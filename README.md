# SoonerFlow: A Full-Stack Class Scheduler

*A modern, scalable web application for course browsing and schedule building, featuring a FastAPI backend, React.js frontend, and an automated CI/CD pipeline to Google Cloud.*

**[Live Demo](https://soonerflow.vercel.app/scheduler) • [Watch the CI/CD Pipeline in Action]([YOUR-GITHUB-ACTIONS-URL])**

![SoonerFlow Demo](./demo.gif)

## About This Project

SoonerFlow was built to solve a common problem for university students: the frustrating process of browsing thousands of courses and building a conflict-free schedule. This full-stack application provides a fast, intuitive, and modern interface for students to visually plan their semester.

This project is more than just a functional application; it's a demonstration of what I consider clean and professional software engineering practices. It featrues a layered backend architecture, a CI/CD pipeline, and a scalable, cloud-native design.

## Key Features

- **🚀 Advanced Course Browser:** Instantly search and filter thousands of courses.
- **📊 Integrated Professor Ratings:** Make informed decisions with Rate My Professors data shown directly in the UI.
- **🗓️ Visual Schedule Builder:** Interactively add and remove classes from a visual calendar to see your week at a glance.
- **🔐 User Authentication:** Securely save and manage multiple schedules with Firebase-powered accounts.

## Engineering Highlights

This project was built with a focus on quality, scalability, and automation.

- **Clean Backend Architecture:** The FastAPI backend uses a **3-tier architecture (API → Service → Repository)** to ensure a clean separation of concerns, making the code maintainable and testable.
- **Automated CI/CD Pipeline:** Every push to `main` automatically triggers a **GitHub Actions** workflow that builds a Docker image, pushes it to Google Artifact Registry, and deploys it to **Google Cloud Run** with zero downtime.
- **Automated Data Management:** A suite of Python scripts regularly scrapes and updates all course and professor data, ensuring the application stays current without manual intervention.

## Tech Stack

- **Backend:** **Python**, **FastAPI**, SQLAlchemy
- **Frontend:** **Next.js**, **React**, **TypeScript**, Tailwind CSS
- **Database:** **PostgreSQL** (hosted on Google Cloud SQL)
- **Auth:** **Firebase Authentication**
- **Deployment:** **Docker**, **Google Cloud Run**, GitHub Actions

## Running Locally

<details>
<summary>Click to view local setup instructions</summary>

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

</details>