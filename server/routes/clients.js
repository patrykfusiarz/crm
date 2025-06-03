const express = require('express');
const jwt = require('jsonwebtoken');
const { getPool, usingDatabase, memoryClients, memoryDeals } = require('../database');
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

// Get all clients with their deal summaries
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (usingDatabase()) {
      const pool = getPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database connection error' });
      }

      const result = await pool.query(`
        SELECT 
          c.*,
          COUNT(d.id) as deal_count,
          COALESCE(SUM(d.value), 0) as total_value,
          MAX(d.created_at) as last_deal_date
        FROM clients c
        LEFT JOIN deals d ON c.id = d.client_id
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `);

      res.json({ clients: result.rows });
    } else {
      // In-memory storage for local development
      const clientsWithDeals = memoryClients.map(client => {
        const clientDeals = memoryDeals.filter(deal => deal.client_id === client.id);
        return {
          ...client,
          deal_count: clientDeals.length,
          total_value: clientDeals.reduce((sum, deal) => sum + (parseFloat(deal.value) || 0), 0),
          last_deal_date: clientDeals.length > 0 ? Math.max(...clientDeals.map(d => new Date(d.created_at))) : null
        };
      });
      
      res.json({ clients: clientsWithDeals });
    }
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get all clients (for dropdown in add deal form)
router.get('/list', authenticateToken, async (req, res) => {
  try {
    if (usingDatabase()) {
      const pool = getPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database connection error' });
      }

      const result = await pool.query(`
        SELECT id, name, company FROM clients 
        ORDER BY name ASC
      `);

      res.json({ clients: result.rows });
    } else {
      // In-memory storage for local development
      const clientList = memoryClients.map(c => ({
        id: c.id,
        name: c.name,
        company: c.company
      }));
      
      res.json({ clients: clientList });
    }
  } catch (error) {
    console.error('Get client list error:', error);
    res.status(500).json({ error: 'Failed to fetch client list' });
  }
});

// Create new deal (and client if needed)
router.post('/deals', authenticateToken, async (req, res) => {
  try {
    const { clientId, clientName, clientEmail, clientPhone, clientCompany, dealTitle, dealValue, dealStatus, dealNotes } = req.body;
    
    if (!dealTitle) {
      return res.status(400).json({ error: 'Deal title is required' });
    }

    if (usingDatabase()) {
      const pool = getPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database connection error' });
      }

      let finalClientId = clientId;

      // If no existing client selected, create new client
      if (!clientId && clientName) {
        const clientResult = await pool.query(`
          INSERT INTO clients (name, email, phone, company, created_by)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `, [clientName, clientEmail, clientPhone, clientCompany, req.user.id]);

        finalClientId = clientResult.rows[0].id;
        console.log(`New client created: ${clientName}`);
      }

      if (!finalClientId) {
        return res.status(400).json({ error: 'Client is required' });
      }

      // Create the deal
      const dealResult = await pool.query(`
        INSERT INTO deals (client_id, title, value, status, notes, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [finalClientId, dealTitle, dealValue, dealStatus || 'prospect', dealNotes, req.user.id]);

      const newDeal = dealResult.rows[0];
      console.log(`New deal created: ${dealTitle}`);
      
      res.status(201).json({ 
        message: 'Deal created successfully',
        deal: newDeal
      });
    } else {
      // In-memory storage for local development
      let finalClientId = clientId;

      if (!clientId && clientName) {
        const newClient = {
          id: memoryClients.length + 1,
          name: clientName,
          email: clientEmail,
          phone: clientPhone,
          company: clientCompany,
          created_by: req.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        memoryClients.push(newClient);
        finalClientId = newClient.id;
        console.log(`New client created: ${clientName}`);
      }

      if (!finalClientId) {
        return res.status(400).json({ error: 'Client is required' });
      }

      const newDeal = {
        id: memoryDeals.length + 1,
        client_id: finalClientId,
        title: dealTitle,
        value: dealValue,
        status: dealStatus || 'prospect',
        notes: dealNotes,
        created_by: req.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      memoryDeals.push(newDeal);
      console.log(`New deal created: ${dealTitle}`);
      
      res.status(201).json({ 
        message: 'Deal created successfully',
        deal: newDeal
      });
    }
  } catch (error) {
    console.error('Create deal error:', error);
    res.status(500).json({ error: 'Failed to create deal' });
  }
});

module.exports = router;
