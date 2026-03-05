# Velomynt HRMS Backend Live Deployment (Free)

This document explains how to deploy the backend live for free using Render.

## 1) Prerequisites

- GitHub account
- Render account ([https://render.com](https://render.com))
- MongoDB Atlas database URI
- Backend code pushed to GitHub

---

## 2) Push Project to GitHub

From project root:

```bash
git add .
git commit -m "Prepare backend for live deployment"
git push
```

---

## 3) Create Render Web Service

1. Login to Render.
2. Click `New +` -> `Web Service`.
3. Connect GitHub and select your repository.
4. Configure:
   - **Name:** `velomynt-hrms-backend`
   - **Runtime:** `Node`
   - **Branch:** `main` (or your active branch)
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

---

## 4) Set Environment Variables

In Render -> Service -> `Environment`, add:

- `MONGODB_URI` = your Atlas URI
- `JWT_SECRET` = strong secret key
- `NODE_ENV` = `production`
- `ADMIN_EMAIL` = admin email (optional but recommended)
- `SMTP_HOST` = `smtp.gmail.com`
- `SMTP_PORT` = `587`
- `SMTP_USER` = smtp user email
- `SMTP_PASS` = smtp app password
- `SMTP_FROM` = `Velomynt HRMS <your-email@example.com>`

Optional attendance configs:

- `ATTENDANCE_HALF_DAY_HOURS` = `4.5`
- `ATTENDANCE_LATE_AFTER_HOUR` = `10`
- `ATTENDANCE_LATE_AFTER_MINUTE` = `15`

Note: Do not commit secrets in `.env` to GitHub.

---

## 5) Deploy

1. Click `Create Web Service`.
2. Wait for build and deploy.
3. You will get a live URL like:

`https://velomynt-hrms-backend.onrender.com`

---

## 6) Connect Frontend to Live Backend

Set frontend env:

- `REACT_APP_API_URL=https://velomynt-hrms-backend.onrender.com/api`

If frontend is already deployed (Render/Vercel/Netlify), add this in its environment settings.

---

## 7) Quick Health Checks

Use browser/Postman:

- `GET https://<your-backend-url>/api/auth/me`
  - Without token, `401` is expected.
  - If you get `404/5xx`, check backend logs.

- Try login API:
  - `POST /api/auth/login`
  - verify token response.

---

## 8) Attendance/Punch Validation (After Live)

Expected behavior:

- `employee`, `manager`, `hr`, `subadmin`: can open attendance page
- `admin`: attendance page should be restricted
- punch buttons visible for non-admin tracked roles
- punch in/out updates status and work hours

---

## 9) Common Issues and Fix

- **Build failed: cannot find module**
  - Ensure Root Directory is `backend`.
- **Mongo connection failed**
  - Verify `MONGODB_URI` in Render Environment.
- **CORS issue**
  - Add proper CORS origin config in backend if you restrict origins.
- **App slow on first request**
  - Render free plan sleeps on inactivity (cold start behavior).

---

## 10) Recommended Next

- Add a health route `/api/health` for uptime checks.
- Add error logging/monitoring.
- Deploy frontend and set production API URL.

