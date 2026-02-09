"""
Service for extracting structured recipe data from AI-generated text using Gemini API.
"""
import google.generativeai as genai
import os
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

load_dotenv()

class RecipeExtractionService:
    """
    Service class for using Gemini API to extract structured recipe data from AI-generated text.
    """
    
    def __init__(self):
        # Initialize the API key
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")

        genai.configure(api_key=api_key)
        
        # Use a suitable model for text processing
        model_name = os.getenv("GEMINI_MODEL_NAME", "gemini-1.5-flash")
        try:
            self.model = genai.GenerativeModel(model_name)
        except Exception as e:
            print(f"Warning: Model {model_name} not available: {e}")
            print("Trying fallback model gemini-1.5-pro...")
            try:
                self.model = genai.GenerativeModel("gemini-1.5-pro")
            except Exception:
                print("Warning: gemini-1.5-pro not available, trying gemini-pro...")
                self.model = genai.GenerativeModel("gemini-pro")

    async def extract_recipe_from_text(self, ai_response: str) -> Dict[str, Any]:
        """
        Extract structured recipe data from AI-generated text using Gemini API.
        
        Args:
            ai_response: The raw AI response text containing recipe information
            
        Returns:
            Dict containing structured recipe data matching the database schema
        """
        # Create a prompt to extract structured data
        prompt = f'''
        Please analyze the following recipe text and extract the information into a structured JSON format.
        Pay careful attention to extract ALL the following fields exactly as specified:
        
        - title: The recipe title (should be just the name of the dish, not including introductory text)
        - description: A brief description of the dish (typically the sentence that starts with "This is" or "This dish combines" or similar)
        - ingredients: An array of objects, each with 'name', 'quantity', and 'preparation' fields (e.g., [{{"name": "beef", "quantity": "1 lb", "preparation": "cut into bite-sized pieces"}}])
        - instructions: An array of strings representing the cooking steps (each step should be a separate array element)
        - prep_time: Preparation time in minutes as an integer (extract from text like "Prep time: 15 minutes" - return just the number)
        - cook_time: Cooking time in minutes as an integer (extract from text like "Cook time: 45-60 minutes" - use the first number or average)
        - total_time: Total time in minutes as an integer (prep_time + cook_time)
        - servings: Number of servings as an integer (extract from text like "Yields: 4 servings" - return just the number)
        - difficulty: Difficulty level as a string ("easy", "medium", or "hard") - infer from context if not explicitly stated
        - nutrition_info: Object with nutritional information (can be empty object {{}})
        - tips_variations: Array of strings with tips and variations (extract from "Variations:" section)
        - author: Set to "AI Generated"
        - tags: Array of relevant tags (e.g., "Main Dish", "Beef", etc. based on ingredients)
        
        Here is the recipe text to analyze:
        {ai_response}
        
        IMPORTANT: 
        - Return ONLY the JSON data with no additional text, explanations, or markdown formatting
        - Make sure all time fields are integers, not strings
        - Make sure servings is an integer, not a string
        - Make sure ingredients are objects with name, quantity, and preparation fields
        - Make sure instructions are an array of individual steps
        - If a value is not found, return null for numbers or empty arrays/objects as appropriate
        '''
        
        try:
            response = self.model.generate_content(prompt)
            
            # Extract the JSON from the response
            response_text = response.text.strip()
            
            # Find JSON within triple backticks if present
            import re
            json_match = re.search(r'```(?:json)?\s*({.*?})\s*```', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(1)
            else:
                # If no backticks, try to find JSON object in the response
                # Look for content between curly braces
                brace_pattern = r'\{.*\}'
                brace_match = re.search(brace_pattern, response_text, re.DOTALL)
                if brace_match:
                    response_text = brace_match.group(0)
            
            # Import json here to avoid circular imports
            import json
            recipe_data = json.loads(response_text)
            
            # Debug logging to see what data is being extracted
            print(f"DEBUG: Extracted recipe data: {recipe_data}")
            
            # Ensure required fields have proper defaults
            recipe_data.setdefault('nutrition_info', {})
            recipe_data.setdefault('tips_variations', [])
            recipe_data.setdefault('tags', [])
            recipe_data.setdefault('author', 'AI Generated')
            
            # Set default values for time fields if not provided
            if recipe_data.get('prep_time') is None:
                recipe_data['prep_time'] = 0
            if recipe_data.get('cook_time') is None:
                recipe_data['cook_time'] = 0
            if recipe_data.get('total_time') is None:
                recipe_data['total_time'] = recipe_data['prep_time'] + recipe_data['cook_time']
                
            # Set default servings if not provided
            if recipe_data.get('servings') is None:
                recipe_data['servings'] = 1
                
            # Set default difficulty if not provided
            if recipe_data.get('difficulty') is None:
                recipe_data['difficulty'] = 'medium'
                
            # Set default description if not provided
            if not recipe_data.get('description'):
                recipe_data['description'] = f"A delicious {recipe_data.get('title', 'recipe')} for your cooking pleasure."
                
            # Set default ingredients and instructions if not provided
            if not recipe_data.get('ingredients'):
                recipe_data['ingredients'] = []
            if not recipe_data.get('instructions'):
                recipe_data['instructions'] = []
                
            # Ensure date fields are properly set
            from datetime import datetime
            if not recipe_data.get('generated_at'):
                recipe_data['generated_at'] = datetime.utcnow().isoformat()
            if not recipe_data.get('updated_at'):
                recipe_data['updated_at'] = datetime.utcnow().isoformat()
            
            # Ensure all time fields are integers
            if recipe_data.get('prep_time') is None:
                recipe_data['prep_time'] = 0
            if recipe_data.get('cook_time') is None:
                recipe_data['cook_time'] = 0
            if recipe_data.get('total_time') is None:
                recipe_data['total_time'] = recipe_data['prep_time'] + recipe_data['cook_time']
            
            # Ensure servings is an integer
            if recipe_data.get('servings') is None:
                recipe_data['servings'] = 1
            
            # Ensure difficulty is a string
            if not recipe_data.get('difficulty'):
                recipe_data['difficulty'] = 'medium'
            
            # Ensure arrays are initialized
            if not recipe_data.get('ingredients'):
                recipe_data['ingredients'] = []
            if not recipe_data.get('instructions'):
                recipe_data['instructions'] = []
            if not recipe_data.get('tips_variations'):
                recipe_data['tips_variations'] = []
            if not recipe_data.get('tags'):
                recipe_data['tags'] = []
            
            # Ensure description exists
            if not recipe_data.get('description'):
                recipe_data['description'] = f"A delicious {recipe_data.get('title', 'recipe')} for your cooking pleasure."
                
            return recipe_data
            
        except Exception as e:
            print(f"Error extracting recipe from text: {e}")
            # Import datetime here to avoid issues
            from datetime import datetime
            # Return a minimal structure in case of error
            return {
                'title': 'New Recipe',
                'description': 'A recipe generated by AI',
                'ingredients': [],
                'instructions': [],
                'prep_time': 0,
                'cook_time': 0,
                'total_time': 0,
                'servings': 1,
                'difficulty': 'medium',
                'nutrition_info': {},
                'tips_variations': [],
                'author': 'AI Generated',
                'tags': [],
                'customization_notes': [],
                'source_recipe_id': None,
                'rag_context': {},
                'public': False,
                'user_id': 'unknown',
                'username': 'Anonymous Chef',
                'generated_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }

# Global instance
recipe_extraction_service = RecipeExtractionService()