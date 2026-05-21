# Sera Glam Studio

### Description
Sera Glam Studio is a beauty salon booking website for a professional lash artist and wig stylist based in Nairobi,Kenya. Clients can browse services, book appointments through an interactive calendar and contact the studio directly. When a booking is made or cancelled, the studio owner is automatically notified via WhatsApp. The website is built using HTML, CSS and JavaScript and uses the browser's built-in Local Storage to save bookings automatically.

### Technologies Used
- HTML
- CSS
- JavaScript
- Google Fonts - Cormorant and Jost
- Local Storage - for saving bookings in the browser
- WhatsApp API - for owner booking notification

### Pages
- index.html — Home page with hero section and studio introduction
- services.html — Full list of lash and wig services with prices
- book.html — Interactive calendar booking system
- gallery.html — Photo gallery with filter by lashes and wigs
- contact.html — Contact form, location, WhatsApp and Instagram links

### Features
- Interactive calendar with available and booked time slots
- Automatic WhatsApp notification to owner on new booking
- Automatic WhatsApp notification to owner on booking cancellation
- Password protected Clear All Bookings button
- Live booking summary panel that updates in real time
- Dark mode and light mode toggle saved to Local Storage
- Fully responsive on mobile and desktop
- Hamburger navigation menu on mobile
- Gallery filter by service category
- Contact form with validation

### Setup Instructions
1. Download or clone the project folder
2. Make sure all files are in the same folder structure
3. Open index.html in any web browser
4. No installation or internet connection required

### Known Bugs
- Booked time slots only show as taken on the same device and browser where the booking was made — no cross-device sync without a backend
- WhatsApp notification requires the client to click Send manually
- Clear All Bookings password is stored in the JS file and can be seen in the browser console

### Future Plans
- Connect to a backend database so bookings sync across all devices
- Add automatic email or SMS notifications to the owner
- Add an owner admin dashboard to manage all appointments
- Add M-Pesa deposit integration for booking deposits
- Add a loyalty rewards system for returning clients