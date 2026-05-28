# Employee Attendance & Leave Management System

A comprehensive, full-stack Employee Portal for managing attendance logs, leave applications, feedback submissions, and corporate holidays. Supports full role-based access control with distinct dashboards for **Employees**, **Managers**, and **Admins**.

---

## 🚀 Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Axios, React Router (v6)
- **Backend:** Node.js, Express.js, Mongoose (MongoDB), JWT, bcryptjs, Nodemailer
- **PWA Support:** Installable app with offline support (Service Worker)
- **API Documentation:** Swagger UI (accessible at `/api-docs` on the backend)

---

## ✨ Key Features

1. **Role-Based Dashboards:** Distinct permissions for `employee`, `manager`, and `admin` roles.
2. **Attendance Tracking:** One-click clock in/out with history logs, monthly summaries, and CSV data export.
3. **Leave Management:** Custom leave requests (annual quota tracking), pending approval logs, and leave cancellation with automatic quota restoration.
4. **Two-Factor Authentication (2FA):** Google Authenticator (TOTP) setup with QR code and secure verification on login.
5. **Admin Operations:** Digital payslip generation, policy document uploads (Multer), global announcements, holiday CRUD, and system audit logs.
6. **In-App & Email Alerts:** Automatic in-app notification bell and nodemailer dispatch on leave status changes.

---

## 🛠️ Local Installation & Setup

1. **Install Dependencies:**
   Run in the project root:
   ```bash
   npm run install-all
   ```
2. **Environment Variables:**
   Configure `.env` in the `backend` folder (see `backend/.env.example`).
3. **Run Locally:**
   - **Backend Server:** `npm run backend` (restarts on save via Nodemon)
   - **Frontend App:** `npm run frontend` (Vite dev server)
   - Open: `http://localhost:5173`

---

## 📂 Project Structure

```text
├── backend/            # Express backend (routes, models, controllers, upload cache)
├── frontend/           # React + Tailwind frontend (Vite build)
├── package.json        # Root scripts to run both apps easily
└── README.md
```

---

## 📦 Production Deployment & Git Guide

### 1. Rename the Folder Locally
1. Stop all local terminal dev servers.
2. Close your IDE.
3. Rename the root folder to `Employee-Attendance-Leave-Management-System`.
4. Reopen in your IDE and run processes.

### 2. Push to GitHub
Open a terminal in your renamed root directory and run:
```bash
git init
git add .
git commit -m "feat: initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/Employee-Attendance-Leave-Management-System.git
git push -u origin main
```

### 3. Free Deployment Setup
- **Database (MongoDB Atlas):** Create a free **M0 Free Tier** cluster, configure network access whitelist (`0.0.0.0/0`), and grab the connection URI string.
- **Hosting (Render.com):** Deploy as a free **Web Service** pointing to your GitHub repository:
  - **Build Command:** `npm run install-all && npm run build`
  - **Start Command:** `npm start`
  - **Instance Type:** `Free`
  - **Env Variables:** Set `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, and optional SMTP variables.

---

## 👤 Seed Data & Initial Setup
1. **Sign Up:** Go to the register page and choose your role (`employee`, `manager`, `admin`) to test dashboard capabilities.
2. **Forgot Password:** In local dev mode, the reset link prints directly to your backend terminal console for security and ease of access.
3. **Swagger API Docs:** Available directly at `http://localhost:5000/api-docs` when the backend is running.
