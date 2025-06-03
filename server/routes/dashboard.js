const express = require('express');
const { getPool, usingDatabase, memoryDeals } = require('../database');
const { verifyToken } = require('../auth');
const router = express.Router();

// Get deals data for dashboard charts
router.get('/deals-data/:timeframe', verifyToken, async (req, res) => {
  try {
    const { timeframe } = req.params;
    const currentDate = new Date();
    let data = [];

    if (usingDatabase()) {
      const pool = getPool();

      switch (timeframe) {
        case 'current_month':
          // Get CUMULATIVE daily deal counts for current month
          const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          
          const dailyResult = await pool.query(`
            WITH date_series AS (
              SELECT generate_series($1::date, $2::date, '1 day'::interval) AS day
            ),
            daily_counts AS (
              SELECT 
                date_series.day,
                COALESCE(COUNT(deals.id), 0) as daily_deals
              FROM date_series
              LEFT JOIN deals ON DATE(deals.created_at) = DATE(date_series.day)
                AND deals.created_by = $3 
                AND deals.status = 'completed'
              GROUP BY date_series.day
              ORDER BY date_series.day
            )
            SELECT 
              EXTRACT(DAY FROM day) as day,
              SUM(daily_deals) OVER (ORDER BY day ROWS UNBOUNDED PRECEDING) as cumulative_deals
            FROM daily_counts
            ORDER BY day
          `, [startOfMonth, endOfMonth, req.userId]);

          data = dailyResult.rows.map(row => ({
            period: row.day.toString(),
            deals: parseInt(row.cumulative_deals)
          }));
          break;

        case 'last_3_months':
          // Always return exactly 3 months with 0s if no data
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          data = [];
          
          for (let i = 2; i >= 0; i--) {
            const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthName = monthNames[monthDate.getMonth()];
            
            const monthResult = await pool.query(`
              SELECT COALESCE(COUNT(*), 0) as deals
              FROM deals
              WHERE created_by = $1 
                AND status = 'completed'
                AND EXTRACT(MONTH FROM created_at) = $2
                AND EXTRACT(YEAR FROM created_at) = $3
            `, [req.userId, monthDate.getMonth() + 1, monthDate.getFullYear()]);
            
            data.push({
              period: monthName,
              deals: parseInt(monthResult.rows[0].deals)
            });
          }
          break;

        case 'year_to_date':
          // Always return Jan to current month with 0s if no data
          const ytdMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          data = [];
          
          for (let i = 0; i <= currentDate.getMonth(); i++) {
            const monthName = ytdMonthNames[i];
            
            const monthResult = await pool.query(`
              SELECT COALESCE(COUNT(*), 0) as deals
              FROM deals
              WHERE created_by = $1 
                AND status = 'completed'
                AND EXTRACT(MONTH FROM created_at) = $2
                AND EXTRACT(YEAR FROM created_at) = $3
            `, [req.userId, i + 1, currentDate.getFullYear()]);
            
            data.push({
              period: monthName,
              deals: parseInt(monthResult.rows[0].deals)
            });
          }
          break;
      }
    } else {
      // In-memory logic for local development
      const userDeals = memoryDeals.filter(deal => 
        deal.created_by === req.userId && deal.status === 'completed'
      );

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      switch (timeframe) {
        case 'current_month':
          // CUMULATIVE data for current month
          const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
          let cumulativeCount = 0;
          
          data = Array.from({length: daysInMonth}, (_, i) => {
            const day = i + 1;
            const dealsOnDay = userDeals.filter(deal => {
              const dealDate = new Date(deal.created_at || Date.now());
              return dealDate.getDate() === day && 
                     dealDate.getMonth() === currentDate.getMonth() && 
                     dealDate.getFullYear() === currentDate.getFullYear();
            }).length;
            
            cumulativeCount += dealsOnDay;
            return { period: day.toString(), deals: cumulativeCount };
          });
          break;

        case 'last_3_months':
          // Always return exactly 3 months
          data = [];
          for (let i = 2; i >= 0; i--) {
            const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthName = monthNames[monthDate.getMonth()];
            const dealsInMonth = userDeals.filter(deal => {
              const dealDate = new Date(deal.created_at || Date.now());
              return dealDate.getMonth() === monthDate.getMonth() && 
                     dealDate.getFullYear() === monthDate.getFullYear();
            }).length;
            data.push({ period: monthName, deals: dealsInMonth });
          }
          break;

        case 'year_to_date':
          // Always return Jan to current month
          data = [];
          for (let i = 0; i <= currentDate.getMonth(); i++) {
            const monthName = monthNames[i];
            const dealsInMonth = userDeals.filter(deal => {
              const dealDate = new Date(deal.created_at || Date.now());
              return dealDate.getMonth() === i && 
                     dealDate.getFullYear() === currentDate.getFullYear();
            }).length;
            data.push({ period: monthName, deals: dealsInMonth });
          }
          break;
      }
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;
