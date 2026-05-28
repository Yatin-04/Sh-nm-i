import express from 'express';
import { startSession, endSession, getSubjectSessions } from '../controllers/Session.js';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

router.use(auth);

router.post('/', startSession);
router.put('/:session_id/complete', endSession);
router.get('/subject/:subject_id', getSubjectSessions);

export { router as sessionRouter };