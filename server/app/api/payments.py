from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.core.config import settings
from app.models.models import User, Job, Transaction, Notification
from app.schemas.schemas import TransactionCreate, TransactionResponse, WalletSummary
from app.api.auth import get_current_user

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/advance", response_model=TransactionResponse)
async def pay_advance(
    transaction_data: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if transaction_data.transaction_type != "advance":
        raise HTTPException(status_code=400, detail="Invalid transaction type")
    
    result = await db.execute(select(Job).where(Job.id == transaction_data.job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.job_giver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only job giver can pay advance")
    if job.advance_paid:
        raise HTTPException(status_code=400, detail="Advance already paid")
    
    advance_amount = job.price * 0.5
    
    transaction = Transaction(
        job_id=job.id,
        user_id=current_user.id,
        amount=advance_amount,
        transaction_type="advance",
        status="completed",
        description=f"50% advance payment for job: {job.title}"
    )
    db.add(transaction)
    
    job.advance_paid = True
    job.advance_amount = advance_amount
    job.status = "assigned"
    
    notification = Notification(
        user_id=job.job_doer_id,
        type="payment",
        title="Advance Payment Received",
        message=f"50% advance payment (₹{advance_amount}) received for job: {job.title}. Please start working.",
        related_id=job.id
    )
    db.add(notification)
    
    await db.commit()
    await db.refresh(transaction)
    return TransactionResponse.model_validate(transaction)

@router.post("/refund", response_model=TransactionResponse)
async def request_refund(
    transaction_data: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if transaction_data.transaction_type != "refund":
        raise HTTPException(status_code=400, detail="Invalid transaction type")
    
    result = await db.execute(select(Job).where(Job.id == transaction_data.job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    is_authorized = job.job_giver_id == current_user.id or job.job_doer_id == current_user.id
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if job.status == "completed":
        raise HTTPException(status_code=400, detail="Cannot refund completed job")
    
    refund_amount = 0
    if job.advance_paid and not job.final_paid:
        refund_amount = job.advance_amount
    
    transaction = Transaction(
        job_id=job.id,
        user_id=current_user.id,
        amount=refund_amount,
        transaction_type="refund",
        status="completed",
        description=f"Refund for cancelled job: {job.title}"
    )
    db.add(transaction)
    
    job.status = "cancelled"
    
    giver_notification = Notification(
        user_id=job.job_giver_id,
        type="refund",
        title="Job Cancelled - Refund Processed",
        message=f"Job '{job.title}' has been cancelled. ₹{refund_amount} refunded to your wallet.",
        related_id=job.id
    )
    db.add(giver_notification)
    
    if job.job_doer_id:
        doer_notification = Notification(
            user_id=job.job_doer_id,
            type="cancellation",
            title="Assigned Job Cancelled",
            message=f"Job '{job.title}' has been cancelled by the client.",
            related_id=job.id
        )
        db.add(doer_notification)
    
    await db.commit()
    await db.refresh(transaction)
    return TransactionResponse.model_validate(transaction)

@router.post("/final", response_model=TransactionResponse)
async def pay_final(
    transaction_data: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if transaction_data.transaction_type != "final":
        raise HTTPException(status_code=400, detail="Invalid transaction type")
    
    result = await db.execute(select(Job).where(Job.id == transaction_data.job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.job_giver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only job giver can pay final amount")
    if not job.advance_paid:
        raise HTTPException(status_code=400, detail="Please pay advance first")
    if job.final_paid:
        raise HTTPException(status_code=400, detail="Final payment already completed")
    if job.status != "in_progress":
        raise HTTPException(status_code=400, detail="Job must be in progress to pay final")
    
    final_amount = job.price * 0.5
    commission = job.price * settings.PLATFORM_COMMISSION
    doer_payment = final_amount - commission
    
    transaction = Transaction(
        job_id=job.id,
        user_id=current_user.id,
        amount=final_amount,
        transaction_type="final",
        status="completed",
        description=f"Final 50% payment for job: {job.title}"
    )
    db.add(transaction)
    
    commission_transaction = Transaction(
        job_id=job.id,
        user_id=0,
        amount=commission,
        transaction_type="commission",
        status="completed",
        description=f"Platform commission (5%) for job: {job.title}"
    )
    db.add(commission_transaction)
    
    job.final_paid = True
    job.final_amount = final_amount
    job.status = "completed"
    job.completed_at = datetime.utcnow()
    
    if job.job_doer_id:
        result = await db.execute(select(User).where(User.id == job.job_doer_id))
        doer = result.scalar_one_or_none()
        if doer:
            doer.wallet_balance += doer_payment
        
        notification = Notification(
            user_id=job.job_doer_id,
            type="payment",
            title="Job Completed - Payment Received",
            message=f"Congratulations! Job '{job.title}' completed. ₹{doer_payment} credited to your wallet.",
            related_id=job.id
        )
        db.add(notification)
    
    await db.commit()
    await db.refresh(transaction)
    return TransactionResponse.model_validate(transaction)

@router.get("/wallet", response_model=WalletSummary)
async def get_wallet(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Transaction).where(Transaction.user_id == current_user.id).order_by(Transaction.created_at.desc())
    )
    transactions = result.scalars().all()
    
    total_earned = sum(t.amount for t in transactions if t.transaction_type in ["final", "advance"] and t.status == "completed")
    total_spent = sum(t.amount for t in transactions if t.transaction_type in ["refund"] and t.status == "completed")
    
    pending_result = await db.execute(
        select(func.sum(Transaction.amount)).where(
            Transaction.user_id == current_user.id,
            Transaction.transaction_type.in_(["advance"]),
            Transaction.status == "completed"
        )
    )
    pending_payments = pending_result.scalar() or 0
    
    return WalletSummary(
        total_earned=total_earned,
        total_spent=total_spent,
        current_balance=current_user.wallet_balance,
        pending_payments=pending_payments,
        transactions=[TransactionResponse.model_validate(t) for t in transactions[:50]]
    )

@router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    job_id: int = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Transaction).where(Transaction.user_id == current_user.id)
    if job_id:
        query = query.where(Transaction.job_id == job_id)
    query = query.order_by(Transaction.created_at.desc())
    
    result = await db.execute(query)
    transactions = result.scalars().all()
    return [TransactionResponse.model_validate(t) for t in transactions]
