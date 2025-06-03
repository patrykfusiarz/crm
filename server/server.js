const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database');
const { router: authRoutes } = require('./auth');
const accountRoutes = require('./routes/account');
const adminRoutes = require('./routes/admin');
const clientsRoutes = require('./routes/clients');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database
initDatabase();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/clients', clientsRoutes);
app.use("/api/staging", require("./routes/staging"));
app.use("/api/dashboard", require("./routes/dashboard"));
// Health check endpoint
app.get('/health', (req, res) => {
  console.log('✅ Health endpoint hit');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../client/dist')));

// Catch all handler for React Router
app.get('*', (req, res) => {
  console.log(`🌐 Serving React app for: ${req.path}`);
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Starting server...');
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 Server running on port ${PORT}`);
});
