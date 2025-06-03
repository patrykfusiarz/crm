const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Get user profile
router.get('/profile', authenticateToken, (req, res) => {
  try {
    // In a real app, you'd fetch from database
    // For now, return the user data from the token
    const user = {
      id: req.user.id,
      email: req.user.email,
      username: req.user.username || 'admin',
      firstName: req.user.firstName || 'John',
      lastName: req.user.lastName || 'Doe'
    };
    
    res.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, email, username } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !username) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // In a real app, you'd update the database here
    // For now, we'll simulate a successful update
    const updatedUser = {
      id: req.user.id,
      email,
      username,
      firstName,
      lastName
    };
    
    // Generate new token with updated info
    const newToken = jwt.sign(updatedUser, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '24h'
    });
    
    console.log(`Profile updated for user: ${email}`);
    res.json({ 
      message: 'Profile updated successfully', 
      user: updatedUser,
      token: newToken
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All password fields are required' });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // In a real app, you'd verify current password against database
    // For demo purposes, we'll accept any current password
    if (currentPassword !== 'password123') {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // In a real app, you'd update the password in the database
    console.log(`Password changed for user: ${req.user.email}`);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
