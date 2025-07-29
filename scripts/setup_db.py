import os
import subprocess
import sys

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n{description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"{description} completed successfully")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"{description} failed:")
        print(f"Error: {e.stderr}")
        return False

def setup_database():
    """Set up the SQLite database and Prisma client"""
    
    print("Setting up OU Class Manager Database...")
    
    # Check if we're in the right directory
    if not os.path.exists('ou-class-manager/prisma/schema.prisma'):
        print("Error: ou-class-manager/prisma/schema.prisma not found. Make sure you're in the project root.")
        return False
    
    # Create .env file if it doesn't exist (in the Next.js app directory)
    env_path = 'ou-class-manager/.env'
    if not os.path.exists(env_path):
        print("Creating .env file...")
        with open(env_path, 'w') as f:
            f.write('DATABASE_URL="file:./prisma/dev.db"\n')
        print(".env file created")
    
    # Install dependencies if needed
    print("\nChecking dependencies...")
    if not os.path.exists('ou-class-manager/node_modules'):
        print("Installing Node.js dependencies...")
        run_command("cd ou-class-manager && npm install", "Installing Node.js dependencies")
    
    # Generate Prisma client
    run_command("cd ou-class-manager && npx prisma generate", "Generating Prisma client")
    
    # Create and migrate database
    run_command("cd ou-class-manager && npx prisma db push", "Creating database schema")
    
    # Verify database was created
    if os.path.exists('ou-class-manager/prisma/dev.db'):
        print("Database file created successfully")
    else:
        print("Database file not found")
        return False
    
    print("\nDatabase setup completed successfully!")
    print("\nDatabase info:")
    print("   - Database file: ou-class-manager/prisma/dev.db")
    print("   - Schema: prisma/schema.prisma")
    print("   - Tables: classes, meeting_times, departments, professors, ratings")
    
    print("\nReady for data backload!")
    print("   - Run scrapers to populate database")
    print("   - Use 'npx prisma studio' to view data")
    
    return True

if __name__ == "__main__":
    success = setup_database()
    if success:
        print("\nSetup completed successfully!")
    else:
        print("\nSetup failed. Please check the errors above.")
        sys.exit(1) 