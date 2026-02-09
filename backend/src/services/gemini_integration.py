import google.generativeai as genai
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import json
import logging

logger = logging.getLogger(__name__)

class RecipeGenerationRequest(BaseModel):
    ingredients: List[str]
    preferences: Dict[str, Any]
    user_profile: Optional[Dict[str, Any]] = None
    session_context: Optional[Dict[str, Any]] = None

class GeminiIntegrationService:
    def __init__(self, api_key: str, model_name: str = None, text_model_name: str = None):
        genai.configure(api_key=api_key)
        
        # Use the model names from environment variables if not provided
        vision_model_name = model_name or os.getenv("GEMINI_MODEL_NAME", "gemini-1.5-flash")
        text_model_name = text_model_name or os.getenv("GEMINI_MODEL_NAME", "gemini-1.5-pro")
        
        self.model = genai.GenerativeModel(vision_model_name)
        self.text_model = genai.GenerativeModel(text_model_name)

    def generate_recipe_prompt(self, ingredients: List[str], preferences: Dict[str, Any],
                              user_profile: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate a detailed prompt for the Gemini model based on ingredients,
        preferences, and user profile data.

        Args:
            ingredients: List of ingredients provided by the user
            preferences: User's dietary preferences and restrictions
            user_profile: Optional user profile with health conditions, allergies, etc.

        Returns:
            Formatted prompt string for the Gemini model
        """
        # Start with base ingredients
        prompt = f"You are an expert chef and nutritionist. Create a detailed recipe using these ingredients: {', '.join(ingredients)}.\n\n"

        # Add user preferences
        if preferences:
            prompt += "Additional preferences to consider:\n"
            for key, value in preferences.items():
                if value:  # Only add non-empty preferences
                    if isinstance(value, list):
                        prompt += f"- {key}: {', '.join(value)}\n"
                    else:
                        prompt += f"- {key}: {value}\n"
            prompt += "\n"

        # Add user profile information if available
        if user_profile:
            prompt += "User profile information to personalize the recipe:\n"

            # Add dietary restrictions from profile
            if user_profile.get('diet'):
                prompt += f"- Dietary preference: {user_profile['diet']}\n"

            # Add allergies from profile
            allergies = user_profile.get('allergies', [])
            if allergies:
                prompt += f"- Allergies to avoid: {', '.join(allergies)}\n"

            # Add health conditions from profile
            health_conditions = user_profile.get('health_conditions', [])
            if health_conditions:
                prompt += f"- Health conditions to consider: {', '.join(health_conditions)}\n"

            # Add cooking skill level
            skill_level = user_profile.get('skill_level')
            if skill_level:
                prompt += f"- Cooking skill level: {skill_level}. Adjust complexity accordingly.\n"

            # Add calorie goal
            calorie_goal = user_profile.get('calorie_goal')
            if calorie_goal:
                prompt += f"- Daily calorie goal: {calorie_goal}. Consider portion sizes.\n"

            # Add pregnancy status
            if user_profile.get('pregnancy'):
                prompt += "- User is pregnant. Avoid any ingredients or preparations not safe for pregnancy.\n"

            # Add doctor restrictions
            doctor_restrictions = user_profile.get('doctor_restrictions')
            if doctor_restrictions:
                prompt += f"- Doctor's dietary restrictions: {doctor_restrictions}\n"

            prompt += "\n"

        # Add recipe requirements
        prompt += """Please provide:
        1. Recipe title
        2. Detailed ingredients list with quantities
        3. Step-by-step cooking instructions
        4. Estimated prep and cooking time
        5. Serving size
        6. Nutritional information (approximate)
        7. Cooking tips and variations
        8. Substitution suggestions if needed

        Make sure the recipe is practical, safe, and delicious. Consider the user's preferences and profile information when making suggestions."""

        return prompt

    async def generate_recipe_with_profile(self, ingredients: List[str], preferences: Dict[str, Any],
                                          user_profile: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Generate a recipe using the Gemini model with profile information integrated.

        Args:
            ingredients: List of ingredients provided by the user
            preferences: User's dietary preferences and restrictions
            user_profile: Optional user profile with health conditions, allergies, etc.

        Returns:
            Generated recipe as a dictionary
        """
        try:
            # Generate the prompt with profile information
            prompt = self.generate_recipe_prompt(ingredients, preferences, user_profile)

            # Generate content using the text model
            response = await self.text_model.generate_content_async(prompt)

            # Parse the response
            recipe_text = response.text

            # Attempt to structure the response
            structured_recipe = self.parse_recipe_response(recipe_text)

            # Add profile usage information
            structured_recipe['profile_used'] = user_profile is not None
            if user_profile:
                structured_recipe['profile_summary'] = {
                    'diet': user_profile.get('diet'),
                    'allergies': user_profile.get('allergies', []),
                    'skill_level': user_profile.get('skill_level'),
                    'health_conditions': user_profile.get('health_conditions', [])
                }

            return structured_recipe

        except Exception as e:
            logger.error(f"Error generating recipe with profile: {str(e)}")
            raise

    def parse_recipe_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse the Gemini response into a structured recipe format.

        Args:
            response_text: Raw text response from Gemini

        Returns:
            Structured recipe dictionary
        """
        # This is a simplified parser - in a real implementation,
        # you might use more sophisticated NLP or structured output from Gemini
        recipe = {
            'title': 'Generated Recipe',
            'ingredients': [],
            'instructions': [],
            'prep_time': 'NA',
            'cook_time': 'NA',
            'servings': 'NA',
            'nutritional_info': {},
            'tips_variations': [],
            'customization_notes': []
        }

        # Basic parsing - in practice, you'd want more robust parsing
        lines = response_text.split('\n')
        current_section = None

        for line in lines:
            line_lower = line.lower().strip()

            if 'title:' in line_lower or 'recipe:' in line_lower:
                recipe['title'] = line.replace('Title:', '').replace('Recipe:', '').strip()
            elif 'ingredients' in line_lower:
                current_section = 'ingredients'
            elif 'instructions' in line_lower or 'steps' in line_lower:
                current_section = 'instructions'
            elif 'time:' in line_lower or 'prep' in line_lower:
                recipe['prep_time'] = line.strip()
            elif 'serving' in line_lower:
                recipe['servings'] = line.strip()
            elif 'nutrition' in line_lower or 'calories' in line_lower:
                current_section = 'nutrition'
            elif 'tip' in line_lower or 'variation' in line_lower:
                current_section = 'tips'
            elif line.strip().startswith(('- ', '*', '•')):
                if current_section == 'ingredients':
                    recipe['ingredients'].append(line.strip('- *• '))
                elif current_section == 'instructions':
                    recipe['instructions'].append(line.strip('- *• '))
                elif current_section == 'tips':
                    recipe['tips_variations'].append(line.strip('- *• '))

        return recipe

    async def refine_recipe_with_profile(self, current_recipe: Dict[str, Any],
                                        refinement_request: str,
                                        user_profile: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Refine an existing recipe based on a user's request, considering their profile.

        Args:
            current_recipe: Current recipe to refine
            refinement_request: User's request for refinement
            user_profile: Optional user profile with health conditions, allergies, etc.

        Returns:
            Refined recipe as a dictionary
        """
        try:
            # Create a prompt that includes the current recipe and refinement request
            prompt = f"Here is the current recipe:\n\n"
            prompt += json.dumps(current_recipe, indent=2)
            prompt += f"\n\nThe user wants to refine this recipe with the following request: '{refinement_request}'\n\n"

            if user_profile:
                prompt += "Consider the user's profile information when making changes:\n"
                if user_profile.get('allergies'):
                    prompt += f"- Allergies to avoid: {', '.join(user_profile['allergies'])}\n"
                if user_profile.get('health_conditions'):
                    prompt += f"- Health conditions to consider: {', '.join(user_profile['health_conditions'])}\n"
                if user_profile.get('diet'):
                    prompt += f"- Dietary preference: {user_profile['diet']}\n"
                if user_profile.get('pregnancy'):
                    prompt += "- User is pregnant. Ensure all ingredients are safe for pregnancy.\n"

            prompt += "\nPlease provide the refined recipe, clearly indicating what changes were made based on the user's request."

            # Generate refined recipe
            response = await self.text_model.generate_content_async(prompt)

            # Parse the response
            refined_recipe = self.parse_recipe_response(response.text)

            # Add refinement information
            refined_recipe['original_recipe'] = current_recipe
            refined_recipe['refinement_request'] = refinement_request
            refined_recipe['profile_considered'] = user_profile is not None

            return refined_recipe

        except Exception as e:
            logger.error(f"Error refining recipe with profile: {str(e)}")
            raise