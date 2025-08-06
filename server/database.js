const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  host: process.env.POSTGRESQL_HOST,
  port: process.env.POSTGRESQL_PORT,
  user: process.env.POSTGRESQL_USER,
  password: process.env.POSTGRESQL_PASSWORD,
  database: process.env.POSTGRESQL_DBNAME,
  ssl: false
})

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err)
  } else {
    console.log('Successfully connected to PostgreSQL')
    release()
  }
})

module.exports = { pool }