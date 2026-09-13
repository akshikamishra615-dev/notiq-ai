# NOTIQ AI — Production Deployment Guide

This guide provides instructions for deploying the **NOTIQ AI** web application.

---

## Architecture Overview

```
┌──────────────────────────────────────┐       HTTPS / REST API       ┌──────────────────────────────────────┐
│       Netlify Static Frontend        │  ─────────────────────────>  │    Node.js / Express / Prisma API    │
│  (React 19 + Vite + Tailwind CSS)    │                              │      (Render / Railway / VPS / Cloud)│
└──────────────────────────────────────┘                              └──────────────────────────────────────┘
                                                                                         │
                                                                                         ▼
                                                                              ┌──────────────────────┐
                                                                              │ SQLite / Postgres DB │
                                                                              └──────────────────────┘
```

- **Frontend**: Deployed on **Netlify** (Static SPA build using `dist/`).
- **Backend**: Deployed on a Node.js cloud runtime (**Render**, **Railway**, **Fly.io**, **AWS**, or **VPS**) capable of hosting the Express server & persistent database.
- **Database**: SQLite (via Prisma) or PostgreSQL connection.

---

## 1. Frontend Deployment (Netlify)

### Step 1: Upload or Connect Repository
- Option A: Connect your GitHub / GitLab repository to Netlify.
- Option B: Drag and drop the `NOTIQ-AI-Netlify-Frontend.zip` or `dist` folder into Netlify.

### Step 2: Configure Build Settings
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Node Version**: 18+ (default in Netlify)

### Step 3: Configure Environment Variables in Netlify
In Netlify Dashboard → **Site configuration** → **Environment variables**, add:

| Key | Example Value | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `https://your-backend-domain.com/api` | **Required.** Base API URL of your deployed backend. |

> [!IMPORTANT]
> Do **NOT** include trailing slash in `VITE_API_BASE_URL`. Do **NOT** add backend secret keys (e.g., `MAILJET_SECRET_KEY`, `JWT_SECRET`) to Netlify environment variables.

### Step 4: SPA Route Redirects
- SPA routing fallback is pre-configured via `netlify.toml` and `public/_redirects`. All routes (`/dashboard`, `/flashcards`, `/vault`, `/settings`, etc.) automatically redirect to `/index.html` with HTTP status 200.

---

## 2. Backend Deployment (Render / Railway / VPS)

### Required Backend Environment Variables
Set the following environment variables in your backend hosting service:

```env
PORT=5000
NODE_ENV=production

# JWT Security Secrets (Generate strong unique keys in production)
JWT_SECRET=your_long_random_jwt_secret_key_here
REFRESH_TOKEN_SECRET=your_long_random_refresh_secret_key_here
OTP_SECRET=your_long_random_otp_secret_key_here

# AES-256 Cloud Vault Encryption Key (Must be exactly 32 bytes long)
VAULT_AES_KEY=your_production_aes_256_key_32_bytes_long!!

# CORS Allowed Origins (Set to your Netlify Frontend URL)
CORS_ORIGIN=https://your-netlify-app.netlify.app

# Database URL
DATABASE_URL=file:./notiq_production.db

# Mailjet Email Service Configuration (Backend Only)
MAILJET_API_KEY=your_mailjet_api_key
MAILJET_SECRET_KEY=your_mailjet_secret_key
MAILJET_FROM_EMAIL=akshikamishra615@gmail.com
MAILJET_FROM_NAME=NOTIQ AI Team

# Security Flags
SHOW_DEV_OTP=false
```

### Backend Start Commands
- **Install**: `npm install`
- **Build**: `npm run build`
- **Start Backend**: `npx tsx server/index.ts` or `npm run server`

---

## 3. Database Persistence Notes

- The project uses **Prisma** with **SQLite** (`notiq_production.db`).
- On cloud platforms with ephemeral filesystems (e.g., free tiers of Render), attach a **Persistent Disk** for `./prisma/notiq_production.db` to prevent data reset on server restarts.
- Alternatively, for production scale, you can switch the Prisma datasource provider in `prisma/schema.prisma` to PostgreSQL without altering any application logic.

---

## 4. Security Verification Checklist

- [x] No backend secrets (`JWT_SECRET`, `MAILJET_SECRET_KEY`, `VAULT_AES_KEY`) are exposed in the frontend bundle.
- [x] Frontend `apiClient.ts` dynamically resolves `import.meta.env.VITE_API_BASE_URL`.
- [x] `CORS_ORIGIN` restricts cross-origin access strictly to authorized frontend domains.
- [x] All OTP generation and email dispatch operations remain strictly server-side.
