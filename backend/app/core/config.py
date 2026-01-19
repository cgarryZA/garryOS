"""
Application configuration using Pydantic Settings.
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """
    # API Settings
    API_TITLE: str = "HomeOS API"
    API_VERSION: str = "0.1.0"
    DEBUG: bool = True

    # Database Settings
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/homeos"

    # Redis Settings
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS Settings
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    RELOAD: bool = True

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
