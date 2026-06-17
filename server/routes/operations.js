const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/groups/:groupId/flights', async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const result = await pool.query(
      'SELECT * FROM flight_bookings WHERE group_id = $1 ORDER BY created_at DESC',
      [groupId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/groups/:groupId/flights', async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { flight_no, seat_count, seat_price, notes } = req.body;
    const total_cost = seat_count * seat_price;
    const result = await pool.query(
      `INSERT INTO flight_bookings (group_id, flight_no, seat_count, seat_price, total_cost, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [groupId, flight_no, seat_count, seat_price, total_cost, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/flights/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { flight_no, seat_count, seat_price, notes } = req.body;
    const total_cost = seat_count * seat_price;
    const result = await pool.query(
      `UPDATE flight_bookings SET flight_no=$1, seat_count=$2, seat_price=$3, total_cost=$4, notes=$5
       WHERE id=$6 RETURNING *`,
      [flight_no, seat_count, seat_price, total_cost, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '航班预订不存在' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/flights/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM flight_bookings WHERE id = $1', [id]);
    res.json({ message: '删除成功' });
  } catch (err) {
    next(err);
  }
});

router.get('/groups/:groupId/hotels', async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const result = await pool.query(
      'SELECT * FROM hotel_bookings WHERE group_id = $1 ORDER BY checkin_date',
      [groupId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/groups/:groupId/hotels', async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { hotel_name, room_type, room_count, checkin_date, checkout_date, room_price, notes } = req.body;
    const nights = Math.ceil((new Date(checkout_date) - new Date(checkin_date)) / (1000 * 60 * 60 * 24));
    const total_cost = room_count * room_price * Math.max(nights, 1);
    const result = await pool.query(
      `INSERT INTO hotel_bookings (group_id, hotel_name, room_type, room_count, checkin_date, checkout_date, room_price, total_cost, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [groupId, hotel_name, room_type, room_count, checkin_date, checkout_date, room_price, total_cost, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/hotels/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hotel_name, room_type, room_count, checkin_date, checkout_date, room_price, notes } = req.body;
    const nights = Math.ceil((new Date(checkout_date) - new Date(checkin_date)) / (1000 * 60 * 60 * 24));
    const total_cost = room_count * room_price * Math.max(nights, 1);
    const result = await pool.query(
      `UPDATE hotel_bookings SET hotel_name=$1, room_type=$2, room_count=$3, checkin_date=$4,
       checkout_date=$5, room_price=$6, total_cost=$7, notes=$8 WHERE id=$9 RETURNING *`,
      [hotel_name, room_type, room_count, checkin_date, checkout_date, room_price, total_cost, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '酒店预订不存在' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/hotels/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM hotel_bookings WHERE id = $1', [id]);
    res.json({ message: '删除成功' });
  } catch (err) {
    next(err);
  }
});

router.get('/groups/:groupId/local-agency', async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const result = await pool.query(
      'SELECT * FROM local_agency_bookings WHERE group_id = $1 ORDER BY created_at DESC',
      [groupId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/groups/:groupId/local-agency', async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { agency_name, guide_name, vehicle_info, meal_info, total_cost, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO local_agency_bookings (group_id, agency_name, guide_name, vehicle_info, meal_info, total_cost, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [groupId, agency_name, guide_name, vehicle_info, meal_info, total_cost, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/local-agency/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { agency_name, guide_name, vehicle_info, meal_info, total_cost, notes } = req.body;
    const result = await pool.query(
      `UPDATE local_agency_bookings SET agency_name=$1, guide_name=$2, vehicle_info=$3,
       meal_info=$4, total_cost=$5, notes=$6 WHERE id=$7 RETURNING *`,
      [agency_name, guide_name, vehicle_info, meal_info, total_cost, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '地接社预订不存在' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/local-agency/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM local_agency_bookings WHERE id = $1', [id]);
    res.json({ message: '删除成功' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
