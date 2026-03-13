"""
Application configuration using Pydantic settings.
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    APP_NAME: str = "AI-Assisted Regulatory Submission Builder"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    SECRET_KEY: str = "your-secret-key-change-in-production"
    
    # Database
    DATABASE_URL: str = "postgresql://username:password@localhost:5432/regulatory_submissions"
    
    # File Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 100
    
    # IMDRF Templates
    TEMPLATES_DIR: str = "./templates/imdrf"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # AI Configuration
    SARVAM_API_KEY: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()