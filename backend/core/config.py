"""
Configuration and Settings Module for RecipeRAG
Handles environment variables and application settings
"""
import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    """Application settings loaded from environment variables"""

    # Gemini API Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL_NAME: str = os.getenv("GEMINI_MODEL_NAME", "gemini-1.5-flash")

    # Database Configuration
    NEON_DB_URL: str = os.getenv("NEON_DB_URL", "")

    # Application Configuration
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    CORS_ORIGINS_STR: str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    CORS_ORIGINS: list = [origin.strip() for origin in CORS_ORIGINS_STR.split(",")]

    # Performance Configuration
    API_TIMEOUT_SECONDS: int = int(os.getenv("API_TIMEOUT_SECONDS", "30"))
    MAX_IMAGE_SIZE_MB: int = int(os.getenv("MAX_IMAGE_SIZE_MB", "20"))  # Gemini API limit

    # RAG Configuration
    RAG_TOP_K: int = int(os.getenv("RAG_TOP_K", "3"))  # Number of similar recipes to retrieve
    EMBEDDING_DIMENSION: int = 384  # Dimension of sentence-transformers/all-MiniLM-L6-v2 embeddings

    @property
    def is_config_valid(self) -> bool:
        """Check if the essential configuration is properly set"""
        return bool(self.GEMINI_API_KEY and self.NEON_DB_URL)

    def validate_config(self) -> list:
        """Validate configuration and return list of missing required values"""
        errors = []
        if not self.GEMINI_API_KEY:
            errors.append("GEMINI_API_KEY is not set in environment variables")
        if not self.NEON_DB_URL:
            errors.append("NEON_DB_URL is not set in environment variables")
        return errors

# Create a singleton settings instance
settings = Settings()

# Validate configuration at startup
config_errors = settings.validate_config()
if config_errors:
    print("Configuration errors detected:")
    for error in config_errors:
        print(f"- {error}")
    print("Please check your .env file against .env.example")