const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/groups', async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT g.*, p.route_name, p.departure_city, p.destination, p.days
      FROM tour_groups g
      JOIN tour_products p ON g.product_id = p.id
    `;
    const params = [];
    if (status) {
      query += ' WHERE g.status = $1';
      params.push(status);
    }
    query += ' ORDER BY g.departure_date DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/groups/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const groupResult = await pool.query(`
      SELECT g.*, p.route_name, p.departure_city, p.destination, p.days
      FROM tour_groups g
      JOIN tour_products p ON g.product_id = p.id
      WHERE g.id = $1
    `, [id]);
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: '团队不存在' });
    }
    const touristsResult = await pool.query(
      'SELECT * FROM tourists WHERE group_id = $1 ORDER BY created_at',
      [id]
    );
    res.json({
      ...groupResult.rows[0],
      tourists: touristsResult.rows
    });
  } catch (err) {
    next(err);
  }
});

router.get('/groups/:id/tourists', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM tourists WHERE group_id = $1 ORDER BY created_at',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/groups/:id/tourists', async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { name, id_card, phone, room_type, special_requirements } = req.body;

    const groupResult = await client.query(
      'SELECT * FROM tour_groups WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (groupResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: '团队不存在' });
    }
    const group = groupResult.rows[0];
    if (group.status !== 'open') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '该团队已停止收客' });
    }
    if (group.current_count >= group.max_group_size) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '该团队已满员' });
    }

    const touristResult = await client.query(
      `INSERT INTO tourists (group_id, name, id_card, phone, room_type, special_requirements)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, name, id_card, phone, room_type, special_requirements]
    );

    const newCount = group.current_count + 1;
    let newStatus = group.status;
    if (newCount >= group.max_group_size) {
      newStatus = 'full';
    }
    await client.query(
      'UPDATE tour_groups SET current_count = $1, status = $2 WHERE id = $3',
      [newCount, newStatus, id]
    );

    await client.query('COMMIT');
    res.status(201).json({
      tourist: touristResult.rows[0],
      group: { ...group, current_count: newCount, status: newStatus }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

router.delete('/tourists/:id', async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const touristResult = await client.query(
      'SELECT group_id FROM tourists WHERE id = $1',
      [id]
    );
    if (touristResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: '游客不存在' });
    }
    const groupId = touristResult.rows[0].group_id;
    await client.query('DELETE FROM tourists WHERE id = $1', [id]);

    const groupResult = await client.query(
      'SELECT current_count, status, max_group_size FROM tour_groups WHERE id = $1',
      [groupId]
    );
    if (groupResult.rows.length > 0) {
      const newCount = Math.max(0, groupResult.rows[0].current_count - 1);
      let newStatus = groupResult.rows[0].status;
      if (newStatus === 'full' && newCount < groupResult.rows[0].max_group_size) {
        newStatus = 'open';
      }
      await client.query(
        'UPDATE tour_groups SET current_count = $1, status = $2 WHERE id = $3',
        [newCount, newStatus, groupId]
      );
    }

    await client.query('COMMIT');
    res.json({ message: '游客删除成功' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

router.put('/groups/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['open', 'full', 'closed', 'departed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: '无效的状态值' });
    }
    await pool.query(
      'UPDATE tour_groups SET status = $1 WHERE id = $2',
      [status, id]
    );
    res.json({ message: '团队状态更新成功' });
  } catch (err) {
    next(err);
  }
});

router.delete('/groups/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM tour_groups WHERE id = $1 RETURNING id, group_code',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '团队不存在' });
    }
    res.json({ message: `团队 ${result.rows[0].group_code} 删除成功` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
