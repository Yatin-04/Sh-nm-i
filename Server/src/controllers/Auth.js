import { registerUser, verifyUser, findUserByEmail, findUserById } from '../models/user.js';
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

    // Generate token so user is logged in immediately after signup
    const token = generateToken(newUser.user_id);

    res.status(200).json({
      message: 'Registration successful',
      token,
      name: newUser.name,
      email: newUser.email,
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
    const { email, password } = req.body;

    const user = await verifyUser(email, password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Generate token
    const token = generateToken(user.user_id);

    // In production (cross-domain), send token in response body
    // In dev (same-origin), also set httpOnly cookie as convenience
    if (process.env.NODE_ENV !== 'production') {
      res.cookie('jwt', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    res.status(200).json({
      message: 'Login successful',
      token, // Frontend stores this and sends in Authorization header
      name: user.name,
      email: user.email
    });

  }catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /auth/me — validate JWT cookie and return current user info
export const me = async (req, res) => {
  try {
    // req.user is set by the auth middleware (decoded JWT payload)
    const user = await findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json({
      // user_id: user.user_id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.error('ME endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /auth/logout — clear the JWT cookie
export const logout = (req, res) => {
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  });
  res.status(200).json({ message: 'Logged out successfully' });
};