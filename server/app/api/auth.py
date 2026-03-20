from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, decode_token
from app.core.config import settings
from app.models.models import User
from app.schemas.schemas import UserCreate, UserLogin, UserResponse, TokenResponse, UserUpdate

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

ADMIN_EMAIL = "admin@gmail.com"
ADMIN_PASSWORD = "admin123"

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    if user.is_suspended:
        raise HTTPException(status_code=403, detail="User account is suspended")
    return user

async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        name=user_data.name,
        role="student"
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": str(new_user.id)})
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(new_user)
    )

@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    if user_data.email == ADMIN_EMAIL and user_data.password == ADMIN_PASSWORD:
        result = await db.execute(select(User).where(User.email == ADMIN_EMAIL))
        admin = result.scalar_one_or_none()
        
        if not admin:
            hashed_password = get_password_hash(ADMIN_PASSWORD)
            admin = User(
                email=ADMIN_EMAIL,
                password_hash=hashed_password,
                name="Administrator",
                role="admin"
            )
            db.add(admin)
            await db.commit()
            await db.refresh(admin)
        
        access_token = create_access_token(data={"sub": str(admin.id)})
        return TokenResponse(
            access_token=access_token,
            user=UserResponse.model_validate(admin)
        )
    
    result = await db.execute(select(User).where(User.email == user_data.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.is_suspended:
        raise HTTPException(status_code=403, detail="User account is suspended")
    
    access_token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == current_user.id))
    user = result.scalar_one_or_none()
    
    from sqlalchemy import func, select
    from app.models.models import Review, Job
    
    avg_rating_result = await db.execute(
        select(func.avg(Review.rating)).where(Review.reviewee_id == user.id)
    )
    avg_rating = avg_rating_result.scalar() or 0.0
    
    total_reviews_result = await db.execute(
        select(func.count(Review.id)).where(Review.reviewee_id == user.id)
    )
    total_reviews = total_reviews_result.scalar() or 0
    
    completed_jobs_result = await db.execute(
        select(func.count(Job.id)).where(
            Job.job_doer_id == user.id,
            Job.status == "completed"
        )
    )
    completed_jobs = completed_jobs_result.scalar() or 0
    
    user_dict = {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "profile_photo": user.profile_photo,
        "skills": user.skills,
        "experience": user.experience,
        "portfolio": user.portfolio,
        "github": user.github,
        "projects": user.projects,
        "bio": user.bio,
        "upi_id": user.upi_id,
        "latitude": user.latitude,
        "longitude": user.longitude,
        "address": user.address,
        "is_verified": user.is_verified,
        "is_suspended": user.is_suspended,
        "is_profile_complete": user.is_profile_complete,
        "wallet_balance": user.wallet_balance,
        "created_at": user.created_at,
        "avg_rating": float(avg_rating) if avg_rating else 0.0,
        "total_reviews": total_reviews,
        "completed_jobs": completed_jobs
    }
    return UserResponse(**user_dict)

@router.post("/forgot-password")
async def forgot_password(email: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        return {"message": "If email exists, reset link has been sent"}
    return {"message": "Password reset functionality - check your email"}
