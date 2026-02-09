from typing import Dict, Any, List
import re
from datetime import datetime

class ProfileValidationService:
    """
    Service for validating and sanitizing user profile data to ensure
    security, consistency, and adherence to defined constraints.
    """

    @staticmethod
    def validate_preferences(preferences: Dict[str, Any]) -> Dict[str, List[str]]:
        """
        Validate user preferences and return a dictionary of validation errors.

        Args:
            preferences: Dictionary containing user preferences

        Returns:
            Dictionary of validation errors, keyed by field name
        """
        errors = {}

        # Validate diet preference
        if 'diet' in preferences:
            valid_diets = {
                'omnivore', 'vegetarian', 'vegan', 'pescatarian',
                'keto', 'paleo', 'gluten-free', 'dairy-free', ''
            }
            if preferences['diet'] not in valid_diets:
                errors['diet'] = [f"Diet must be one of: {', '.join(valid_diets)}"]

        # Validate skill level
        if 'skill_level' in preferences:
            valid_skill_levels = {'beginner', 'intermediate', 'advanced', 'expert', ''}
            if preferences['skill_level'] not in valid_skill_levels:
                errors['skill_level'] = [f"Skill level must be one of: {', '.join(valid_skill_levels)}"]

        # Validate cooking time preference
        if 'cooking_time_preference' in preferences:
            valid_time_prefs = {'quick', 'moderate', 'slow', ''}
            if preferences['cooking_time_preference'] not in valid_time_prefs:
                errors['cooking_time_preference'] = [f"Time preference must be one of: {', '.join(valid_time_prefs)}"]

        # Validate gender
        if 'gender' in preferences:
            valid_genders = {'male', 'female', 'other', 'prefer-not-to-say', ''}
            if preferences['gender'] not in valid_genders:
                errors['gender'] = [f"Gender must be one of: {', '.join(valid_genders)}"]

        # Validate age
        if 'age' in preferences:
            try:
                age = int(preferences['age'])
                if age < 0 or age > 150:
                    errors['age'] = ["Age must be between 0 and 150"]
            except (ValueError, TypeError):
                errors['age'] = ["Age must be a valid number"]

        # Validate calorie goal
        if 'calorie_goal' in preferences:
            try:
                calorie_goal = int(preferences['calorie_goal'])
                if calorie_goal < 0:
                    errors['calorie_goal'] = ["Calorie goal must be a positive number"]
            except (ValueError, TypeError):
                errors['calorie_goal'] = ["Calorie goal must be a valid number"]

        # Validate allergies (array of strings)
        if 'allergies' in preferences:
            if not isinstance(preferences['allergies'], list):
                errors['allergies'] = ["Allergies must be an array of strings"]
            else:
                for i, allergy in enumerate(preferences['allergies']):
                    if not isinstance(allergy, str):
                        if 'allergies' not in errors:
                            errors['allergies'] = []
                        errors['allergies'].append(f"Allergy at index {i} must be a string")
                    elif len(allergy.strip()) == 0:
                        if 'allergies' not in errors:
                            errors['allergies'] = []
                        errors['allergies'].append(f"Allergy at index {i} cannot be empty")

        # Validate likes/dislikes (array of strings)
        if 'likes_dislikes' in preferences:
            if not isinstance(preferences['likes_dislikes'], list):
                errors['likes_dislikes'] = ["Likes/dislikes must be an array of strings"]
            else:
                for i, item in enumerate(preferences['likes_dislikes']):
                    if not isinstance(item, str):
                        if 'likes_dislikes' not in errors:
                            errors['likes_dislikes'] = []
                        errors['likes_dislikes'].append(f"Item at index {i} must be a string")
                    elif len(item.strip()) == 0:
                        if 'likes_dislikes' not in errors:
                            errors['likes_dislikes'] = []
                        errors['likes_dislikes'].append(f"Item at index {i} cannot be empty")

        # Validate cuisine preferences (array of strings)
        if 'cuisine_preferences' in preferences:
            if not isinstance(preferences['cuisine_preferences'], list):
                errors['cuisine_preferences'] = ["Cuisine preferences must be an array of strings"]
            else:
                for i, cuisine in enumerate(preferences['cuisine_preferences']):
                    if not isinstance(cuisine, str):
                        if 'cuisine_preferences' not in errors:
                            errors['cuisine_preferences'] = []
                        errors['cuisine_preferences'].append(f"Cuisine at index {i} must be a string")
                    elif len(cuisine.strip()) == 0:
                        if 'cuisine_preferences' not in errors:
                            errors['cuisine_preferences'] = []
                        errors['cuisine_preferences'].append(f"Cuisine at index {i} cannot be empty")

        # Validate health conditions (array of strings)
        if 'health_conditions' in preferences:
            if not isinstance(preferences['health_conditions'], list):
                errors['health_conditions'] = ["Health conditions must be an array of strings"]
            else:
                for i, condition in enumerate(preferences['health_conditions']):
                    if not isinstance(condition, str):
                        if 'health_conditions' not in errors:
                            errors['health_conditions'] = []
                        errors['health_conditions'].append(f"Condition at index {i} must be a string")
                    elif len(condition.strip()) == 0:
                        if 'health_conditions' not in errors:
                            errors['health_conditions'] = []
                        errors['health_conditions'].append(f"Condition at index {i} cannot be empty")

        # Validate doctor restrictions
        if 'doctor_restrictions' in preferences:
            if not isinstance(preferences['doctor_restrictions'], str):
                errors['doctor_restrictions'] = ["Doctor restrictions must be a string"]
            elif len(preferences['doctor_restrictions']) > 1000:  # Limit length
                errors['doctor_restrictions'] = ["Doctor restrictions must be less than 1000 characters"]

        # Validate ingredient avoidance (array of strings)
        if 'ingredient_avoidance' in preferences:
            if not isinstance(preferences['ingredient_avoidance'], list):
                errors['ingredient_avoidance'] = ["Ingredient avoidance must be an array of strings"]
            else:
                for i, ingredient in enumerate(preferences['ingredient_avoidance']):
                    if not isinstance(ingredient, str):
                        if 'ingredient_avoidance' not in errors:
                            errors['ingredient_avoidance'] = []
                        errors['ingredient_avoidance'].append(f"Ingredient at index {i} must be a string")
                    elif len(ingredient.strip()) == 0:
                        if 'ingredient_avoidance' not in errors:
                            errors['ingredient_avoidance'] = []
                        errors['ingredient_avoidance'].append(f"Ingredient at index {i} cannot be empty")

        return errors

    @staticmethod
    def sanitize_preferences(preferences: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitize user preferences by cleaning and normalizing input.

        Args:
            preferences: Dictionary containing user preferences

        Returns:
            Sanitized preferences dictionary
        """
        sanitized = {}

        # Sanitize string fields
        string_fields = ['diet', 'skill_level', 'cooking_time_preference', 'gender',
                         'doctor_restrictions']
        for field in string_fields:
            if field in preferences:
                value = preferences[field]
                if isinstance(value, str):
                    sanitized[field] = value.strip()[:1000]  # Limit length
                else:
                    sanitized[field] = str(value)[:1000] if value is not None else ''

        # Sanitize numeric fields
        if 'age' in preferences:
            try:
                sanitized['age'] = max(0, min(150, int(preferences['age'])))
            except (ValueError, TypeError):
                sanitized['age'] = 0

        if 'calorie_goal' in preferences:
            try:
                sanitized['calorie_goal'] = max(0, int(preferences['calorie_goal']))
            except (ValueError, TypeError):
                sanitized['calorie_goal'] = 0

        # Sanitize boolean fields
        if 'pregnancy' in preferences:
            sanitized['pregnancy'] = bool(preferences['pregnancy'])

        # Sanitize array fields
        array_fields = ['allergies', 'likes_dislikes', 'cuisine_preferences',
                        'health_conditions', 'ingredient_avoidance']
        for field in array_fields:
            if field in preferences:
                if isinstance(preferences[field], list):
                    # Remove empty strings and sanitize each entry
                    sanitized[field] = [
                        item.strip()[:100] for item in preferences[field]
                        if isinstance(item, str) and item.strip()
                    ][:50]  # Limit to 50 items
                else:
                    sanitized[field] = []

        return sanitized

    @staticmethod
    def validate_and_sanitize(preferences: Dict[str, Any]) -> tuple[bool, Dict[str, Any], Dict[str, List[str]]]:
        """
        Validate and sanitize preferences in one step.

        Args:
            preferences: Dictionary containing user preferences

        Returns:
            Tuple of (is_valid, sanitized_preferences, validation_errors)
        """
        errors = ProfileValidationService.validate_preferences(preferences)
        is_valid = len(errors) == 0

        if is_valid:
            sanitized = ProfileValidationService.sanitize_preferences(preferences)
            return is_valid, sanitized, {}
        else:
            # Still return sanitized data for fields that passed validation
            partially_sanitized = {}
            for key, value in preferences.items():
                if key not in errors:
                    # This field passed validation, so sanitize it
                    temp_dict = {key: value}
                    sanitized_field = ProfileValidationService.sanitize_preferences(temp_dict)
                    partially_sanitized[key] = sanitized_field[key]

            return is_valid, partially_sanitized, errors


# Recipe-specific validation service
class RecipeValidationService:
    """
    Service for validating recipe data to ensure safety and consistency.
    """

    @staticmethod
    def validate_generated_recipe(recipe_data: Dict[str, Any]) -> Dict[str, List[str]]:
        """
        Validate generated recipe data to ensure it meets safety and quality standards.

        Args:
            recipe_data: Dictionary containing recipe data

        Returns:
            Dictionary of validation errors, keyed by field name
        """
        errors = {}

        # Validate required fields
        required_fields = ['title', 'ingredients', 'instructions']
        for field in required_fields:
            if field not in recipe_data or not recipe_data[field]:
                if field not in errors:
                    errors[field] = []
                errors[field].append(f"{field} is required and cannot be empty")

        # Validate title
        if 'title' in recipe_data:
            if not isinstance(recipe_data['title'], str) or len(recipe_data['title'].strip()) == 0:
                if 'title' not in errors:
                    errors['title'] = []
                errors['title'].append("Title must be a non-empty string")
            elif len(recipe_data['title']) > 200:
                if 'title' not in errors:
                    errors['title'] = []
                errors['title'].append("Title must be less than 200 characters")

        # Validate ingredients
        if 'ingredients' in recipe_data:
            if not isinstance(recipe_data['ingredients'], list):
                errors['ingredients'] = ["Ingredients must be an array"]
            else:
                for i, ingredient in enumerate(recipe_data['ingredients']):
                    if isinstance(ingredient, str):
                        # If it's a string, it's fine
                        continue
                    elif isinstance(ingredient, dict):
                        # If it's an object, it should have expected fields
                        if 'name' not in ingredient or not ingredient['name']:
                            if 'ingredients' not in errors:
                                errors['ingredients'] = []
                            errors['ingredients'].append(f"Ingredient at index {i} must have a name")
                    else:
                        if 'ingredients' not in errors:
                            errors['ingredients'] = []
                        errors['ingredients'].append(f"Ingredient at index {i} must be a string or object")

        # Validate instructions
        if 'instructions' in recipe_data:
            if not isinstance(recipe_data['instructions'], list):
                errors['instructions'] = ["Instructions must be an array"]
            else:
                for i, instruction in enumerate(recipe_data['instructions']):
                    if not isinstance(instruction, str) or len(instruction.strip()) == 0:
                        if 'instructions' not in errors:
                            errors['instructions'] = []
                        errors['instructions'].append(f"Instruction at index {i} must be a non-empty string")

        # Validate numerical fields
        numerical_fields = ['prep_time', 'cook_time', 'total_time', 'servings']
        for field in numerical_fields:
            if field in recipe_data:
                try:
                    value = int(recipe_data[field])
                    if value < 0:
                        if field not in errors:
                            errors[field] = []
                        errors[field].append(f"{field} must be a non-negative number")
                except (ValueError, TypeError):
                    if field not in errors:
                        errors[field] = []
                    errors[field].append(f"{field} must be a valid number")

        return errors