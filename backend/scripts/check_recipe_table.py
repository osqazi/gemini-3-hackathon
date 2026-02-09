#!/usr/bin/env python3
"""
Script to check if the recipe_cards table has the required user_id column.
"""

import os
import sys
from sqlalchemy import create_engine, text
import logging

# Add the src directory to the path so we can import our modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_recipe_table_structure():
    # Get database URL from environment
    database_url = os.getenv("NEON_DB_URL")
    if not database_url:
        logger.error("Error: NEON_DB_URL environment variable is not set.")
        logger.error("Please set the NEON_DB_URL environment variable with your database connection string.")
        return False

    logger.info("Connecting to database...")

    # Create engine
    engine = create_engine(database_url)

    try:
        # Connect to database
        with engine.connect() as conn:
            logger.info("Connected to database successfully!")

            # Check if recipe_cards table exists
            table_exists_query = text("""
                SELECT EXISTS (
                   SELECT FROM information_schema.tables
                   WHERE table_name = 'recipe_cards'
                );
            """)

            table_result = conn.execute(table_exists_query)
            table_exists = table_result.scalar()

            if not table_exists:
                logger.error("recipe_cards table does not exist!")
                return False

            logger.info("recipe_cards table exists.")

            # Check the columns in the recipe_cards table
            columns_query = text("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'recipe_cards'
                ORDER BY ordinal_position;
            """)

            result = conn.execute(columns_query)
            columns = []
            user_id_found = False
            public_found = False

            logger.info("\nColumns in recipe_cards table:")
            for row in result:
                col_name, data_type, is_nullable = row
                columns.append((col_name, data_type, is_nullable))
                logger.info(f"- {col_name}: {data_type} (nullable: {is_nullable})")

                if col_name == 'user_id':
                    user_id_found = True
                    logger.info(f"✓ Found user_id column: {data_type}, nullable: {is_nullable}")

                if col_name == 'public':
                    public_found = True
                    logger.info(f"✓ Found public column: {data_type}, nullable: {is_nullable}")

            # Check if required columns exist
            if not user_id_found:
                logger.warning("⚠ WARNING: user_id column is missing from recipe_cards table!")
                logger.info("You need to run the migration script to add the user_id column.")
                return False
            else:
                logger.info("✓ user_id column exists in recipe_cards table.")

            if not public_found:
                logger.warning("⚠ WARNING: public column is missing from recipe_cards table!")
                logger.info("You need to run the migration script to add the public column.")
                return False
            else:
                logger.info("✓ public column exists in recipe_cards table.")

            logger.info("\n✅ All required columns are present in the recipe_cards table.")
            return True

    except Exception as e:
        logger.error(f"Error checking table structure: {e}")
        return False

if __name__ == "__main__":
    success = check_recipe_table_structure()
    if success:
        logger.info("Table structure check completed successfully.")
        sys.exit(0)
    else:
        logger.error("Table structure check failed.")
        sys.exit(1)