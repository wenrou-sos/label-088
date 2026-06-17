const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'travel_agency'
});

async function initDB() {
  try {
    const schemaSQL = fs.readFileSync(path.join(__dirname, '01_schema.sql'), 'utf8');
    const seedSQL = fs.readFileSync(path.join(__dirname, '02_seed_data.sql'), 'utf8');

    console.log('Creating database schema...');
    await pool.query(schemaSQL);
    console.log('Schema created successfully.');

    console.log('Seeding initial data...');
    await pool.query(seedSQL);
    console.log('Data seeded successfully.');

    console.log('Database initialization completed!');
    process.exit(0);
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

initDB();
