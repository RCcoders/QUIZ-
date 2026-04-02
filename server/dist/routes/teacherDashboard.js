import express from 'express';
import { getDashboardStats } from '../controllers/teacherDashboardController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
const router = express.Router();
router.get('/dashboard-stats', protect, authorize('teacher'), getDashboardStats);
export default router;
//# sourceMappingURL=teacherDashboard.js.map