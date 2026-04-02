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
console.log('All imports successful');
//# sourceMappingURL=test-import.js.map