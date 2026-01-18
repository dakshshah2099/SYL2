
# 🚀 TrustID - Ingenious Government Portal

> A secure, AI-powered unified digital identity and government service platform.

---

## 📖 Project Overview

**TrustID** is a next-generation platform designed to bridge the gap between citizens, organizations, and the government. It enables users to manage their digital identity (Entity), grant consent-based access to their data, and access verifying government services.

### ✨ Key Features

*   **Unified Identity (Entity) Management**:
    *   Create and manage Profiles for Individuals, Organizations, and Government Bodies.
    *   Secure session management with device tracking.
*   **Government Portal (Govt Mode)**:
    *   **Dedicated Login**: Separate secure access for government officials (`admin.gov`).
    *   **Govt AI Chatbot**: Integrated Gemini 2.5 Flash powered assistant for monitoring audits, logs, and citizen data.
    *   **Service Promotion**: Admins can verify organizations and promote them to "Government Services" with perpetual access mandates.
*   **Service Directory**:
    *   Browse verified service providers (Health, Finance, Utilities).
    *   **Govt Service Badging**: Distinct transparency for government-mandated services.
    *   Direct links to official portals (e.g., NHA).
*   **Security & Compliance**:
    *   **OWASP Protected**: Implemented Helmet headers, Rate Limiting, and Input Validation.
    *   **Consent Architecture**: Granular permission system for data sharing.
    *   **Audit Logging**: Comprehensive logs for all access requests.

---

## 🛠️ Tech Stack

### **Frontend**
*   **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
*   **Language**: TypeScript
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components**: [Shadcn/UI](https://ui.shadcn.com/) + Lucide Icons
*   **State Management**: React Context API
*   **Routing**: React Router DOM

### **Backend**
*   **Runtime**: [Node.js](https://nodejs.org/)
*   **Framework**: [Express.js](https://expressjs.com/)
*   **Database**: MySQL (via [Prisma ORM](https://www.prisma.io/))
*   **AI Integration**: Google Generative AI (Gemini 2.5 Flash)
*   **Security**: Bcrypt, JWT, Helmet, Express-Rate-Limit

---

## ⚙️ Setup & Installation

### Prerequisites
*   Node.js (v18+)
*   MySQL Server (Running locally or via Docker)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Ingenious
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Setup Environment Variables (Create .env file)
# See the Environment Variables section below

# Database Setup
npx prisma generate
npx prisma db push

# (Optional) Seed Initial Data
# Create a Superuser (admin.gov)
npx ts-node scripts/seed-superuser.ts

# Start the Server
npm run dev
```
> Server runs on `http://localhost:3000`

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start the Development Server
npm run dev
```
> Application runs on `http://localhost:8080` (or similar portfolio)

---

## 🔐 Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Database Connection
DATABASE_URL="mysql://root:password@localhost:3306/ingenious_db"

# Security Secrets
JWT_SECRET="your_super_secret_jwt_key_here"

# API Keys
GOOGLE_API_KEY="your_gemini_api_key_here"  # Required for Govt AI Chatbot

# Server Config
PORT=3000
FRONTEND_URL="http://localhost:8080" # For CORS
```

---

## 🧪 Test Credentials

If you have run the `seed-superuser.ts` script, use these credentials to access the **Government Portal**:

| Role | Portal | Service ID | Password |
| :--- | :--- | :--- | :--- |
| **Government Admin** | `/govt-login` | `admin.gov` | `admin` |

*Note: For Individual/Organization accounts, please use the **Sign Up** page to create a new profile.*

---

## ⚠️ Database Management

We include several utility scripts in `backend/scripts/` to manage the database state during development:

*   **Create Superuser**: `npx ts-node scripts/seed-superuser.ts`
    *   Creates the 'admin.gov' account.
*   **Truncate Database**: `npx ts-node scripts/truncate-db.ts`
    *   **WARNING**: Deletes ALL data (Users, Entities, Services, Logs). Use with caution.
*   **Seed Govt Service**: `npx ts-node scripts/seed-govt-service.ts`
    *   Creates a sample "National Health Authority" service.

---

## 🛡️ Security & Secrets

*   **No Hardcoded Secrets**: All API keys and Database credentials are loaded via `.env`.
*   **Git Ignore**: `.env`, `node_modules`, and build artifacts are excluded from version control.
*   **Rate Limiting**: API is protected against abuse.

---

## 🐛 Basic Troubleshooting

*   **"Prisma Client not initialized"**: Run `npx prisma generate` in the `backend` folder.
*   **Database Connection Refused**: Ensure MySQL is running and the `DATABASE_URL` in `.env` is correct.
*   **CORS Error**: Check if `FRONTEND_URL` in `.env` matches your frontend running port.
*   **AI Chatbot Error**: Ensure `GOOGLE_API_KEY` is valid and has credits.

---