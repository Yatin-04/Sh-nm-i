import express from 'express';
// Make sure this matches the exact name of your analytics controller file
import { getDashboardAnalytics } from '../controllers/Analytics.js'; 
import { auth } from '../middlewares/auth.js';

const router = express.Router();

// Apply auth middleware to protect all analytics endpoints
router.use(auth);

// GET /api/analytics/dashboard
router.get('/dashboard', getDashboardAnalytics);

export { router as analyticsRouter };