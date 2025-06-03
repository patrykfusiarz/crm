const { Pool } = require('pg');

let pool = null;
let usingDatabase = false;

// In-memory storage for local development
let memoryUsers = [
  {
    id: 1,
    email: 'admin@test.com',
    password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', // 'password123' hashed
    username: 'admin',
    first_name: 'John',
    last_name: 'Doe'
  }
];

// Initialize database connection (only on Railway)
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

      // Insert default admin user if not exists
      const adminExists = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@test.com']);
      
      if (adminExists.rows.length === 0) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        await pool.query(`
          INSERT INTO users (email, password, username, first_name, last_name)
          VALUES ($1, $2, $3, $4, $5)
        `, ['admin@test.com', hashedPassword, 'admin', 'John', 'Doe']);
        
        console.log('✅ Default admin user created in PostgreSQL');
      }

      console.log('✅ PostgreSQL database connected (Production)');
    } else {
      console.log('📝 Using in-memory storage (Local Development)');
      usingDatabase = false;
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    usingDatabase = false;
  }
};

// Database management functions for Railway
const clearAllData = async () => {
  if (usingDatabase && pool) {
    try {
      await pool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
      console.log('🗑️ All user data cleared from database');
      
      // Re-insert default admin user
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      await pool.query(`
        INSERT INTO users (email, password, username, first_name, last_name)
        VALUES ($1, $2, $3, $4, $5)
      `, ['admin@test.com', hashedPassword, 'admin', 'John', 'Doe']);
      
      console.log('✅ Default admin user recreated');
      return true;
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      return false;
    }
  }
  return false;
};

module.exports = { 
  pool, 
  initDatabase, 
  usingDatabase: () => usingDatabase,
  memoryUsers,
  clearAllData
};
