"""
Database Connection Module for RecipeRAG
Handles Neon PostgreSQL connection with pgvector extension
"""
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Optional, List, Dict, Any
import numpy as np
from contextlib import contextmanager
import logging

logger = logging.getLogger(__name__)

class DatabaseManager:
    """
    Manages database connections and operations for RecipeRAG
    Uses Neon PostgreSQL with pgvector extension for recipe embeddings
    """

    def __init__(self, connection_url: Optional[str] = None):
        """
        Initialize the database manager with connection URL

        Args:
            connection_url: PostgreSQL connection string (defaults to environment variable)
        """
        self.connection_url = connection_url or os.getenv("NEON_DB_URL")
        if not self.connection_url:
            raise ValueError("Database connection URL is required in NEON_DB_URL environment variable")

        self._initialize_database()

    def _initialize_database(self):
        """
        Initialize the database schema if not already present
        Creates the recipes table with pgvector column and indexes
        """
        try:
            conn = psycopg2.connect(self.connection_url)
            cursor = conn.cursor()

            # Enable pgvector extension
            cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")

            # Create recipes table
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS recipes (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                ingredients TEXT NOT NULL,
                instructions TEXT NOT NULL,
                embedding VECTOR(384),
                category TEXT,
                prep_time INTEGER,  -- in minutes
                servings INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
            cursor.execute(create_table_sql)

            # Create index for cosine similarity search
            create_index_sql = """
            CREATE INDEX IF NOT EXISTS idx_recipes_embedding_cosine
            ON recipes USING hnsw (embedding vector_cosine_ops);
            """
            cursor.execute(create_index_sql)

            conn.commit()
            cursor.close()
            conn.close()

            logger.info("Database schema initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing database schema: {e}")
            raise

    @contextmanager
    def get_connection(self):
        """
        Context manager to get database connection
        Ensures proper connection cleanup
        """
        conn = None
        try:
            conn = psycopg2.connect(self.connection_url)
            yield conn
        except Exception as e:
            if conn:
                conn.rollback()
            raise
        finally:
            if conn:
                conn.close()

    def insert_recipe(self, title: str, ingredients: List[str], instructions: List[str],
                      embedding: List[float], category: Optional[str] = None,
                      prep_time: Optional[int] = None, servings: Optional[int] = None) -> int:
        """
        Insert a recipe with its embedding into the database

        Args:
            title: Recipe title
            ingredients: List of ingredient strings
            instructions: List of instruction steps
            embedding: 384-dimensional embedding vector
            category: Recipe category (optional)
            prep_time: Preparation time in minutes (optional)
            servings: Number of servings (optional)

        Returns:
            int: ID of the inserted recipe
        """
        ingredients_str = ", ".join(ingredients)
        instructions_str = "\n".join(instructions)

        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            insert_sql = """
            INSERT INTO recipes (title, ingredients, instructions, embedding, category, prep_time, servings)
            VALUES (%s, %s, %s, %s::VECTOR, %s, %s, %s)
            RETURNING id;
            """

            cursor.execute(insert_sql, (title, ingredients_str, instructions_str,
                                      embedding, category, prep_time, servings))
            recipe_id = cursor.fetchone()['id']
            conn.commit()

            return recipe_id

    def retrieve_similar_recipes(self, query_embedding: List[float], top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieve top-k most similar recipes based on cosine similarity

        Args:
            query_embedding: 384-dimensional embedding vector to search for
            top_k: Number of similar recipes to return (default 3)

        Returns:
            List of recipe dictionaries with similarity scores
        """
        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            search_sql = """
            SELECT
                id,
                title,
                ingredients,
                instructions,
                category,
                prep_time,
                servings,
                (1 - (embedding <=> %s::VECTOR)) AS similarity
            FROM recipes
            ORDER BY embedding <=> %s::VECTOR
            LIMIT %s;
            """

            cursor.execute(search_sql, (query_embedding, query_embedding, top_k))
            results = cursor.fetchall()

            # Convert results to list of dictionaries
            recipes = []
            for row in results:
                recipe = dict(row)
                # Convert ingredients string back to list
                recipe['ingredients'] = recipe['ingredients'].split(', ') if recipe['ingredients'] else []
                # Convert instructions string back to list
                recipe['instructions'] = recipe['instructions'].split('\n') if recipe['instructions'] else []
                recipes.append(recipe)

            return recipes

    def bulk_insert_recipes(self, recipes_data: List[Dict[str, Any]]) -> int:
        """
        Bulk insert multiple recipes for efficiency

        Args:
            recipes_data: List of recipe dictionaries with keys:
                         title, ingredients(list), instructions(list), embedding(list),
                         category(optional), prep_time(optional), servings(optional)

        Returns:
            int: Number of recipes inserted
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()

            # Prepare data for bulk insert
            values_list = []
            for recipe in recipes_data:
                ingredients_str = ", ".join(recipe.get('ingredients', []))
                instructions_str = "\n".join(recipe.get('instructions', []))

                values_list.append((
                    recipe['title'],
                    ingredients_str,
                    instructions_str,
                    recipe.get('embedding'),
                    recipe.get('category'),
                    recipe.get('prep_time'),
                    recipe.get('servings')
                ))

            insert_sql = """
            INSERT INTO recipes (title, ingredients, instructions, embedding, category, prep_time, servings)
            VALUES %s
            """

            # Use execute_values for efficient bulk insert
            from psycopg2.extras import execute_values
            execute_values(cursor, insert_sql, values_list, template=None, page_size=100)
            conn.commit()

            return len(values_list)

    def get_recipe_by_id(self, recipe_id: int) -> Optional[Dict[str, Any]]:
        """
        Retrieve a single recipe by its ID

        Args:
            recipe_id: ID of the recipe to retrieve

        Returns:
            Recipe dictionary or None if not found
        """
        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            select_sql = """
            SELECT
                id,
                title,
                ingredients,
                instructions,
                category,
                prep_time,
                servings,
                created_at,
                updated_at
            FROM recipes
            WHERE id = %s;
            """

            cursor.execute(select_sql, (recipe_id,))
            result = cursor.fetchone()

            if result:
                recipe = dict(result)
                # Convert ingredients string back to list
                recipe['ingredients'] = recipe['ingredients'].split(', ') if recipe['ingredients'] else []
                # Convert instructions string back to list
                recipe['instructions'] = recipe['instructions'].split('\n') if recipe['instructions'] else []
                return recipe

            return None

# Global database manager instance (singleton pattern with lazy initialization)
_db_manager_instance = None

def get_db_manager() -> DatabaseManager:
    """
    Get the database manager instance with lazy initialization

    Returns:
        DatabaseManager: Singleton instance of the database manager
    """
    global _db_manager_instance
    if _db_manager_instance is None:
        try:
            _db_manager_instance = DatabaseManager()
        except ValueError as e:
            # If database connection is not configured, log the issue but don't crash
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Database not configured: {e}. Some features may be unavailable.")
            # Return a database manager that can handle the lack of connection gracefully
            # For now, we'll raise the error to be handled by the calling code
            raise
    return _db_manager_instance