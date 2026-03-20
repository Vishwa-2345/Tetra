from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from typing import List, Optional
import math

from app.core.database import get_db
from app.models.models import User, Job, Review
from app.schemas.schemas import UserResponse, UserUpdate, AdminStats, NearbyUserResponse
from app.api.auth import get_current_user, get_current_admin

router = APIRouter(prefix="/users", tags=["Users"])

def calculate_profile_completion(user: User) -> int:
    fields = [user.profile_photo, user.skills, user.experience, user.portfolio, user.github, user.linkedin, user.projects, user.upi_id]
    completed = sum(1 for f in fields if f)
    return int((completed / len(fields)) * 100)

async def get_user_stats(db: AsyncSession, user_id: int) -> dict:
    result = await db.execute(
        select(func.count(Job.id)).where(Job.job_doer_id == user_id, Job.status == "completed")
    )
    completed_jobs = result.scalar() or 0
    
    result = await db.execute(
        select(func.avg(Review.rating), func.count(Review.id))
        .where(Review.reviewee_id == user_id)
    )
    avg_rating, total_reviews = result.first() or (None, 0)
    
    return {
        "completed_jobs": completed_jobs,
        "avg_rating": round(avg_rating, 1) if avg_rating else 0.0,
        "total_reviews": total_reviews or 0
    }

@router.get("", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 20,
    skill: Optional[str] = None,
    min_rating: Optional[float] = None,
    verified_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(User).where(User.role == "student", User.is_suspended == False)
    
    if skill:
        query = query.where(User.skills.ilike(f"%{skill}%"))
    if verified_only:
        query = query.where(User.is_verified == True)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()
    
    response = []
    for user in users:
        stats = await get_user_stats(db, user.id)
        user_dict = {
            **UserResponse.model_validate(user).model_dump(),
            **stats
        }
        response.append(UserResponse(**user_dict))
    
    if min_rating:
        response = [u for u in response if u.avg_rating >= min_rating]
    
    return response

@router.get("/nearby", response_model=List[NearbyUserResponse])
async def get_nearby_users(
    latitude: float = Query(...),
    longitude: float = Query(...),
    radius_km: float = Query(default=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(User).where(User.role == "student", User.is_suspended == False)
    result = await db.execute(query)
    users = result.scalars().all()
    
    nearby = []
    for user in users:
        if user.latitude and user.longitude:
            distance = calculate_distance(latitude, longitude, user.latitude, user.longitude)
            if distance <= radius_km:
                stats = await get_user_stats(db, user.id)
                user_dict = UserResponse.model_validate(user).model_dump()
                user_dict["distance_km"] = round(distance, 1)
                user_dict["avg_rating"] = stats.get("avg_rating", 0.0)
                user_dict["total_reviews"] = stats.get("total_reviews", 0)
                user_dict["completed_jobs"] = stats.get("completed_jobs", 0)
                nearby.append(NearbyUserResponse(**user_dict))
    
    nearby.sort(key=lambda x: x.distance_km)
    return nearby

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

@router.get("/profile-completion")
async def get_profile_completion(
    current_user: User = Depends(get_current_user)
):
    return {"percentage": calculate_profile_completion(current_user)}

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    stats = await get_user_stats(db, user.id)
    user_dict = {
        **UserResponse.model_validate(user).model_dump(),
        **stats
    }
    return UserResponse(**user_dict)

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    update_data = user_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
    
    if calculate_profile_completion(current_user) >= 70:
        current_user.is_profile_complete = True
    
    await db.commit()
    await db.refresh(current_user)
    
    stats = await get_user_stats(db, current_user.id)
    user_dict = {
        **UserResponse.model_validate(current_user).model_dump(),
        **stats
    }
    return UserResponse(**user_dict)

@router.get("/me/dashboard")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(func.count(Job.id)).where(Job.job_giver_id == current_user.id)
    )
    total_jobs_given = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(Job.id)).where(Job.job_giver_id == current_user.id, Job.status == "completed")
    )
    completed_jobs_given = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(Job.id)).where(Job.job_doer_id == current_user.id)
    )
    total_jobs_done = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(Job.id)).where(Job.job_doer_id == current_user.id, Job.status == "completed")
    )
    completed_jobs_done = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(Job.id)).where(
            or_(
                and_(Job.job_giver_id == current_user.id, Job.advance_paid == True, Job.final_paid == False),
                and_(Job.job_doer_id == current_user.id, Job.advance_paid == True, Job.final_paid == False)
            )
        )
    )
    pending_payments = result.scalar() or 0
    
    stats = await get_user_stats(db, current_user.id)
    
    return {
        "total_jobs_given": total_jobs_given,
        "completed_jobs_given": completed_jobs_given,
        "total_jobs_done": total_jobs_done,
        "completed_jobs_done": completed_jobs_done,
        "pending_payments": pending_payments,
        "wallet_balance": current_user.wallet_balance,
        "is_profile_complete": current_user.is_profile_complete,
        **stats
    }
