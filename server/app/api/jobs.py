from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.config import settings
from app.models.models import User, Job, Transaction, Notification, Review
from app.schemas.schemas import JobCreate, JobUpdate, JobResponse, JobStatusUpdate, JobAssign, UserResponse
from app.api.auth import get_current_user

router = APIRouter(prefix="/jobs", tags=["Jobs"])

async def get_user_stats(db: AsyncSession, user_id: int) -> dict:
    result = await db.execute(
        select(func.avg(Review.rating), func.count(Review.id))
        .where(Review.reviewee_id == user_id)
    )
    avg_rating, total_reviews = result.first() or (None, 0)
    return {
        "avg_rating": round(avg_rating, 1) if avg_rating else 0.0,
        "total_reviews": total_reviews or 0
    }

@router.post("", response_model=JobResponse)
async def create_job(
    job_data: JobCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_profile_complete:
        raise HTTPException(status_code=400, detail="Please complete your profile before creating jobs")
    
    new_job = Job(
        title=job_data.title,
        description=job_data.description,
        skill_required=job_data.skill_required,
        price=job_data.price,
        job_giver_id=current_user.id
    )
    db.add(new_job)
    await db.commit()
    await db.refresh(new_job)
    
    return JobResponse.model_validate(new_job)

@router.get("", response_model=List[JobResponse])
async def list_jobs(
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    skill: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Job)
    
    if status:
        query = query.where(Job.status == status)
    if skill:
        query = query.where(Job.skill_required.ilike(f"%{skill}%"))
    if min_price:
        query = query.where(Job.price >= min_price)
    if max_price:
        query = query.where(Job.price <= max_price)
    
    query = query.order_by(Job.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    jobs = result.scalars().all()
    
    response = []
    for job in jobs:
        job_dict = JobResponse.model_validate(job).model_dump()
        if job.giver:
            stats = await get_user_stats(db, job.giver.id)
            job_dict["giver"] = {**UserResponse.model_validate(job.giver).model_dump(), **stats}
        if job.doer:
            stats = await get_user_stats(db, job.doer.id)
            job_dict["doer"] = {**UserResponse.model_validate(job.doer).model_dump(), **stats}
        response.append(JobResponse(**job_dict))
    
    return response

@router.get("/my-jobs", response_model=List[JobResponse])
async def get_my_jobs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Job).where(Job.job_giver_id == current_user.id).order_by(Job.created_at.desc())
    result = await db.execute(query)
    jobs = result.scalars().all()
    return [JobResponse.model_validate(job) for job in jobs]

@router.get("/assigned-jobs", response_model=List[JobResponse])
async def get_assigned_jobs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Job).where(Job.job_doer_id == current_user.id).order_by(Job.created_at.desc())
    result = await db.execute(query)
    jobs = result.scalars().all()
    return [JobResponse.model_validate(job) for job in jobs]

@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job_dict = JobResponse.model_validate(job).model_dump()
    if job.giver:
        stats = await get_user_stats(db, job.giver.id)
        job_dict["giver"] = {**UserResponse.model_validate(job.giver).model_dump(), **stats}
    if job.doer:
        stats = await get_user_stats(db, job.doer.id)
        job_dict["doer"] = {**UserResponse.model_validate(job.doer).model_dump(), **stats}
    
    return JobResponse(**job_dict)

@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: int,
    job_data: JobUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.job_giver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this job")
    
    update_data = job_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(job, key, value)
    
    await db.commit()
    await db.refresh(job)
    return JobResponse.model_validate(job)

@router.put("/{job_id}/status", response_model=JobResponse)
async def update_job_status(
    job_id: int,
    status_data: JobStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    is_authorized = job.job_giver_id == current_user.id or job.job_doer_id == current_user.id
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    old_status = job.status
    job.status = status_data.status
    
    if status_data.status == "completed":
        job.completed_at = datetime.utcnow()
    
    notification = Notification(
        user_id=job.job_giver_id if job.job_doer_id == current_user.id else job.job_doer_id,
        type="status_update",
        title="Job Status Updated",
        message=f"Job '{job.title}' status changed from {old_status} to {status_data.status}",
        related_id=job.id
    )
    db.add(notification)
    
    await db.commit()
    await db.refresh(job)
    return JobResponse.model_validate(job)

@router.put("/{job_id}/assign", response_model=JobResponse)
async def assign_job(
    job_id: int,
    assign_data: JobAssign,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.job_giver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only job giver can assign")
    
    result = await db.execute(select(User).where(User.id == assign_data.job_doer_id))
    doer = result.scalar_one_or_none()
    if not doer:
        raise HTTPException(status_code=404, detail="Job doer not found")
    
    job.job_doer_id = assign_data.job_doer_id
    job.status = "assigned"
    
    notification = Notification(
        user_id=assign_data.job_doer_id,
        type="job_assigned",
        title="New Job Assigned",
        message=f"You have been assigned to job: {job.title}",
        related_id=job.id
    )
    db.add(notification)
    
    await db.commit()
    await db.refresh(job)
    return JobResponse.model_validate(job)
