# ☁️ Vercel Deployment Guide (Final)

This guide provides the exact steps to deploy **TrustID** to Vercel, accounting for the specific monorepo structure and database requirements.

---

## 🏗️ 1. Database Requirement (Critical)
Vercel is Serverless and does **not** host MySQL. You cannot use your local `localhost` database.

1.  **Provision a Cloud Database**:
    *   Use [Railway](https://railway.app), [PlanetScale](https://planetscale.com), or [Aiven](https://aiven.io).
2.  **Get Connection String**:
    *   Example: `mysql://user:pass@host:port/dbname`
3.  **Initialize Database**:
    *   On your *local machine*, update your `backend/.env` with the **Cloud Connection String**.
    *   Run: `npx prisma db push` (Creates tables in cloud).
    *   Run: `npm run seed` (Creates `admin.gov` superuser in cloud).

---

## 🛠️ 2. Project Structure Check
Ensure your project looks like this (we have configured this for you):
```
/ (Root)
├── vercel.json           (Redirects root traffic to backend API)
├── backend/
│   ├── vercel.json       (Configures backend as Serverless Function)
│   ├── api/index.ts      (Vercel Entry Point)
│   ├── package.json      (Includes "postinstall": "prisma generate")
│   └── tsconfig.json     (Includes "rootDir": ".")
└── frontend/
    └── vite.config.ts
```

---

## 🚀 3. Backend Deployment

1.  **Navigate to Backend**:
    ```bash
    cd backend
    ```

2.  **Deploy Command**:
    ```bash
    vercel
    ```

3.  **Project Settings**:
    *   **Framework Preset**: Other (or None)
    *   **Build Command**: `tsc` (or leave default, our `package.json` handles it)
    *   **Output Directory**: `dist` (or leave default)

4.  **Environment Variables** (In Vercel Dashboard):
    *   `DATABASE_URL`: Your Cloud Database URL.
    *   `JWT_SECRET`: Random Secret.
    *   `GOOGLE_API_KEY`: Your Gemini API Key.
    *   `FRONTEND_URL`: URL of your future frontend (e.g., `https://your-frontend.vercel.app`).

---

## 🎨 4. Frontend Deployment

1.  **Navigate to Frontend**:
    ```bash
    cd ../frontend
    ```

2.  **Deploy Command**:
    ```bash
    vercel
    ```

3.  **Project Settings**:
    *   **Framework Preset**: Vite
    *   **Build Command**: `vite build`
    *   **Output Directory**: `dist`

4.  **Environment Variables**:
    *   `VITE_API_URL`: The URL of your **Backend** deployment (e.g., `https://trustid-backend.vercel.app/api`).
    *   *Note: Ensure you include `/api` at the end if required by your frontend logic, or just the domain if your Axios setup appends it.*

---

## 🔄 5. Dealing with Common Errors

### "Command npm run build exited with 2"
*   **Cause**: TypeScript errors or missing Prisma Client.
*   **Solution**: We added `"postinstall": "prisma generate"` to `backend/package.json`. ensure this scripts runs. If it fails, check your `DATABASE_URL` in Vercel.

### "Prisma Client not initialized"
*   **Cause**: Serverless function cold start.
*   **Solution**: Our code initializes Prisma *outside* the handler function to reuse connections. If persistent, check connection string.

### "CORS Error"
*   **Cause**: Backend rejecting Frontend requests.
*   **Solution**: Update `FRONTEND_URL` in **Backend's** Vercel Environment Variables to match your deployed Frontend URL.

---

## ✅ Summary Checklist
- [ ] Cloud Database Provisioned & Seeded (`npm run seed`).
- [ ] Backend Deployed (Env Vars: DB_URL, JWT, API_KEY).
- [ ] Frontend Deployed (Env Var: VITE_API_URL).
- [ ] CORS Configured on Backend.
