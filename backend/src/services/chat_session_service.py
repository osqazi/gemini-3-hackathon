from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_
import json
import logging

from src.models.chat_session import ChatSession
from src.models.user import User
from src.models.user_profile import UserProfile
from database.session import get_db

logger = logging.getLogger(__name__)

class ChatSessionService:
    """
    Service class for managing chat sessions including both guest and registered users.
    Handles volatile sessions for guests and persistent sessions for registered users.
    """

    def __init__(self):
        pass

    def _convert_datetime(self, obj):
        """Recursively convert datetime objects to ISO format strings for JSON serialization."""
        import json
        from datetime import datetime

        if isinstance(obj, dict):
            return {key: self._convert_datetime(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_datetime(item) for item in obj]
        elif isinstance(obj, datetime):
            return obj.isoformat()
        else:
            return obj

    def create_new_session(self, user_id: Optional[str] = None, session_id: Optional[str] = None) -> ChatSession:
        """
        Create a new chat session for a user.

        Args:
            user_id: The user ID (None for guest sessions)
            session_id: The session ID to use (will be generated if not provided)

        Returns:
            The created ChatSession object
        """
        db = next(get_db())
        try:
            # Create a new chat session record
            chat_session = ChatSession(
                user_id=user_id or "guest",  # Use "guest" as a placeholder for guest sessions
                session_id=session_id or f"session_{datetime.utcnow().timestamp()}",
                messages_history=[],
                recipe_context={}
            )

            db.add(chat_session)
            db.commit()
            db.refresh(chat_session)

            logger.info(f"Created new chat session for user {user_id or 'guest'} with session_id {chat_session.session_id}")
            return chat_session
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating chat session: {e}")
            raise
        finally:
            db.close()

    def save_session_to_db(self, user_id: str, session_id: str, messages_history: List[Dict], recipe_context: Dict) -> ChatSession:
        """
        Save a chat session to the database.

        Args:
            user_id: The user ID
            session_id: The session ID
            messages_history: The messages history to save
            recipe_context: The recipe context to save

        Returns:
            The saved ChatSession object
        """
        db = next(get_db())
        try:
            # Convert the messages_history and recipe_context to ensure JSON serializability
            serializable_messages_history = self._convert_datetime(messages_history)
            serializable_recipe_context = self._convert_datetime(recipe_context)

            # Check if session already exists
            existing_session = db.query(ChatSession).filter(
                and_(
                    ChatSession.user_id == user_id,
                    ChatSession.session_id == session_id
                )
            ).first()

            if existing_session:
                # Update existing session
                existing_session.messages_history = serializable_messages_history
                existing_session.recipe_context = serializable_recipe_context
                existing_session.updated_at = datetime.utcnow()

                db.commit()
                db.refresh(existing_session)

                logger.info(f"Updated existing chat session {session_id} for user {user_id}")
                return existing_session
            else:
                # Create new session
                chat_session = ChatSession(
                    user_id=user_id,
                    session_id=session_id,
                    messages_history=serializable_messages_history,
                    recipe_context=serializable_recipe_context
                )

                db.add(chat_session)
                db.commit()
                db.refresh(chat_session)

                logger.info(f"Created new chat session {session_id} for user {user_id}")
                return chat_session
        except Exception as e:
            db.rollback()
            logger.error(f"Error saving chat session: {e}")
            raise
        finally:
            db.close()

    def get_user_sessions(self, user_id: str) -> List[ChatSession]:
        """
        Get all chat sessions for a user.

        Args:
            user_id: The user ID

        Returns:
            List of ChatSession objects for the user
        """
        db = next(get_db())
        try:
            sessions = db.query(ChatSession).filter(ChatSession.user_id == user_id).order_by(ChatSession.created_at.desc()).all()
            logger.info(f"Retrieved {len(sessions)} sessions for user {user_id}")
            return sessions
        except Exception as e:
            logger.error(f"Error retrieving user sessions: {e}")
            raise
        finally:
            db.close()

    def get_session_by_id(self, session_id: str) -> Optional[ChatSession]:
        """
        Get a chat session by its ID.

        Args:
            session_id: The session ID

        Returns:
            ChatSession object or None if not found
        """
        db = next(get_db())
        try:
            session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
            return session
        except Exception as e:
            logger.error(f"Error retrieving session by ID {session_id}: {e}")
            raise
        finally:
            db.close()

    def delete_session(self, session_id: str) -> bool:
        """
        Delete a specific chat session.

        Args:
            session_id: The session ID to delete

        Returns:
            True if deletion was successful, False otherwise
        """
        db = next(get_db())
        try:
            session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
            if session:
                db.delete(session)
                db.commit()
                logger.info(f"Deleted session {session_id}")
                return True
            return False
        except Exception as e:
            db.rollback()
            logger.error(f"Error deleting session {session_id}: {e}")
            raise
        finally:
            db.close()

    def delete_all_user_sessions(self, user_id: str) -> bool:
        """
        Delete all chat sessions for a user.

        Args:
            user_id: The user ID

        Returns:
            True if deletion was successful, False otherwise
        """
        db = next(get_db())
        try:
            sessions = db.query(ChatSession).filter(ChatSession.user_id == user_id).all()
            for session in sessions:
                db.delete(session)
            db.commit()
            logger.info(f"Deleted all {len(sessions)} sessions for user {user_id}")
            return True
        except Exception as e:
            db.rollback()
            logger.error(f"Error deleting all user sessions for {user_id}: {e}")
            raise
        finally:
            db.close()

    def get_session_summary(self, session: ChatSession) -> Dict[str, Any]:
        """
        Get a summary of a chat session for display in the history list.

        Args:
            session: The ChatSession object

        Returns:
            Dictionary with session summary information
        """
        # Get the first message or a default message
        first_message = "New conversation"
        if session.messages_history and len(session.messages_history) > 0:
            # Find the first user message in the history
            for msg in session.messages_history:
                if msg.get('sender') == 'user':
                    content = msg.get('content', '')
                    # Take the first line or first 50 characters
                    first_line = content.split('\n')[0] if '\n' in content else content
                    first_message = first_line[:50] + "..." if len(first_line) > 50 else first_line
                    break

        # Ensure recipe_context is JSON serializable
        serializable_recipe_context = self._convert_datetime(session.recipe_context)

        return {
            'session_id': session.session_id,
            'created_at': session.created_at.isoformat() if session.created_at else None,
            'updated_at': session.updated_at.isoformat() if session.updated_at else None,
            'message_count': len(session.messages_history) if session.messages_history else 0,
            'summary': first_message,
            'recipe_context': serializable_recipe_context
        }


# Global instance
chat_session_service = ChatSessionService()


def get_chat_session_service() -> ChatSessionService:
    """
    Get the chat session service instance.

    Returns:
        ChatSessionService instance
    """
    return chat_session_service