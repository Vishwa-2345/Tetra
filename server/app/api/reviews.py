from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.models.models import User, Job, Review, Notification
from app.schemas.schemas import ReviewCreate, ReviewResponse, UserResponse
from app.api.auth import get_current_user

router = APIRouter(prefix="/reviews", tags=["Reviews"])

async def get_user_stats(db: AsyncSession, user_id: int) -> dict:
    from sqlalchemy import func
    result = await db.execute(
        select(func.avg(Review.rating), func.count(Review.id))
        .where(Review.reviewee_id == user_id)
    )
    avg_rating, total_reviews = result.first() or (None, 0)
    return {
        "avg_rating": round(avg_rating, 1) if avg_rating else 0.0,
        "total_reviews": total_reviews or 0
    }

@router.post("", response_model=ReviewResponse)
async def create_review(
    review_data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Job).where(Job.id == review_data.job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    is_authorized = job.job_giver_id == current_user.id or job.job_doer_id == current_user.id
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Not authorized to review this job")
    
    if current_user.id == review_data.reviewee_id:
        raise HTTPException(status_code=400, detail="Cannot review yourself")
    
    existing = await db.execute(
        select(Review).where(
            Review.job_id == review_data.job_id,
            Review.reviewer_id == current_user.id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You have already reviewed this job")
    
    review = Review(
        job_id=review_data.job_id,
        reviewer_id=current_user.id,
        reviewee_id=review_data.reviewee_id,
        rating=review_data.rating,
        feedback=review_data.feedback
    )
    db.add(review)
    
    notification = Notification(
        user_id=review_data.reviewee_id,
        type="review",
        title="New Review Received",
        message=f"You received a {review_data.rating}-star review: {review_data.feedback[:50] if review_data.feedback else 'No feedback'}",
        related_id=job.id
    )
    db.add(notification)
    
    await db.commit()
    await db.refresh(review)
    return ReviewResponse.model_validate(review)

@router.get("/{user_id}", response_model=List[ReviewResponse])
async def get_user_reviews(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Review).where(Review.reviewee_id == user_id).order_by(Review.created_at.desc())
    )
    reviews = result.scalars().all()
    
    response = []
    for review in reviews:
        review_dict = ReviewResponse.model_validate(review).model_dump()
        if review.reviewer:
            stats = await get_user_stats(db, review.reviewer.id)
            review_dict["reviewer"] = {**UserResponse.model_validate(review.reviewer).model_dump(), **stats}
        response.append(ReviewResponse(**review_dict))
    
    return response

@router.get("/job/{job_id}", response_model=List[ReviewResponse])
async def get_job_reviews(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Review).where(Review.job_id == job_id).order_by(Review.created_at.desc())
    )
    reviews = result.scalars().all()
    return [ReviewResponse.model_validate(r) for r in reviews]
