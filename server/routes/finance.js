const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/groups/:groupId/summary', async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const groupResult = await pool.query(`
      SELECT g.*, p.route_name, p.departure_city, p.destination
      FROM tour_groups g
      JOIN tour_products p ON g.product_id = p.id
      WHERE g.id = $1
    `, [groupId]);
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: '团队不存在' });
    }
    const group = groupResult.rows[0];

    const touristsResult = await pool.query(
      'SELECT * FROM tourists WHERE group_id = $1',
      [groupId]
    );
    const tourists = touristsResult.rows;

    const pricesResult = await pool.query(
      'SELECT room_type, price FROM product_prices WHERE product_id = $1',
      [group.product_id]
    );
    const priceMap = {};
    pricesResult.rows.forEach(p => { priceMap[p.room_type] = parseFloat(p.price); });

    let total_income = 0;
    tourists.forEach(t => {
      total_income += priceMap[t.room_type] || 0;
    });

    const flightsResult = await pool.query(
      'SELECT COALESCE(SUM(total_cost), 0) as total FROM flight_bookings WHERE group_id = $1',
      [groupId]
    );
    const flight_cost = parseFloat(flightsResult.rows[0].total);

    const hotelsResult = await pool.query(
      'SELECT COALESCE(SUM(total_cost), 0) as total FROM hotel_bookings WHERE group_id = $1',
      [groupId]
    );
    const hotel_cost = parseFloat(hotelsResult.rows[0].total);

    const localResult = await pool.query(
      'SELECT COALESCE(SUM(total_cost), 0) as total FROM local_agency_bookings WHERE group_id = $1',
      [groupId]
    );
    const local_agency_cost = parseFloat(localResult.rows[0].total);

    const total_cost = flight_cost + hotel_cost + local_agency_cost;
    const gross_profit = total_income - total_cost;
    const profit_margin = total_income > 0 ? (gross_profit / total_income * 100).toFixed(2) : 0;

    res.json({
      group: {
        id: group.id,
        group_code: group.group_code,
        route_name: group.route_name,
        departure_city: group.departure_city,
        destination: group.destination,
        departure_date: group.departure_date,
        return_date: group.return_date,
        current_count: group.current_count,
        max_group_size: group.max_group_size,
        status: group.status
      },
      tourists_count: tourists.length,
      total_income: total_income.toFixed(2),
      costs: {
        flight: flight_cost.toFixed(2),
        hotel: hotel_cost.toFixed(2),
        local_agency: local_agency_cost.toFixed(2),
        total: total_cost.toFixed(2)
      },
      gross_profit: gross_profit.toFixed(2),
      profit_margin: profit_margin
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
