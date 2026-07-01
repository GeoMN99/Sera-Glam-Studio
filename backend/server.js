const express = require('express');
const cors = require('cors');
const db = require('./db.js');

const app = express();

app.use(cors());
app.use(express.json());

// ===== TEST ROUTE =====
app.get('/', (req, res) => {
    res.send('Sera Glam Studio backend is running!');
});

// ===== GET ALL BOOKINGS (optionally filtered by date) =====
// Full data — name, phone, email, etc. Used internally / for testing.
app.get('/api/bookings', (req, res) => {
    const { date } = req.query;

    let bookings;
    if (date) {
        const stmt = db.prepare('SELECT * FROM bookings WHERE date = ?');
        bookings = stmt.all(date);
    } else {
        const stmt = db.prepare('SELECT * FROM bookings ORDER BY date, time');
        bookings = stmt.all();
    }

    res.json(bookings);
});

// ===== PUBLIC: AVAILABILITY ONLY (no personal data) =====
// Used by the booking calendar — clients only need to know
// which date+time slots are taken, never who booked them.
app.get('/api/availability', (req, res) => {
    const { date } = req.query;

    let rows;
    if (date) {
        rows = db.prepare('SELECT date, time FROM bookings WHERE date = ?').all(date);
    } else {
        rows = db.prepare('SELECT date, time FROM bookings').all();
    }

    res.json(rows);
});

// ===== CREATE A NEW BOOKING =====
app.post('/api/bookings', (req, res) => {
    const { name, phone, email, service, price, duration, date, time, notes } = req.body;

    if (!name || !phone || !service || !date || !time) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

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
    res.json({ message: 'Booking cancelled.', cancelled: existing });
});

// ===== DELETE ALL BOOKINGS (bulk, public version) =====
app.delete('/api/bookings', (req, res) => {
    const result = db.prepare('DELETE FROM bookings').run();
    res.json({ message: 'All bookings cleared.', count: result.changes });
});

// ===== ADMIN: SIMPLE PASSWORD CHECK MIDDLEWARE =====
// Checks for a header called 'x-admin-password' on the request,
// and compares it to the ADMIN_PASSWORD environment variable set on Render.
function requireAdmin(req, res, next) {
    const providedPassword = req.headers['x-admin-password'];

    if (!providedPassword || providedPassword !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized.' });
    }

    next();
}

// ===== ADMIN: FULL BOOKING LIST (protected) =====
app.get('/api/admin/bookings', requireAdmin, (req, res) => {
    const rows = db.prepare('SELECT * FROM bookings ORDER BY date, time').all();
    res.json(rows);
});

// ===== ADMIN: CANCEL A SPECIFIC BOOKING (protected) =====
app.delete('/api/admin/bookings/:id', requireAdmin, (req, res) => {
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
    if (!existing) {
        return res.status(404).json({ error: 'Booking not found.' });
    }

    db.prepare('DELETE FROM bookings WHERE id = ?').run(id);
    res.json({ message: 'Booking cancelled.', cancelled: existing });
});

// ===== ADMIN: BULK CLEAR (protected) =====
app.delete('/api/admin/bookings', requireAdmin, (req, res) => {
    const result = db.prepare('DELETE FROM bookings').run();
    res.json({ message: 'All bookings cleared.', count: result.changes });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

