// ===== SERA GLAM STUDIO — BOOKING JS (BACKEND VERSION, PUBLIC PAGE) =====

const API_URL = 'https://sera-glam-backend.onrender.com/api/bookings';
const AVAILABILITY_URL = 'https://sera-glam-backend.onrender.com/api/availability';

// Only ever holds { date, time } pairs now — no personal data reaches this page.
let bookings = [];

// ===== CALENDAR STATE =====
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = null;        // ISO format, e.g. "2026-05-22" — sent to backend
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
function toISODate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// ===== FETCH AVAILABILITY FROM SERVER (no personal data) =====
async function fetchBookings() {
    try {
        const response = await fetch(AVAILABILITY_URL);
        bookings = await response.json();
    } catch (err) {
        console.error('Could not reach the server:', err);
        alert('Could not connect to the booking server. Make sure it is running.');
        bookings = [];
    }
}

// ===== BUILD CALENDAR =====
async function buildCalendar(month, year) {
    await fetchBookings(); // always work with fresh availability data

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

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.classList.add('cal-day', 'empty');
        grid.appendChild(empty);
    }

    for (let day = 1; day <= totalDays; day++) {
        const dayEl = document.createElement('div');
        dayEl.classList.add('cal-day');
        dayEl.textContent = day;

        const thisDate = new Date(year, month, day);
        thisDate.setHours(0, 0, 0, 0);
        const dateStr = toISODate(thisDate);

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
        date: selectedDate,
        time: selectedTime,
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
            await buildCalendar(currentMonth, currentYear);
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

    await buildCalendar(currentMonth, currentYear);
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

// ===== CANCEL A BOOKING (not currently wired to any UI on this public page — =====
// ===== cancellation is now handled from the owner's admin page instead) =====
async function deleteBooking(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            console.error('Could not cancel booking', id);
            return;
        }
        await buildCalendar(currentMonth, currentYear);
    } catch (err) {
        console.error(err);
    }
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', async function () {
    await buildCalendar(currentMonth, currentYear);

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
    document.getElementById('client-name').addEventListener('input', updateSummary);
    document.getElementById('client-phone').addEventListener('input', updateSummary);
    document.getElementById('service-category').addEventListener('change', updateServices);
    document.getElementById('service-type').addEventListener('change', updateSummary);
});