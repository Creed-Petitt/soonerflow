import logging
import sys
import os

def setup_logging():
    # Set log level based on environment
    log_level = os.getenv('LOG_LEVEL', 'INFO').upper()

    # Configure logging for Cloud Run
    logging.basicConfig(
        level=getattr(logging, log_level, logging.INFO),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        stream=sys.stdout,  # Cloud Run expects logs on stdout
        force=True  # Override any existing configuration
    )

    # Set specific loggers
    logger = logging.getLogger(__name__)
    logger.info(f"Logging configured with level: {log_level}")

    return logger