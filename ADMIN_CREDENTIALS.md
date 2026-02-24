# Velomynt HRMS - Admin Documentation

## Admin Login Credentials

### Primary Admin Account

**Email:** `amruta442001@gmail.com`  
**Password:** `Amruta@2001`  
**Employee ID:** `ADMIN001`  
**Role:** Admin  
**Department:** Administration  
**Designation:** System Administrator  

---

## Employee Login Credentials

### Sample Employee Account

**Email:** `amrutabargal44@gmail.com`  
**Password:** `123456789`  

---

## HR Login Credentials

### HR Account 

---

## How to Login

### Admin Login
1. Open the HRMS application in your browser
2. Go to the **Login** page
3. Enter the email: `amruta442001@gmail.com`
4. Enter the password: ` 22@2001`
5. Click **Login**

### Employee Login
1. Open the HRMS application in your browser
2. Go to the **Login** page
3. Enter the email: `amrutabargal44@gmail.com`
4. Enter the password: `123456789`
5. Click **Login**

### HR Login
1. Open the HRMS application in your browser
2. Go to the **Login** page
3. Enter the email: `hramuu@gmail.com`
4. Enter the password: `123456789`
5. Click **Login**

### Subadmin Login
1. Open the Subadmin application in your browser
2. Go to the **Login** page
3. Enter the email: `subadmin2001@gmail.com`
4. Enter the password: `123456789`
5. Click **Login**

---

## Admin Features

As an admin user, you have access to:

- **Employee Management** - Add, edit, and manage employees
- **Attendance** - Track employee attendance
- **Leave Management** - Approve/reject leave requests
- **Salary Management** - Manage salary structures and components
- **Payslip Generation** - Generate and view payslips
- **Reports** - View HR reports and analytics
- **Notifications** - Send notifications to employees
- **Pending Approvals** - Approve pending requests

---

## Database Configuration

**MongoDB URI:** `mongodb+srv://testing77754_db_user:eunlvFITcXeB9zOi@velomynt.iuxpkcf.mongodb.net/velomynt_hrms?appName=Velomynt`

**JWT Secret:** `velomynt_hrms_super_secret_key_2024`

---

## Email Configuration

**SMTP Host:** `smtp.gmail.com`  
**SMTP Port:** `587`  
**SMTP User:** `bargal442001@gmail.com`  
**SMTP Password:** `Amruta@44`  
**Admin Email:** `bargal442001@gmail.com`  

---

## Important Notes

- Keep these credentials secure and do not share them publicly
- Change the admin password after first login if needed
- All OTP notifications will be sent to the configured admin email
- The system is configured for Gmail SMTP for email notifications

---

**Created:** February 9, 2026  
**Project:** Velomynt HRMS

---

## Leave Management - Detailed Flow

1. Employee files a leave request (type, start/end, reason) via UI or API (`POST /api/leave`).
2. System records request with status `pending` and notifies the employee's manager and HR/subadmin.
3. Manager or Subadmin reviews; can add comments and either `approve` or `reject` (`PUT /api/leave/:id/approve` or `PUT /api/leave/:id/reject`).
4. On approval, system updates leave balance (if applicable), marks status `approved`, and notifies employee. On rejection, status `rejected` with reason, and notifies employee.
5. HR can override approvals (change status, edit dates) and resolve conflicts.

Permissions and roles:
- Employee: create leave, view own leaves, cancel pending leaves.
- Manager/Subadmin: view team leaves, approve/reject, add comments.
- HR/Admin: full control, adjust balances, override decisions, generate leave reports.

Suggested API endpoints:
- `POST /api/leave` — submit leave
- `GET /api/leave?userId=` — list leaves (filter by user/manager/status)
- `GET /api/leave/:id` — get leave details
- `PUT /api/leave/:id/approve` — approve leave (body: approverId, comment)
- `PUT /api/leave/:id/reject` — reject leave (body: approverId, comment)
- `PUT /api/leave/:id/cancel` — cancel pending leave (employee action)

UI flow notes:
- Leave request form should allow attachment (medical certificate), auto-validate overlapping dates, and show remaining balance.
- Notifications: in-app alerts, email to approver(s) and employee.

---

## HR / Subadmin - Additional Features

- Dashboard for pending approvals and team leave calendar.
- Bulk approve/reject for batch leave processing.
- Edit employee leave balances and leave types.
- Generate leave reports (monthly/quarterly) with export (CSV/PDF).
- Audit log of approvals/edits (who changed what and when).
- Role management: assign managers, subadmins, HR privileges.

---

## Time-Tracker (Automatic via Login/Logout) - Spec

Overview:
- Track work sessions automatically when a user logs in and ends when they log out. Provide live timer in UI showing current session duration and total worked time for the day.

Data model (suggested):
- `TimeSession`: { userId, startAt: Date, endAt: Date|null, source: 'auto'|'manual', meta: { ip, device } }

API endpoints:
- `POST /api/time/start` — record session start (server also records at login)
- `POST /api/time/stop` — record session stop (server also records at logout)
- `GET /api/time/daily?userId=&date=` — return sessions and total worked time for the day
- `GET /api/time/live?userId=` — return current session (if any)

Implementation notes:
- On successful login, server creates `TimeSession` with `startAt` = now.
- On logout (or explicit stop), server sets `endAt` = now and computes session duration.
- Add heartbeat (optional): client pings every X minutes to keep session alive; if heartbeat stops unexpectedly, server can mark tentative end after configurable timeout and flag for review.
- Handle multiple tabs/devices: either allow multiple concurrent sessions or prevent duplicates by checking active session per device.

Frontend UI suggestions:
- Show live timer in header with `startAt` and elapsed time, and a daily summary widget showing total worked time and sessions list.
- Allow manual pause/resume and manual correction by HR/Admin.

---

## Next Steps (recommended)
1. Review these specs and confirm acceptance.
2. I can create a dedicated spec file `docs/FEATURES.md` and open PRs to implement backend APIs and frontend UI.
3. If you want code now, tell me which part to implement first: Leave API, Time-tracker backend, or frontend UI.

---
