import { registerUser, verifyUser, findUserByEmail } from '../models/User.js';
import jwt from 'jsonwebtoken';

// Helper function to generate a JWT
const generateToken = (userId) => {
  // Signs the token with the user's ID, using your secret key, valid for 7 days
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d', 
  });
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Basic input validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    // 2. EXPLICIT VALIDATION: Check if user already exists
    const existingUser = await findUserByEmail(email);
    
    if (existingUser) {
      // 409 Conflict is the standard HTTP status code for duplicate entries
      return res.status(409).json({ 
        error: 'Registration failed: A user with this email is already registered.' 
      });
    }

    // 3. Create the user
    const newUser = await registerUser(name, email, password);

    const token = generateToken(user.user_id);

    // Attach the token to an httpOnly cookie
    res.cookie('jwt', token, {
    httpOnly: true, // Prevents JavaScript (XSS) from reading the cookie
    secure: process.env.NODE_ENV === 'production', // Use true if using HTTPS
    sameSite: 'strict', // Prevents CSRF attacks
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    res.status(200).json({
    message: 'Login successful',
    user_id: user.user_id
    // Notice we no longer need to send the token in the JSON body!
    });

  } catch (error) {
    // Keep this as a safety net for race conditions!
    if (error.code === '23505') {
      return res.status(409).json({ error: 'A user with this email already exists.' });
    }
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { name, password } = req.body;

    const user = await verifyUser(name, password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Generate token
    const token = generateToken(user.user_id);

    // Attach the token to an httpOnly cookie
    res.cookie('jwt', token, {
    httpOnly: true, // Prevents JavaScript (XSS) from reading the cookie
    secure: process.env.NODE_ENV === 'production', // Use true if using HTTPS
    sameSite: 'strict', // Prevents CSRF attacks
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    res.status(200).json({
    message: 'Login successful',
    user_id: user.user_id
    // Notice we no longer need to send the token in the JSON body!
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};