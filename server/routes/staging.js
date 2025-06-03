const express = require('express');
const { getPool, usingDatabase, memoryStagingDeals } = require('../database');
const { verifyToken } = require('../auth');
const router = express.Router();

// Get all staging deals (for Live View)
router.get('/', verifyToken, async (req, res) => {
  try {
    if (usingDatabase()) {
      const pool = getPool();
      const result = await pool.query(`
        SELECT id, client_name, client_email, client_phone, client_company,
               deal_title, deal_notes, status, created_at, updated_at
        FROM staging_deals 
        WHERE created_by = $1 
        ORDER BY created_at DESC
      `, [req.userId]);
      
      res.json({ deals: result.rows });
    } else {
      // In-memory storage for local dev
      const userDeals = memoryStagingDeals.filter(deal => deal.created_by === req.userId);
      res.json({ deals: userDeals });
    }
  } catch (error) {
    console.error('Error fetching staging deals:', error);
    res.status(500).json({ error: 'Failed to fetch staging deals' });
  }
});

// Complete staging deal (move to clients/deals tables)
router.post('/:id/complete', verifyToken, async (req, res) => {
  try {
    const stagingDealId = req.params.id;

    if (usingDatabase()) {
      const pool = getPool();
      
      // Get staging deal
      const stagingResult = await pool.query(`
        SELECT * FROM staging_deals WHERE id = $1 AND created_by = $2
      `, [stagingDealId, req.userId]);

      if (stagingResult.rows.length === 0) {
        return res.status(404).json({ error: 'Staging deal not found' });
      }

      const stagingDeal = stagingResult.rows[0];

      // Begin transaction
      await pool.query('BEGIN');

      try {
        // Check if client exists
        let clientResult = await pool.query(`
          SELECT id FROM clients WHERE name = $1 AND created_by = $2
        `, [stagingDeal.client_name, req.userId]);

        let clientId;
        if (clientResult.rows.length === 0) {
          // Create new client
          const newClientResult = await pool.query(`
            INSERT INTO clients (name, email, phone, created_by)
            VALUES ($1, $2, $3, $4)
            RETURNING id
          `, [stagingDeal.client_name, stagingDeal.client_email, stagingDeal.client_phone, req.userId]);
          clientId = newClientResult.rows[0].id;
        } else {
          clientId = clientResult.rows[0].id;
        }

        // Create final deal
        await pool.query(`
          INSERT INTO deals (client_id, title, status, notes, created_by)
          VALUES ($1, $2, 'completed', $3, $4)
        `, [clientId, stagingDeal.deal_title, stagingDeal.deal_notes, req.userId]);

        // Delete staging deal
        await pool.query(`
          DELETE FROM staging_deals WHERE id = $1
        `, [stagingDealId]);

        await pool.query('COMMIT');
        console.log('Staging deal completed and moved:', stagingDeal.deal_title);
        res.json({ success: true, message: 'Deal completed successfully' });
      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }
    } else {
      // In-memory logic for local dev
      const stagingIndex = memoryStagingDeals.findIndex(d => d.id == stagingDealId && d.created_by === req.userId);
      if (stagingIndex === -1) {
        return res.status(404).json({ error: 'Staging deal not found' });
      }

      const stagingDeal = memoryStagingDeals[stagingIndex];
      
      // Move to final deals (simplified for local dev)
      const { memoryClients, memoryDeals } = require('../database');
      
      // Check/create client
      let client = memoryClients.find(c => c.name === stagingDeal.client_name);
      if (!client) {
        client = {
          id: memoryClients.length + 1,
          name: stagingDeal.client_name,
          email: stagingDeal.client_email,
          phone: stagingDeal.client_phone,
          created_by: req.userId
        };
        memoryClients.push(client);
      }

      // Create final deal
      const newDeal = {
        id: memoryDeals.length + 1,
        client_id: client.id,
        title: stagingDeal.deal_title,
        status: 'completed',
        notes: stagingDeal.deal_notes,
        created_by: req.userId
      };
      memoryDeals.push(newDeal);

      // Remove from staging
      memoryStagingDeals.splice(stagingIndex, 1);
      
      console.log('Staging deal completed:', stagingDeal.deal_title);
      res.json({ success: true, message: 'Deal completed successfully' });
    }
  } catch (error) {
    console.error('Error completing staging deal:', error);
    res.status(500).json({ error: 'Failed to complete deal' });
  }
});

module.exports = router;
