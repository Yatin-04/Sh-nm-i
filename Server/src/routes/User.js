import express from 'express';
import { register, login } from '../controllers/Auth.js'; // Adjust path if your controllers folder is named differently

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

export { router as authRouter };