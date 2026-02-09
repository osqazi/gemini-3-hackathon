import uuid
from datetime import datetime
from typing import Dict, Optional, Any
import threading
from google.generativeai.types import ContentDict

class SessionManager:
    """
    Manages conversation sessions using in-memory storage as specified in the requirements.
    Each session contains chat history and user preferences.
    """

    def __init__(self):
        # In-memory storage for sessions
        self.sessions: Dict[str, Dict[str, Any]] = {}
        # Thread lock for thread-safe operations
        self._lock = threading.Lock()

    async def get_or_create_session(self, session_id: str):
        """
        Retrieve an existing session or create a new one if it doesn't exist.
        """
        with self._lock:
            if session_id not in self.sessions:
                # Create a new session
                self.sessions[session_id] = {
                    'session_id': session_id,
                    'created_at': datetime.now(),
                    'last_active': datetime.now(),
                    'chat_session': None,  # Will be set by GeminiService
                    'history': [],  # List of ContentDict objects
                    'preferences': {
                        'dietary_restrictions': [],
                        'allergies': [],
                        'taste_preferences': {},
                        'cooking_constraints': [],
                        'ingredient_exclusions': []
                    }
                }
            else:
                # Update last active timestamp
                self.sessions[session_id]['last_active'] = datetime.now()

            return self.sessions[session_id]

    async def update_session(self, session_id: str, session_data: Dict[str, Any]):
        """
        Update session data in memory.
        """
        with self._lock:
            if session_id in self.sessions:
                # Update the session data
                self.sessions[session_id].update(session_data)
                self.sessions[session_id]['last_active'] = datetime.now()

    async def add_message_to_history(self, session_id: str, role: str, parts: list):
        """
        Add a message to the session's history.
        """
        with self._lock:
            if session_id in self.sessions:
                content_dict = {
                    'role': role,
                    'parts': parts,
                    'timestamp': datetime.now()
                }
                self.sessions[session_id]['history'].append(content_dict)

    async def get_session_history(self, session_id: str):
        """
        Get the conversation history for a session.
        """
        with self._lock:
            if session_id in self.sessions:
                return self.sessions[session_id]['history']
            return []

    async def update_preferences(self, session_id: str, preferences: Dict[str, Any]):
        """
        Update user preferences in the session.
        Implements preference preservation and constraint tracking functionality per functional requirement FR-003.
        """
        with self._lock:
            if session_id in self.sessions:
                # Merge the new preferences with existing ones
                for key, value in preferences.items():
                    if isinstance(value, list) and isinstance(self.sessions[session_id]['preferences'].get(key), list):
                        # Extend lists, avoiding duplicates
                        for item in value:
                            if item not in self.sessions[session_id]['preferences'][key]:
                                self.sessions[session_id]['preferences'][key].append(item)
                    elif isinstance(value, dict) and isinstance(self.sessions[session_id]['preferences'].get(key), dict):
                        # Update dictionaries
                        self.sessions[session_id]['preferences'][key].update(value)
                    else:
                        # Replace other types
                        self.sessions[session_id]['preferences'][key] = value

    async def get_preferences(self, session_id: str) -> Dict[str, Any]:
        """
        Get user preferences for a session.
        """
        with self._lock:
            if session_id in self.sessions:
                return self.sessions[session_id]['preferences']
            return {}

    async def preserve_constraints(self, session_id: str, constraints: Dict[str, Any]):
        """
        Preserve and track constraints across conversation turns.
        This implements the iterative recipe refinement while preserving preferences requirement (FR-003).
        """
        with self._lock:
            if session_id in self.sessions:
                # Add constraints to the appropriate preference categories
                for constraint_type, constraint_values in constraints.items():
                    if constraint_type in self.sessions[session_id]['preferences']:
                        if isinstance(constraint_values, list):
                            # Add constraint values to existing list, avoiding duplicates
                            for value in constraint_values:
                                if value not in self.sessions[session_id]['preferences'][constraint_type]:
                                    self.sessions[session_id]['preferences'][constraint_type].append(value)
                        else:
                            # Add single constraint value
                            if constraint_values not in self.sessions[session_id]['preferences'][constraint_type]:
                                self.sessions[session_id]['preferences'][constraint_type].append(constraint_values)

    async def validate_session_id(self, session_id: str) -> bool:
        """
        Validate that the session_id is in a proper UUID format.
        """
        try:
            uuid.UUID(session_id)
            return True
        except ValueError:
            return False