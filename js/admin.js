const ADMIN_API = 'https://sera-glam-backend.onrender.com/api/admin/bookings';

// Password is stored in memory only — never localStorage.
// Closing the tab clears it automatically.
let adminPassword = null;

// ===== ALL TIME SLOTS (for converting raw "HH:MM" to readable label) =====
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

// ===== LOGIN =====
async function adminLogin() {
    const input = document.getElementById('admin-password-input').value.trim();
    if (!input) return;

    // Test the password against the server before showing the dashboard
    try {
        const response = await fetch(ADMIN_API, {
            headers: { 'x-admin-password': input }
        });

        if (response.status === 401) {
            document.getElementById('admin-error').style.display = 'block';
            document.getElementById('admin-password-input').value = '';
            return;
        }

        // Password accepted — store it and show dashboard
        adminPassword = input;
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        document.getElementById('admin-error').style.display = 'none';

        const bookings = await response.json();
        renderAdminBookings(bookings);

    } catch (err) {
        console.error(err);
        alert('Could not reach the server. Make sure the backend is running.');
    }
}

// ===== FETCH AND REFRESH BOOKINGS =====
async function fetchAdminBookings() {
    try {
        const response = await fetch(ADMIN_API, {
            headers: { 'x-admin-password': adminPassword }
        });

        if (response.status === 401) {
            alert('Session expired. Please log in again.');
            adminLogout();
            return;
        }

        const bookings = await response.json();
        renderAdminBookings(bookings);

    } catch (err) {
        console.error(err);
        alert('Could not reach the server.');
    }
}

// ===== RENDER BOOKINGS LIST =====
function renderAdminBookings(bookings) {
    const list = document.getElementById('admin-bookings-list');
    const count = document.getElementById('admin-booking-count');
    list.innerHTML = '';

    if (bookings.length === 0) {
        count.textContent = 'No bookings yet.';
        list.innerHTML = '<li style="color:var(--grey); text-align:center; padding:40px; border:none; background:transparent;">No bookings to display.</li>';
        return;
    }

    count.textContent = `${bookings.length} booking${bookings.length !== 1 ? 's' : ''} total`;

    bookings.forEach(b => {
        const slot = allTimeSlots.find(s => s.value === b.time);
        const timeLabel = slot ? slot.label : b.time;

        const li = document.createElement('li');
        li.innerHTML =
            '<div class="admin-booking-info">' +
                '<strong>' + b.service + '</strong>' +
                '<span>👤 ' + b.name + '</span>' +
                '<span>📞 ' + b.phone + '</span>' +
                '<span>✉️ ' + (b.email || 'No email provided') + '</span>' +
                '<span>📅 ' + b.date + ' at ' + timeLabel + '</span>' +
                '<span class="admin-highlight">💰 ' + b.price + ' · ' + b.duration + '</span>' +
                (b.notes ? '<span>📝 ' + b.notes + '</span>' : '') +
                '<span style="color:var(--grey); font-size:0.78rem;">Booked: ' + new Date(b.bookedOn).toLocaleString() + '</span>' +
            '</div>' +
            '<button class="btn-danger" data-id="' + b.id + '" style="white-space:nowrap; font-size:0.75rem; padding:8px 14px;">Cancel</button>';

        list.appendChild(li);
    });

    // Cancel button event listeners
    document.querySelectorAll('#admin-bookings-list .btn-danger').forEach(btn => {
        btn.addEventListener('click', async function () {
            const id = parseInt(this.getAttribute('data-id'));
            await adminCancelBooking(id);
        });
    });
}

// ===== CANCEL A BOOKING =====
async function adminCancelBooking(id) {
    if (!confirm('Cancel this booking? This cannot be undone.')) return;

    try {
        const response = await fetch(`${ADMIN_API}/${id}`, {
            method: 'DELETE',
            headers: { 'x-admin-password': adminPassword }
        });

        if (!response.ok) {
            alert('Could not cancel booking. It may have already been removed.');
            return;
        }

        await fetchAdminBookings();

    } catch (err) {
        console.error(err);
        alert('Could not reach the server.');
    }
}

// ===== CLEAR ALL BOOKINGS =====
async function adminClearAll() {
    if (!confirm('Are you sure you want to clear ALL bookings? This cannot be undone.')) return;

    try {
        const response = await fetch(ADMIN_API, {
            method: 'DELETE',
            headers: { 'x-admin-password': adminPassword }
        });

        const result = await response.json();
        await fetchAdminBookings();
        alert(`✅ ${result.count} booking(s) cleared.`);

    } catch (err) {
        console.error(err);
        alert('Could not reach the server.');
    }
}

// ===== LOGOUT =====
function adminLogout() {
    adminPassword = null;
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('admin-login').style.display = 'flex';
    document.getElementById('admin-password-input').value = '';
    document.getElementById('admin-bookings-list').innerHTML = '';
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('admin-login-btn').addEventListener('click', adminLogin);

    // Allow pressing Enter in the password field to log in
    document.getElementById('admin-password-input').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') adminLogin();
    });

    document.getElementById('admin-refresh-btn').addEventListener('click', fetchAdminBookings);
    document.getElementById('admin-clear-all-btn').addEventListener('click', adminClearAll);
    document.getElementById('admin-logout-btn').addEventListener('click', adminLogout);
});