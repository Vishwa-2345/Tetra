from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from app.core.database import get_db
from app.models.models import User, Job, Transaction
from app.schemas.schemas import AdminStats, UserResponse
from app.api.auth import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    total_users = await db.execute(select(func.count(User.id)))
    total_users = total_users.scalar() or 0
    
    verified_users = await db.execute(
        select(func.count(User.id)).where(User.is_verified == True)
    )
    verified_users = verified_users.scalar() or 0
    
    suspended_users = await db.execute(
        select(func.count(User.id)).where(User.is_suspended == True)
    )
    suspended_users = suspended_users.scalar() or 0
    
    total_jobs = await db.execute(select(func.count(Job.id)))
    total_jobs = total_jobs.scalar() or 0
    
    completed_jobs = await db.execute(
        select(func.count(Job.id)).where(Job.status == "completed")
    )
    completed_jobs = completed_jobs.scalar() or 0
    
    pending_jobs = await db.execute(
        select(func.count(Job.id)).where(Job.status.in_(["pending", "assigned", "in_progress"]))
    )
    pending_jobs = pending_jobs.scalar() or 0
    
    total_revenue = await db.execute(
        select(func.sum(Transaction.amount)).where(
            Transaction.transaction_type.in_(["advance", "final"]),
            Transaction.status == "completed"
        )
    )
    total_revenue = total_revenue.scalar() or 0
    
    total_commission = await db.execute(
        select(func.sum(Transaction.amount)).where(
            Transaction.transaction_type == "commission",
            Transaction.status == "completed"
        )
    )
    total_commission = total_commission.scalar() or 0
    
    return AdminStats(
        total_users=total_users,
        total_jobs=total_jobs,
        completed_jobs=completed_jobs,
        pending_jobs=pending_jobs,
        total_revenue=total_revenue,
        total_commission=total_commission,
        verified_users=verified_users,
        suspended_users=suspended_users
    )

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    skip: int = 0,
    limit: int = 50,
    role: str = None,
    verified: bool = None,
    suspended: bool = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    query = select(User)
    
    if role:
        query = query.where(User.role == role)
    if verified is not None:
        query = query.where(User.is_verified == verified)
    if suspended is not None:
        query = query.where(User.is_suspended == suspended)
    
    query = query.offset(skip).limit(limit).order_by(User.created_at.desc())
    result = await db.execute(query)
    users = result.scalars().all()
    return [UserResponse.model_validate(u) for u in users]

@router.put("/users/{user_id}/verify")
async def verify_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_verified = True
    await db.commit()
    return {"message": "User verified successfully"}

@router.put("/users/{user_id}/suspend")
async def suspend_user(
    user_id: int,
    suspend: bool = True,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot suspend yourself")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_suspended = suspend
    await db.commit()
    return {"message": f"User {'suspended' if suspend else 'unsuspended'} successfully"}

@router.get("/jobs")
async def get_all_jobs(
    skip: int = 0,
    limit: int = 50,
    status: str = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    from app.schemas.schemas import JobResponse
    query = select(Job)
    if status:
        query = query.where(Job.status == status)
    query = query.offset(skip).limit(limit).order_by(Job.created_at.desc())
    result = await db.execute(query)
    jobs = result.scalars().all()
    return [JobResponse.model_validate(j) for j in jobs]

@router.get("/transactions")
async def get_all_transactions(
    skip: int = 0,
    limit: int = 50,
    transaction_type: str = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    from app.schemas.schemas import TransactionResponse
    query = select(Transaction)
    if transaction_type:
        query = query.where(Transaction.transaction_type == transaction_type)
    query = query.offset(skip).limit(limit).order_by(Transaction.created_at.desc())
    result = await db.execute(query)
    transactions = result.scalars().all()
    return [TransactionResponse.model_validate(t) for t in transactions]
