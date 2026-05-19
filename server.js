const express = require('express');
const cors = require('cors');
const fs = require('fs'); // New: to handle files
const app = express();
const PORT = 3000;

app.use(cors({
  origin: 'https://dvrss.netlify.app'
}));app.use(express.json());

const DATA_FILE = './database.json';

// Function to save data to a file
const saveToFile = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// Function to load data from a file
const loadFromFile = () => {
    if (fs.existsSync(DATA_FILE)) {
        return JSON.parse(fs.readFileSync(DATA_FILE));
    }
return { clients: [], payments: [], dispatches: [] };};

// Ensure your initial data has a dispatches array
let dvrsData = loadFromFile();
if (!dvrsData.dispatches) dvrsData.dispatches = [];

// This tells the server how to handle NEW client requests
app.post('/api/clients', (req, res) => {
    console.log("Received a new client request:", req.body);
    
    const db = loadFromFile();
    
    // Ensure the clients array exists in your JSON
    if (!db.clients) {
        db.clients = [];
    }

    const newRequest = req.body;
    
    // Add the new request to our list
    db.clients.push(newRequest);
    
    // Save the updated list back to database.json
    saveToFile(db);
    
    console.log("Client request saved successfully!");
    res.status(201).json(newRequest);
});

// New route to save Dispatches
app.post('/api/dispatches', (req, res) => {
    console.log("POST request received at /api/dispatches"); // 1. Check your terminal for this
    const db = loadFromFile();
    
    // Ensure the dispatches array exists
    if (!db.dispatches) db.dispatches = [];

    const newDispatch = req.body;
    newDispatch.tripId = "TRP-" + Math.floor(1000 + Math.random() * 9000);
    
    console.log("Data to save:", newDispatch); // 2. Check your terminal for this
    
    db.dispatches.push(newDispatch);
    saveToFile(db);
    
    res.status(201).json(newDispatch);
});

// Route to POST a new payment
app.post('/api/payments', (req, res) => {
    const db = loadFromFile();
    if (!db.payments) db.payments = [];
    db.payments.push(req.body);
    saveToFile(db);
    res.status(201).json(req.body);
});

app.post('/api/maintenance', (req, res) => {
    const db = loadFromFile();
    if (!db.maintenance) db.maintenance = [];
    const newRecord = req.body;
    db.maintenance.push(newRecord);
    saveToFile(db);
    res.status(201).json(newRecord);
});

app.get('/api/maintenance', (req, res) => {
    const db = loadFromFile();
    if (!db.maintenance) db.maintenance = [];
    res.json(db.maintenance);
});


// Route to get Dispatches
app.get('/api/dispatches', (req, res) => {
    const db = loadFromFile();
    res.json(db.dispatches || []);
});
// This tells the server how to handle the GET request for clients
app.get('/api/clients', (req, res) => {
    // Force the server to read the file NOW
    const db = loadFromFile(); 
    
    if (db && db.clients) {
        res.json(db.clients);
    } else {
        res.json([]); 
    }
});

// Route to GET all payments
app.get('/api/payments', (req, res) => {
    // Force the server to read the file NOW
    const db = loadFromFile();
    res.json(db.payments || []);
});

// PUT update maintenance record
app.put('/api/maintenance/:id', (req, res) => {
    const db = loadFromFile();
    const recordId = req.params.id;
    const updateData = req.body;
    
    const index = db.maintenance.findIndex(m => m.id === recordId);
    if (index !== -1) {
        db.maintenance[index] = { ...db.maintenance[index], ...updateData };
        saveToFile(db);
        res.json(db.maintenance[index]);
    } else {
        res.status(404).json({ error: 'Record not found' });
    }
});

app.put('/api/clients/:id', (req, res) => {
    const db = loadFromFile();
    const index = db.clients.findIndex(c => c.id === req.params.id);
    if (index !== -1) {
        db.clients[index] = { ...db.clients[index], ...req.body };
        saveToFile(db);
        res.json(db.clients[index]);
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

app.delete('/api/clients/:id', (req, res) => {
    const db = loadFromFile();
    db.clients = db.clients.filter(c => c.id !== req.params.id);
    saveToFile(db);
    res.json({ message: 'Deleted' });
});

// Update dispatch status (for trip reports)
app.put('/api/dispatches/:tripId', (req, res) => {
    console.log("PUT request received for trip:", req.params.tripId);
    const db = loadFromFile();
    const tripId = req.params.tripId;
    const updateData = req.body;
    
    // Find the dispatch by tripId
    const index = db.dispatches.findIndex(d => d.tripId === tripId);
    
    if (index !== -1) {
        // Update the dispatch with new data
        db.dispatches[index] = { ...db.dispatches[index], ...updateData };
        saveToFile(db);
        console.log("Trip updated:", db.dispatches[index]);
        res.json(db.dispatches[index]);
    } else {
        res.status(404).json({ error: 'Trip not found' });
    }
});

// Delete a dispatch
app.delete('/api/dispatches/:tripId', (req, res) => {
    console.log("DELETE request received for trip:", req.params.tripId);
    const db = loadFromFile();
    const tripId = req.params.tripId;
    
    const initialLength = db.dispatches.length;
    db.dispatches = db.dispatches.filter(d => d.tripId !== tripId);
    
    if (db.dispatches.length < initialLength) {
        saveToFile(db);
        res.json({ message: 'Trip deleted successfully' });
    } else {
        res.status(404).json({ error: 'Trip not found' });
    }
});

// DELETE maintenance record
app.delete('/api/maintenance/:id', (req, res) => {
    const db = loadFromFile();
    const recordId = req.params.id;
    db.maintenance = db.maintenance.filter(m => m.id !== recordId);
    saveToFile(db);
    res.json({ message: 'Deleted' });
});

app.listen(PORT, () => {
    console.log(`Warehouse Server is running on http://localhost:${PORT}`);
});