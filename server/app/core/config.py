from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Tetragrid Systems"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    SECRET_KEY: str = "your-secret-key-change-in-production-tetragrid-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    DATABASE_URL: str = "sqlite+aiosqlite:///./tetragrid.db"
    
    PLATFORM_COMMISSION: float = 0.07
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
