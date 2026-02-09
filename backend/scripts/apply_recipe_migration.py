#!/usr/bin/env python3
"""
Script to apply the recipe_cards table migration to add user_id and public columns.
This script connects to the database and runs the necessary ALTER statements.
"""

import os
import sys
from sqlalchemy import create_engine, text

# Add the src directory to the path so we can import our modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

def main():
    # Get database URL from environment
    database_url = os.getenv("NEON_DB_URL")
    if not database_url:
        print("Error: NEON_DB_URL environment variable is not set.")
        print("Please set the NEON_DB_URL environment variable with your database connection string.")
        return 1

    print("Connecting to database...")

    # Create engine
    engine = create_engine(database_url)

    try:
        # Connect to database
        with engine.connect() as conn:
            print("Connected to database successfully!")

            # Apply the migration
            print("Applying migration to add user_id and public columns to recipe_cards table...")

            # Add user_id column
            print("Adding user_id column...")
            conn.execute(text("""
                ALTER TABLE recipe_cards ADD COLUMN IF NOT EXISTS user_id VARCHAR NOT NULL DEFAULT '';
            """))

            # Update existing records to have a default user_id if needed
            print("Updating existing records...")
            conn.execute(text("""
                UPDATE recipe_cards SET user_id = 'migrated_record' WHERE user_id = '' OR user_id IS NULL;
            """))

            # Add public column
            print("Adding public column...")
            conn.execute(text("""
                ALTER TABLE recipe_cards ADD COLUMN IF NOT EXISTS public BOOLEAN DEFAULT FALSE;
            """))

            # Make user_id non-nullable after populating existing records
            print("Making user_id column non-nullable...")
            conn.execute(text("""
                ALTER TABLE recipe_cards ALTER COLUMN user_id SET NOT NULL;
            """))

            # Add indexes
            print("Creating indexes...")
            try:
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_recipe_cards_user_id ON recipe_cards (user_id);
                """))

                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_recipe_cards_public ON recipe_cards (public);
                """))

                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_recipe_cards_user_public ON recipe_cards (user_id, public);
                """))
            except Exception as e:
                print(f"Warning: Could not create indexes: {e}")
                print("This might be because the indexes already exist.")

            # Commit the transaction
            conn.commit()

            print("Migration applied successfully!")
            print("\nMigration includes:")
            print("- Added user_id column (VARCHAR, NOT NULL)")
            print("- Added public column (BOOLEAN, DEFAULT FALSE)")
            print("- Created indexes for better performance")

            # Verify the changes
            print("\nVerifying the table structure...")
            result = conn.execute(text("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'recipe_cards'
                ORDER BY ordinal_position;
            """))

            print("\nCurrent columns in recipe_cards table:")
            for row in result:
                print(f"- {row[0]}: {row[1]} (nullable: {row[2]})")

    except Exception as e:
        print(f"Error applying migration: {e}")
        return 1

    return 0

if __name__ == "__main__":
    sys.exit(main())