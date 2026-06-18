const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

const dbName = process.env.DB_NAME || 'travel_agency';

const isReset = process.argv.includes('--reset');

async function ensureDatabase() {
  const adminPool = new Pool({ ...dbConfig, database: 'postgres' });
  try {
    const res = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );
    if (res.rows.length === 0) {
      await adminPool.query(`CREATE DATABASE "${dbName}"`);
      console.log(`数据库 "${dbName}" 创建成功`);
    }
  } finally {
    await adminPool.end();
  }
}

async function resetDatabase() {
  const pool = new Pool({ ...dbConfig, database: dbName });
  try {
    console.log('正在清空并重建所有数据表...');
    await pool.query('DROP TABLE IF EXISTS local_agency_bookings CASCADE');
    await pool.query('DROP TABLE IF EXISTS hotel_bookings CASCADE');
    await pool.query('DROP TABLE IF EXISTS flight_bookings CASCADE');
    await pool.query('DROP TABLE IF EXISTS tourists CASCADE');
    await pool.query('DROP TABLE IF EXISTS tour_groups CASCADE');
    await pool.query('DROP TABLE IF EXISTS product_prices CASCADE');
    await pool.query('DROP TABLE IF EXISTS daily_itineraries CASCADE');
    await pool.query('DROP TABLE IF EXISTS tour_products CASCADE');
    console.log('旧数据表已清除');
    await pool.end();
  } catch (err) {
    await pool.end();
    throw err;
  }
}

async function ensureSchema() {
  const pool = new Pool({ ...dbConfig, database: dbName });
  try {
    const schemaSQL = fs.readFileSync(path.join(__dirname, '01_schema.sql'), 'utf8');
    await pool.query(schemaSQL);
    console.log('数据表结构确认完成');
    await pool.end();
  } catch (err) {
    await pool.end();
    throw err;
  }
}

async function patchForeignKey() {
  const pool = new Pool({ ...dbConfig, database: dbName });
  try {
    const constraintRes = await pool.query(`
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'tour_groups'::regclass
        AND contype = 'f'
        AND confrelid = 'tour_products'::regclass
    `);
    for (const row of constraintRes.rows) {
      await pool.query(`ALTER TABLE tour_groups DROP CONSTRAINT ${row.conname}`);
    }
    await pool.query(`
      ALTER TABLE tour_groups
      ADD CONSTRAINT tour_groups_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES tour_products(id) ON DELETE CASCADE
    `);
    console.log('外键约束已更新（ON DELETE CASCADE）');
    await pool.end();
  } catch (err) {
    await pool.end();
    if (!err.message.includes('already exists')) {
      console.log('外键约束检查跳过:', err.message);
    }
  }
}

async function seedData(force) {
  const pool = new Pool({ ...dbConfig, database: dbName });
  try {
    if (!force) {
      const checkResult = await pool.query('SELECT COUNT(*) as cnt FROM tour_products');
      if (parseInt(checkResult.rows[0].cnt) > 0) {
        console.log('数据已存在，跳过导入');
        await pool.end();
        return;
      }
    }
    const seedSQL = fs.readFileSync(path.join(__dirname, '02_seed_data.sql'), 'utf8');
    await pool.query(seedSQL);
    console.log('测试数据已导入');
    await pool.end();
  } catch (err) {
    await pool.end();
    throw err;
  }
}

async function initialize() {
  try {
    await ensureDatabase();
    if (isReset) {
      await resetDatabase();
    }
    await ensureSchema();
    await patchForeignKey();
    await seedData(isReset);
    console.log('数据库初始化完成');
  } catch (err) {
    console.error('数据库初始化失败:', err.message);
    throw err;
  }
}

function createPool() {
  return new Pool({ ...dbConfig, database: dbName });
}

module.exports = { initialize, createPool, dbConfig, dbName };

if (require.main === module) {
  initialize().then(() => process.exit(0)).catch(() => process.exit(1));
}
