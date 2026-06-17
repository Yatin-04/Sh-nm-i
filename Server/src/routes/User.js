import express from 'express';
import { register, login, me, logout } from '../controllers/Auth.js';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, me);
router.post('/logout', auth, logout);

export { router as authRouter };