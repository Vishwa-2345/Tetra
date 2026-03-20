from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.config import settings
from app.models.models import User, Job, Transaction, Notification, Review, JobApplication
from app.schemas.schemas import JobCreate, JobUpdate, JobResponse, JobStatusUpdate, JobAssign, UserResponse, ApplicationCreate, ApplicationResponse
from app.api.auth import get_current_user

router = APIRouter(prefix="/jobs", tags=["Jobs"])

async def get_user_stats(db: AsyncSession, user_id: int) -> dict:
    result = await db.execute(
        select(func.avg(Review.rating), func.count(Review.id))
        .where(Review.reviewee_id == user_id)
    )
    avg_rating, total_reviews = result.first() or (None, 0)
    
    jobs_result = await db.execute(
        select(func.count(Job.id))
        .where(Job.job_doer_id == user_id, Job.status == "completed")
    )
    completed_jobs = jobs_result.scalar() or 0
    
    return {
        "avg_rating": round(avg_rating, 1) if avg_rating else 0.0,
        "total_reviews": total_reviews or 0,
        "completed_jobs": completed_jobs
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
    query = select(Job).options(
        selectinload(Job.giver),
        selectinload(Job.doer),
        selectinload(Job.applications)
    )
    
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
        
        job_dict["application_count"] = len(job.applications) if job.applications else 0
        
        has_applied = False
        if job.applications:
            for app in job.applications:
                if app.applicant_id == current_user.id:
                    has_applied = True
                    break
        job_dict["has_applied"] = has_applied
        
        response.append(JobResponse(**job_dict))
    
    return response

@router.get("/my-jobs", response_model=List[JobResponse])
async def get_my_jobs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Job).options(
        selectinload(Job.giver),
        selectinload(Job.doer),
        selectinload(Job.applications)
    ).where(Job.job_giver_id == current_user.id).order_by(Job.created_at.desc())
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
        job_dict["application_count"] = len(job.applications) if job.applications else 0
        job_dict["has_applied"] = False
        response.append(JobResponse(**job_dict))
    
    return response

@router.get("/assigned-jobs", response_model=List[JobResponse])
async def get_assigned_jobs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Job).options(
        selectinload(Job.giver),
        selectinload(Job.doer),
        selectinload(Job.applications)
    ).where(Job.job_doer_id == current_user.id).order_by(Job.created_at.desc())
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
        job_dict["application_count"] = 0
        job_dict["has_applied"] = False
        response.append(JobResponse(**job_dict))
    
    return response

@router.get("/user/{user_id}", response_model=List[JobResponse])
async def get_jobs_by_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Job).options(
        selectinload(Job.giver),
        selectinload(Job.doer),
        selectinload(Job.applications)
    ).where(Job.job_giver_id == user_id).order_by(Job.created_at.desc())
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
        job_dict["application_count"] = len(job.applications) if job.applications else 0
        job_dict["has_applied"] = False
        response.append(JobResponse(**job_dict))
    
    return response

@router.get("/pending-final-payments", response_model=List[JobResponse])
async def get_pending_final_payments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Job).options(
        selectinload(Job.giver),
        selectinload(Job.doer)
    ).where(
        Job.job_giver_id == current_user.id,
        Job.advance_paid == True,
        Job.final_paid == False,
        Job.status == "completed"
    ).order_by(Job.created_at.desc())
    result = await db.execute(query)
    jobs = result.scalars().all()
    
    response = []
    for job in jobs:
        job_dict = JobResponse.model_validate(job).model_dump()
        try:
            if job.giver:
                stats = await get_user_stats(db, job.giver.id)
                job_dict["giver"] = {**UserResponse.model_validate(job.giver).model_dump(), **stats}
            if job.doer:
                stats = await get_user_stats(db, job.doer.id)
                job_dict["doer"] = {**UserResponse.model_validate(job.doer).model_dump(), **stats}
        except Exception:
            pass
        response.append(JobResponse(**job_dict))
    
    return response

@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Job).options(
            selectinload(Job.giver),
            selectinload(Job.doer),
            selectinload(Job.applications)
        ).where(Job.id == job_id)
    )
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
    
    job_dict["application_count"] = len(job.applications) if job.applications else 0
    
    has_applied = False
    if job.applications:
        for app in job.applications:
            if app.applicant_id == current_user.id:
                has_applied = True
                break
    job_dict["has_applied"] = has_applied
    
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
    result = await db.execute(
        select(Job).options(
            selectinload(Job.giver),
            selectinload(Job.doer),
            selectinload(Job.applications)
        ).where(Job.id == job_id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    is_authorized = job.job_giver_id == current_user.id or job.job_doer_id == current_user.id
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    old_status = job.status
    new_status = status_data.status
    
    if new_status == "in_progress" and job.job_doer_id == current_user.id:
        if not job.advance_paid:
            raise HTTPException(status_code=400, detail="Cannot start work before advance payment is received")
        if old_status != "assigned":
            raise HTTPException(status_code=400, detail="Job must be assigned before starting")
    
    job.status = new_status
    
    if status_data.status == "completed":
        job.completed_at = datetime.utcnow()
        
        notification = Notification(
            user_id=job.job_giver_id,
            type="status_update",
            title="Job Completed - Pay Final Amount",
            message=f"'{job.title}' has been marked as completed. Please release the final payment.",
            related_id=job.id
        )
        db.add(notification)
    
    await db.commit()
    await db.refresh(job)
    
    job_dict = JobResponse.model_validate(job).model_dump()
    try:
        if job.giver:
            stats = await get_user_stats(db, job.giver.id)
            job_dict["giver"] = {**UserResponse.model_validate(job.giver).model_dump(), **stats}
        if job.doer:
            stats = await get_user_stats(db, job.doer.id)
            job_dict["doer"] = {**UserResponse.model_validate(job.doer).model_dump(), **stats}
    except Exception as e:
        pass
    job_dict["application_count"] = len(job.applications) if job.applications else 0
    job_dict["has_applied"] = False
    return JobResponse(**job_dict)

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
    
    application_result = await db.execute(
        select(JobApplication).where(
            JobApplication.job_id == job_id,
            JobApplication.applicant_id == assign_data.job_doer_id
        )
    )
    application = application_result.scalar_one_or_none()
    if application:
        application.status = "accepted"
    
    all_applications_result = await db.execute(
        select(JobApplication).where(
            JobApplication.job_id == job_id,
            JobApplication.applicant_id != assign_data.job_doer_id
        )
    )
    other_applications = all_applications_result.scalars().all()
    for app in other_applications:
        app.status = "rejected"
        notif = Notification(
            user_id=app.applicant_id,
            type="application_update",
            title="Application Not Selected",
            message=f"Your application for '{job.title}' was not selected.",
            related_id=job.id
        )
        db.add(notif)
    
    job.job_doer_id = assign_data.job_doer_id
    job.status = "assigned"
    job.assigned_at = datetime.utcnow()
    
    notification = Notification(
        user_id=assign_data.job_doer_id,
        type="job_assigned",
        title="Job Assigned to You!",
        message=f"You have been assigned to job: '{job.title}'. The job giver will pay an advance to start the work.",
        related_id=job.id
    )
    db.add(notification)
    
    await db.commit()
    await db.refresh(job)
    
    job_dict = JobResponse.model_validate(job).model_dump()
    return JobResponse(**job_dict)

@router.post("/{job_id}/apply", response_model=ApplicationResponse)
async def apply_for_job(
    job_id: int,
    application_data: ApplicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.job_giver_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot apply to your own job")
    if job.status != "pending":
        raise HTTPException(status_code=400, detail="Job is no longer accepting applications")
    
    existing = await db.execute(
        select(JobApplication).where(
            JobApplication.job_id == job_id,
            JobApplication.applicant_id == current_user.id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You have already applied to this job")
    
    application = JobApplication(
        job_id=job_id,
        applicant_id=current_user.id,
        message=application_data.message
    )
    db.add(application)
    
    notification = Notification(
        user_id=job.job_giver_id,
        type="application_received",
        title="New Application",
        message=f"{current_user.name} has applied for your job '{job.title}'.",
        related_id=job.id
    )
    db.add(notification)
    
    await db.commit()
    await db.refresh(application)
    
    return ApplicationResponse.model_validate(application)

@router.get("/{job_id}/applications", response_model=List[ApplicationResponse])
async def get_job_applications(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.job_giver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only job giver can view applications")
    
    result = await db.execute(
        select(JobApplication)
        .options(selectinload(JobApplication.applicant))
        .where(JobApplication.job_id == job_id)
        .order_by(JobApplication.created_at.desc())
    )
    applications = result.scalars().all()
    
    response = []
    for app in applications:
        app_dict = ApplicationResponse.model_validate(app).model_dump()
        if app.applicant:
            stats = await get_user_stats(db, app.applicant.id)
            app_dict["applicant"] = {**UserResponse.model_validate(app.applicant).model_dump(), **stats}
        response.append(ApplicationResponse(**app_dict))
    
    return response

@router.delete("/{job_id}/withdraw")
async def withdraw_application(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(JobApplication).where(
            JobApplication.job_id == job_id,
            JobApplication.applicant_id == current_user.id
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if application.status != "pending":
        raise HTTPException(status_code=400, detail="Cannot withdraw accepted or rejected application")
    
    await db.delete(application)
    await db.commit()
    
    return {"message": "Application withdrawn successfully"}
