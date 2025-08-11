# OU Class Manager Backend

FastAPI backend for the OU Class Manager application.

## Setup

```bash
cd backend
pip install -r requirements.txt
```

## Run

```bash
# Development
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or
python main.py
```

## API Documentation

- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Endpoints

- `GET /api/classes` - Get all classes (with optional filtering)
- `GET /api/classes/{class_id}` - Get specific class details
- `GET /api/assignments` - Get upcoming assignments
- `GET /api/user/schedule` - Get user's current schedule
- `POST /api/user/schedule/{class_id}` - Add class to schedule
- `DELETE /api/user/schedule/{class_id}` - Remove class from schedule