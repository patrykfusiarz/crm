const express = require('express');
const { getPool, usingDatabase, memoryClients, memoryDeals } = require('../database');
const { verifyToken } = require('../auth');
const router = express.Router();

// Get clients with deal summaries (completed deals only)
router.get('/', verifyToken, async (req, res) => {
  try {
    if (usingDatabase()) {
      const pool = getPool();
      const result = await pool.query(`
        SELECT 
          c.id,
          c.name,
          c.email,
          c.phone,
          c.company,
          c.created_at,
          COUNT(d.id) as deal_count,
          COALESCE(SUM(d.value), 0) as total_value,
          MAX(d.created_at) as last_deal_date
        FROM clients c
        LEFT JOIN deals d ON c.id = d.client_id AND d.status = 'completed'
        WHERE c.created_by = $1
        GROUP BY c.id, c.name, c.email, c.phone, c.company, c.created_at
        ORDER BY c.created_at DESC
      `, [req.userId]);
      
      res.json({ clients: result.rows });
    } else {
      // In-memory storage logic
      const userClients = memoryClients.filter(client => client.created_by === req.userId);
      const clientsWithDeals = userClients.map(client => {
        const clientDeals = memoryDeals.filter(deal => 
          deal.client_id === client.id && deal.status === 'completed'
        );
        
        return {
          ...client,
          deal_count: clientDeals.length,
          total_value: clientDeals.reduce((sum, deal) => sum + (parseFloat(deal.value) || 0), 0),
          last_deal_date: clientDeals.length > 0 ? 
            Math.max(...clientDeals.map(d => new Date(d.created_at || Date.now()))) : 
            client.created_at
        };
      });
      
      res.json({ clients: clientsWithDeals });
    }
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get client names for dropdown (completed clients only)
router.get('/list', verifyToken, async (req, res) => {
  try {
    if (usingDatabase()) {
      const pool = getPool();
      const result = await pool.query(`
        SELECT DISTINCT c.id, c.name, c.email, c.phone, c.company
        FROM clients c
        WHERE c.created_by = $1
        ORDER BY c.name
      `, [req.userId]);
      
      res.json({ clients: result.rows });
    } else {
      const userClients = memoryClients.filter(client => client.created_by === req.userId);
      res.json({ clients: userClients });
    }
  } catch (error) {
    console.error('Error fetching client list:', error);
    res.status(500).json({ error: 'Failed to fetch client list' });
  }
});

// Create deal - route based on status (updated to match frontend form)
router.post('/deals', verifyToken, async (req, res) => {
  try {
    const {
      clientId,
      clientName,
      clientEmail,
      clientPhone,
      dealTitle,
      dealStatus,
      dealNotes
    } = req.body;

    if (!clientName || !dealTitle) {
      return res.status(400).json({ error: 'Client name and deal title are required' });
    }

    // Route based on deal status
    if (dealStatus === 'in_progress') {
      // Route to staging (Live View)
      if (usingDatabase()) {
        const pool = getPool();
        const result = await pool.query(`
          INSERT INTO staging_deals (
            client_name, client_email, client_phone,
            deal_title, deal_notes, status, created_by
          ) VALUES ($1, $2, $3, $4, $5, 'in_progress', $6)
          RETURNING *
        `, [clientName, clientEmail, clientPhone, dealTitle, dealNotes, req.userId]);

        console.log('New staging deal created:', result.rows[0].deal_title);
        res.json({ success: true, deal: result.rows[0], routed_to: 'staging' });
      } else {
        // In-memory storage
        const { memoryStagingDeals } = require('../database');
        const newDeal = {
          id: memoryStagingDeals.length + 1,
          client_name: clientName,
          client_email: clientEmail,
          client_phone: clientPhone,
          deal_title: dealTitle,
          deal_notes: dealNotes,
          status: 'in_progress',
          created_by: req.userId,
          created_at: new Date(),
          updated_at: new Date()
        };

        memoryStagingDeals.push(newDeal);
        console.log('New staging deal created:', dealTitle);
        res.json({ success: true, deal: newDeal, routed_to: 'staging' });
      }
    } else if (dealStatus === 'completed') {
      // Route to final clients/deals (existing logic)
      if (usingDatabase()) {
        const pool = getPool();
        
        await pool.query('BEGIN');
        
        try {
          let finalClientId = clientId;
          
          if (!clientId) {
            // Check if client exists
            const existingClient = await pool.query(`
              SELECT id FROM clients WHERE name = $1 AND created_by = $2
            `, [clientName, req.userId]);
            
            if (existingClient.rows.length > 0) {
              finalClientId = existingClient.rows[0].id;
            } else {
              // Create new client
              const newClient = await pool.query(`
                INSERT INTO clients (name, email, phone, created_by)
                VALUES ($1, $2, $3, $4)
                RETURNING id
              `, [clientName, clientEmail, clientPhone, req.userId]);
              finalClientId = newClient.rows[0].id;
            }
          }
          
          // Create the deal (no value field)
          const dealResult = await pool.query(`
            INSERT INTO deals (client_id, title, status, notes, created_by)
            VALUES ($1, $2, 'completed', $3, $4)
            RETURNING *
          `, [finalClientId, dealTitle, dealNotes, req.userId]);
          
          await pool.query('COMMIT');
          
          console.log('New deal created:', dealResult.rows[0].title);
          res.json({ success: true, deal: dealResult.rows[0], routed_to: 'clients' });
        } catch (error) {
          await pool.query('ROLLBACK');
          throw error;
        }
      } else {
        // In-memory storage logic
        let finalClientId = clientId;
        
        if (!clientId) {
          let client = memoryClients.find(c => c.name === clientName && c.created_by === req.userId);
          if (!client) {
            client = {
              id: memoryClients.length + 1,
              name: clientName,
              email: clientEmail,
              phone: clientPhone,
              created_by: req.userId,
              created_at: new Date()
            };
            memoryClients.push(client);
          }
          finalClientId = client.id;
        }
        
        const newDeal = {
          id: memoryDeals.length + 1,
          client_id: finalClientId,
          title: dealTitle,
          status: 'completed',
          notes: dealNotes,
          created_by: req.userId,
          created_at: new Date()
        };
        
        memoryDeals.push(newDeal);
        console.log('New deal created:', newDeal.title);
        res.json({ success: true, deal: newDeal, routed_to: 'clients' });
      }
    } else {
      res.status(400).json({ error: 'Invalid deal status' });
    }
  } catch (error) {
    console.error('Error creating deal:', error);
    res.status(500).json({ error: 'Failed to create deal' });
  }
});

module.exports = router;
