import express from 'express';
import { createSubject, getUserSubjects } from '../controllers/Subject.js';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

// Apply auth middleware to all subject routes
router.use(auth);

router.post('/', createSubject);
router.get('/', getUserSubjects); // Notice we removed :user_id from the URL!

export { router as subjectRouter };