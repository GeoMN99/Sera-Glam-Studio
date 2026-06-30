const express = require('express');
const cors = require('cors');
const db = require('./db.js');  // our database connection

const app = express();

app.use(cors());
app.use(express.json());

// ===== TEST ROUTE =====
app.get('/', (req, res) => {
    res.send('Sera Glam Studio backend is running!');
});

// ===== GET ALL BOOKINGS (optionally filtered by date) =====
// Example: GET /api/bookings?date=2026-05-22
app.get('/api/bookings', (req, res) => {
    const { date } = req.query;

    let bookings;
    if (date) {
        // Only bookings for that specific date
        const stmt = db.prepare('SELECT * FROM bookings WHERE date = ?');
        bookings = stmt.all(date);
    } else {
        // All bookings
        const stmt = db.prepare('SELECT * FROM bookings ORDER BY date, time');
        bookings = stmt.all();
    }

    res.json(bookings);
});

// ===== CREATE A NEW BOOKING =====
app.post('/api/bookings', (req, res) => {
    const { name, phone, email, service, price, duration, date, time, notes } = req.body;

    // Basic validation
    if (!name || !phone || !service || !date || !time) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Check if this date + time is already booked
    const existing = db.prepare('SELECT * FROM bookings WHERE date = ? AND time = ?').get(date, time);
    if (existing) {
        return res.status(409).json({ error: 'This time slot is already booked.' });
    }

    const bookedOn = new Date().toISOString();

    const stmt = db.prepare(`
        INSERT INTO bookings (name, phone, email, service, price, duration, date, time, notes, bookedOn)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, phone, email || null, service, price, duration, date, time, notes || null, bookedOn);

    // Send back the newly created booking, including its new id
    const newBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newBooking);
});

// ===== CANCEL (DELETE) A BOOKING =====
app.delete('/api/bookings/:id', (req, res) => {
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
    if (!existing) {
        return res.status(404).json({ error: 'Booking not found.' });
    }

    db.prepare('DELETE FROM bookings WHERE id = ?').run(id);

    // Send back what was deleted, so the frontend can use it for the WhatsApp cancellation message
    res.json({ message: 'Booking cancelled.', cancelled: existing });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});