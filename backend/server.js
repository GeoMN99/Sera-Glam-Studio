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

// Converts a duration string to number of 1-hour slots to block
// Examples:
// "30 mins"  → 1
// "45 mins"  → 1
// "60 mins"  → 1
// "90 mins"  → 2
// "2 hours"  → 2
// "2.5 hours"→ 3
function durationToSlots(durationStr) {
    if (!durationStr) return 1;

    const str = durationStr.toLowerCase().trim();
    let minutes = 0;

    if (str.includes('hour')) {
        // Extract the number before "hour"
        const num = parseFloat(str);
        minutes = num * 60;
    } else if (str.includes('min')) {
        // Extract the number before "min"
        minutes = parseFloat(str);
    }

    // Each slot is 60 minutes — round up so we never double-book
    return Math.ceil(minutes / 60);
}

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

// ===== PUBLIC: AVAILABILITY ONLY (duration-aware) =====
app.get('/api/availability', (req, res) => {
    const { date } = req.query;

    let bookedRows;
    if (date) {
        bookedRows = db.prepare(
            'SELECT date, time, duration FROM bookings WHERE date = ?'
        ).all(date);
    } else {
        bookedRows = db.prepare(
            'SELECT date, time, duration FROM bookings'
        ).all();
    }

    // All time slot values in order
    const allSlots = [
        '08:00', '09:00', '10:00', '11:00', '12:00',
        '13:00', '14:00', '15:00', '16:00', '17:00'
    ];

    // Build the full list of blocked slots, including duration overlap
    const blockedSlots = [];

    bookedRows.forEach(booking => {
        const slotsNeeded = durationToSlots(booking.duration);
        const startIndex = allSlots.indexOf(booking.time);

        if (startIndex === -1) return; // unrecognised time, skip

        // Block the start slot plus however many additional slots the duration needs
        for (let i = 0; i < slotsNeeded; i++) {
            const slotIndex = startIndex + i;
            if (slotIndex < allSlots.length) {
                blockedSlots.push({
                    date: booking.date,
                    time: allSlots[slotIndex]
                });
            }
        }
    });

    res.json(blockedSlots);
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

