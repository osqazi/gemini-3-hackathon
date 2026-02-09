from fastapi import APIRouter, UploadFile, File, Form, Request, Depends
from typing import Optional
from pydantic import BaseModel
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database.session import get_db
from ..services.recipe_service import save_recipe_to_db
from ..models.recipe_card import RecipeCard
import json

router = APIRouter()
security = HTTPBearer()

class ChatRequest(BaseModel):
    session_id: str
    message: str
    new_photo: Optional[bytes] = None  # This won't work directly - we'll handle file differently

async def get_current_user_id(request: Request) -> Optional[str]:
    """
    Get the current user ID from the session or headers.

    Note: Due to the architecture with NextAuth on Next.js frontend and FastAPI backend,
    direct session sharing is complex. In a production implementation, you'd either:
    1. Use a shared session store
    2. Pass user ID securely from frontend after NextAuth validation
    3. Implement JWT tokens that both systems can validate
    4. Have Next.js API routes act as a bridge

    For this implementation, we check for a secure header that would be set
    by the frontend after validating the NextAuth session.
    """
    try:
        # The frontend should pass the user ID in a secure header after validating
        # the NextAuth session. This header would be set only after proper validation.
        user_id = request.headers.get("x-user-id")

        if user_id:
            # Verify this is a legitimate request by checking for a request signature
            # In a real implementation, you'd validate a signature or token here
            return user_id

        # Alternative: In a production setup, you might have NextAuth call this API
        # directly with validated user information, or implement proper session sharing

        # For now, return None indicating unauthenticated user
        return None
    except Exception as e:
        # Log the exception for debugging
        import logging
        logging.warning(f"Error in get_current_user_id: {e}")
        # If there's an error, treat as guest user
        return None

@router.post("/chat")
async def chat(
    request: Request,
    session_id: str = Form(...),
    message: str = Form(...),
    include_preferences: str = Form("true"),  # Default to true
    new_photo: UploadFile = File(None),
    current_user_id: Optional[str] = Depends(get_current_user_id)
):
    """
    Endpoint for engaging in conversational recipe refinement with the personal chef agent.
    Maintains persistent conversation history using Gemini's chat/session mechanism
    with full 1M-token context persistence.
    """
    import time
    from src.services.gemini_service import GeminiService
    from src.models.session_manager import SessionManager

    # Measure the start time for performance tracking
    start_time = time.time()

    # Validate session_id format
    from core.session_store import shared_session_manager
    is_valid = await shared_session_manager.validate_session_id(session_id)
    if not is_valid:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    try:
        # Get or create session
        session = await shared_session_manager.get_or_create_session(session_id)

        # Check domain guardrails before processing the message
        from src.services.domain_guardrails import domain_guardrails
        should_intercept, intercept_response = domain_guardrails.should_intercept_query(message)

        if should_intercept:
            # Return the thematic response instead of processing with Gemini
            response_time = time.time() - start_time
            import logging
            logging.info(f"Chat request intercepted by domain guardrails in {response_time:.2f} seconds for session {session_id}")
            return {
                "response": intercept_response,
                "ingredients": []
            }

        # Initialize gemini service
        gemini_service = GeminiService()

        # Prepare the message content
        content_parts = [message]

        if new_photo:
            try:
                # Read the image file
                image_bytes = await new_photo.read()

                # Validate that we have actual content
                if not image_bytes:
                    from fastapi import HTTPException
                    raise HTTPException(status_code=422, detail="Uploaded image file is empty")

                # Validate file type (basic check)
                allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/gif"]
                if new_photo.content_type not in allowed_types:
                    from fastapi import HTTPException
                    raise HTTPException(status_code=422, detail=f"Invalid image type. Allowed types: {', '.join(allowed_types)}")

                # Add image to content parts in the correct format for Gemini
                content_parts.append({
                    "mime_type": new_photo.content_type,
                    "data": image_bytes
                })
            except Exception as e:
                from fastapi import HTTPException
                raise HTTPException(status_code=422, detail=f"Error processing uploaded image: {str(e)}")

        # Check if the user is asking about ingredients from the image
        # Look for keywords that indicate they're asking about the analyzed image
        user_message_lower = message.lower()
        asking_about_ingredients = any(keyword in user_message_lower for keyword in [
            'ingredient', 'ingredients', 'what are', 'what is', 'recipe', 'cuisine',
            'food', 'dish', 'contents', 'include', 'contains', 'analyze', 'uploaded', 'image'
        ])

        # Try to retrieve the session again to ensure we have the latest data
        current_session = await shared_session_manager.get_or_create_session(session_id)

        # If asking about ingredients and session has previously analyzed image data,
        # include that information in the message to Gemini
        if asking_about_ingredients and current_session.get('image_analysis'):
            image_ingredients = current_session.get('image_analysis', {}).get('ingredients', [])
            if image_ingredients:
                # Add the previously analyzed ingredients to the message context
                ingredient_context = f"\n\nNote: Earlier you uploaded an image that contained these ingredients: {', '.join(image_ingredients)}. Please refer to these ingredients when responding to this query."
                content_parts.append(ingredient_context)

        # Convert include_preferences string to boolean
        include_preferences_bool = include_preferences.lower() in ['true', '1', 'yes', 'on']

        # Send message to gemini service and get response
        # The gemini service should handle adding messages to the session history
        response = await gemini_service.send_message(session, content_parts, include_preferences_bool)

        # Update session with any changes made by the gemini service
        await shared_session_manager.update_session(session_id, session)

        # For registered users, save the session to the database
        if current_user_id:
            from src.services.chat_session_service import chat_session_service
            # Update the messages history with the new conversation
            messages_history = session.get('history', [])

            # Extract recipe context from the session - try to parse response for recipe info
            recipe_context = session.get('recipe_context', {})

            # If no recipe context exists, try to extract recipe information from the response
            if not recipe_context and response:
                # Attempt to parse recipe information from the AI response
                import re

                # Look for recipe-related information in the response
                recipe_info = {}

                # Extract recipe title if present
                title_match = re.search(r'(Recipe|Title|Name):\s*(.+?)(?:\n|$)', response, re.IGNORECASE)
                if title_match:
                    recipe_info['title'] = title_match.group(2).strip()

                # Look for ingredients section
                ingredients_match = re.search(r'Ingredients:(.*?)(?=Instructions|Directions|Steps|$)', response, re.DOTALL | re.IGNORECASE)
                if ingredients_match:
                    ingredients_text = ingredients_match.group(1).strip()
                    # Extract individual ingredients
                    ingredient_lines = [line.strip() for line in ingredients_text.split('\n') if line.strip()]
                    recipe_info['ingredients'] = ingredient_lines

                # Look for instructions section
                instructions_match = re.search(r'(Instructions|Directions|Steps):(.*?)(?=Notes|Tips|Recipe|$)', response, re.DOTALL | re.IGNORECASE)
                if instructions_match:
                    instructions_text = instructions_match.group(2).strip()
                    instruction_steps = [step.strip() for step in instructions_text.split('\n') if step.strip() and not step.strip().startswith('#')]
                    recipe_info['instructions'] = instruction_steps

                # If we found recipe information, update the session
                if recipe_info:
                    session['recipe_context'] = recipe_info
                    recipe_context = recipe_info

            chat_session_service.save_session_to_db(
                user_id=current_user_id,
                session_id=session_id,
                messages_history=messages_history,
                recipe_context=recipe_context
            )

        # Extract ingredients from response if available
        ingredients = await _extract_ingredients_from_response(response)

        # Calculate response time
        response_time = time.time() - start_time

        # Log response time for performance tracking
        import logging
        logging.info(f"Chat request completed in {response_time:.2f} seconds for session {session_id}")

        # Additional performance logging per conversation turn
        logging.info(f"Conversation turn completed - Session: {session_id}, Message: '{message[:50]}...', Response time: {response_time:.2f}s")

        # Extract recipe information from the response if available
        recipe_data = await _extract_recipe_from_response(response)

        # Return response with ingredients list and recipe data
        return {
            "response": response,
            "ingredients": ingredients,
            "recipe": recipe_data,
            "session_id": session_id  # Return the session ID for frontend tracking
        }
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Error processing chat request: {str(e)}")


@router.get("/chat/history")
async def get_chat_history(current_user_id: Optional[str] = Depends(get_current_user_id)):
    """
    Get the chat history for the current user.
    """
    if not current_user_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Unauthorized: Only registered users can access chat history")

    try:
        from src.services.chat_history_service import chat_history_service
        history = chat_history_service.get_user_chat_history(current_user_id)
        return {"success": True, "history": history}
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Error retrieving chat history: {str(e)}")


@router.get("/chat/session/{session_id}")
async def get_chat_session(session_id: str, current_user_id: Optional[str] = Depends(get_current_user_id)):
    """
    Get a specific chat session by ID.
    """
    if not current_user_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Unauthorized: Only registered users can access chat sessions")

    try:
        from src.services.chat_history_service import chat_history_service
        session = chat_history_service.get_specific_chat_session(session_id)
        if not session:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Session not found")
        return {"success": True, "session": session}
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Error retrieving chat session: {str(e)}")


@router.delete("/chat/session/{session_id}")
async def delete_chat_session(session_id: str, current_user_id: Optional[str] = Depends(get_current_user_id)):
    """
    Delete a specific chat session.
    """
    if not current_user_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Unauthorized: Only registered users can delete chat sessions")

    try:
        from src.services.chat_history_service import chat_history_service
        success = chat_history_service.delete_specific_chat_session(session_id)
        if not success:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Session not found")
        return {"success": True, "message": "Session deleted successfully"}
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Error deleting chat session: {str(e)}")


@router.delete("/chat/history")
async def delete_all_chat_history(current_user_id: Optional[str] = Depends(get_current_user_id)):
    """
    Delete all chat history for the current user.
    """
    if not current_user_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Unauthorized: Only registered users can delete chat history")

    try:
        from src.services.chat_history_service import chat_history_service
        success = chat_history_service.delete_all_user_chat_sessions(current_user_id)
        return {"success": True, "message": "All chat history deleted successfully"}
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Error deleting all chat history: {str(e)}")


async def _extract_ingredients_from_response(response: str):
    """
    Extract ingredients from the response if they are available.
    """
    # This is a simple extraction based on common patterns in recipe responses
    # In a more sophisticated implementation, we would use NLP or structured parsing

    import re

    # Look for common ingredient list patterns in the response
    # This is a basic implementation - a real one would be more sophisticated
    ingredients = []

    # Split the response into lines and look for ingredient-like patterns
    lines = response.split('\n')

    for line in lines:
        # Look for lines that might contain ingredients
        # This is a simplified approach - real implementation would use NLP
        line = line.strip()

        # Common indicators of ingredient lines
        if any(indicator in line.lower() for indicator in [' - ', '• ', '*', ' cup', ' tbsp', ' tsp', ' g', ' kg']):
            # Extract potential ingredient (simplified)
            potential_ingredient = line.replace(' - ', '').replace('• ', '').replace('* ', '').strip()

            # Add to ingredients if it looks like an ingredient
            if len(potential_ingredient) > 3 and not any(word in potential_ingredient.lower() for word in ['reasoning:', 'substitutions:', 'nutrition notes:', 'variations:']):
                ingredients.append(potential_ingredient)

    # If no ingredients found with the above method, return an empty list
    # In a real implementation, we would have more sophisticated parsing
    return ingredients


async def _extract_recipe_from_response(response: str):
    """
    Extract structured recipe information from the AI response using AI-powered extraction.
    """
    try:
        # Import the recipe extraction service
        from src.services.recipe_extraction_service import recipe_extraction_service
        
        # Use the AI service to extract structured recipe data
        recipe_data = await recipe_extraction_service.extract_recipe_from_text(response)
        
        # Map the fields to match the expected format in the rest of the code
        result = {
            'title': recipe_data.get('title', 'Generated Recipe'),
            'description': recipe_data.get('description', ''),
            'ingredients': recipe_data.get('ingredients', []),
            'instructions': recipe_data.get('instructions', []),
            'prep_time': recipe_data.get('prep_time'),
            'cook_time': recipe_data.get('cook_time'),
            'total_time': recipe_data.get('total_time'),
            'servings': recipe_data.get('servings', 2),
            'difficulty': recipe_data.get('difficulty', 'medium'),
            'nutrition_info': recipe_data.get('nutrition_info', {}),
            'tips_variations': recipe_data.get('tips_variations', []),
            'author': recipe_data.get('author', 'AI Generated'),
            'tags': recipe_data.get('tags', []),
            'reasoning': recipe_data.get('description', ''),  # For backward compatibility
            'variations': recipe_data.get('tips_variations', []),  # For backward compatibility
            'createdAt': datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%fZ')  # ISO format string for frontend compatibility
        }
        
        # Add any cookingTime field for backward compatibility if needed
        if recipe_data.get('cook_time'):
            result['cookingTime'] = recipe_data['cook_time']
        
        # If we found substantial recipe data, return it; otherwise return None
        if len(result.get('ingredients', [])) > 0 or len(result.get('instructions', [])) > 0:
            return result

        return None
        
    except Exception as e:
        import logging
        logging.error(f"Error extracting recipe with AI service: {e}")
        
        # Fallback to basic extraction if AI service fails
        import re

        # Look for recipe structure in the response
        recipe_data = {}

        # Extract recipe title (usually the first line after greeting or the first heading-like text)
        lines = response.split('\n')
        for line in lines:
            line = line.strip()
            # Look for potential recipe title (short lines with capitalized words, without common prefixes)
            if 10 <= len(line) <= 100 and line.count(' ') >= 1 and not any(common in line.lower() for common in ['okay', 'here', 'is', 'a', 'recipe', 'for', 'this']):
                # Check if it looks like a title (capitalized words, no colons in the middle, etc.)
                if line[0].isupper() and ':' not in line[1:-1] and '!' not in line[1:-1]:
                    # Avoid lines that start with common sentence starters
                    if not any(line.lower().startswith(start) for start in ['this recipe', 'the recipe', 'here is', 'i suggest']):
                        recipe_data['title'] = line
                        break

        # If no title found, try to extract from the first sentence after intro
        if not recipe_data.get('title'):
            # Look for pattern like "Here's a recipe for [TITLE]"
            title_match = re.search(r'recipe for ([^\n.]+)', response, re.IGNORECASE)
            if title_match:
                recipe_data['title'] = title_match.group(1).strip()
            else:
                # Use the first capitalized sentence that looks like a recipe name
                sentences = response.split('.')
                for sentence in sentences:
                    sentence = sentence.strip()
                    if len(sentence) > 5 and sentence[0].isupper() and any(word in sentence.lower() for word in ['skillet', 'soup', 'salad', 'stew', 'cake', 'pie', 'bread', 'roast', 'grill']):
                        recipe_data['title'] = sentence
                        break

        # Extract ingredients
        ingredients_section = None
        for i, line in enumerate(lines):
            if 'ingredients:' in line.lower():
                ingredients_section = i
                break

        if ingredients_section is not None:
            ingredients = []
            i = ingredients_section + 1
            while i < len(lines):
                line = lines[i].strip()
                if not line or line.lower().startswith(('instructions:', 'steps:', 'method:', 'yield', 'prep time')):
                    break
                if line.startswith(('•', '-', '*')) or any(unit in line.lower() for unit in ['cup', 'tbsp', 'tsp', 'oz', 'lb', 'kg', 'g']):
                    # Clean up the ingredient line
                    ingredient = line.lstrip('•-* \t')
                    if ingredient:
                        ingredients.append(ingredient)
                i += 1

            recipe_data['ingredients'] = ingredients

        # Extract instructions
        instructions_section = None
        for i, line in enumerate(lines):
            if any(keyword in line.lower() for keyword in ['instructions:', 'steps:', 'method:', 'how to']):
                instructions_section = i
                break

        if instructions_section is not None:
            instructions = []
            i = instructions_section + 1
            while i < len(lines):
                line = lines[i].strip()
                if not line or line.lower().startswith(('serving', 'notes', 'variations', 'substitutions', 'nutrition')):
                    break
                if line.startswith(('•', '-', '*', '1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '10.')):
                    # Clean up the instruction line
                    instruction = re.sub(r'^\d+\.\s*', '', line.lstrip('•-* \t'))
                    if instruction:
                        instructions.append(instruction)
                i += 1

            recipe_data['instructions'] = instructions

        # Extract cooking time
        time_match = re.search(r'cook time[:\s]+(\d+)-?(\d*)\s*(minutes|min)?', response, re.IGNORECASE)
        if time_match:
            try:
                cook_time = int(time_match.group(1))
                recipe_data['cookingTime'] = cook_time
            except:
                pass
        else:
            # Look for other time patterns
            time_match = re.search(r'(\d+)\s*(minutes|min)\s+cook', response, re.IGNORECASE)
            if time_match:
                try:
                    cook_time = int(time_match.group(1))
                    recipe_data['cookingTime'] = cook_time
                except:
                    pass

        # Extract servings
        servings_match = re.search(r'(serves?|yield|servings)[:\s]+(\d+)-?(\d*)', response, re.IGNORECASE)
        if servings_match:
            try:
                servings = int(servings_match.group(2))
                recipe_data['servings'] = servings
            except:
                pass

        # Extract difficulty (if mentioned)
        if any(word in response.lower() for word in ['easy', 'simple', 'quick']):
            recipe_data['difficulty'] = 'easy'
        elif any(word in response.lower() for word in ['medium', 'intermediate', 'moderate']):
            recipe_data['difficulty'] = 'medium'
        elif any(word in response.lower() for word in ['hard', 'difficult', 'challenging', 'advanced']):
            recipe_data['difficulty'] = 'hard'

        # Extract reasoning (description)
        # Look for the description part before ingredients/instructions
        ingredients_start = next((i for i, line in enumerate(lines) if 'ingredients:' in line.lower()), len(lines))
        intro_end = next((i for i, line in enumerate(lines[:ingredients_start]) if line.strip() and not any(w in line.lower() for w in ['here', 'is', 'a', 'recipe', 'for'])), ingredients_start)

        # Get the descriptive paragraph
        description_lines = []
        for i in range(min(intro_end + 1, len(lines))):
            line = lines[i].strip()
            if len(line) > 20 and not any(w in line.lower() for w in ['here', 'is', 'a', 'recipe', 'for', 'this']):
                description_lines.append(line)

        if description_lines:
            # Use the longest descriptive line that seems like a description
            description_lines = [line for line in description_lines if not any(w in line.lower() for w in ['okay', 'here', 'this'])]
            if description_lines:
                recipe_data['reasoning'] = ' '.join(description_lines[-3:])  # Last few lines as description

        # Extract variations
        variations_section = None
        for i, line in enumerate(lines):
            if 'variations:' in line.lower():
                variations_section = i
                break

        if variations_section is not None:
            variations = []
            i = variations_section + 1
            while i < len(lines):
                line = lines[i].strip()
                if not line or line.lower().startswith(('notes', 'serving', 'substitutions')):
                    break
                if line.startswith(('•', '-')):
                    variation = line.lstrip('•- \t')
                    if variation:
                        variations.append(variation)
                i += 1
            recipe_data['variations'] = variations

        # Set default values if not found
        if not recipe_data.get('title'):
            recipe_data['title'] = 'Generated Recipe'
        if not recipe_data.get('ingredients'):
            recipe_data['ingredients'] = []
        if not recipe_data.get('instructions'):
            recipe_data['instructions'] = []
        if not recipe_data.get('servings'):
            recipe_data['servings'] = 2
        if not recipe_data.get('difficulty'):
            recipe_data['difficulty'] = 'medium'
        # Add createdAt for frontend compatibility (as ISO string)
        recipe_data['createdAt'] = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%fZ')

        # If we found substantial recipe data, return it; otherwise return None
        if len(recipe_data.get('ingredients', [])) > 0 or len(recipe_data.get('instructions', [])) > 0:
            return recipe_data

        return None


@router.post("/save-recipe")
async def save_recipe_endpoint(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Endpoint to save a recipe to the database.

    Expects a JSON payload with:
    - recipe: Recipe data object
    - is_public: Boolean indicating if recipe should be shared on Chef's Board
    - user_id: ID of the user saving the recipe (passed in x-user-id header)
    """
    try:
        # Get the JSON payload
        payload = await request.json()

        # Get user ID from header (verified by frontend after NextAuth validation)
        user_id = request.headers.get("x-user-id")
        if not user_id:
            from fastapi import HTTPException
            raise HTTPException(status_code=401, detail="User not authenticated")

        # Extract recipe data and public flag from payload
        recipe_data = payload.get("recipe", {})
        is_public = payload.get("isPublic", False)

        # Validate that we have recipe data
        if not recipe_data:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="Recipe data is required")

        # Save the recipe to the database
        saved_recipe = save_recipe_to_db(
            db=db,
            recipe_data=recipe_data,
            user_id=user_id,
            is_public=is_public
        )

        return {
            "success": True,
            "recipe_id": saved_recipe.id,
            "message": "Recipe saved successfully"
        }
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Error saving recipe: {str(e)}")


@router.get("/public-recipes")
async def get_public_recipes(
    db: Session = Depends(get_db),
    sort_by: str = "generated_at",  # Sort by field (generated_at, user_id, total_time, etc.)
    sort_order: str = "desc",       # Sort order (asc or desc)
    search: str = "",               # Search term to filter recipes
    difficulty: str = "",           # Filter by difficulty level
    min_time: int = None,           # Filter by minimum total time
    max_time: int = None,           # Filter by maximum total time
    servings: int = None,           # Filter by number of servings
    username: str = "",             # Filter by username to show only user's recipes
    limit: int = 20,                # Number of recipes to return
    offset: int = 0                 # Offset for pagination
):
    """
    Get public recipes for the Chef's Board.

    Args:
        sort_by: Field to sort by (generated_at, user_id, total_time, etc.)
        sort_order: Sort order ('asc' or 'desc')
        search: Search term to filter recipes by title, description, ingredients, etc.
        difficulty: Filter by difficulty level (easy, medium, hard)
        min_time: Filter by minimum total time (in minutes)
        max_time: Filter by maximum total time (in minutes)
        servings: Filter by number of servings
        limit: Number of recipes to return
        offset: Offset for pagination

    Returns:
        List of public recipes
    """
    try:
        # Base query for public recipes
        query = db.query(RecipeCard).filter(RecipeCard.public == True)

        # Apply search filter if provided
        if search:
            query = query.filter(RecipeCard.title.ilike(f"%{search}%"))

        # Apply difficulty filter
        if difficulty:
            query = query.filter(RecipeCard.difficulty.ilike(f"%{difficulty}%"))

        # Apply username filter if provided
        if username:
            # Get user by username to get their user_id
            from src.models.user import User
            user = db.query(User).filter(User.username == username).first()
            if user:
                query = query.filter(RecipeCard.user_id == user.user_id)

        # Apply time and servings filters with validation
        if min_time is not None and str(min_time).strip() != "":
            try:
                min_time_int = int(min_time)
                query = query.filter(RecipeCard.total_time >= min_time_int)
            except (ValueError, TypeError):
                pass  # Skip invalid min_time value

        if max_time is not None and str(max_time).strip() != "":
            try:
                max_time_int = int(max_time)
                query = query.filter(RecipeCard.total_time <= max_time_int)
            except (ValueError, TypeError):
                pass  # Skip invalid max_time value

        if servings is not None and str(servings).strip() != "":
            try:
                servings_int = int(servings)
                query = query.filter(RecipeCard.servings == servings_int)
            except (ValueError, TypeError):
                pass  # Skip invalid servings value

        # Define valid sort fields to prevent injection
        valid_sort_fields = {
            'generated_at': RecipeCard.generated_at,
            'user_id': RecipeCard.user_id,
            'total_time': RecipeCard.total_time,
            'difficulty': RecipeCard.difficulty,
            'title': RecipeCard.title,
            'servings': RecipeCard.servings,
        }

        # Apply sorting
        if sort_by in valid_sort_fields:
            sort_field = valid_sort_fields[sort_by]
            if sort_order.lower() == 'asc':
                query = query.order_by(sort_field.asc())
            else:
                query = query.order_by(sort_field.desc())
        else:
            # Default to sorting by generated_at descending (newest first)
            query = query.order_by(RecipeCard.generated_at.desc())

        # Apply pagination
        recipes = query.offset(offset).limit(limit).all()

        # Get total count for pagination info with the same filters applied
        total_count_query = db.query(RecipeCard).filter(RecipeCard.public == True)

        # Apply the same filters to count query
        if search:
            total_count_query = total_count_query.filter(RecipeCard.title.ilike(f"%{search}%"))
        if difficulty:
            total_count_query = total_count_query.filter(RecipeCard.difficulty.ilike(f"%{difficulty}%"))
        if username:
            # Get user by username to get their user_id for count query
            from src.models.user import User
            user = db.query(User).filter(User.username == username).first()
            if user:
                total_count_query = total_count_query.filter(RecipeCard.user_id == user.user_id)
        if min_time is not None and str(min_time).strip() != "":
            try:
                min_time_int = int(min_time)
                total_count_query = total_count_query.filter(RecipeCard.total_time >= min_time_int)
            except (ValueError, TypeError):
                pass  # Skip invalid min_time value
        if max_time is not None and str(max_time).strip() != "":
            try:
                max_time_int = int(max_time)
                total_count_query = total_count_query.filter(RecipeCard.total_time <= max_time_int)
            except (ValueError, TypeError):
                pass  # Skip invalid max_time value
        if servings is not None and str(servings).strip() != "":
            try:
                servings_int = int(servings)
                total_count_query = total_count_query.filter(RecipeCard.servings == servings_int)
            except (ValueError, TypeError):
                pass  # Skip invalid servings value

        total_count = total_count_query.count()

        # Convert to dictionary format for JSON serialization
        result = []
        for recipe in recipes:
            try:
                # Safely parse JSON fields
                ingredients = []
                if recipe.ingredients:
                    if isinstance(recipe.ingredients, list):
                        # Ingredients are already in object format
                        ingredients = recipe.ingredients
                    else:
                        # Ingredients are stored as JSON string, parse them
                        try:
                            ingredients = json.loads(recipe.ingredients)
                        except (json.JSONDecodeError, TypeError):
                            ingredients = []

                nutrition_info = {}
                if recipe.nutrition_info:
                    if isinstance(recipe.nutrition_info, dict):
                        # Nutrition info is already in object format
                        nutrition_info = recipe.nutrition_info
                    else:
                        # Nutrition info is stored as JSON string, parse it
                        try:
                            nutrition_info = json.loads(recipe.nutrition_info)
                        except (json.JSONDecodeError, TypeError):
                            nutrition_info = {}

                # Get user info for the recipe owner
                from src.models.user import User
                user = db.query(User).filter(User.user_id == recipe.user_id).first()
                username = "Anonymous Chef"
                if user and user.username:
                    username = user.username

                # Safely parse other JSON fields
                instructions = []
                if recipe.instructions:
                    if isinstance(recipe.instructions, list):
                        # Instructions are already in object format
                        instructions = recipe.instructions
                    else:
                        # Instructions are stored as JSON string, parse them
                        try:
                            instructions = json.loads(recipe.instructions)
                        except (json.JSONDecodeError, TypeError):
                            instructions = []

                tips_variations = []
                if recipe.tips_variations:
                    if isinstance(recipe.tips_variations, list):
                        # Tips variations are already in object format
                        tips_variations = recipe.tips_variations
                    else:
                        # Tips variations are stored as JSON string, parse them
                        try:
                            tips_variations = json.loads(recipe.tips_variations)
                        except (json.JSONDecodeError, TypeError):
                            tips_variations = []

                images = []
                if recipe.images:
                    if isinstance(recipe.images, list):
                        # Images are already in object format
                        images = recipe.images
                    else:
                        # Images are stored as JSON string, parse them
                        try:
                            images = json.loads(recipe.images)
                        except (json.JSONDecodeError, TypeError):
                            images = []

                tags = []
                if recipe.tags:
                    if isinstance(recipe.tags, list):
                        # Tags are already in object format
                        tags = recipe.tags
                    else:
                        # Tags are stored as JSON string, parse them
                        try:
                            tags = json.loads(recipe.tags)
                        except (json.JSONDecodeError, TypeError):
                            tags = []

                customization_notes = []
                if recipe.customization_notes:
                    if isinstance(recipe.customization_notes, list):
                        # Customization notes are already in object format
                        customization_notes = recipe.customization_notes
                    else:
                        # Customization notes are stored as JSON string, parse them
                        try:
                            customization_notes = json.loads(recipe.customization_notes)
                        except (json.JSONDecodeError, TypeError):
                            customization_notes = []

                rag_context = {}
                if recipe.rag_context:
                    if isinstance(recipe.rag_context, dict):
                        # RAG context is already in object format
                        rag_context = recipe.rag_context
                    else:
                        # RAG context is stored as JSON string, parse it
                        try:
                            rag_context = json.loads(recipe.rag_context)
                        except (json.JSONDecodeError, TypeError):
                            rag_context = {}

                recipe_dict = {
                    "id": recipe.id,
                    "title": recipe.title,
                    "description": recipe.description or "",
                    "ingredients": ingredients,
                    "instructions": instructions,
                    "prep_time": recipe.prep_time,
                    "cook_time": recipe.cook_time,
                    "total_time": recipe.total_time,
                    "servings": recipe.servings,
                    "difficulty": recipe.difficulty,
                    "nutrition_info": nutrition_info,
                    "tips_variations": tips_variations,
                    "author": recipe.author or "AI Generated",
                    "generated_at": recipe.generated_at.isoformat() if recipe.generated_at else None,
                    "updated_at": recipe.updated_at.isoformat() if recipe.updated_at else None,
                    "createdAt": recipe.generated_at.strftime('%Y-%m-%dT%H:%M:%S.%fZ') if recipe.generated_at else datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%fZ'),  # Added for frontend compatibility
                    "images": images,
                    "tags": tags,
                    "customization_notes": customization_notes,
                    "source_recipe_id": recipe.source_recipe_id,
                    "rag_context": rag_context,
                    "user_id": recipe.user_id,
                    "username": username,
                }
                result.append(recipe_dict)
            except Exception as e:
                print(f"Error parsing recipe {recipe.id}: {e}")
                continue

        return {"recipes": result, "total_count": total_count}

    except Exception as e:
        import traceback
        print(f"Error fetching public recipes: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error fetching public recipes: {str(e)}")


@router.get("/public-recipes/stats")
async def get_public_recipes_stats(
    db: Session = Depends(get_db)
):
    """
    Get statistics for public recipes in the database

    Returns:
        Dictionary with statistics about public recipes
    """
    try:
        from sqlalchemy import func

        # Get total count of public recipes
        total_recipes = db.query(RecipeCard).filter(RecipeCard.public == True).count()

        # Get count of easy recipes
        easy_recipes = db.query(RecipeCard).filter(
            RecipeCard.public == True,
            RecipeCard.difficulty.ilike('%easy%')
        ).count()

        # Get count of quick meals (recipes with total time <= 30 minutes)
        quick_meals = db.query(RecipeCard).filter(
            RecipeCard.public == True,
            RecipeCard.total_time <= 30
        ).count()

        # Get count of unique contributors (user_ids)
        chefs_contributing = db.query(func.count(func.distinct(RecipeCard.user_id))).filter(
            RecipeCard.public == True
        ).scalar()

        return {
            "total_recipes": total_recipes,
            "easy_recipes": easy_recipes,
            "quick_meals": quick_meals,
            "chefs_contributing": chefs_contributing or 0
        }

    except Exception as e:
        import traceback
        print(f"Error fetching recipe statistics: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error fetching recipe statistics: {str(e)}")


@router.patch("/recipes/{recipe_id}/publish")
async def update_recipe_public_status(
    recipe_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Update the public status of a recipe.

    Args:
        recipe_id: ID of the recipe to update
        request: Request object containing the public status
        db: Database session

    Returns:
        Dictionary with success status and message
    """
    try:
        # Get the JSON payload
        payload = await request.json()
        is_public = payload.get("public", False)

        # Get user ID from header (verified by frontend after NextAuth validation)
        user_id = request.headers.get("x-user-id")
        if not user_id:
            from fastapi import HTTPException
            raise HTTPException(status_code=401, detail="User not authenticated")

        # Find the recipe in the database
        recipe = db.query(RecipeCard).filter(RecipeCard.id == recipe_id, RecipeCard.user_id == user_id).first()
        
        if not recipe:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Recipe not found or you don't have permission to modify it")

        # Update the public status
        recipe.public = is_public
        db.commit()
        db.refresh(recipe)

        return {
            "success": True,
            "message": f"Recipe public status updated successfully to {'public' if is_public else 'private'}"
        }
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        import logging
        logging.error(f"Error updating recipe public status: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error updating recipe public status: {str(e)}"
        )


@router.post("/extract-recipe-from-text")
async def extract_recipe_from_text(request: Request):
    """
    Extract structured recipe data from text using AI.
    """
    try:
        # Get the JSON payload
        payload = await request.json()
        text_content = payload.get("text", "")

        if not text_content:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="Text content is required")

        # Import the recipe extraction service
        from src.services.recipe_extraction_service import recipe_extraction_service

        # Use the AI service to extract structured recipe data
        recipe_data = await recipe_extraction_service.extract_recipe_from_text(text_content)

        return recipe_data

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        import logging
        logging.error(f"Error extracting recipe from text: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error extracting recipe from text: {str(e)}"
        )