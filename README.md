# Employee Attendance & Leave Management System

A comprehensive, full-stack Employee Portal for managing attendance logs, leave applications, feedback submissions, and system-wide holidays. The system supports full role-based access control with distinct dashboards and permissions for **Employees**, **Managers**, and **Admins**.

---

## 🚀 Tech Stack

The application is built using a modern JavaScript/Mongoose/React stack:

### Frontend
*   **Framework:** React 18
*   **Build Tool / Dev Server:** Vite
*   **Styling:** Tailwind CSS (v3) + PostCSS
*   **Routing:** React Router DOM (v6)
*   **HTTP Client:** Axios (for backend API communications)

### Backend
*   **Runtime Environment:** Node.js
*   **Web Framework:** Express.js
*   **Database ODM:** Mongoose (MongoDB)
*   **Authentication:** JSON Web Tokens (JWT) + bcryptjs (for password hashing)
*   **Logging & Development Tools:** Nodemon (auto-restarts on save) + Morgan (HTTP request logger)

---

## ✨ Features Breakdown

### 1. Role-Based Authentication
*   **Sign Up & Log In:** Secure registration and login with bcrypt-hashed passwords.
*   **Roles Supported:**
    *   `employee`: Can clock in/out, view own logs, request leaves, view holidays, update profile, edit settings, and submit feedback.
    *   `manager`: All employee actions, plus viewing team feedback, reviewing leave requests (approve/reject), and managing attendance summaries.
    *   `admin`: Full access to system configuration and actions.
*   **Password Recovery:** Request a password reset link (logs directly to the backend terminal console in local development environment for security and ease of access).

### 2. Attendance Tracking (`/attendance`)
*   **Clock In / Clock Out:** Easy, one-click button triggers backend recording of date, login time, logout time, and status.
*   **Logs History:** Detailed monthly list showing check-in/out times, duration, and status (e.g., Present, Checked-out, Active).
*   **Stats Summary:** Aggregated view showing total days worked, average check-in times, and overall attendance rate.
*   **Export Data:** HR/Manager helper action to download attendance logs as a `.csv` file.

### 3. Leave Management System (`/leaves`)
*   **Apply for Leaves:** Fill out a quick form indicating start date, end date, leave type, and reason.
*   **Leave Balance:** Visual progress tracking showing annual quota (total, used, remaining leaves).
*   **My Leave Requests:** Employees can review their current and historic requests along with their status (`Pending`, `Approved`, `Rejected`).
*   **Manager Approval Panel:** Dedicated section for managers to review pending team leave applications and instantly approve or reject them.

### 4. Interactive Holidays Calendar (`/holidays`)
*   **Calendar Grid View:** Monthly interactive grid displaying upcoming corporate holidays and weekends.
*   **Holiday List:** Structured list detail detailing each holiday's date, day, and name.

### 5. Profile & Settings (`/profile` & `/settings`)
*   **Profile Editor:** Edit basic information such as Display Name, Date of Birth, and Age.
*   **Settings Panel:**
    *   Toggle system **Dark Mode** (persists system state via Tailwind).
    *   Configure preferences for Email Notifications (leave updates, attendance alerts).

### 6. Feedback Portal
*   **Submit Feedback:** Employees can submit structured thoughts, bug reports, or comments.
*   **Team Feedback View:** Managers and Admins can view a list of all feedback submitted by the team for review and organizational action.

### 7. In-App Notifications
*   **Instant Updates:** Notifications generated automatically upon leave approval or rejection.
*   **Read State Tracking:** Mark individual notifications as read or clear all at once. An unread badge displays on the dashboard.

---

## 📁 Directory Structure

```text
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB configuration (db.js)
│   │   ├── controllers/     # Controller logic (auth, attendance, leave, feedback, etc.)
│   │   ├── middleware/      # Auth & role validation middleware
│   │   ├── models/          # Mongoose Schemas (User, Attendance, Leave, Feedback, Notification)
│   │   ├── routes/          # Express API route endpoints
│   │   └── utils/           # Shared helpers and constants (e.g. roles)
│   ├── .env.example         # Template for backend secrets and configuration
│   ├── server.js            # Entry point for backend Express app
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios instance & interceptors config
│   │   ├── components/      # UI components (Layout, Sidebar, ProtectedRoute, etc.)
│   │   ├── context/         # AuthContext provider for global auth state
│   │   ├── data/            # Static datasets (e.g., initial holiday listings)
│   │   ├── hooks/           # Custom React hooks (useAuth)
│   │   ├── pages/           # Page views (Dashboard, Attendance, Leaves, Holidays, Profile, Settings)
│   │   ├── App.jsx          # Route declarations & main layout component
│   │   └── main.jsx         # App mounting point
│   ├── .env.example         # Template for frontend environment configuration
│   ├── tailwind.config.cjs  # Tailwind configuration
│   ├── vite.config.js       # Vite bundler configurations
│   └── package.json
```

---

## 🛢️ Database Schema Overview

The MongoDB database maintains the following primary collections managed via Mongoose:

1.  **Users (`User`):**
    *   `name` (String), `email` (String, Unique), `password` (String, Hashed), `role` (enum: `'employee'`, `'manager'`, `'admin'`).
    *   `dob` (Date), `age` (Number).
    *   `settings`: `{ darkMode: Boolean, emailNotifications: { leaveUpdates: Boolean, attendanceAlerts: Boolean } }`.
2.  **Attendance Logs (`Attendance`):**
    *   `user` (ObjectId ref to User), `date` (Date), `loginTime` (Date), `logoutTime` (Date), `status` (enum: `'Present'`, `'Checked-out'`).
3.  **Leave Requests (`Leave`):**
    *   `user` (ObjectId ref to User), `startDate` (Date), `endDate` (Date), `reason` (String), `status` (enum: `'Pending'`, `'Approved'`, `'Rejected'`), `approvedBy` (ObjectId ref to User).
4.  **Feedback Records (`Feedback`):**
    *   `user` (ObjectId ref to User), `text` (String), `createdAt` (Date).
5.  **Notifications (`Notification`):**
    *   `user` (ObjectId ref to User), `title` (String), `message` (String), `read` (Boolean), `createdAt` (Date).

---

## 🔌 API Endpoints Reference

All API endpoints are prefixed with `/api`.

| Module | Route | HTTP Method | Protected | Description |
| :--- | :--- | :---: | :---: | :--- |
| **Auth** | `/auth/signup` | POST | No | Register a new user account |
| | `/auth/login` | POST | No | Authenticate user & return token |
| | `/auth/logout` | POST | Yes | Terminate current session |
| | `/auth/forgot-password` | POST | No | Request password reset token |
| | `/auth/reset-password` | POST | No | Complete password reset |
| **Attendance**| `/attendance/signin` | POST | Yes | Record check-in timestamp |
| | `/attendance/signout` | POST | Yes | Record check-out timestamp |
| | `/attendance/me` | GET | Yes | Retrieve logged-in user's logs |
| | `/attendance/summary`| GET | Yes | Get attendance stats (e.g. days worked)|
| | `/attendance/export` | GET | Yes | Download attendance logs as CSV |
| **Leaves** | `/leaves` | POST | Yes | Submit a new leave request |
| | `/leaves/me` | GET | Yes | Retrieve user's leave requests history|
| | `/leaves/balance` | GET | Yes | Get remaining leave quotas |
| | `/leaves/types` | GET | Yes | Fetch list of available leave categories|
| | `/leaves/pending` | GET | Yes (Manager/Admin)| View all pending requests from team |
| | `/leaves/:id/status`| PATCH | Yes (Manager/Admin)| Approve or Reject a leave request |
| **Feedback** | `/feedback` | POST | Yes | Submit anonymous/employee feedback |
| | `/feedback/all` | GET | Yes (Manager/Admin)| View team feedback list |
| **Users** | `/users/me` | GET | Yes | Get logged-in user profile details |
| | `/users/me` | PUT | Yes | Update profile info (name, dob, settings) |
| **Notifications**| `/notifications`| GET | Yes | Fetch user's in-app notifications |
| | `/notifications/read-all`| PATCH| Yes | Mark all notifications as read |
| | `/notifications/:id/read`| PATCH| Yes | Mark specific notification as read |

---

## 🛠️ Installation & Running the Application

Follow these steps to run the application locally.

### Prerequisites
*   [Node.js](https://nodejs.org/) installed (v16.x or higher recommended)
*   [MongoDB](https://www.mongodb.com/) running locally (`mongodb://localhost:27017`) or a connection URI for MongoDB Atlas.

---

### Step 1: Backend Setup
1.  Navigate into the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure your environment variables. Copy the `.env.example` file to `.env`:
    ```bash
    cp .env.example .env
    ```
    *Open the `.env` file and make sure values are correct for your local setup:*
    ```env
    PORT=5000
    MONGO_URI=mongodb://127.0.0.1:27017/employee_portal
    JWT_SECRET=your_jwt_secret_here
    JWT_EXPIRES_IN=7d
    CLIENT_URL=http://localhost:5173
    ```
4.  Start the backend development server (runs via `nodemon` on port `5000`):
    ```bash
    npm run dev
    ```

---

### Step 2: Frontend Setup
1.  Open a second terminal window and navigate into the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  *(Optional)* Create a `.env` file to configure custom backend API endpoints if running on a custom port (Vite defaults to `http://localhost:5000/api`):
    ```bash
    cp .env.example .env
    ```
4.  Start the frontend development server (runs via `Vite` on port `5173`):
    ```bash
    npm run dev
    ```
5.  Open your browser and navigate to `http://localhost:5173`.

---

### 💡 Running with Shortcut Commands (From Project Root)
Instead of switching directories, you can start the services directly from the **root directory** of the workspace using the `--prefix` flag in npm:

*   **To run the Backend:**
    ```bash
    npm --prefix backend run dev
    ```
*   **To run the Frontend:**
    ```bash
    npm --prefix frontend run dev
    ```

---

## 👤 Seed Data / Initial Sign-up Guidance

To log in and experience the full functionality of the application, follow these guidelines:

1.  **Register a New Account:**
    *   Navigate to the Sign Up portal in the application.
    *   Fill out the registration details.
    *   You can select the role (`employee`, `manager`, or `admin`) during signup to test the dashboard from different roles' perspectives.
2.  **Verify Roles:**
    *   An **Employee** dashboard focuses on attendance sign-in/out logs, applying for leaves, and individual profiles.
    *   A **Manager** dashboard displays operational overviews, team pending leaves requiring approval/rejection, and team feedback submissions.
3.  **Password Reset Verification:**
    *   If you click **Forgot Password** and submit your registered email, the backend will print the security reset token link directly into the backend server's terminal console (e.g. `http://localhost:5173/login?token=...`). Use this link to test password resets locally.
