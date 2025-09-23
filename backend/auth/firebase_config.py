import firebase_admin
from firebase_admin import credentials, auth
import os

def initialize_firebase():
    # Use an environment variable for the path, falling back to a default
    cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_PATH", "firebase-service-account.json")

    if not os.path.exists(cred_path):
        raise FileNotFoundError(f"Firebase service account key not found at {cred_path}")

    cred = credentials.Certificate(cred_path)

    # Initialize Firebase app only if it hasn't been initialized yet
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)

    import logging
    logger = logging.getLogger(__name__)
    logger.info("Firebase initialized successfully!")