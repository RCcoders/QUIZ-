# Quizly Deployment Guide

This guide provides instructions for deploying the Quizly platform. The application is configured with a unified build process where the backend (Express) serves the frontend (Vite/React) as static files.

## 1. Environment Variables
Ensure the following environment variables are set on your hosting provider:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | The port the server will run on (optional, defaults to 5000) | `5000` |
| `MONGODB_URI` | Your MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | A secret key for signing authentication tokens | `your_long_random_secret` |
| `GEMINI_API_KEY` | API Key for Google Gemini (AI Quiz features) | `AIzaSy...` |
| `NODE_ENV` | Set to `production` | `production` |

## 2. Deployment Commands

### Step 1: Install Dependencies
Run this in the root directory:
```bash
npm install
```

### Step 2: Build the Project
This will build the backend into `server/dist` and the frontend into `dist`:
```bash
npm run build
```

### Step 3: Start the Production Server
```bash
npm start
```

## 3. Recommended Platform Config

### Backend (Render / Railway)
Since the backend uses **Socket.io (WebSockets)**, it needs a hosting provider that supports persistent connections.

**Steps for Render:**
1.  **New Web Service**: Connect your GitHub repository.
2.  **Root Directory**: `server`
3.  **Build Command**: `npm install && npm run build`
4.  **Start Command**: `npm start`
5.  **Environment Variables**: Add `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, and `NODE_ENV=production`.

### Frontend (Vercel)
Vercel is excellent for the React frontend.

**Steps for Vercel:**
1.  **New Project**: Connect your GitHub repository.
2.  **Framework Preset**: Vite
3.  **Root Directory**: `.` (Root)
4.  **Build Command**: `npm run build`
5.  **Output Directory**: `dist`
6.  **Environment Variables**: 
    - Add `VITE_API_URL` set to your **Backend URL** (e.g., `https://quizly-backend.onrender.com`).
    - Note: This variable must be set **before** the build runs.

---

## 4. Local Production Test
To test the production build locally before pushing:
```powershell
# Build both
npm run build

# Start the integrated server
# On Windows (PowerShell):
$env:PORT=5000; npm start
# On Linux/macOS:
PORT=5000 npm start
```
The app will be available at `http://localhost:5000`.
