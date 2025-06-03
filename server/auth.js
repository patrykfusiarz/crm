import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Test user with plain text password for testing
const testUsers = [
  {
    id: '1',
    email: 'admin@test.com',
    password: 'password123', // Plain text for now
    name: 'Admin User'
  }
];

// Generate JWT token
export const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Verify JWT token middleware
export const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// Login endpoint
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email, password);

    // Find user
    const user = testUsers.find(u => u.email === email);
    if (!user) {
      console.log('User not found');
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password (simple comparison for testing)
    if (password !== user.password) {
      console.log('Password mismatch');
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log('Login successful for:', email);

    // Generate token
    const token = generateToken(user);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get current user endpoint
export const getCurrentUser = (req, res) => {
  const user = testUsers.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name
  });
};

// Logout endpoint
export const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
};
