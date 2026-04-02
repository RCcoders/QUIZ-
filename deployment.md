# Deployment Guide

This guide provides instructions for deploying the Quizly platform to **Render** (recommended for full-stack) and **Vercel** (static frontend).

## 🌍 Option 1: Render (Recommended: Full-stack)
Render is the easiest way to deploy this full-stack application (Frontend + Backend + Real-time Sockets).

### Step 1: Create an Account
- Sign up at [render.com](https://render.com).
- Connect your GitHub repository.

### Step 2: Create a New "Web Service"
- Click **New +** → **Web Service**.
- Select your Quizly repository.

### Step 3: Configure Settings
- **Instance Type**: Node.js
- **Build Command**: `npm run build:all`
- **Start Command**: `npm start`
- **Environment Variables**: Add your `MONGODB_URI`, `JWT_SECRET`, and `GEMINI_API_KEY`.

---

## ⚡ Option 2: Vercel (Static Frontend)
Vercel's standard deployment is perfect for the frontend, but it does **not** natively support Socket.io for live games. If you use Vercel, you should point the frontend to a backend hosted elsewhere (like Render).

### Step 1: Import Project
- Connect your repo to [vercel.com](https://vercel.com).
- Vercel will auto-detect Vite.

### Step 2: Set Environment Variables
- Add your `VITE_FIREBASE_*` variables from `.env.example`.
- Add `VITE_API_URL`: The URL of your **Render backend** (e.g., `https://quiz-api.onrender.com`).

---

## 🛠 Support & Troubleshooting
- **Real-time Sync**: If students don't appear in the lobby, verify your backend supports persistent WebSocket connections (like Render).
- **Environment Variables**: Features like "Create from Syllabus" or "Adaptive Quiz" require a valid `GEMINI_API_KEY` on the backend.
