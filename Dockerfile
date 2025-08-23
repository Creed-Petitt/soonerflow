FROM python:3.11-slim

WORKDIR /app

# Copy only what we need
COPY backend/ ./backend/
COPY database/ ./database/

# Install dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt

# Set Python path
ENV PYTHONPATH=/app
ENV PORT=8080

# Run the app
CMD exec uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}