# ✨ Sera Glam Studio

### Author
Your Name Here

### Description
Sera Glam Studio is a beauty salon booking website for a professional
lash artist and wig stylist based in Nairobi, Kenya. Clients can browse
services, book appointments through an interactive calendar, and contact
the studio directly. The website is backed by a real Node.js/Express
server with a SQLite database, meaning bookings persist across devices
and double-booking is prevented server-side. When a booking is made or
cancelled, the studio owner is automatically notified via WhatsApp.
An owner-only admin dashboard allows full booking management behind
server-side password protection.

### Technologies Used
- HTML, CSS, JavaScript — frontend
- Node.js + Express — backend API server
- SQLite (better-sqlite3) — persistent booking database
- GitHub Pages — frontend hosting
- Render — backend hosting
- Google Fonts — Cormorant Garamond and Jost
- WhatsApp API — pre-filled booking/cancellation notifications to owner

### Pages
- index.html — Home page with hero section and studio introduction
- services.html — Full list of lash and wig services with prices
- book.html — Interactive calendar booking system
- gallery.html — Photo gallery with filter by lashes and wigs
- contact.html — Contact form, location, WhatsApp and Instagram links
- admin.html — Owner-only dashboard (password protected)

### Features
- Interactive calendar with available and booked time slots
- Server-side double-booking protection — works across all devices
- Public availability endpoint strips personal data before it reaches the client
- Owner admin dashboard — full booking list, cancel and clear all
- Server-side password check on all admin routes via environment variable
- Automatic WhatsApp notification to owner on new booking and cancellation
- Dark mode and light mode toggle saved to Local Storage
- Fully responsive on mobile and desktop
- Hamburger navigation menu on mobile
- Gallery filter by service category
- Contact form with validation

### Architecture
Frontend (GitHub Pages) → calls → Backend API (Render) → reads/writes → SQLite database

Public routes (no auth required):
- GET  /api/availability         — date/time pairs only, no personal data
- POST /api/bookings             — create a booking
- DELETE /api/bookings/:id       — cancel a specific booking

Protected routes (owner password required via x-admin-password header):
- GET    /api/admin/bookings     — full booking list with all client details
- DELETE /api/admin/bookings/:id — cancel any booking
- DELETE /api/admin/bookings     — bulk clear all bookings

### Setup Instructions — Frontend
1. Clone or download the frontend folder
2. Open index.html in any web browser
3. The booking system connects to the live Render backend automatically

### Setup Instructions — Backend (local)
1. cd into the backend folder
2. Run: npm install
3. Set environment variable: ADMIN_PASSWORD=yourpassword
4. Run: node server.js
5. Server runs on http://localhost:3000
6. Update API_URL and AVAILABILITY_URL in js/book.js to point to localhost

### Live Site
Frontend: https://geomn99.github.io/Sera-Glam-Studio
Backend: https://sera-glam-backend.onrender.com

### Known Limitations
- Render free tier may reset the SQLite database file on redeploys or
  after extended inactivity — for true persistence in production,
  a paid persistent volume or cloud database (e.g. Supabase, PlanetScale)
  is needed
- WhatsApp notifications require the client to manually click Send in
  WhatsApp — true server-triggered automatic messages require the
  Twilio or Meta WhatsApp Cloud API
- The public DELETE /api/bookings/:id route has no auth — anyone who
  knows a booking ID can cancel it. A future fix would require clients
  to provide a cancellation token sent to their phone/email at booking time

### Future Plans
- Replace SQLite with a cloud database for true cross-deploy persistence
- Add automatic server-triggered WhatsApp/SMS via Twilio
- Add M-Pesa deposit integration for booking deposits
- Add a cancellation token system so clients can cancel their own bookings safely
- Add email confirmation to clients on booking