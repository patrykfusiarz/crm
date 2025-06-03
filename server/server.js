import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '../.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log('🚀 Starting server...');
console.log('📝 Environment:', NODE_ENV);

app.use(express.json());
app.use(cors());

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// API routes FIRST
app.get('/health', (req, res) => {
  console.log('✅ Health endpoint hit');
  res.json({ status: 'OK', environment: NODE_ENV });
});

app.get('/api/test', (req, res) => {
  console.log('✅ API test endpoint hit');
  res.json({ 
    message: 'API working!', 
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Static files AFTER API routes
if (NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '../client/dist');
  console.log('📂 Static path:', staticPath);
  app.use(express.static(staticPath));
  
  app.get('*', (req, res) => {
    console.log('🌐 Serving React app for:', req.path);
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
