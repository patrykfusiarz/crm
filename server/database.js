const { Pool } = require('pg');

let pool = null;
let usingDatabase = false;

// In-memory storage for local development - keep simple
let memoryUsers = [
  {
    id: 1,
    email: 'admin@test.com',
    password: 'password123', // Plain text for local dev
    username: 'admin',
    first_name: 'John',
    last_name: 'Doe'
  }
];

let memoryClients = [];
let memoryDeals = [];

// Initialize database connection
const initDatabase = async () => {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });

      // Test connection
      await pool.query('SELECT NOW()');
      usingDatabase = true;
      
      // Create users table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          username VARCHAR(255),
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create clients table (contact info only)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS clients (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(255),
          company VARCHAR(255),
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create deals table (business transactions)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS deals (
          id SERIAL PRIMARY KEY,
          client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          value DECIMAL(10, 2),
          status VARCHAR(50) DEFAULT 'prospect',
          notes TEXT,
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('✅ PostgreSQL database connected (Production)');
    } else {
      console.log('📝 Using in-memory storage (Local Development)');
      usingDatabase = false;
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    usingDatabase = false;
    pool = null;
  }
};

// Database management functions
const clearAllData = async () => {
  if (usingDatabase && pool) {
    try {
      await pool.query('TRUNCATE TABLE deals RESTART IDENTITY CASCADE');
      await pool.query('TRUNCATE TABLE clients RESTART IDENTITY CASCADE');
      await pool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
      console.log('🗑️ All data cleared from database');
      return true;
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      return false;
    }
  } else {
    // Clear in-memory storage
    memoryClients.length = 0;
    memoryDeals.length = 0;
    console.log('🗑️ In-memory data cleared');
    return true;
  }
};

// Get database pool
const getPool = () => {
  return pool;
};

module.exports = { 
  pool,
  getPool,
  initDatabase, 
  usingDatabase: () => usingDatabase,
  memoryUsers,
  memoryClients,
  memoryDeals,
  clearAllData
};
