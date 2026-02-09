"""
SQLAlchemy Database Session Module for RecipeRAG
Handles database connections for profile and other SQLAlchemy-based models
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager
import logging

logger = logging.getLogger(__name__)

# Get database URL from environment variable
DATABASE_URL = os.getenv("NEON_DB_URL")

if not DATABASE_URL:
    raise ValueError("Database connection URL is required in NEON_DB_URL environment variable")

# Create engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=300,    # Recycle connections every 5 minutes
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for SQLAlchemy models
Base = declarative_base()

def get_db():
    """
    Dependency function for FastAPI to provide database sessions
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """
    Create all tables defined in SQLAlchemy models
    This should be called during application startup
    """
    try:
        # Import models to ensure they're registered with Base.metadata
        from src.models.user import User
        from src.models.user_profile import UserProfile
        from src.models.chat_session import ChatSession
        from src.models.recipe_card import RecipeCard

        Base.metadata.create_all(bind=engine)
        logger.info("SQLAlchemy tables created successfully")
    except Exception as e:
        logger.error(f"Error creating SQLAlchemy tables: {e}")
        raise