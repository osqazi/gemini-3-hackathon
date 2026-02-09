from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True, nullable=False)  # This would be the auth provider's user ID
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True)  # Optional username
    password = Column(String)  # Hashed password for credentials authentication
    provider = Column(String, nullable=False, default='credentials')  # 'google', 'credentials', etc.
    provider_id = Column(String)  # Provider's unique user ID
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', provider='{self.provider}')>"