import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config({ path: '../.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cookieParser());
app.use(express.json());

// CORS configuration
app.use(cors({
  origin: NODE_ENV === 'production' ? true : FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Health check endpoint (required by Railway)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// API Routes - MUST come before static file serving
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'CRM API is working!', 
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Temporary auth endpoints (we'll build these out)
app.post('/api/auth/login', (req, res) => {
  res.json({ message: 'Login endpoint working' });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logout endpoint working' });
});

// Serve React app in production - MUST come after API routes
if (NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  // Catch-all handler for React Router - MUST be last
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${NODE_ENV}`);
  console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
});
