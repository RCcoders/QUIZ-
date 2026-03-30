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

### Render / Heroku / Digital Ocean
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Root Directory**: `.` (Root)

### Vercel
*Note: Vercel is best for static sites. For this full-stack app, use the "Vercel + Serverless" configuration or deploy to a Node.js-based host like Render.*

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
