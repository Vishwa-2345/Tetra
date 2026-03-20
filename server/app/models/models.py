from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base

class UserRole(str, enum.Enum):
    STUDENT = "student"
    ADMIN = "admin"

class JobStatus(str, enum.Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TransactionType(str, enum.Enum):
    ADVANCE = "advance"
    REFUND = "refund"
    FINAL = "final"
    COMMISSION = "commission"

class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.STUDENT.value)
    
    profile_photo = Column(String(500), nullable=True)
    skills = Column(Text, nullable=True)
    experience = Column(String(500), nullable=True)
    portfolio = Column(String(500), nullable=True)
    github = Column(String(500), nullable=True)
    projects = Column(Text, nullable=True)
    bio = Column(Text, nullable=True)
    
    upi_id = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(String(500), nullable=True)
    
    is_verified = Column(Boolean, default=False)
    is_suspended = Column(Boolean, default=False)
    is_profile_complete = Column(Boolean, default=False)
    
    wallet_balance = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    jobs_given = relationship("Job", foreign_keys="Job.job_giver_id", back_populates="giver")
    jobs_done = relationship("Job", foreign_keys="Job.job_doer_id", back_populates="doer")
    transactions = relationship("Transaction", back_populates="user")
    reviews_given = relationship("Review", foreign_keys="Review.reviewer_id", back_populates="reviewer")
    reviews_received = relationship("Review", foreign_keys="Review.reviewee_id", back_populates="reviewee")
    notifications = relationship("Notification", back_populates="user")

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    skill_required = Column(String(255), nullable=True)
    price = Column(Float, nullable=False)
    status = Column(String(50), default=JobStatus.PENDING.value)
    
    job_giver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_doer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    advance_paid = Column(Boolean, default=False)
    advance_amount = Column(Float, default=0.0)
    final_paid = Column(Boolean, default=False)
    final_amount = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    giver = relationship("User", foreign_keys=[job_giver_id], back_populates="jobs_given")
    doer = relationship("User", foreign_keys=[job_doer_id], back_populates="jobs_done")
    transactions = relationship("Transaction", back_populates="job")
    reviews = relationship("Review", back_populates="job")
    messages = relationship("Message", back_populates="job")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String(50), nullable=False)
    status = Column(String(50), default=TransactionStatus.PENDING.value)
    description = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    job = relationship("Job", back_populates="transactions")
    user = relationship("User", back_populates="transactions")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reviewee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    feedback = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    job = relationship("Job", back_populates="reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="reviews_given")
    reviewee = relationship("User", foreign_keys=[reviewee_id], back_populates="reviews_received")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    job = relationship("Job", back_populates="messages")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    related_id = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="notifications")
