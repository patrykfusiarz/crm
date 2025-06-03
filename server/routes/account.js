const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool, usingDatabase, memoryUsers } = require('../database');
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
router.get('/profile', authenticateToken, async (req, res) => {
  console.log('🔍 GET /profile route hit for user:', req.user.id);
  try {
    if (usingDatabase()) {
      const pool = getPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database connection error' });
      }

      const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.rows[0];
      res.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name
        }
      });
    } else {
      const user = memoryUsers.find(u => u.id == req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({
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
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  console.log('🔄 PUT /profile route hit for user:', req.user.id);
  console.log('📦 Request body:', req.body);
  
  try {
    const { firstName, lastName, email, username } = req.body;
    
    if (!firstName || !lastName || !email || !username) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (usingDatabase()) {
      console.log('🗄️ Using database...');
      const pool = getPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database connection error' });
      }

      const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, req.user.id]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email already in use' });
      }

      const result = await pool.query(`
        UPDATE users 
        SET email = $1, username = $2, first_name = $3, last_name = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *
      `, [email, username, firstName, lastName, req.user.id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updatedUser = result.rows[0];
      
      const newToken = jwt.sign({
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name
      }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: '24h'
      });
      
      console.log(`✅ Profile updated for user: ${email}`);
      res.json({ 
        message: 'Profile updated successfully', 
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name
        },
        token: newToken
      });
    } else {
      console.log('💾 Using in-memory storage...');
      const userIndex = memoryUsers.findIndex(u => u.id == req.user.id);
      if (userIndex === -1) {
        console.log('❌ User not found in memory');
        return res.status(404).json({ error: 'User not found' });
      }

      // Update the user in memory
      memoryUsers[userIndex] = {
        ...memoryUsers[userIndex],
        email,
        username,
        first_name: firstName,
        last_name: lastName
      };

      const updatedUser = memoryUsers[userIndex];
      
      const newToken = jwt.sign({
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name
      }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: '24h'
      });
      
      console.log(`✅ Profile updated in memory for user: ${email}`);
      res.json({ 
        message: 'Profile updated successfully', 
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name
        },
        token: newToken
      });
    }
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.put('/password', authenticateToken, async (req, res) => {
  console.log('🔐 PUT /password route hit for user:', req.user.id);
  
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All password fields are required' });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (usingDatabase()) {
      const pool = getPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database connection error' });
      }

      const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.rows[0];
      
      console.log('Password change - checking current password...');
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      console.log('Current password valid:', isValidPassword);
      
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      
      console.log('Hashing new password...');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      console.log('New password hashed, updating database...');
      
      await pool.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashedPassword, req.user.id]);
      
      console.log(`Password changed for user: ${user.email}`);
      res.json({ message: 'Password updated successfully' });
    } else {
      // In-memory password change (simplified for local dev)
      const userIndex = memoryUsers.findIndex(u => u.id == req.user.id);
      if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
      }

      // For in-memory, just update the password (simplified)
      memoryUsers[userIndex].password = newPassword;
      console.log('✅ Password updated in memory');
      res.json({ message: 'Password updated successfully' });
    }
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
