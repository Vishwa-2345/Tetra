from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    role: str = "student"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    profile_photo: Optional[str] = None
    skills: Optional[str] = None
    experience: Optional[str] = None
    portfolio: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    projects: Optional[str] = None
    bio: Optional[str] = None
    upi_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None

class UserResponse(UserBase):
    id: int
    role: str
    profile_photo: Optional[str] = None
    skills: Optional[str] = None
    experience: Optional[str] = None
    portfolio: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    projects: Optional[str] = None
    bio: Optional[str] = None
    upi_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    is_verified: bool
    is_suspended: bool
    is_profile_complete: bool
    wallet_balance: float
    created_at: datetime
    avg_rating: Optional[float] = 0.0
    total_reviews: int = 0
    completed_jobs: int = 0

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "email": "user@example.com",
                "name": "John Doe",
                "role": "student",
                "is_verified": False,
                "is_suspended": False,
                "is_profile_complete": False,
                "wallet_balance": 0.0,
                "created_at": "2024-01-01T00:00:00"
            }
        }

class NearbyUserResponse(UserResponse):
    distance_km: float

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class JobBase(BaseModel):
    title: str
    description: str
    skill_required: Optional[str] = None
    price: float

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    skill_required: Optional[str] = None
    price: Optional[float] = None

class JobStatusUpdate(BaseModel):
    status: str

class JobAssign(BaseModel):
    job_doer_id: int

class JobResponse(JobBase):
    id: int
    status: str
    job_giver_id: int
    job_doer_id: Optional[int] = None
    advance_paid: bool
    advance_amount: float
    final_paid: bool
    final_amount: float
    created_at: datetime
    completed_at: Optional[datetime] = None
    giver: Optional[UserResponse] = None
    doer: Optional[UserResponse] = None
    avg_rating: Optional[float] = None

    class Config:
        from_attributes = True

class TransactionBase(BaseModel):
    job_id: int
    amount: float
    transaction_type: str

class TransactionCreate(TransactionBase):
    pass

class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    status: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ReviewBase(BaseModel):
    job_id: int
    reviewee_id: int
    rating: int = Field(..., ge=1, le=5)
    feedback: Optional[str] = None

class ReviewCreate(ReviewBase):
    pass

class ReviewResponse(ReviewBase):
    id: int
    reviewer_id: int
    created_at: datetime
    reviewer: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class MessageBase(BaseModel):
    receiver_id: int
    content: str
    job_id: Optional[int] = None

class MessageCreate(MessageBase):
    pass

class MessageResponse(MessageBase):
    id: int
    sender_id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationBase(BaseModel):
    type: str
    title: str
    message: str
    related_id: Optional[int] = None

class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AdminStats(BaseModel):
    total_users: int
    total_jobs: int
    completed_jobs: int
    pending_jobs: int
    total_revenue: float
    total_commission: float
    verified_users: int
    suspended_users: int

class ChatRoomResponse(BaseModel):
    user_id: int
    user_name: str
    user_photo: Optional[str] = None
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    unread_count: int = 0

class WalletSummary(BaseModel):
    total_earned: float
    total_spent: float
    current_balance: float
    pending_payments: float
    transactions: List[TransactionResponse] = []
