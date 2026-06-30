// ===== SERA GLAM STUDIO — BOOKING JS (BACKEND VERSION) =====

const API_URL = 'http://sera-glam-backend.onrender.com/api/bookings'; 

// Bookings now come from the server, not localStorage.
// This array is just an in-memory cache, refreshed by fetchBookings().
let bookings = [];

// ===== CALENDAR STATE =====
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = null;       // ISO format, e.g. "2026-05-22" — sent to backend
let selectedDateDisplay = null; // human readable, e.g. "Friday, May 22, 2026" — shown to user
let selectedTime = null;

// ===== ALL TIME SLOTS =====
const allTimeSlots = [
    { value: '08:00', label: '8:00 AM' },
    { value: '09:00', label: '9:00 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '13:00', label: '1:00 PM' },
    { value: '14:00', label: '2:00 PM' },
    { value: '15:00', label: '3:00 PM' },
    { value: '16:00', label: '4:00 PM' },
    { value: '17:00', label: '5:00 PM' },
];

// ===== SERVICE DATA =====
const serviceData = {
    lashes: [
        { name: 'Classic Lashes', price: 'Ksh 1,500', duration: '90 mins' },
        { name: 'Hybrid Lashes', price: 'Ksh 2,000', duration: '2 hours' },
        { name: 'Volume Lashes', price: 'Ksh 2,500', duration: '2.5 hours' },
        { name: 'Lash Removal', price: 'Ksh 500', duration: '30 mins' },
        { name: 'Lash Infills', price: 'Ksh 1,000', duration: '60 mins' },
    ],
    wigs: [
        { name: 'Wig Install', price: 'Ksh 1,500', duration: '60 mins' },
        { name: 'Wig Install & Style', price: 'Ksh 2,500', duration: '2 hours' },
        { name: 'Wig Styling Only', price: 'Ksh 1,000', duration: '60 mins' },
        { name: 'Wig Maintenance', price: 'Ksh 800', duration: '45 mins' },
    ]
};

// ===== HELPER: format a Date object as ISO "YYYY-MM-DD" =====
// We use this instead of toLocaleDateString() because the backend
// stores and compares dates in this exact format.
function toISODate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// ===== FETCH BOOKINGS FROM SERVER =====
async function fetchBookings() {
    try {
        const response = await fetch(API_URL);
        bookings = await response.json();
    } catch (err) {
        console.error('Could not reach the server:', err);
        alert('Could not connect to the booking server. Make sure it is running.');
        bookings = [];
    }
}

// ===== BUILD CALENDAR =====
async function buildCalendar(month, year) {
    await fetchBookings(); // always work with fresh data from the server

    const grid = document.getElementById('calendar-grid');
    const monthYearLabel = document.getElementById('calendar-month-year');
    grid.innerHTML = '';

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    monthYearLabel.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Empty cells before the first day
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.classList.add('cal-day', 'empty');
        grid.appendChild(empty);
    }

    // Day cells
    for (let day = 1; day <= totalDays; day++) {
        const dayEl = document.createElement('div');
        dayEl.classList.add('cal-day');
        dayEl.textContent = day;

        const thisDate = new Date(year, month, day);
        thisDate.setHours(0, 0, 0, 0);
        const dateStr = toISODate(thisDate); // ISO format, matches backend

        if (thisDate < today) {
            dayEl.classList.add('past');
        } else {
            const hasBookings = bookings.some(b => b.date === dateStr);
            if (hasBookings) dayEl.classList.add('has-bookings');

            if (thisDate.getTime() === today.getTime()) {
                dayEl.classList.add('today');
            }

            if (selectedDate === dateStr) {
                dayEl.classList.add('selected');
            }

            dayEl.addEventListener('click', function () {
                document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('selected'));
                this.classList.add('selected');

                selectedDate = dateStr;
                selectedTime = null;

                document.getElementById('appt-date').value = selectedDate;
                document.getElementById('appt-time').value = '';

                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                selectedDateDisplay = thisDate.toLocaleDateString('en-KE', options);
                document.getElementById('selected-date-label').textContent = 'Selected: ' + selectedDateDisplay;

                renderTimeSlots(dateStr);
                updateSummary();
            });
        }

        grid.appendChild(dayEl);
    }
}

// ===== RENDER TIME SLOTS =====
// Uses the in-memory `bookings` array, which was just refreshed
// by fetchBookings() inside buildCalendar() — no extra network call needed here.
function renderTimeSlots(dateStr) {
    const container = document.getElementById('time-slots-container');
    const grid = document.getElementById('time-slots-grid');
    container.style.display = 'block';
    grid.innerHTML = '';

    const bookedTimes = bookings
        .filter(b => b.date === dateStr)
        .map(b => b.time);

    allTimeSlots.forEach(slot => {
        const btn = document.createElement('button');
        btn.classList.add('time-slot');
        btn.textContent = slot.label;
        btn.setAttribute('data-time', slot.value);

        if (bookedTimes.includes(slot.value)) {
            btn.classList.add('booked');
            btn.textContent = slot.label + ' ✗';
            btn.disabled = true;
        } else {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected-slot'));
                this.classList.add('selected-slot');
                selectedTime = slot.value;
                document.getElementById('appt-time').value = slot.value;
                updateSummary();
            });
        }

        grid.appendChild(btn);
    });
}

// ===== UPDATE SERVICE DROPDOWN =====
function updateServices() {
    const category = document.getElementById('service-category').value;
    const serviceSelect = document.getElementById('service-type');
    serviceSelect.innerHTML = '<option value="">Select a service</option>';

    if (category && serviceData[category]) {
        serviceData[category].forEach((service, i) => {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${service.name} — ${service.price}`;
            serviceSelect.appendChild(option);
        });
    }

    updateSummary();
}

// ===== UPDATE BOOKING SUMMARY =====
function updateSummary() {
    const name = document.getElementById('client-name').value.trim();
    const phone = document.getElementById('client-phone').value.trim();
    const category = document.getElementById('service-category').value;
    const serviceIndex = document.getElementById('service-type').value;

    document.getElementById('sum-name').textContent = name || '—';
    document.getElementById('sum-phone').textContent = phone || '—';

    if (category && serviceIndex !== '') {
        const service = serviceData[category][serviceIndex];
        document.getElementById('sum-service').textContent = service.name;
        document.getElementById('sum-price').textContent = service.price;
    } else {
        document.getElementById('sum-service').textContent = '—';
        document.getElementById('sum-price').textContent = '—';
    }

    document.getElementById('sum-date').textContent = selectedDateDisplay || '—';

    if (selectedTime) {
        const slot = allTimeSlots.find(s => s.value === selectedTime);
        document.getElementById('sum-time').textContent = slot ? slot.label : '—';
    } else {
        document.getElementById('sum-time').textContent = '—';
    }
}

// ===== SHOW SUCCESS MESSAGE =====
function showSuccess(message) {
    const msg = document.createElement('div');
    msg.classList.add('success-message');
    msg.textContent = message;
    document.body.appendChild(msg);
    setTimeout(() => msg.classList.add('fade-out'), 2000);
    setTimeout(() => msg.remove(), 2500);
}

// ===== ADD BOOKING =====
async function addBooking() {
    const name = document.getElementById('client-name').value.trim();
    const phone = document.getElementById('client-phone').value.trim();
    const email = document.getElementById('client-email').value.trim();
    const category = document.getElementById('service-category').value;
    const serviceIndex = document.getElementById('service-type').value;
    const notes = document.getElementById('appt-notes').value.trim();

    if (!name || !phone || !category || serviceIndex === '' || !selectedDate || !selectedTime) {
        alert('Please fill in all required fields and select a date and time slot.');
        return;
    }

    const service = serviceData[category][serviceIndex];
    const slot = allTimeSlots.find(s => s.value === selectedTime);

    const newBooking = {
        name,
        phone,
        email,
        service: service.name,
        price: service.price,
        duration: service.duration,
        date: selectedDate,   // ISO format
        time: selectedTime,   // raw "HH:MM"
        notes
    };

    let saved;
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newBooking)
        });

        if (response.status === 409) {
            alert('Sorry, that time slot was just booked by someone else. Please pick another.');
            await buildCalendar(currentMonth, currentYear); // refresh to show it as taken
            return;
        }

        if (!response.ok) {
            const errData = await response.json();
            alert('Booking failed: ' + (errData.error || 'Unknown error'));
            return;
        }

        saved = await response.json();
    } catch (err) {
        console.error(err);
        alert('Could not reach the server. Make sure the backend is running.');
        return;
    }

    // Refresh calendar and bookings list from the server
    await buildCalendar(currentMonth, currentYear);
    await renderBookings();
    showSuccess('✨ Booking confirmed! We will contact you shortly.');

    // ===== WHATSAPP NOTIFICATION TO OWNER =====
    const ownerPhone = '254790549541';
    const message =
        '🌸 *New Booking — Sera Glam Studio* 🌸' + '\n\n' +
        '👤 *Client:* ' + saved.name + '\n' +
        '📞 *Phone:* ' + saved.phone + '\n' +
        '✉️ *Email:* ' + (saved.email || 'Not provided') + '\n\n' +
        '💅 *Service:* ' + saved.service + '\n' +
        '💰 *Price:* ' + saved.price + '\n' +
        '⏱ *Duration:* ' + saved.duration + '\n\n' +
        '📅 *Date:* ' + selectedDateDisplay + '\n' +
        '🕐 *Time:* ' + slot.label + '\n\n' +
        '📝 *Notes:* ' + (saved.notes || 'None');

    const whatsappURL = 'https://wa.me/' + ownerPhone + '?text=' + encodeURIComponent(message);
    window.open(whatsappURL, '_blank');

    // Reset form
    document.getElementById('client-name').value = '';
    document.getElementById('client-phone').value = '';
    document.getElementById('client-email').value = '';
    document.getElementById('service-category').value = '';
    document.getElementById('service-type').innerHTML = '<option value="">Select a service first</option>';
    document.getElementById('appt-notes').value = '';
    document.getElementById('appt-date').value = '';
    document.getElementById('appt-time').value = '';

    selectedDate = null;
    selectedDateDisplay = null;
    selectedTime = null;
    document.getElementById('selected-date-label').textContent = 'Select a date to see available slots';
    document.getElementById('time-slots-container').style.display = 'none';

    updateSummary();
}

// ===== DELETE (CANCEL) A BOOKING =====
async function deleteBooking(id) {
    const target = bookings.find(b => b.id === id);
    if (!target) return;

    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            alert('Could not cancel the booking. It may have already been removed.');
            return;
        }
    } catch (err) {
        console.error(err);
        alert('Could not reach the server.');
        return;
    }

    await buildCalendar(currentMonth, currentYear);
    await renderBookings();

    // ===== WHATSAPP CANCELLATION NOTICE TO OWNER =====
    const ownerPhone = '254790549541';
    const message =
        '❌ *Booking Cancelled — Sera Glam Studio* ❌' + '\n\n' +
        '👤 *Client:* ' + target.name + '\n' +
        '📞 *Phone:* ' + target.phone + '\n\n' +
        '💅 *Service:* ' + target.service + '\n' +
        '📅 *Date:* ' + target.date + '\n' +
        '🕐 *Time:* ' + target.time + '\n' +
        '💰 *Price:* ' + target.price;

    const whatsappURL = 'https://wa.me/' + ownerPhone + '?text=' + encodeURIComponent(message);
    window.open(whatsappURL, '_blank');
}

// ===== CLEAR ALL BOOKINGS (password protected) =====
// Note: there's no bulk-delete endpoint on the backend yet, so this
// cancels each booking one at a time using the same DELETE route.
async function clearAllBookings() {
    const password = prompt('Enter owner password to clear all bookings:');
    if (password === null) return;

    if (password !== 'sera2026') {
        alert('❌ Incorrect password. Access denied.');
        return;
    }

    if (!confirm('Are you sure you want to clear ALL bookings? This cannot be undone.')) return;

    for (const b of bookings) {
        await fetch(`${API_URL}/${b.id}`, { method: 'DELETE' });
    }

    await buildCalendar(currentMonth, currentYear);
    await renderBookings();
    alert('✅ All bookings cleared successfully.');
}

// ===== RENDER BOOKINGS LIST =====
async function renderBookings() {
    const list = document.getElementById('bookings-list');
    const clearWrap = document.getElementById('clear-wrap');
    list.innerHTML = '';

    if (bookings.length === 0) {
        list.innerHTML = '<li style="color:#9B59D6; text-align:center; padding:30px; border:none; background:transparent;">No bookings yet. Book your first appointment above!</li>';
        clearWrap.style.display = 'none';
        return;
    }

    clearWrap.style.display = 'block';

    bookings.forEach(b => {
        const slot = allTimeSlots.find(s => s.value === b.time);
        const timeLabel = slot ? slot.label : b.time;

        const li = document.createElement('li');
        li.innerHTML =
            '<div class="booking-info">' +
                '<strong>' + b.service + '</strong>' +
                '<br/>' +
                '<span>' + b.name + ' · ' + b.phone + '</span>' +
                '<br/>' +
                '<span>' + b.date + ' at ' + timeLabel + '</span>' +
                '<br/>' +
                '<span style="color:#9B59D6;">' + b.price + ' · ' + b.duration + '</span>' +
            '</div>' +
            '<button class="btn-danger" data-id="' + b.id + '" style="font-size:0.75rem; padding:8px 14px;">Cancel</button>';
        list.appendChild(li);
    });

    document.querySelectorAll('#bookings-list .btn-danger').forEach(btn => {
        btn.addEventListener('click', function () {
            deleteBooking(parseInt(this.getAttribute('data-id')));
        });
    });
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', async function () {
    await buildCalendar(currentMonth, currentYear);
    await renderBookings();

    document.getElementById('prev-month').addEventListener('click', async function () {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        await buildCalendar(currentMonth, currentYear);
    });

    document.getElementById('next-month').addEventListener('click', async function () {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        await buildCalendar(currentMonth, currentYear);
    });

    document.getElementById('book-btn').addEventListener('click', addBooking);
    document.getElementById('clear-bookings-btn').addEventListener('click', clearAllBookings);
    document.getElementById('client-name').addEventListener('input', updateSummary);
    document.getElementById('client-phone').addEventListener('input', updateSummary);
    document.getElementById('service-category').addEventListener('change', updateServices);
    document.getElementById('service-type').addEventListener('change', updateSummary);
});