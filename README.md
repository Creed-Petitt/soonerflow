# OU Class Manager (SoonerFlow)

This repository contains the full-stack source code for SoonerFlow, a comprehensive web application designed to help University of Oklahoma students browse courses, view professor ratings, and build their class schedules with ease. The project features a React/Next.js frontend, a Python/FastAPI backend, and a PostgreSQL database, all containerized with Docker and configured for automated deployment on Google Cloud Run.

## Key Features

- **Advanced Course Browser:** Search, filter, and browse thousands of courses with detailed information, including descriptions, meeting times, and available seats.
- **Professor Insights:** Integrates Rate My Professors data to show instructor ratings, difficulty scores, and student feedback directly within the course browser.
- **Visual Schedule Builder:** Interactively add and remove classes from a visual calendar to build the perfect schedule.
- **Multi-Schedule Management:** Create, save, and switch between multiple schedule variations for different semesters.
- **User Authentication:** Secure user accounts with Firebase for saving schedules and personal preferences.
- **Automated Data Scraping:** A suite of Python scripts automates the process of scraping and updating course and professor data to keep the application current.
- **Cloud-Native Architecture:** Designed for serverless deployment on Google Cloud Run, using Cloud SQL for the database and Artifact Registry for container storage.
- **Automated CI/CD:** A GitHub Actions workflow automates testing, building, and deploying the backend application on every push to the `main` branch.

## Architecture Overview

The application is composed of three main components: a Next.js frontend, a FastAPI backend, and a set of data scraping scripts.

- **Frontend (Next.js):** A modern, responsive user interface built with React and Next.js. It provides all the client-facing features, including the class browser, schedule calendar, and user authentication. It communicates with the backend via a REST API.
- **Backend (FastAPI):** A robust RESTful API built with Python and FastAPI. It handles business logic, serves data to the frontend, manages user authentication, and interacts with the PostgreSQL database.
- **Database (PostgreSQL):** A PostgreSQL database, hosted on Google Cloud SQL in production, persists all application data, including courses, professors, users, and schedules. The schema is managed by SQLAlchemy.
- **Scrapers:** A collection of Python scripts responsible for fetching course data from the university's public catalog and professor ratings from Rate My Professors. This data is then processed and loaded into the database.

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Classes

- `GET /classes`: Retrieve a paginated and filtered list of classes.
- `GET /classes/{class_id}`: Retrieve details for a specific class by its ID.
- `GET /subjects`: Retrieve a list of all course subjects.
- `GET /semesters`: Retrieve a list of all available semesters.

### Professors

- `GET /professors`: Retrieve a paginated list of professors.
- `GET /professors/{professor_id}`: Retrieve details for a specific professor by ID.

### Schedules

- `POST /schedules`: Create a new schedule for the authenticated user.
- `GET /schedules`: Get all schedules for the authenticated user for a given semester.
- `GET /schedules/active`: Get the active schedule for the user for a given semester.
- `PUT /schedules/{schedule_id}/active`: Set a specific schedule as active.
- `POST /schedules/{schedule_id}/classes`: Add a class to a schedule.
- `DELETE /schedules/{schedule_id}/classes/{class_id}`: Remove a class from a schedule.

### Users

- `GET /users/me`: Get the profile of the currently authenticated user.

## Deployment & CI/CD

This project is configured for automated deployment to Google Cloud Run.

### Backend Deployment

The backend is containerized using the provided `Dockerfile`. The deployment process is as follows:

1.  **Build the Docker Image:** The `Dockerfile` uses a multi-stage build to create a lightweight Python 3.11 image with all necessary dependencies.
2.  **Push to Artifact Registry:** The built Docker image is pushed to Google Artifact Registry.
3.  **Deploy to Cloud Run:** The container is deployed as a Cloud Run service, configured with environment variables, secrets from Secret Manager (like the database URL), and a connection to the Cloud SQL instance.

### Zero-Downtime CI/CD with GitHub Actions

The `.github/workflows/deploy.yml` file defines the CI/CD pipeline for the backend. On every push to the `main` branch, the workflow automatically:

1.  Checks out the code.
2.  Authenticates with Google Cloud.
3.  Builds and pushes the Docker image to Artifact Registry.
4.  Deploys the new image to the `soonerflow-backend` Cloud Run service, ensuring zero-downtime updates.

## Project Structure

```
.
├── .github/workflows/deploy.yml  # GitHub Actions CI/CD pipeline for backend
├── Dockerfile                    # Defines the backend container image
├── backend/                      # FastAPI backend source code
│   ├── main.py                   # FastAPI application entrypoint
│   ├── routers/                  # API endpoint definitions
│   ├── services/                 # Business logic
│   └── auth/                     # Firebase authentication
├── nextjs-app/                   # Next.js frontend source code
│   ├── app/                      # Next.js 13 app directory
│   ├── components/               # React components
│   ├── lib/                      # API clients and utility functions
│   └── package.json              # Frontend dependencies
├── scrapers/                     # Data scraping and processing scripts
│   ├── clients/                  # Clients for fetching raw data
│   ├── processors/               # Data cleaning and transformation
│   └── loaders/                  # Scripts to load data into the database
└── database/
    └── models.py                 # SQLAlchemy database models
```

## Quick Start

### Prerequisites

- Docker
- Node.js & npm
- Python 3.11+
- PostgreSQL database
- Firebase Project for authentication
- Google Cloud Project for deployment

### Local Development

**Backend:**

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv .venv
    source .venv/bin/activate
    ```
3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Set up environment variables:**
    Create a `.env` file in the root directory and add the `DATABASE_URL`.
    ```
    DATABASE_URL=postgresql://user:password@host:port/database
    ```
5.  **Run the backend server:**
    ```bash
    uvicorn backend.main:app --reload
    ```

**Frontend:**

1.  **Navigate to the frontend directory:**
    ```bash
    cd nextjs-app
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up environment variables:**
    Create a `.env.local` file and add the necessary Firebase configuration from your Firebase project.
4.  **Run the frontend development server:**
    ```bash
    npm run dev
    ```

## Technology Stack

- **Backend:** FastAPI, Python 3.11, SQLAlchemy
- **Frontend:** React, Next.js, TypeScript, Tailwind CSS
- **Database:** PostgreSQL
- **Authentication:** Firebase Authentication
- **Deployment:** Docker, Google Cloud Run, Google Cloud SQL, Artifact Registry
- **CI/CD:** GitHub Actions
