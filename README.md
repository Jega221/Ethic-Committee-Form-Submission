# Ethics Committee Form Submission System

A comprehensive web application for managing ethics committee applications, reviews, and workflows. This system streamlines the process for researchers, faculty administrators, committee members, and rectors.

## Features

- **Role-Based Access Control**:
  - **Researcher**: Submit new applications, view status, modify applications (if requested).
  - **Faculty Admin**: Review incoming applications, forward to committee.
  - **Committee Member**: Review applications, add comments, approve/reject/request revision.
  - **Rector**: Final approval step.
  - **Admin / Super Admin**: Manage users, roles, and system configuration.
- **Application Workflow**:
  - Multi-step form submission (Applicant, Research, Participants, Ethics, Documents).
  - Document upload support (PDF, DOCX) with optional "Skip Upload" for specific cases.
  - Dynamic status tracking (Pending -> Faculty Review -> Committee Review -> Rector Approval -> Approved/Rejected).
- **Dashboard**:
  - Role-specific dashboards (Researcher, Faculty, Committee, Rector).
  - Real-time application status updates.
  - "Study Status" overview for researchers.
- **Security**:
  - JWT-based authentication.
  - Protected routes and API endpoints.

## Tech Stack

### Frontend
- **Framework**: React (Vite) + TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI) + Lucide React icons
- **State Management**: React Hooks
- **Form Handling**: React Hook Form + Zod Validation
- **Routing**: React Router DOM (v6)
- **HTTP Client**: Axios
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (pg)
- **Authentication**: JSON Web Tokens (JWT) + bcryptjs
- **File Handling**: Multer (for document uploads)
- **Email**: Nodemailer (for notifications)

## Setup & Installation

### Prerequisites
- Node.js (v18+)
- PostgreSQL

### 1. Database Setup
Ensure you have PostgreSQL installed and running. Create a database and configure the connection details in `backend/.env`.

### 2. Backend Setup
```bash
cd backend
npm install
npm start
# or for development with auto-restart:
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Application Structure

- `frontend/`: React application source code.
  - `src/pages/`: Main page components (NewApplication, Dashboard, Login, etc.).
  - `src/components/`: Reusable UI components and Sidebars (BaseSidebar, RoleSwitcher).
  - `src/lib/`: API utilities and helper functions.
- `backend/`: Express API server.
  - `controllers/`: Request handling logic.
  - `routes/`: API route definitions.
  - `db/`: Database configuration.

## Usage

1.  **Sign Up/Login**: Create an account or log in with existing credentials.
2.  **Submit Application**: Navigate to "New Application", fill in the details, and upload necessary documents.
3.  **Track Status**: Monitor the progress of your application on the Dashboard.
4.  **Review (for Admins/Committee)**: Switch to the appropriate role view (Faculty/Committee) to review and process pending applications.
