-- Migration script to add user_id and public columns to recipe_cards table
-- This script adds the required columns to the recipe_cards table

-- Add user_id column (non-nullable)
ALTER TABLE recipe_cards ADD COLUMN IF NOT EXISTS user_id VARCHAR NOT NULL DEFAULT '';

-- Update existing records to have a default user_id if needed (this is just for the migration)
-- In a real scenario, you might want to handle existing records differently
UPDATE recipe_cards SET user_id = 'anonymous' WHERE user_id = '' OR user_id IS NULL;

-- Add public column (boolean with default false)
ALTER TABLE recipe_cards ADD COLUMN IF NOT EXISTS public BOOLEAN DEFAULT FALSE;

-- Make user_id non-nullable after populating existing records
ALTER TABLE recipe_cards ALTER COLUMN user_id SET NOT NULL;

-- Add index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_recipe_cards_user_id ON recipe_cards (user_id);

-- Add index on public for filtering public recipes
CREATE INDEX IF NOT EXISTS idx_recipe_cards_public ON recipe_cards (public);

-- Add index on both user_id and public for efficient querying
CREATE INDEX IF NOT EXISTS idx_recipe_cards_user_public ON recipe_cards (user_id, public);