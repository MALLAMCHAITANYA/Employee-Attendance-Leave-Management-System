# Work Space – Feature Roadmap

Features you can add to the project, grouped by area and effort.

---

## Already in the project
- **Auth:** Login, signup, roles (employee, manager, admin)
- **Attendance:** Sign in / Sign out, summary, history
- **Leave:** Apply, My Leave Requests, manager approve/reject, Pending Approvals
- **Holidays:** Calendar view (static data)
- **Profile:** Name, email, DOB, age
- **Settings:** Dark mode, email notification preferences
- **Feedback:** Submit feedback, managers see team feedback

---

## 1. Quick wins (small effort)

| Feature | Description |
|--------|-------------|
| **Leave balance / quota** | Show remaining leave days per year (e.g. 20 total, 5 used, 15 left). Add a field or config for “annual leave days” per user or globally. |
| **Export attendance** | “Download CSV” for attendance history (date range or full). |
| **Forgot password** | Reset password via email (needs email service + token). |
| **In-app notifications** | When manager approves/rejects leave, show a small badge or list on Dashboard (“You have 1 new update”) without email. |
| **Search / filter leaves** | Filter “My Leave Requests” by status (Pending/Approved/Rejected) or date range. |
| **Holidays: mark today** | Highlight today’s date on the holiday calendar. |
| **Profile: avatar** | Upload or choose a simple avatar image (store URL or file). |

---

## 2. Medium effort (backend + UI)

| Feature | Description |
|--------|-------------|
| **Email notifications** | Actually send emails on leave approval/rejection (and optionally attendance alerts) using the saved notification preferences. Use Nodemailer + SMTP or a provider (SendGrid, Resend, etc.). |


| **Manager dashboard** | Dedicated page for managers: pending leaves count, team attendance overview, quick approve/reject. |
| **Attendance reports (manager)** | Manager sees team attendance: who’s present/absent, hours per day/week. |
| **Department / team** | Add “department” or “team” to User; filter leaves and attendance by department. |
| **Leave cancellation** | Allow employee to cancel a pending (or optionally approved) leave request. |
| **Holidays from DB** | Move holidays from frontend `holidays.js` to backend (e.g. Holiday model); CRUD for admins. |
| **Audit log** | Log important actions (login, leave approved/rejected, attendance sign-in/out) for admins. |

---

## 3. Larger / advanced

| Feature | Description |
|--------|-------------|
| **Real email service** | Full “forgot password” + “leave approved/rejected” emails, using notification preferences. |
| **Payslip / salary** | Optional module: upload or generate payslips; employees see only their own (role-based). |
| **Documents** | Upload policy PDFs, handbooks; list by category; role-based visibility. |
| **Announcements** | Admin posts announcements; show on Dashboard or a dedicated page; optional “read” tracking. |
| **Multi-company / branches** | Support multiple companies or branches; filter users and data by branch. |
| **Mobile-friendly PWA** | Make the app installable (manifest + service worker) for better mobile use. |
| **Two-factor auth (2FA)** | TOTP (e.g. Google Authenticator) or SMS for login. |
| **REST API docs** | Swagger/OpenAPI for your API so others can integrate. |

---

## 4. Suggested order to implement

1. **Leave balance** – simple, very useful.
2. **In-app notifications** – no email needed; improves UX.
3. **Leave types** – better tracking (Sick, Casual, etc.).
4. **Email on leave approval/rejection** – use existing notification preferences.
5. **Manager dashboard** – pending count, team overview.
6. **Export attendance (CSV)** – often requested by HR.
7. **Forgot password** – once email is set up.
8. **Department/team** – then reports and filters by team.

---

## 5. Technical notes

- **Email:** Use something like `nodemailer` + Gmail SMTP or Resend/SendGrid; store API key in `.env`.
- **Leave balance:** Add `leaveBalance` or `annualLeaveDays` on User (or a config table); decrement when leave is approved.
- **In-app notifications:** New model e.g. `Notification` (user, type, read, link); create on leave status change; show unread count in sidebar.
- **Leave types:** Add `leaveType` to Leave model (enum); filter and display in UI.

If you tell me which feature you want first (e.g. “leave balance” or “email on leave approval”), I can outline the exact steps and code changes for your project.
