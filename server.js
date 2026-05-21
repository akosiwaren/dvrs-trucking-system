require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'https://dvrss.netlify.app' // or use '*' for development
}));
app.use(express.json());

// ===== PostgreSQL CONNECTION =====
// Render provides the DATABASE_URL environment variable automatically.
// For local testing, you can set it manually or use a local PostgreSQL instance.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }  // Accept self-signed certificates
});

// ===== CREATE TABLES IF NOT EXISTS =====
async function initTables() {
  const client = await pool.connect();
  try {
    // Clients table
    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        client TEXT,
        service TEXT,
        date TEXT,
        origin TEXT,
        dest TEXT,
        amount NUMERIC,
        status TEXT,
        notes TEXT,
        contact TEXT
      )
    `);
    // Payments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        txid TEXT PRIMARY KEY,
        waybill TEXT,
        amount NUMERIC,
        method TEXT,
        date TEXT,
        remarks TEXT,
        postedby TEXT
      )
    `);
    // Dispatches table
    await client.query(`
      CREATE TABLE IF NOT EXISTS dispatches (
        tripid TEXT PRIMARY KEY,
        waybillid TEXT,
        driver TEXT,
        truck TEXT,
        origin TEXT,
        destination TEXT,
        date TEXT,
        status TEXT,
        notes TEXT,
        clientname TEXT,
        departuretime TEXT,
        arrivaltime TEXT,
        tripnotes TEXT
      )
    `);
    // Maintenance table
    await client.query(`
      CREATE TABLE IF NOT EXISTS maintenance (
        id TEXT PRIMARY KEY,
        truck TEXT,
        type TEXT,
        reqdate TEXT,
        priority TEXT,
        provider TEXT,
        estcost NUMERIC,
        description TEXT,
        status TEXT,
        parts NUMERIC,
        labor NUMERIC,
        total NUMERIC,
        completeddate TEXT,
        workdone TEXT
      )
    `);
    console.log("Tables created/verified.");
  } catch (err) {
    console.error("Error creating tables:", err);
  } finally {
    client.release();
  }
}
initTables();

// ===== HELPER FUNCTIONS (optional, for compatibility) =====
// Not strictly needed, but kept for any remaining JSON logic.

// ===== CLIENTS ENDPOINTS =====
app.get('/api/clients', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clients ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clients', async (req, res) => {
  const { id, client, service, date, origin, dest, amount, status, notes, contact } = req.body;
  try {
    await pool.query(
      `INSERT INTO clients (id, client, service, date, origin, dest, amount, status, notes, contact)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, client, service, date, origin, dest, amount, status, notes, contact || '']
    );
    res.status(201).json(req.body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/clients/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const setClause = Object.keys(updates).map((key, idx) => `${key}=$${idx+2}`).join(',');
    const values = [id, ...Object.values(updates)];
    await pool.query(`UPDATE clients SET ${setClause} WHERE id=$1`, values);
    res.json({ message: 'Updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM clients WHERE id=$1', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ===== PAYMENTS ENDPOINTS =====
app.get('/api/payments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payments ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payments', async (req, res) => {
  const { txid, waybill, amount, method, date, remarks, postedby } = req.body;
  try {
    await pool.query(
      `INSERT INTO payments (txid, waybill, amount, method, date, remarks, postedby)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [txid, waybill, amount, method, date, remarks, postedby]
    );
    res.status(201).json(req.body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ===== DISPATCHES ENDPOINTS =====
app.get('/api/dispatches', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM dispatches ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/dispatches', async (req, res) => {
  const { tripid, waybillId, driver, truck, origin, destination, date, status, notes, clientName, departureTime, arrivalTime, tripNotes } = req.body;
  try {
    await pool.query(
      `INSERT INTO dispatches (tripid, waybillid, driver, truck, origin, destination, date, status, notes, clientname, departuretime, arrivaltime, tripnotes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [tripId, waybillId, driver, truck, origin, destination, date, status, notes, clientName, departureTime, arrivalTime, tripNotes]
    );
    res.status(201).json(req.body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/dispatches/:tripId', async (req, res) => {
  const { tripId } = req.params;
  const updates = req.body;
  try {
    const setClause = Object.keys(updates).map((key, idx) => `${key}=$${idx+2}`).join(',');
    const values = [tripId, ...Object.values(updates)];
    await pool.query(`UPDATE dispatches SET ${setClause} WHERE tripid=$1`, values);
    res.json({ message: 'Updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/dispatches/:tripId', async (req, res) => {
  const { tripId } = req.params;
  try {
    await pool.query('DELETE FROM dispatches WHERE tripid=$1', [tripId]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ===== MAINTENANCE ENDPOINTS =====
app.get('/api/maintenance', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM maintenance ORDER BY reqdate DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/maintenance', async (req, res) => {
  const { id, truck, type, reqDate, priority, provider, estCost, description, status, parts, labor, total, completedDate, workDone } = req.body;
  try {
    await pool.query(
      `INSERT INTO maintenance (id, truck, type, reqdate, priority, provider, estcost, description, status, parts, labor, total, completeddate, workdone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [id, truck, type, reqDate, priority, provider, estCost, description, status, parts || 0, labor || 0, total || 0, completedDate, workDone]
    );
    res.status(201).json(req.body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/maintenance/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const setClause = Object.keys(updates).map((key, idx) => `${key}=$${idx+2}`).join(',');
    const values = [id, ...Object.values(updates)];
    await pool.query(`UPDATE maintenance SET ${setClause} WHERE id=$1`, values);
    res.json({ message: 'Updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/maintenance/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM maintenance WHERE id=$1', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ===== START SERVER =====
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});