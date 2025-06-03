const express = require('express');
const { clearAllData, usingDatabase } = require('../database');
const router = express.Router();

// Clear all data endpoint 
router.post('/clear-data', async (req, res) => {
  try {
    // Check if we have a database connection
    if (!usingDatabase()) {
      return res.status(400).json({ 
        error: 'No database connection available', 
        environment: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL
      });
    }

    const success = await clearAllData();
    
    if (success) {
      res.json({ message: 'All data cleared successfully. Default admin user recreated.' });
    } else {
      res.status(500).json({ error: 'Failed to clear data' });
    }
  } catch (error) {
    console.error('Clear data error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Get database info
router.get('/db-info', (req, res) => {
  res.json({
    usingDatabase: usingDatabase(),
    environment: process.env.NODE_ENV || 'development',
    hasDbUrl: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV
  });
});

module.exports = router;
