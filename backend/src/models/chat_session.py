from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.session import Base

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)  # Foreign Key to user
    session_id = Column(String, unique=True, index=True, nullable=False)
    messages_history = Column(JSON, nullable=False)  # Array of message objects
    recipe_context = Column(JSON, nullable=True)  # Associated recipe data and preferences
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship to User (if needed)
    # user = relationship("User", back_populates="chat_sessions")