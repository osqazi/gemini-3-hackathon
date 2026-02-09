# Recipe Cards Migration

This migration adds the required columns to the `recipe_cards` table to support user-specific recipes and public sharing functionality.

## Changes Made

1. **Added `user_id` column**: VARCHAR, NOT NULL - stores the ID of the user who owns the recipe
2. **Added `public` column**: BOOLEAN, DEFAULT FALSE - indicates whether the recipe is shared on Chef's Board
3. **Created indexes** for improved query performance:
   - `idx_recipe_cards_user_id` on user_id column
   - `idx_recipe_cards_public` on public column
   - `idx_recipe_cards_user_public` on both columns for efficient querying

## Migration Script

The migration is handled by:
- SQL script: `migrations/add_user_id_and_public_to_recipe_cards.sql`
- Python script: `scripts/apply_recipe_migration.py`

## Running the Migration

To apply the migration manually, run:

```bash
cd backend
python scripts/apply_recipe_migration.py
```

**Note**: The application automatically creates the tables with the new schema on startup via the `create_tables()` function, so running the migration script is only necessary if upgrading an existing installation.

## Backend Changes

- Updated `RecipeCard` model to include `user_id` and `public` fields
- Added `/save-recipe` endpoint to the chat router
- Created `recipe_service.py` with `save_recipe_to_db` function
- Enhanced error handling and logging

## Frontend Changes

- Created `RecipeSaveDialog` component for the save/share flow
- Integrated dialog into chat page to show after recipe generation
- Added `saveRecipe` function to API library
- Updated Recipe type to support additional fields

## User Authentication Flow

1. Only authenticated users see the save/share dialog
2. Dialog shows two sequential questions:
   - "Do you want to save this Recipe?" (Yes/No)
   - "Do you want to share this Recipe on Chef's Board?" (Yes/No)
3. Recipe is saved only if user answers "Yes" to first question
4. Recipe is marked as public only if user answers "Yes" to second question