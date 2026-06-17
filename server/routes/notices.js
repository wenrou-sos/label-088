const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/groups/:groupId', async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const groupResult = await pool.query(`
      SELECT g.*, p.route_name, p.days, p.departure_city, p.destination, p.description
      FROM tour_groups g
      JOIN tour_products p ON g.product_id = p.id
      WHERE g.id = $1
    `, [groupId]);
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: '团队不存在' });
    }
    const group = groupResult.rows[0];

    const itinerariesResult = await pool.query(
      'SELECT * FROM daily_itineraries WHERE product_id = $1 ORDER BY day_number',
      [group.product_id]
    );

    const touristsResult = await pool.query(
      'SELECT * FROM tourists WHERE group_id = $1 ORDER BY created_at',
      [groupId]
    );

    const flightsResult = await pool.query(
      'SELECT * FROM flight_bookings WHERE group_id = $1',
      [groupId]
    );

    const hotelsResult = await pool.query(
      'SELECT * FROM hotel_bookings WHERE group_id = $1 ORDER BY checkin_date',
      [groupId]
    );

    const localResult = await pool.query(
      'SELECT * FROM local_agency_bookings WHERE group_id = $1',
      [groupId]
    );

    const notice = {
      title: `出团通知书 - ${group.route_name}`,
      group_code: group.group_code,
      route_name: group.route_name,
      departure_city: group.departure_city,
      destination: group.destination,
      departure_date: group.departure_date,
      return_date: group.return_date,
      days: group.days,
      tourists: touristsResult.rows,
      itineraries: itinerariesResult.rows,
      flights: flightsResult.rows,
      hotels: hotelsResult.rows,
      local_agency: localResult.rows,
      notes: group.description,
      generated_at: new Date()
    };

    res.json(notice);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
