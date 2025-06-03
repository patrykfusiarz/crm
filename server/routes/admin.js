const express = require('express');
const { clearAllData, usingDatabase } = require('../database');
const router = express.Router();

// Clear all data endpoint (only works on Railway with database)
router.post('/clear-data', async (req, res) => {
  try {
    if (!usingDatabase()) {
      return res.status(400).json({ error: 'Database operations only available in production' });
    }

    const success = await clearAllData();
    
    if (success) {
      res.json({ message: 'All data cleared successfully. Default admin user recreated.' });
    } else {
      res.status(500).json({ error: 'Failed to clear data' });
    }
  } catch (error) {
    console.error('Clear data error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get database info
router.get('/db-info', (req, res) => {
  res.json({
    usingDatabase: usingDatabase(),
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;
