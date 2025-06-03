const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getPool, usingDatabase, memoryUsers } = require('./database');
const router = express.Router();

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

// Verify JWT token middleware
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.id;
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email);

    if (usingDatabase()) {
      const pool = getPool();
      
      if (!pool) {
        console.log('Database pool not available');
        return res.status(500).json({ error: 'Database connection error' });
      }

      // Database login
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (result.rows.length === 0) {
        console.log('User not found in database');
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];
      console.log('User found in DB, checking password...');

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log('Password valid:', isValidPassword);
      
      if (!isValidPassword) {
        console.log('Password mismatch');
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      console.log('Login successful for:', email);

      // Generate token
      const token = generateToken(user);

      res.json({
        message: 'Login successful',
        token: token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name
        }
      });
    } else {
      // In-memory login for local development
      const user = memoryUsers.find(u => u.email === email);
      if (!user) {
        console.log('User not found in memory');
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // For in-memory, check if password is hashed or plain text
      let isValidPassword;
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        isValidPassword = await bcrypt.compare(password, user.password);
      } else {
        isValidPassword = password === user.password;
      }

      if (!isValidPassword) {
        console.log('Password mismatch');
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      console.log('Login successful for:', email);

      const token = generateToken(user);

      res.json({
        message: 'Login successful',
        token: token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name
        }
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Export both the router and the verifyToken middleware
module.exports = { router, verifyToken };
