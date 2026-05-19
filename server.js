const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // allow all origins (or restrict to your Netlify URL)
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'database.json');

// Load data from file, create if missing
const loadFromFile = () => {
  if (!fs.existsSync(DATA_FILE)) {
    const defaultData = { clients: [], payments: [], dispatches: [], maintenance: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE));
  } catch (err) {
    console.error("Error reading database file:", err);
    return { clients: [], payments: [], dispatches: [], maintenance: [] };
  }
};

const saveToFile = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// --------------------- CLIENTS ---------------------
app.get('/api/clients', (req, res) => {
  const db = loadFromFile();
  res.json(db.clients || []);
});

app.post('/api/clients', (req, res) => {
  const db = loadFromFile();
  if (!db.clients) db.clients = [];
  const newClient = req.body;
  db.clients.push(newClient);
  saveToFile(db);
  res.status(201).json(newClient);
});

// --------------------- PAYMENTS ---------------------
app.get('/api/payments', (req, res) => {
  const db = loadFromFile();
  res.json(db.payments || []);
});

app.post('/api/payments', (req, res) => {
  const db = loadFromFile();
  if (!db.payments) db.payments = [];
  const newPayment = req.body;
  db.payments.push(newPayment);
  saveToFile(db);
  res.status(201).json(newPayment);
});

// --------------------- DISPATCHES ---------------------
app.get('/api/dispatches', (req, res) => {
  const db = loadFromFile();
  res.json(db.dispatches || []);
});

app.post('/api/dispatches', (req, res) => {
  const db = loadFromFile();
  if (!db.dispatches) db.dispatches = [];
  const newDispatch = req.body;
  // Generate a tripId if not provided
  if (!newDispatch.tripId) newDispatch.tripId = 'TRP-' + Math.floor(1000 + Math.random() * 9000);
  db.dispatches.push(newDispatch);
  saveToFile(db);
  res.status(201).json(newDispatch);
});

app.put('/api/dispatches/:tripId', (req, res) => {
  const db = loadFromFile();
  const tripId = req.params.tripId;
  const updateData = req.body;
  const index = db.dispatches.findIndex(d => d.tripId === tripId);
  if (index !== -1) {
    db.dispatches[index] = { ...db.dispatches[index], ...updateData };
    saveToFile(db);
    res.json(db.dispatches[index]);
  } else {
    res.status(404).json({ error: 'Trip not found' });
  }
});

// --------------------- MAINTENANCE ---------------------
app.get('/api/maintenance', (req, res) => {
  const db = loadFromFile();
  res.json(db.maintenance || []);
});

app.post('/api/maintenance', (req, res) => {
  const db = loadFromFile();
  if (!db.maintenance) db.maintenance = [];
  const newRecord = req.body;
  db.maintenance.push(newRecord);
  saveToFile(db);
  res.status(201).json(newRecord);
});

app.put('/api/maintenance/:id', (req, res) => {
  const db = loadFromFile();
  const id = req.params.id;
  const updateData = req.body;
  const index = db.maintenance.findIndex(m => m.id === id);
  if (index !== -1) {
    db.maintenance[index] = { ...db.maintenance[index], ...updateData };
    saveToFile(db);
    res.json(db.maintenance[index]);
  } else {
    res.status(404).json({ error: 'Record not found' });
  }
});

app.delete('/api/maintenance/:id', (req, res) => {
  const db = loadFromFile();
  const id = req.params.id;
  db.maintenance = db.maintenance.filter(m => m.id !== id);
  saveToFile(db);
  res.json({ message: 'Deleted' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});