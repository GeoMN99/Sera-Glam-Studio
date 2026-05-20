// Load bookings from local storage or start empty
let bookings = JSON.parse(localStorage.getItem('bookings')) || [];

// Calendar State
let currentMonth =new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = null;
let selectedTime = null;

//All time slots
const allTimeSlots = [
    { value:'08:00', label: '8:00 AM' },
    { value:'09:00', label: '9:00 AM' },
    { value:'10:00', label: '10:00 AM' },
    { value:'11:00', label: '11:00 AM' },
    { value:'12:00', label: '12:00 PM' },
    { value:'13:00', label: '1:00 PM' },
    { value:'14:00', label: '2:00 PM' },
    { value:'15:00', label: '3:00 PM' },
    { value:'16:00', label: '4:00 PM' },
    { value:'17:00', label: '5:00 PM' },
];

// Service Data
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

// Build Calendar
function buildCalendar(month, year) {
    const grid = document.getElementById('calendar-grid');
    const monthYearLabel = document.getElementById('calendar-month-year');
    grid.innerHTML = '';

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    monthYearLabel.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.classList.add('cal-day', 'empty');
        grid.appendChild(empty);
    }

    // Day Cell
    for (let day = 1; day <= totalDays; day++) {
        const dayEl = document.createElement('div');
        dayEl.classList.add('cal-day');
        dayEl.textContent = day;

        const thisDate = new Date(year, month, day);
        thisDate.setHours(0, 0, 0, 0);

        if (thisDate < today) {
            dayEl.classList.add('past');
        } else {
            const dateStr = thisDate.toLocaleDateString('en-KE');
            const hasBookings = bookings.some(b => b.rawDate === dateStr);
            if (hasBookings) dayEl.classList.add('has-bookings');

            if (thisDate.getTime() === today.getTime()) {
                dayEl.classList.add('today');
            }

            if (selectedDate === dateStr) {
                dayEl.classList.add('selected');
            }

            dayEl.addEventListener('click', function() {
                document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('selected'));

                this.classList.add('selected');

                selectedDate = dateStr;
                selectedTime = null;

                document.getElementById('appt-date').value = selectedDate;
                document.getElementById('appt-time').value = '';

                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

                document.getElementById('selected-date-label').textContent = 'Selected' + thisDate.toLocaleDateString('en-KE', options);

                renderTimeSlots(selectedDate);
                updateSummary();
            });
        }

        grid.appendChild(dayEl);
    }
}

// Render Time Slots
function renderTimeSlots(dateStr) {
    const container = document.getElementById('time-slots-container');
    const grid =document.getElementById('time-slots-grid');
    container.style.display = 'block';
    grid.innerHTML = '';

    const bookedTimes = bookings
    .filter(b => b.rawDate === dateStr)
    .map(b => b.rawTime);

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
            btn.addEventListener('click', function() {
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

// Update Service Dropdown
function updateServices() {
    const category = document.getElementById('service-category').value;
    const serviceSelect = document.getElementById('service-type');
    serviceSelect.innerHTML = '<option value="">Select a service</option>';

    if (category && serviceData[category]) {
        serviceData[category].forEach((service, i) => {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = service.name + ' — ' + service.price;
            serviceSelect.appendChild(option);
        });
    }

    updateSummary();
}

// Update Booking Summary
function updateSummary() {
    const name = document.getElementById('client-name').value.trim();
    const phone = document.getElementById('client-phone').value.trim();
    const category = document.getElementById('service-category').value;
    const serviceIndex = document.getElementById('service-type').value;

    document.getElementById('sum-name').textContent = name || '—';
    document.getElementById('sum-phone').textContent = phone || '—';

    if (category && serviceIndex !== '') {
        const service =serviceData[category][serviceIndex];
        document.getElementById('sum-service').textContent = service.name;
        document.getElementById('sum-price').textContent = service.price;
    } else {
       document.getElementById('sum-service').textContent = '—';
       document.getElementById('sum-price').textContent = '—'; 
    }

    document.getElementById('sum-date').textContent = selectedDate || '—';

    if (selectedTime) {
        const slot = allTimeSlots.find(s => s.value === selectedTime);
        document.getElementById('sum-time').textContent = slot ? slot.label : '—';
    } else {
        document.getElementById('sum-time').textContent = '—';
    }
}

// Show Success Message
function showSuccess(message) {
    const msg = document.createElement('div');
    msg.classList.add('success-message');
    msg.textContent = message;
    document.body.appendChild(msg);
    setTimeout(function() { msg.classList.add('fade-out'); }, 2000);
    setTimeout(function() { msg.remove(); }, 2500);
}

// Add Booking
function addBooking() {
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

    const booking = {
        name,          // ADD THIS LINE
        phone,         // ADD THIS LINE
        email,         // ADD THIS LINE
        service: service.name,
        price: service.price,
        duration: service.duration,
        date: selectedDate,
        rawDate: selectedDate,
        time: slot.label,
        rawTime: selectedTime,
        notes,
        bookedOn: new Date().toLocaleDateString()
    };

    bookings.push(booking);
    localStorage.setItem('bookings', JSON.stringify(bookings));

    renderBookings();
    buildCalendar(currentMonth, currentYear);
    showSuccess('✨ Booking confirmed! We will contact you shortly.');

    // WhatsApp Notification To Owner
    const ownerPhone = '254113557894'; // Owner's number - change if needed

    const message =
    '🌸 *New Booking — Sera Glam Studio* 🌸' + '\n\n' +
    '👤 *Client:* ' + name + '\n' +
    '📞 *Phone:* ' + phone + '\n' +
    '✉️ *Email:* ' + (email || 'Not provided') + '\n\n' +
    '💅 *Service:* ' + service.name + '\n' +
    '💰 *Price:* ' + service.price + '\n' +
    '⏱ *Duration:* ' + service.duration + '\n\n' +
    '📅 *Date:* ' + selectedDate + '\n' +
    '🕐 *Time:* ' + slot.label + '\n\n' +
    '📝 *Notes:* ' + (notes || 'None') + '\n\n' +
    '✦ Booked on: ' + new Date().toLocaleDateString();

    const whatsappURL = 'https://wa.me/' + ownerPhone + '?text=' + encodeURIComponent(message);
    window.open(whatsappURL, '_blank');

    //Reset Form
    document.getElementById('client-name').value = '';
    document.getElementById('client-phone').value = '';
    document.getElementById('client-email').value = '';
    document.getElementById('service-category').value = '';
    document.getElementById('service-type').innerHTML = '<option value="">Select a service first</option>';
    document.getElementById('appt-notes').value = '';
    document.getElementById('appt-date').value = '';
    document.getElementById('appt-time').value = '';

    selectedDate = null;
    selectedTime = null;
    document.getElementById('selected-date-label').textContent = 'Select a date to see availabile slots';
    document.getElementById('time-slots-container').style.display = 'none';

    updateSummary();
}

// Delete Booking
function deleteBooking(index) {
    bookings.splice(index, 1);
    localStorage.setItem('bookings', JSON.stringify(bookings));
    renderBookings();
    buildCalendar(currentMonth, currentYear);
}

// Clear all Bookings
function clearAllBookings() {
    if (confirm('Are you sure you want to clear all bookings? This cannot be undone.')) {
        bookings = [];
        localStorage.removeItem('bookings');
        renderBookings();
        buildCalendar(currentMonth, currentYear);
    }
}

// Render Bookings List
function renderBookings() {
    const list = document.getElementById('bookings-list');
    const clearWrap = document.getElementById('clear-wrap');
    list.innerHTML = '';

    if (bookings.length === 0) {
        list.innerHTML = '<li style="color:#9B59D6; text-align:center; padding:30px; border:none; background:transparent;">No bookings yet. Book your first appointment above!</li>';
        clearWrap.style.display = 'none';
        return;
    }

    clearWrap.style.display = 'block';

    bookings.forEach((b, i) => {
        const li = document.createElement('li');
        li.innerHTML =
            '<div class="booking-info">' +
                '<strong>' + b.service + '</strong>' +
                '<br/>' +
                '<span>' + b.name + ' · ' + b.phone + '</span>' +
                '<br/>' +
                '<span>' + b.date + ' at ' + b.time + '</span>' +
                '<br/>' +
                '<span style="color:#9B59D6;">' + b.price + ' · ' + b.duration + '</span>' +
            '</div>' +
            '<button class="btn-danger" data-index="' + i + '" style="font-size:0.75rem; padding:8px 14px;">Cancel</button>';
        list.appendChild(li);
    });

    document.querySelectorAll('#bookings-list .btn-danger').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteBooking(parseInt(this.getAttribute('data-index')));
        });
    });
}

//Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    buildCalendar(currentMonth, currentYear);

    document.getElementById('prev-month').addEventListener('click', function() {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        buildCalendar(currentMonth, currentYear);
    });

    document.getElementById('next-month').addEventListener('click', function() {
        currentMonth++;
        if (currentMonth > 11) { currentMonth =0; currentYear++; }
        buildCalendar(currentMonth, currentYear);
    });

    document.getElementById('book-btn').addEventListener('click', addBooking);
    document.getElementById('clear-bookings-btn').addEventListener('click', clearAllBookings);
    document.getElementById('client-name').addEventListener('input', updateSummary);
    document.getElementById('client-phone').addEventListener('input', updateSummary);
    document.getElementById('service-category').addEventListener('change', updateServices);
    document.getElementById('service-type').addEventListener('change', updateSummary);
 
    renderBookings();
});