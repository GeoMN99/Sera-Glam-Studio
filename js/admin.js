const ADMIN_API = 'https://sera-glam-backend.onrender.com/api/admin/bookings';
const CHANGE_PW_API = 'https://sera-glam-backend.onrender.com/api/admin/change-password';

// Password stored in memory only — clears when tab closes
let adminPassword = null;

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

    try {
        const response = await fetch(ADMIN_API, {
            headers: { 'x-admin-password': input }
        });

        if (response.status === 401) {
            document.getElementById('admin-error').style.display = 'block';
            document.getElementById('admin-password-input').value = '';
            return;
        }

        adminPassword = input;
        document.getElementById('admin-login').style.display    = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        document.getElementById('admin-error').style.display    = 'none';

        const bookings = await response.json();
        renderAdminBookings(bookings);

    } catch (err) {
        console.error(err);
        alert('Could not reach the server. Make sure the backend is running.');
    }
}

// ===== FETCH AND REFRESH =====
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

// ===== RENDER BOOKINGS =====
function renderAdminBookings(bookings) {
    const list  = document.getElementById('admin-bookings-list');
    const count = document.getElementById('admin-booking-count');
    list.innerHTML = '';

    if (bookings.length === 0) {
        count.textContent = 'No bookings yet.';
        list.innerHTML = '<li style="color:var(--grey);text-align:center;padding:40px;border:none;background:transparent;">No bookings to display.</li>';
        return;
    }

    count.textContent = `${bookings.length} booking${bookings.length !== 1 ? 's' : ''} total`;

    bookings.forEach(b => {
        const slot      = allTimeSlots.find(s => s.value === b.time);
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
                '<span style="color:var(--grey);font-size:0.78rem;">Booked: ' + new Date(b.bookedOn).toLocaleString() + '</span>' +
            '</div>' +
            '<button class="btn-danger" data-id="' + b.id + '" style="white-space:nowrap;font-size:0.75rem;padding:8px 14px;">Cancel</button>';

        list.appendChild(li);
    });

    document.querySelectorAll('#admin-bookings-list .btn-danger').forEach(btn => {
        btn.addEventListener('click', async function () {
            await adminCancelBooking(parseInt(this.getAttribute('data-id')));
        });
    });
}

// ===== CANCEL A BOOKING =====
async function adminCancelBooking(id) {
    if (!confirm('Cancel this booking? This cannot be undone.')) return;

    try {
        const response = await fetch(`${ADMIN_API}/${id}`, {
            method : 'DELETE',
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

// ===== CLEAR ALL =====
async function adminClearAll() {
    if (!confirm('Are you sure you want to clear ALL bookings? This cannot be undone.')) return;

    try {
        const response = await fetch(ADMIN_API, {
            method : 'DELETE',
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

// ===== CHANGE PASSWORD =====
async function changePassword() {
    const currentInput = document.getElementById('current-password').value.trim();
    const newInput     = document.getElementById('new-password').value.trim();
    const confirmInput = document.getElementById('confirm-password').value.trim();
    const feedback     = document.getElementById('pw-feedback');

    feedback.textContent = '';
    feedback.style.color = 'var(--grey)';

    // Client-side validation
    if (!currentInput || !newInput || !confirmInput) {
        feedback.textContent = '❌ Please fill in all three fields.';
        feedback.style.color = '#cc0000';
        return;
    }

    if (currentInput !== adminPassword) {
        feedback.textContent = '❌ Current password is incorrect.';
        feedback.style.color = '#cc0000';
        return;
    }

    if (newInput.length < 6) {
        feedback.textContent = '❌ New password must be at least 6 characters.';
        feedback.style.color = '#cc0000';
        return;
    }

    if (newInput !== confirmInput) {
        feedback.textContent = '❌ New passwords do not match.';
        feedback.style.color = '#cc0000';
        return;
    }

    if (newInput === currentInput) {
        feedback.textContent = '❌ New password must be different from the current one.';
        feedback.style.color = '#cc0000';
        return;
    }

    try {
        const response = await fetch(CHANGE_PW_API, {
            method  : 'POST',
            headers : {
                'Content-Type'      : 'application/json',
                'x-admin-password'  : adminPassword
            },
            body: JSON.stringify({ newPassword: newInput })
        });

        if (response.status === 401) {
            feedback.textContent = '❌ Current password rejected by server.';
            feedback.style.color = '#cc0000';
            return;
        }

        if (!response.ok) {
            const err = await response.json();
            feedback.textContent = '❌ ' + (err.error || 'Unknown error.');
            feedback.style.color = '#cc0000';
            return;
        }

        // Update in-memory password so the session stays valid
        adminPassword = newInput;

        feedback.textContent = '✅ Password changed successfully.';
        feedback.style.color = '#39a845';

        // Clear the fields
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value     = '';
        document.getElementById('confirm-password').value = '';

        // Collapse the form after 2 seconds
        setTimeout(() => {
            document.getElementById('pw-change-section').style.display = 'none';
            feedback.textContent = '';
        }, 2000);

    } catch (err) {
        console.error(err);
        feedback.textContent = '❌ Could not reach the server.';
        feedback.style.color = '#cc0000';
    }
}

// ===== LOGOUT =====
function adminLogout() {
    adminPassword = null;
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('admin-login').style.display     = 'flex';
    document.getElementById('admin-password-input').value    = '';
    document.getElementById('admin-bookings-list').innerHTML = '';
    document.getElementById('pw-change-section').style.display = 'none';
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', function () {

    // Login
    document.getElementById('admin-login-btn').addEventListener('click', adminLogin);
    document.getElementById('admin-password-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') adminLogin();
    });

    // Dashboard toolbar
    document.getElementById('admin-refresh-btn').addEventListener('click', fetchAdminBookings);
    document.getElementById('admin-clear-all-btn').addEventListener('click', adminClearAll);
    document.getElementById('admin-logout-btn').addEventListener('click', adminLogout);

    // Toggle password change form
    document.getElementById('admin-change-pw-btn').addEventListener('click', function () {
        const section = document.getElementById('pw-change-section');
        const isHidden = section.style.display === 'none' || section.style.display === '';
        section.style.display = isHidden ? 'block' : 'none';
        if (isHidden) document.getElementById('current-password').focus();
    });

    // Submit password change
    document.getElementById('pw-submit-btn').addEventListener('click', changePassword);

    // Allow Enter on confirm field to submit
    document.getElementById('confirm-password').addEventListener('keydown', e => {
        if (e.key === 'Enter') changePassword();
    });

    // Cancel / hide the form
    document.getElementById('pw-cancel-btn').addEventListener('click', () => {
        document.getElementById('pw-change-section').style.display = 'none';
        document.getElementById('current-password').value  = '';
        document.getElementById('new-password').value      = '';
        document.getElementById('confirm-password').value  = '';
        document.getElementById('pw-feedback').textContent = '';
    });
});