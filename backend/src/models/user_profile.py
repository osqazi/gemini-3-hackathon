from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.sql import func
from database.session import Base

class UserProfile(Base):
    __tablename__ = "users_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True, nullable=False)
    preferences = Column(JSON, nullable=False)  # JSONB field for flexible storage
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def to_dict(self):
        """Convert the profile to a dictionary representation."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "preferences": self.preferences,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }