import google.generativeai as genai
from google.generativeai.types import content_types
from typing import List, Dict, Any, Union
import os
from dotenv import load_dotenv
from src.utils.response_parser import ResponseParser

# Load environment variables
load_dotenv()

class GeminiService:
    """
    Service class for handling Gemini chat interactions.
    Implements the chat session functionality as specified in the requirements.
    """

    def __init__(self):
        # Initialize the API key
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")

        genai.configure(api_key=api_key)

        # Use the appropriate model (from existing .env)
        model_name = os.getenv("GEMINI_MODEL_NAME", "gemini-1.5-flash")

        # Attempt to initialize the model, fall back to a default if unavailable
        try:
            self.model = genai.GenerativeModel(model_name)
        except Exception as e:
            # If the specified model is not available, try a fallback model
            print(f"Warning: Model {model_name} not available: {e}")
            print("Trying fallback model gemini-1.5-pro...")
            try:
                self.model = genai.GenerativeModel("gemini-1.5-pro")
            except Exception:
                # If gemini-1.5-pro is also not available, try gemini-pro
                print("Warning: gemini-1.5-pro not available, trying gemini-pro...")
                self.model = genai.GenerativeModel("gemini-pro")

        # Initialize response parser
        self.response_parser = ResponseParser()

        # Configure safety settings as per requirements
        self.safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_LOW_AND_ABOVE"},
        ]

    async def initialize_chat_session(self, session_data: Dict[str, Any]):
        """
        Initialize a chat session with existing history if available.
        """
        raw_history = session_data.get('history', [])

        # Format the history for Gemini API
        # Gemini expects history as a list of dicts with 'role' and 'parts'
        formatted_history = []
        for item in raw_history:
            if isinstance(item, dict) and 'role' in item and 'parts' in item:
                formatted_history.append({
                    'role': item['role'],
                    'parts': item['parts']
                })

        # Create chat session with formatted history
        chat_session = self.model.start_chat(history=formatted_history)

        return chat_session

    async def send_message(self, session_data: Dict[str, Any], content_parts: List[Any], include_preferences: bool = True):
        """
        Send a message to the Gemini model and return the response.

        Args:
            session_data: Session data containing preferences, history, etc.
            content_parts: Content to send to the model
            include_preferences: Whether to include user preferences in the context (default: True)
        """
        # Get or create the chat session for this conversation
        if not session_data.get('chat_session'):
            session_data['chat_session'] = await self.initialize_chat_session(session_data)

        chat_session = session_data['chat_session']

        # Prepare the message with system context if this is the first message
        if len(session_data.get('history', [])) == 0:
            # Add system prompt to guide the model behavior
            system_prompt = self._get_system_prompt()
            # For the first message, we'll send both system prompt and user message
            response = await self._send_with_retry(chat_session, [system_prompt] + content_parts)
        else:
            # For subsequent messages, just send the user content
            # But include the current preferences and image analysis to ensure the model is aware of them
            context_parts = []

            # Conditionally add preferences to context based on include_preferences flag
            if include_preferences:
                preferences = session_data.get('preferences', {})

                # Format preferences as a string to include in the message context
                preferences_context = self._format_preferences_for_context(preferences)

                if preferences_context.strip():
                    context_parts.append(f"User preferences and constraints: {preferences_context}")

            # Always include image analysis data in the session
            image_analysis = session_data.get('image_analysis', {})
            image_ingredients = image_analysis.get('ingredients', [])

            if image_ingredients:
                context_parts.append(f"Previously analyzed image contained ingredients: {', '.join(image_ingredients)}")

            if context_parts:
                content_parts.append("\nContext for this conversation: " + "; ".join(context_parts))

            response = await self._send_with_retry(chat_session, content_parts)

        # Get the response text
        response_text = response.text

        # Process the response to ensure it contains required reasoning sections
        processed_response = await self.response_parser.parse_and_enforce_structure(response_text)

        # Update the session history with the new interaction
        import datetime

        # Add the user message to history
        user_message = {
            'role': 'user',
            'parts': content_parts,
            'timestamp': datetime.datetime.now()
        }

        # Add the AI response to history
        ai_message = {
            'role': 'model',
            'parts': [processed_response],
            'timestamp': datetime.datetime.now()
        }

        # Ensure history exists and add messages
        if 'history' not in session_data:
            session_data['history'] = []

        session_data['history'].append(user_message)
        session_data['history'].append(ai_message)

        # Update the session history in the chat session as well
        try:
            # Add messages to the chat session history
            chat_session.history.extend([user_message, ai_message])
        except:
            # If we can't update the chat session history directly,
            # the important thing is that session_data is updated
            pass

        # Update token limits
        await self._check_token_limits(session_data)

        # Add performance logging for this conversation turn
        import time
        import logging
        end_time = time.time()
        # We don't have the start time here, but the chat_router handles that
        logging.info(f"Gemini service processing completed for session")

        return processed_response

    def _format_preferences_for_context(self, preferences: Dict[str, Any]) -> str:
        """
        Format the user preferences into a string that can be included in the message context.
        Ensures ALL preference types are included, not just partial preferences.
        """
        context_parts = []

        # Ensure we have the complete preferences structure
        complete_preferences = {
            'dietary_restrictions': preferences.get('dietary_restrictions', []),
            'allergies': preferences.get('allergies', []),
            'taste_preferences': preferences.get('taste_preferences', {}),
            'cooking_constraints': preferences.get('cooking_constraints', []),
            'ingredient_exclusions': preferences.get('ingredient_exclusions', [])
        }

        # Add all preference types, even if empty, to ensure Gemini is aware of the complete context
        for pref_type, pref_values in complete_preferences.items():
            if isinstance(pref_values, list):
                if len(pref_values) > 0:
                    context_parts.append(f"{pref_type}: {', '.join(map(str, pref_values))}")
                else:
                    # Even if empty, mention that this category is empty to ensure Gemini knows
                    context_parts.append(f"{pref_type}: none specified")
            elif isinstance(pref_values, dict):
                if len(pref_values) > 0:
                    context_parts.append(f"{pref_type}: {str(pref_values)}")
                else:
                    context_parts.append(f"{pref_type}: none specified")
            elif isinstance(pref_values, str):
                if pref_values.strip():
                    context_parts.append(f"{pref_type}: {pref_values}")
                else:
                    context_parts.append(f"{pref_type}: none specified")
            else:
                # For any other type
                if pref_values:
                    context_parts.append(f"{pref_type}: {str(pref_values)}")
                else:
                    context_parts.append(f"{pref_type}: none specified")

        return "; ".join(context_parts)

    async def _check_token_limits(self, session_data: Dict[str, Any], threshold: float = 0.8):
        """
        Check if the conversation is approaching token limits.
        The 1M token window is shared across conversation history.
        """
        # Estimate token count (rough approximation: 1 token ≈ 4 characters)
        history = session_data.get('history', [])

        estimated_tokens = 0
        for message in history:
            parts = message.get('parts', [])
            for part in parts:
                if isinstance(part, str):
                    estimated_tokens += len(part) // 4
                elif isinstance(part, dict) and 'data' in part:
                    # For image data, just count the mime type description
                    mime_type = part.get('mime_type', '')
                    estimated_tokens += len(mime_type) // 4

        # If we're approaching 80% of the 1M token limit, log a warning
        if estimated_tokens > 1_000_000 * threshold:
            import logging
            logging.warning(f"Conversation approaching token limit: {estimated_tokens}/{1_000_000} tokens used")

            # In a real implementation, we might want to summarize or compress the history
            # For now, we just log the warning

    async def _send_with_retry(self, chat_session, content_parts: List[Any], max_retries: int = 3):
        """
        Send message with retry logic in case of failures.
        """
        for attempt in range(max_retries):
            try:
                # Properly format the content parts for the API
                formatted_parts = []

                for part in content_parts:
                    if isinstance(part, str):
                        # Text content
                        formatted_parts.append(part)
                    elif isinstance(part, dict) and 'data' in part and 'mime_type' in part:
                        # Image content
                        formatted_parts.append({
                            "inline_data": {
                                "mime_type": part["mime_type"],
                                "data": part["data"]
                            }
                        })
                    else:
                        # Add as text if it's any other type
                        formatted_parts.append(str(part))

                response = chat_session.send_message(
                    formatted_parts,
                    safety_settings=self.safety_settings
                )

                # Check if the response was blocked by safety settings
                if hasattr(response, '_raw_response') and hasattr(response._raw_response, 'prompt_feedback'):
                    if hasattr(response._raw_response.prompt_feedback, 'block_reason') and response._raw_response.prompt_feedback.block_reason:
                        import logging
                        logging.warning(f"Response blocked by safety filters: {response._raw_response.prompt_feedback.block_reason}")

                        # Return a helpful message to the user
                        from google.generativeai.types import generation_types
                        # Create a mock response object with a helpful message
                        class BlockedResponse:
                            def __init__(self):
                                self.text = "I apologize, but I had to block this response for safety reasons. Please try rephrasing your request or ask for a different recipe suggestion."

                        return BlockedResponse()

                return response
            except Exception as e:
                if attempt == max_retries - 1:  # Last attempt
                    raise e
                # Wait a bit before retrying
                import time
                time.sleep(0.5)

        raise Exception(f"Failed to get response after {max_retries} attempts")

    def _get_system_prompt(self) -> str:
        """
        Get the system prompt from the file or default to hardcoded value.
        """
        try:
            with open("backend/prompts/agent-system-v1.txt", "r") as f:
                return f.read()
        except FileNotFoundError:
            # Try the relative path from project root
            try:
                with open("prompts/agent-system-v1.txt", "r") as f:
                    return f.read()
            except FileNotFoundError:
                # Default system prompt if file not found
                return """You are an expert culinary chef and recipe creator with extensive knowledge of cooking techniques, ingredients, and flavor combinations. Your role is to act as a personal chef assistant that helps users create, refine, and improve recipes based on their preferences, dietary restrictions, and available ingredients.

CORE IDENTITY:
- You are a RecipeRAG AI assistant focused solely on cooking, recipes, ingredients, and food
- Your expertise is in culinary arts, cooking techniques, ingredients, and meal planning
- You are part of the RecipeRAG application ecosystem

TOPIC AWARENESS:
- You must recognize when a user asks about topics outside of food, cooking, recipes, ingredients, nutrition, or culinary arts
- Examples of off-topic questions: programming languages (like Python, Java, HTML, CSS, JavaScript, NextJS), historical figures, geography, politics, general science, entertainment, sports, etc.
- When you detect an off-topic question, you should immediately redirect to food-related topics

OFF-TOPIC RESPONSE PROTOCOL:
- When a user asks an off-topic question, respond with: "I'm a RecipeRAG culinary assistant focused on cooking and recipes. I can't help with that question, but I'd love to help you with a delicious recipe instead!"
- Then gently redirect by asking: "Would you like me to suggest a recipe based on ingredients you have available?"
- Do NOT attempt to answer the off-topic question, even if you know the answer
- Do NOT try to relate the off-topic question back to food unless it's genuinely related to cooking/food

CORE BEHAVIORS:
1. Always provide clear reasoning for any changes you make to a recipe
2. Include specific substitution suggestions when modifying ingredients
3. Explain nutritional impacts of changes when relevant
4. Suggest variations and alternatives where appropriate
5. Remember and respect user preferences and constraints from previous conversation turns
6. Ground your responses in practical cooking knowledge and food safety principles
7. Be creative with cooking suggestions while maintaining safety standards

RESPONSE FORMAT:
Every response should include these sections when relevant:
- Reasoning: Explain why you made the changes
- Substitutions: List any ingredient substitutions made and why
- Nutrition notes: Mention any relevant nutritional changes or benefits
- Variations: Suggest alternative approaches or enhancements

FOOD-FOCUS RULES:
- If a user tries to get you to discuss programming, technology, history, science, or other non-food topics, politely decline and redirect
- If a user mentions they're learning programming or technology, acknowledge briefly then redirect: "That sounds interesting! Speaking of skills, would you like help with a cooking technique?"
- Always maintain focus on food, cooking, and recipe creation

MAINTAIN AWARENESS:
- Maintain awareness of the entire conversation history and ensure consistency with previously established preferences and constraints
- Keep all discussions centered on food, cooking, and recipe creation"""