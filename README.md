# TalentLeague - AI Proctoring Exam Portal

A full-stack MERN (MongoDB, Express, React, Node.js) application for taking exams with AI-powered proctoring.

## Project Structure

```text
talent-league/
├── backend/                # Express & Node.js Server
│   ├── config/             # Database configuration
│   ├── controllers/        # Business logic for API routes
│   ├── models/             # Mongoose schemas (User, Question, Result)
│   ├── routes/             # API endpoint definitions
│   ├── .env                # Environment variables
│   ├── server.js           # Server entry point
│   └── package.json        # Backend dependencies
├── frontend/               # React & Vite Application
│   ├── src/                # Frontend source code
│   │   ├── components/     # UI Components
│   │   ├── context/        # Auth & State Management
│   │   ├── pages/          # Page Components (TakeExam, Dashboard, etc.)
│   │   └── App.tsx         # Main App component
│   ├── index.html          # HTML entry point
│   ├── package.json        # Frontend dependencies
│   ├── tsconfig.json       # TypeScript configuration
│   └── vite.config.ts      # Vite build configuration
└── README.md               # Project documentation
```

## Getting Started

### Prerequisites
- Node.js installed
- MongoDB running locally (default: `mongodb://localhost:27017/exam_portal`)

### Backend Setup
1.  Navigate to the backend folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the server:
    ```bash
    npm start
    ```

### Frontend Setup
1.  Navigate to the frontend folder:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

## Features
- **AI Proctoring**: Real-time face detection and position monitoring.
- **Dynamic Exams**: Questions fetched from the MongoDB database.
- **Result Tracking**: Exam scores and violations automatically saved.
- **Modern UI**: Built with React, Tailwind CSS, and Lucide React.
