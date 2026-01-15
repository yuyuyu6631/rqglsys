import sys
import os
from sqlalchemy.exc import OperationalError

# Add current directory to path to ensure app import works
sys.path.append(os.getcwd())

from app import create_app
from app.models import User

def check():
    """
    Checks if the database needs initialization.
    Exits with code 1 if initialization is needed (no users or no tables).
    Exits with code 0 if data appears to exist.
    """
    try:
        app = create_app()
        with app.app_context():
            # Try to get the first user
            user = User.query.first()
            
            if user is None:
                # No users found, trigger initialization
                sys.exit(1)
            else:
                # Users found, skip initialization
                sys.exit(0)
                
    except OperationalError:
        # Table doesn't exist, trigger initialization
        sys.exit(1)
    except Exception as e:
        print(f"[CHECK] Warning: Database check failed with error: {e}")
        # If check fails, assume we might need init? Or fail safe?
        # Let's force init if we can't read DB, as it likely means broken/empty DB.
        sys.exit(1)

if __name__ == "__main__":
    check()
