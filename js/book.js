const API_URL          = 'https://sera-glam-backend.onrender.com/api/bookings';
const AVAILABILITY_URL = 'https://sera-glam-backend.onrender.com/api/availability';
const SITE_URL         = 'https://seraglamstudio.netlify.app';

const EMAILJS_SERVICE_ID  = 'service_i1tb1bw';
const EMAILJS_TEMPLATE_ID = 'template_qxnwxl6';
const EMAILJS_PUBLIC_KEY  = '0_AM_K-z-xmqnNh6Z';

let bookings = [];
let currentMonth        = new Date().getMonth();
let currentYear         = new Date().getFullYear();
let selectedDate        = null;
let selectedDateDisplay = null;
let selectedTime        = null;
 
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
];
 
const serviceData = {
    lashes: [
        { name: 'Classic Lashes',    price: 'Ksh 1,500', duration: '90 mins'   },
        { name: 'Hybrid Lashes',     price: 'Ksh 2,000', duration: '2 hours'   },
        { name: 'Volume Lashes',     price: 'Ksh 2,500', duration: '2.5 hours' },
        { name: 'Lash Removal',      price: 'Ksh 500',   duration: '30 mins'   },
        { name: 'Lash Infills',      price: 'Ksh 1,000', duration: '60 mins'   },
    ],
    wigs: [
        { name: 'Wig Install',         price: 'Ksh 1,500', duration: '60 mins' },
        { name: 'Wig Install & Style', price: 'Ksh 2,500', duration: '2 hours' },
        { name: 'Wig Styling Only',    price: 'Ksh 1,000', duration: '60 mins' },
        { name: 'Wig Maintenance',     price: 'Ksh 800',   duration: '45 mins' },
    ]
};
 
function toISODate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
 
function isSunday(dateStr) {
    return new Date(dateStr + 'T00:00:00').getDay() === 0;
}
 
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
 
// ===== PROGRESS INDICATOR =====
function updateProgress() {
    const name         = document.getElementById('client-name').value.trim();
    const phone        = document.getElementById('client-phone').value.trim();
    const category     = document.getElementById('service-category').value;
    const serviceIndex = document.getElementById('service-type').value;
 
    const step1Done = name && phone;
    const step2Done = step1Done && category && serviceIndex !== '';
    const step3Done = step2Done && selectedDate && selectedTime;
 
    const s1 = document.getElementById('step-1');
    const s2 = document.getElementById('step-2');
    const s3 = document.getElementById('step-3');
    const c1 = document.getElementById('connector-1');
    const c2 = document.getElementById('connector-2');
    if (!s1 || !s2 || !s3) return;
 
    s1.className = 'progress-step ' + (step1Done ? 'completed' : 'active');
    if (c1) c1.className = 'progress-connector' + (step1Done ? ' completed' : '');
    s2.className = 'progress-step ' + (step2Done ? 'completed' : step1Done ? 'active' : '');
    if (c2) c2.className = 'progress-connector' + (step2Done ? ' completed' : '');
    s3.className = 'progress-step ' + (step3Done ? 'completed' : step2Done ? 'active' : '');
}
 
// ===== CALENDAR SKELETON =====
function showCalendarSkeleton(grid) {
    const skeleton = document.createElement('div');
    skeleton.className = 'cal-skeleton';
    // 35 cells (5 rows × 7 days)
    for (let i = 0; i < 35; i++) {
        const cell = document.createElement('div');
        cell.className = 'cal-skeleton-cell';
        skeleton.appendChild(cell);
    }
    grid.innerHTML = '';
    grid.appendChild(skeleton);
}
 
async function buildCalendar(month, year) {
    const grid           = document.getElementById('calendar-grid');
    const monthYearLabel = document.getElementById('calendar-month-year');
 
    // Show skeleton immediately
    showCalendarSkeleton(grid);
 
    const slowTimer = setTimeout(() => {
        const msg = document.getElementById('cal-loading-msg');
        if (msg) msg.textContent = 'Still connecting… may take up to 60 s on first load';
    }, 5000);
 
    await fetchBookings();
    clearTimeout(slowTimer);
    grid.innerHTML = '';
 
    const monthNames = ['January','February','March','April','May','June',
        'July','August','September','October','November','December'];
    monthYearLabel.textContent = `${monthNames[month]} ${year}`;
 
    const firstDay  = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const today     = new Date();
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
        } else if (isSunday(dateStr)) {
            dayEl.classList.add('past', 'closed');
        } else {
            const hasBookings = bookings.some(b => b.date === dateStr);
            if (hasBookings) dayEl.classList.add('has-bookings');
            if (thisDate.getTime() === today.getTime()) dayEl.classList.add('today');
            if (selectedDate === dateStr) dayEl.classList.add('selected');
 
            dayEl.addEventListener('click', function () {
                document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('selected'));
                this.classList.add('selected');
                selectedDate = dateStr;
                selectedTime = null;
                document.getElementById('appt-date').value = selectedDate;
                document.getElementById('appt-time').value = '';
                const options = { weekday:'long', year:'numeric', month:'long', day:'numeric' };
                selectedDateDisplay = thisDate.toLocaleDateString('en-KE', options);
                document.getElementById('selected-date-label').textContent =
                    'Selected: ' + selectedDateDisplay;
                renderTimeSlots(dateStr);
                updateSummary();
                updateProgress();
 
                // Scroll to time slots smoothly
                setTimeout(() => {
                    const tc = document.getElementById('time-slots-container');
                    if (tc) tc.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 120);
            });
        }
        grid.appendChild(dayEl);
    }
}
 
function renderTimeSlots(dateStr) {
    const container = document.getElementById('time-slots-container');
    const grid      = document.getElementById('time-slots-grid');
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
                updateProgress();
            });
        }
        grid.appendChild(btn);
    });
}
 
function updateServices() {
    const category     = document.getElementById('service-category').value;
    const serviceSelect = document.getElementById('service-type');
    serviceSelect.innerHTML = '<option value="">Select a service</option>';
 
    if (category && serviceData[category]) {
        serviceData[category].forEach((service, i) => {
            const option = document.createElement('option');
            option.value       = i;
            option.textContent = `${service.name} — ${service.price}`;
            serviceSelect.appendChild(option);
        });
    }
    updateSummary();
    updateProgress();
 
    // Scroll to service dropdown after populating
    setTimeout(() => {
        const st = document.getElementById('service-type');
        if (st) st.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
}
 
function updateSummary() {
    const name         = document.getElementById('client-name').value.trim();
    const phone        = document.getElementById('client-phone').value.trim();
    const category     = document.getElementById('service-category').value;
    const serviceIndex = document.getElementById('service-type').value;
 
    document.getElementById('sum-name').textContent  = name  || '—';
    document.getElementById('sum-phone').textContent = phone || '—';
 
    if (category && serviceIndex !== '') {
        const service = serviceData[category][serviceIndex];
        document.getElementById('sum-service').textContent = service.name;
        document.getElementById('sum-price').textContent   = service.price;
    } else {
        document.getElementById('sum-service').textContent = '—';
        document.getElementById('sum-price').textContent   = '—';
    }
 
    document.getElementById('sum-date').textContent = selectedDateDisplay || '—';
 
    if (selectedTime) {
        const slot = allTimeSlots.find(s => s.value === selectedTime);
        document.getElementById('sum-time').textContent = slot ? slot.label : '—';
    } else {
        document.getElementById('sum-time').textContent = '—';
    }
 
    updateProgress();
}
 
async function sendConfirmationEmail(booking, timeLabel, cancelURL) {
    if (!booking.email || booking.email.trim() === '') return;
    try {
        await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            {
                to_name    : booking.name,
                to_email   : booking.email.trim(),
                service    : booking.service,
                date       : booking.date,
                time       : timeLabel,
                price      : booking.price,
                cancel_url : cancelURL || 'Contact us to cancel'
            },
            EMAILJS_PUBLIC_KEY
        );
    } catch (err) {
        console.warn('Could not send confirmation email:', err);
    }
}
 
async function addBooking() {
    const name         = document.getElementById('client-name').value.trim();
    const phone        = document.getElementById('client-phone').value.trim();
    const email        = document.getElementById('client-email').value.trim();
    const category     = document.getElementById('service-category').value;
    const serviceIndex = document.getElementById('service-type').value;
    const notes        = document.getElementById('appt-notes').value.trim();
 
    if (!name || !phone || !category || serviceIndex === '' || !selectedDate || !selectedTime) {
        alert('Please fill in all required fields and select a date and time slot.');
        return;
    }
 
    const service = serviceData[category][serviceIndex];
    const slot    = allTimeSlots.find(s => s.value === selectedTime);
 
    const newBooking = {
        name, phone, email,
        service : service.name,
        price   : service.price,
        duration: service.duration,
        date    : selectedDate,
        time    : selectedTime,
        notes
    };
 
    // Disable button during request
    const bookBtn = document.getElementById('book-btn');
    bookBtn.disabled    = true;
    bookBtn.textContent = 'Booking...';
 
    let saved;
    try {
        const response = await fetch(API_URL, {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify(newBooking)
        });
 
        if (response.status === 409) {
            alert('Sorry, that time slot was just booked by someone else. Please pick another.');
            await buildCalendar(currentMonth, currentYear);
            bookBtn.disabled    = false;
            bookBtn.textContent = '✨ Confirm Booking';
            return;
        }
 
        if (!response.ok) {
            const errData = await response.json();
            alert('Booking failed: ' + (errData.error || 'Unknown error'));
            bookBtn.disabled    = false;
            bookBtn.textContent = '✨ Confirm Booking';
            return;
        }
 
        saved = await response.json();
    } catch (err) {
        console.error(err);
        alert('Could not reach the server. Make sure the backend is running.');
        bookBtn.disabled    = false;
        bookBtn.textContent = '✨ Confirm Booking';
        return;
    }
 
    const cancelURL = saved.cancelToken
        ? SITE_URL + '/cancel.html?token=' + saved.cancelToken
        : null;
 
    // Send email confirmation
    sendConfirmationEmail(saved, slot.label, cancelURL);
 
    // WhatsApp to owner
    const ownerPhone   = '254790549541';
    const ownerMessage =
        '🌸 *New Booking — Sera Glam Studio* 🌸\n\n' +
        '👤 *Client:* '  + saved.name                      + '\n' +
        '📞 *Phone:* '   + saved.phone                     + '\n' +
        '✉️ *Email:* '   + (saved.email || 'Not provided') + '\n\n' +
        '💅 *Service:* ' + saved.service                   + '\n' +
        '💰 *Price:* '   + saved.price                     + '\n' +
        '⏱ *Duration:* ' + saved.duration                  + '\n\n' +
        '📅 *Date:* '    + selectedDateDisplay             + '\n' +
        '🕐 *Time:* '    + slot.label                      + '\n\n' +
        '📝 *Notes:* '   + (saved.notes || 'None');
 
    window.open(
        'https://wa.me/' + ownerPhone + '?text=' + encodeURIComponent(ownerMessage),
        '_blank'
    );
 
    // WhatsApp to client
    const rawPhone    = saved.phone.replace(/\s/g, '');
    const clientPhone = rawPhone.startsWith('0') ? '254' + rawPhone.slice(1)
                      : rawPhone.startsWith('+') ? rawPhone.slice(1)
                      : rawPhone;
 
    const clientMessage =
        '✨ *Booking Confirmed — Sera Glam Studio* ✨\n\n' +
        'Hi ' + saved.name + '! Your appointment has been booked.\n\n' +
        '💅 *Service:* ' + saved.service      + '\n' +
        '📅 *Date:* '    + selectedDateDisplay + '\n' +
        '🕐 *Time:* '    + slot.label          + '\n' +
        '💰 *Price:* '   + saved.price         + '\n\n' +
        (cancelURL ? 'Need to cancel? Use this link:\n' + cancelURL + '\n\n' : '') +
        'See you soon! ✦ Sera Glam Studio';
 
    window.open(
        'https://wa.me/' + clientPhone + '?text=' + encodeURIComponent(clientMessage),
        '_blank'
    );
 
    // Redirect to confirmation page
    const confirmParams = new URLSearchParams({
        name    : saved.name,
        service : saved.service,
        date    : saved.date,
        time    : slot.label,
        price   : saved.price,
        token   : saved.cancelToken || ''
    });
    window.location.href = 'booking-confirmed.html?' + confirmParams.toString();
}
 
async function deleteBooking(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!response.ok) { console.error('Could not cancel booking', id); return; }
        await buildCalendar(currentMonth, currentYear);
    } catch (err) { console.error(err); }
}
 
document.addEventListener('DOMContentLoaded', async function () {
    await buildCalendar(currentMonth, currentYear);
 
    const params   = new URLSearchParams(window.location.search);
    const category = params.get('category');
    const service  = params.get('service');
 
    if (category && serviceData[category]) {
        const catSelect = document.getElementById('service-category');
        if (catSelect) {
            catSelect.value = category;
            updateServices();
            if (service !== null) {
                const svcSelect = document.getElementById('service-type');
                setTimeout(() => {
                    if (svcSelect) { svcSelect.value = service; updateSummary(); }
                }, 50);
            }
        }
    }
 
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