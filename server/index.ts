import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import scoreRoutes from './routes/scoreRoutes.js';
import adaptiveRoutes from './routes/adaptiveRoutes.js';
import badgeRoutes from './routes/badgeRoutes.js';
import teacherDashboardRoutes from './routes/teacherDashboard.js';
import reportRoutes from './routes/reportRoutes.js';
import userRoutes from './routes/userRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import agentRoutes from './routes/agentRoutes.js';

import { createServer } from 'http';
import { setupSocket } from './socket.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Connect to Database
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Note: When running from server/dist/index.js, we need to go up TWO levels to reach root
const distPath = path.join(__dirname, '..', '..', 'dist');

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the frontend dist folder
app.use(express.static(distPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/adaptive', adaptiveRoutes);
app.use('/api/teacher', teacherDashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/user', userRoutes);
app.use('/api/ai/agent', agentRoutes);
app.use('/api/ai', aiRoutes);

// Catch-all route to serve index.html for SPA
// In Express 5, the route parameters and matching have changed.
// We use a regex to match everything except /api
app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;

// Initialize Socket.io
setupSocket(httpServer);

const server = httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
const shutdown = () => {
    console.log('Shutting down server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
