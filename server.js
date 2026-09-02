const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// GET: Fetch live updates from Supabase
app.get('/api/updates', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM updates ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to fetch updates' });
  }
});

// POST: Save a new Pasabay request to Supabase
app.post('/api/request', async (req, res) => {
  const { studentName, serviceType, quantity } = req.body;

  let totalCost = 0;
  if (serviceType === 'Blue Book') {
    const unitPrice = quantity >= 5 ? 13 : 15;  // If they ordered 5 or more, 13 is the price, else 15.
    totalCost = quantity * unitPrice;
  } else if (serviceType === 'Standard') {
    totalCost = 35;
  }

  try {
    const queryText = `
      INSERT INTO requests (student_name, service_type, quantity, total_cost, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [studentName, serviceType, quantity, totalCost, 'Pending Payment'];
    
    const result = await pool.query(queryText, values);
    res.status(201).json({ message: 'Request submitted successfully!', request: result.rows[0] });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to save request' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running with PostgreSQL at http://localhost:${PORT}`);
});