import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(dotenv_path='../.env')  # Look in parent directory for .env

# Get database connection string from environment
db_url = os.getenv('NEON_DB_URL')

if not db_url:
    # Try to find in backend directory
    load_dotenv(dotenv_path='.env')
    db_url = os.getenv('NEON_DB_URL')

if not db_url:
    print("Error: NEON_DB_URL environment variable not found in .env file")
    print("Please make sure your .env file contains the database connection string")
    exit(1)

try:
    # Connect to the database
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()

    # Check if password column exists
    cursor.execute("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'password'
    """)

    result = cursor.fetchone()

    if result:
        print("Password column already exists in users table")
    else:
        # Add the password column
        alter_query = "ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);"
        cursor.execute(alter_query)
        conn.commit()
        print("Password column added successfully to users table")

    # Verify the column exists
    cursor.execute("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'password'
    """)

    columns = cursor.fetchall()
    print("\nUsers table password column info:")
    for col in columns:
        print(f"  Column: {col[0]}, Type: {col[1]}, Nullable: {col[2]}")

    # Close connections
    cursor.close()
    conn.close()

    print("\nDatabase connection closed.")
    print("The password column has been added to your users table successfully!")
    print("You can now run the authentication system which requires this column.")

except psycopg2.Error as e:
    print(f"Database error: {e}")
except Exception as e:
    print(f"Error: {e}")
    print("Make sure your NEON_DB_URL is correct and you have the necessary permissions.")