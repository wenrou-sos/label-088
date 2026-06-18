const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tour_products ORDER BY created_at DESC'
    );
    const products = result.rows;
    const productsWithData = await Promise.all(products.map(async (p) => {
      const itRes = await pool.query(
        'SELECT * FROM daily_itineraries WHERE product_id = $1 ORDER BY day_number',
        [p.id]
      );
      const prRes = await pool.query(
        'SELECT * FROM product_prices WHERE product_id = $1',
        [p.id]
      );
      return {
        ...p,
        itineraries: itRes.rows,
        prices: prRes.rows
      };
    }));
    res.json(productsWithData);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const productResult = await pool.query('SELECT * FROM tour_products WHERE id = $1', [id]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: '产品不存在' });
    }
    const itineraryResult = await pool.query(
      'SELECT * FROM daily_itineraries WHERE product_id = $1 ORDER BY day_number',
      [id]
    );
    const priceResult = await pool.query(
      'SELECT * FROM product_prices WHERE product_id = $1',
      [id]
    );
    res.json({
      ...productResult.rows[0],
      itineraries: itineraryResult.rows,
      prices: priceResult.rows
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { route_name, days, departure_city, destination, max_group_size, description, itineraries, prices } = req.body;

    if (prices && prices.length > 0) {
      const roomTypes = prices.map(p => p.room_type);
      const uniqueTypes = new Set(roomTypes);
      if (uniqueTypes.size !== roomTypes.length) {
        return res.status(400).json({ error: '价格设置中存在重复房型，请检查后重试' });
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const productResult = await client.query(
        `INSERT INTO tour_products (route_name, days, departure_city, destination, max_group_size, description)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [route_name, days, departure_city, destination, max_group_size || 30, description]
      );
      const productId = productResult.rows[0].id;

      if (itineraries && itineraries.length > 0) {
        for (const it of itineraries) {
          await client.query(
            `INSERT INTO daily_itineraries (product_id, day_number, title, attractions, meals, accommodation, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [productId, it.day_number, it.title, it.attractions, it.meals, it.accommodation, it.notes]
          );
        }
      }

      if (prices && prices.length > 0) {
        for (const pr of prices) {
          await client.query(
            `INSERT INTO product_prices (product_id, room_type, price) VALUES ($1, $2, $3)`,
            [productId, pr.room_type, pr.price]
          );
        }
      }

      await client.query('COMMIT');
      res.status(201).json({ id: productId, message: '产品创建成功' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { route_name, days, departure_city, destination, max_group_size, description, itineraries, prices } = req.body;

    if (prices && prices.length > 0) {
      const roomTypes = prices.map(p => p.room_type);
      const uniqueTypes = new Set(roomTypes);
      if (uniqueTypes.size !== roomTypes.length) {
        return res.status(400).json({ error: '价格设置中存在重复房型，请检查后重试' });
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE tour_products SET route_name=$1, days=$2, departure_city=$3, destination=$4,
         max_group_size=$5, description=$6, updated_at=CURRENT_TIMESTAMP WHERE id=$7`,
        [route_name, days, departure_city, destination, max_group_size, description, id]
      );

      await client.query('DELETE FROM daily_itineraries WHERE product_id = $1', [id]);
      if (itineraries && itineraries.length > 0) {
        for (const it of itineraries) {
          await client.query(
            `INSERT INTO daily_itineraries (product_id, day_number, title, attractions, meals, accommodation, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [id, it.day_number, it.title, it.attractions, it.meals, it.accommodation, it.notes]
          );
        }
      }

      await client.query('DELETE FROM product_prices WHERE product_id = $1', [id]);
      if (prices && prices.length > 0) {
        for (const pr of prices) {
          await client.query(
            `INSERT INTO product_prices (product_id, room_type, price) VALUES ($1, $2, $3)`,
            [id, pr.room_type, pr.price]
          );
        }
      }

      await client.query('COMMIT');
      res.json({ message: '产品更新成功' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const groupCheck = await pool.query(
      'SELECT id, group_code FROM tour_groups WHERE product_id = $1',
      [id]
    );
    if (groupCheck.rows.length > 0) {
      return res.status(400).json({
        error: `该产品下有 ${groupCheck.rows.length} 个出团计划（${groupCheck.rows.map(g => g.group_code).join('、')}），请先删除相关出团计划`
      });
    }
    const result = await pool.query('DELETE FROM tour_products WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '产品不存在' });
    }
    res.json({ message: '产品删除成功' });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/groups', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM tour_groups WHERE product_id = $1 ORDER BY departure_date DESC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/groups', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { group_code, departure_date, return_date, max_group_size } = req.body;
    const result = await pool.query(
      `INSERT INTO tour_groups (product_id, group_code, departure_date, return_date, max_group_size)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, group_code, departure_date, return_date, max_group_size || 30]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
