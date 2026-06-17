const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: 'postgres'
});

async function createDatabase() {
  try {
    console.log('Creating database travel_agency...');
    await pool.query('CREATE DATABASE travel_agency');
    console.log('Database created successfully!');
    process.exit(0);
  } catch (err) {
    if (err.code === '42P04') {
      console.log('Database already exists.');
      process.exit(0);
    }
    console.error('Error creating database:', err);
    process.exit(1);
  }
}

createDatabase();
