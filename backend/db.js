// Import the SQLite library
const Database = require('better-sqlite3');

// Open (or create, if it doesn't exist) the database file
const db = new Database('bookings.db');

// Create the bookings table if it doesn't already exist
db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        service TEXT NOT NULL,
        price TEXT NOT NULL,
        duration TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        notes TEXT,
        bookedOn TEXT NOT NULL
    )
`);

// Export the db connection so other files (like server.js) can use it
module.exports = db;