# Extractor - AI Resume Parsing Platform

Extractor is a powerful, AI-driven candidate management and resume parsing platform. It utilizes Large Language Models (LLMs) to automatically extract, structure, and analyze candidate data directly from uploaded PDF resumes.

## Features

- **Automated Resume Parsing**: Upload a PDF and the system will automatically extract the candidate's name, email, phone number, professional links (LinkedIn, GitHub, Website), education, experience, skills, and projects.
- **AI Skill Matching**: Automatically compares the candidate's parsed skills against the requirements of the job role they applied for, generating an intelligent Match Score.
- **Candidate Profiles**: A comprehensive dashboard for admins to manage candidates, view extracted information, and easily preview original resume PDFs.
- **Robust Storage**: Securely stores resumes using Backblaze B2 cloud storage.

## Tech Stack

- **Frontend**: React.js, Vite, Bootstrap, TanStack Query
- **Backend**: Node.js, Express, Sequelize (PostgreSQL)
- **AI & Document Processing**: Groq API (Llama 3), PyMuPDF4LLM (Python integration)
- **Storage**: Backblaze B2

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- Python 3.8+ (for the resume parsing script)

### 1. Database Setup
Create a PostgreSQL database (e.g., `extractor_db`) and run the migrations:
```bash
cd backend
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all # if seeders exist
```

### 2. Environment Variables
Copy the `.env.example` files to `.env` in both the `backend` and `frontend` directories, and fill in your actual credentials.

**Backend (`backend/.env`)**
- Needs a Groq API Key for the LLM parsing to work.
- Needs your PostgreSQL connection strings.
- Needs your Backblaze B2 credentials.

**Frontend (`frontend/.env`)**
- Requires the `VITE_API_URL` pointing to the backend.

### 3. Installation
Install the dependencies for both the frontend and backend.

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

### 4. Python Setup
The backend relies on a Python script (`extract_pdf.py`) using `pymupdf4llm`. Ensure you have installed the requirements in your Python environment:
```bash
pip install pymupdf4llm
```

## Contributing
Please ensure you do not commit any `.env` files containing live secrets! Use `.env.example` for templating.
