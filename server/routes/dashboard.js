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
          // Get daily deal counts for current month
          const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          
          const dailyResult = await pool.query(`
            WITH date_series AS (
              SELECT generate_series($1::date, $2::date, '1 day'::interval) AS day
            )
            SELECT 
              EXTRACT(DAY FROM date_series.day) as day,
              COALESCE(COUNT(deals.id), 0) as deals
            FROM date_series
            LEFT JOIN deals ON DATE(deals.created_at) = DATE(date_series.day)
              AND deals.created_by = $3 
              AND deals.status = 'completed'
            GROUP BY date_series.day
            ORDER BY date_series.day
          `, [startOfMonth, endOfMonth, req.userId]);

          data = dailyResult.rows.map(row => ({
            period: row.day.toString(),
            deals: parseInt(row.deals)
          }));
          break;

        case 'last_3_months':
          // Get monthly totals for last 3 months
          const threeMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1);
          
          const monthlyResult = await pool.query(`
            SELECT 
              TO_CHAR(created_at, 'Mon') as month,
              COUNT(*) as deals
            FROM deals
            WHERE created_by = $1 
              AND status = 'completed'
              AND created_at >= $2
            GROUP BY EXTRACT(MONTH FROM created_at), TO_CHAR(created_at, 'Mon')
            ORDER BY EXTRACT(MONTH FROM created_at)
          `, [req.userId, threeMonthsAgo]);

          data = monthlyResult.rows.map(row => ({
            period: row.month,
            deals: parseInt(row.deals)
          }));
          break;

        case 'year_to_date':
          // Get monthly totals from January to current month
          const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
          
          const ytdResult = await pool.query(`
            SELECT 
              TO_CHAR(created_at, 'Mon') as month,
              COUNT(*) as deals
            FROM deals
            WHERE created_by = $1 
              AND status = 'completed'
              AND created_at >= $2
            GROUP BY EXTRACT(MONTH FROM created_at), TO_CHAR(created_at, 'Mon')
            ORDER BY EXTRACT(MONTH FROM created_at)
          `, [req.userId, startOfYear]);

          data = ytdResult.rows.map(row => ({
            period: row.month,
            deals: parseInt(row.deals)
          }));
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
          // Real data for current month - count actual deals by day
          const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
          data = Array.from({length: daysInMonth}, (_, i) => {
            const day = i + 1;
            const dealsOnDay = userDeals.filter(deal => {
              const dealDate = new Date(deal.created_at || Date.now());
              return dealDate.getDate() === day && 
                     dealDate.getMonth() === currentDate.getMonth() && 
                     dealDate.getFullYear() === currentDate.getFullYear();
            }).length;
            return { period: day.toString(), deals: dealsOnDay };
          });
          break;

        case 'last_3_months':
          // Real data for last 3 months
          const last3Months = [];
          for (let i = 2; i >= 0; i--) {
            const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthName = monthNames[monthDate.getMonth()];
            const dealsInMonth = userDeals.filter(deal => {
              const dealDate = new Date(deal.created_at || Date.now());
              return dealDate.getMonth() === monthDate.getMonth() && 
                     dealDate.getFullYear() === monthDate.getFullYear();
            }).length;
            last3Months.push({ period: monthName, deals: dealsInMonth });
          }
          data = last3Months;
          break;

        case 'year_to_date':
          // Real data for year to date
          const ytdData = [];
          for (let i = 0; i <= currentDate.getMonth(); i++) {
            const monthName = monthNames[i];
            const dealsInMonth = userDeals.filter(deal => {
              const dealDate = new Date(deal.created_at || Date.now());
              return dealDate.getMonth() === i && 
                     dealDate.getFullYear() === currentDate.getFullYear();
            }).length;
            ytdData.push({ period: monthName, deals: dealsInMonth });
          }
          data = ytdData;
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
