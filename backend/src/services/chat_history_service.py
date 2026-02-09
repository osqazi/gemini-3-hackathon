from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from src.services.chat_session_service import chat_session_service
from src.models.user import User
from src.models.chat_session import ChatSession

logger = logging.getLogger(__name__)

class ChatHistoryService:
    """
    Service class for managing chat history functionality including retrieval, deletion, etc.
    """

    def __init__(self):
        self.chat_session_service = chat_session_service

    def get_user_chat_history(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all chat sessions for a user as a history list.

        Args:
            user_id: The user ID

        Returns:
            List of session summaries for the user's chat history
        """
        try:
            sessions = self.chat_session_service.get_user_sessions(user_id)

            history_list = []
            for session in sessions:
                summary = self.chat_session_service.get_session_summary(session)
                history_list.append(summary)

            logger.info(f"Retrieved {len(history_list)} chat history items for user {user_id}")
            return history_list
        except Exception as e:
            logger.error(f"Error getting user chat history for user {user_id}: {e}")
            raise

    def get_specific_chat_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific chat session by its ID.

        Args:
            session_id: The session ID

        Returns:
            Dictionary with session data or None if not found
        """
        try:
            session = self.chat_session_service.get_session_by_id(session_id)
            if session:
                return {
                    'session_id': session.session_id,
                    'user_id': session.user_id,
                    'messages_history': session.messages_history,
                    'recipe_context': session.recipe_context,
                    'created_at': session.created_at.isoformat() if session.created_at else None,
                    'updated_at': session.updated_at.isoformat() if session.updated_at else None
                }
            return None
        except Exception as e:
            logger.error(f"Error getting specific chat session {session_id}: {e}")
            raise

    def delete_specific_chat_session(self, session_id: str) -> bool:
        """
        Delete a specific chat session.

        Args:
            session_id: The session ID to delete

        Returns:
            True if deletion was successful, False otherwise
        """
        try:
            return self.chat_session_service.delete_session(session_id)
        except Exception as e:
            logger.error(f"Error deleting specific chat session {session_id}: {e}")
            raise

    def delete_all_user_chat_sessions(self, user_id: str) -> bool:
        """
        Delete all chat sessions for a user.

        Args:
            user_id: The user ID

        Returns:
            True if deletion was successful, False otherwise
        """
        try:
            return self.chat_session_service.delete_all_user_sessions(user_id)
        except Exception as e:
            logger.error(f"Error deleting all chat sessions for user {user_id}: {e}")
            raise


# Global instance
chat_history_service = ChatHistoryService()


def get_chat_history_service() -> ChatHistoryService:
    """
    Get the chat history service instance.

    Returns:
        ChatHistoryService instance
    """
    return chat_history_service