# Quizly Deployment Guide 🚀

This document outlines the steps to deploy the Quizly platform to production using **Render** (Backend) and **Cloudflare Pages** (Frontend).

---

## 1. Backend Deployment (Render)

### Configuration
1.  **Service Type**: Web Service
2.  **Environment**: Node
3.  **Build Command**: `cd server && npm install && npx tsc`
4.  **Start Command**: `cd server && node dist/index.js`

### Environment Variables
Set the following in the Render Dashboard (**Environment** tab):
| Variable | Description |
| :--- | :--- |
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A long, random string for signing tokens |
| `PORT` | Set to `5000` (or leave empty for Render default) |
| `NODE_ENV` | Set to `production` |
| `FRONTEND_URL` | The URL of your Cloudflare Pages site (e.g., `https://quizly.pages.dev`) |

---

## 2. Frontend Deployment (Cloudflare Pages)

### Configuration
1.  **Framework Preset**: Vite
2.  **Build Command**: `npm run build`
3.  **Build Output Directory**: `dist`
4.  **Root Directory**: `/` (Project root)

### Environment Variables
Set the following in the Cloudflare Pages Dashboard (**Settings > Environment variables**):
| Variable | Value |
| :--- | :--- |
| `VITE_API_URL` | Your Render Backend URL (e.g., `https://quizly-backend.onrender.com/api`) |
| `VITE_RAZORPAY_KEY_ID` | Your Razorpay Live Key ID |

---

## 3. Post-Deployment Verification

### 1. CORS & Connectivity
- Ensure the `FRONTEND_URL` in the backend matches the actual Cloudflare URL.
- Ensure the `VITE_API_URL` in the frontend ends with `/api`.

### 2. Socket.io
The frontend automatically detects the API URL for socket connections. Ensure the backend URL is whitelisted in any firewall or CSP settings.

### 3. Database Scaling
Our production hardening includes optimized pooling:
- `minPoolSize: 5`
- `maxPoolSize: 50`
- `waitQueueTimeoutMS: 10000`

If you experience "Pool exhausted" errors in Render logs, check your MongoDB Atlas tier limits.

---

## 4. Troubleshooting

- **CSP Errors**: If the browser blocks API calls, verify the `helmet` configuration in `server/index.ts` allows your Cloudflare domain.
- **Login Failures**: Verify `JWT_SECRET` is consistent across restarts.
- **Port Mismatch**: Render automatically assigns a port. The app uses `process.env.PORT || 5000`.

---
**Note**: All debug `console.log` statements have been stripped for production. Monitor Render logs for system-level errors.
