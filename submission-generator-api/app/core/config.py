"""
Application configuration using Pydantic settings.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    APP_NAME: str = "AI-Assisted Regulatory Submission Builder"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = "change-me-in-production"
    
    # Database
    DATABASE_URL: str = "postgresql://username:password@localhost:5432/regulatory_submissions"
    
    # File Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 100
    
    # IMDRF Templates
    TEMPLATES_DIR: str = "./templates/imdrf"
    
    # Logging
    LOG_LEVEL: str = "INFO"

    # Security
    CORS_ALLOWED_ORIGINS: str = "http://localhost:3030,http://localhost:3000"
    SERVE_UPLOADS_PUBLIC: bool = False
    INTERNAL_API_KEY: Optional[str] = None

    # AI Logging Controls
    AI_LOG_INCLUDE_CONTENT: bool = False
    AI_LOG_MAX_CONTENT_CHARS: int = 500
    
    # AI Configuration
    SARVAM_API_KEY: Optional[str] = None
    SARVAM_MODEL: str = "sarvam-105b"

    @property
    def cors_allowed_origins(self) -> list[str]:
        """Return normalized CORS origins from comma-separated env value."""
        return [origin.strip() for origin in self.CORS_ALLOWED_ORIGINS.split(",") if origin.strip()]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()