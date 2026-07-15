const ADMIN_API     = 'https://sera-glam-backend.onrender.com/api/admin/bookings';
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
        document.getElementById('admin-login').style.display     = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        document.getElementById('admin-error').style.display     = 'none';

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
        li.style.flexDirection = 'column';
        li.style.alignItems    = 'flex-start';
        li.style.gap           = '14px';

        li.innerHTML =
            // ── Top row: booking info + action buttons ──
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;width:100%;gap:12px;">' +
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
                '<div style="display:flex;flex-direction:column;gap:8px;min-width:120px;">' +
                    '<button class="btn-outline reschedule-btn" data-id="' + b.id + '" style="font-size:0.75rem;padding:8px 14px;">📅 Reschedule</button>' +
                    '<button class="btn-danger cancel-btn"     data-id="' + b.id + '" style="white-space:nowrap;font-size:0.75rem;padding:8px 14px;">✕ Cancel</button>' +
                '</div>' +
            '</div>' +

            // ── Inline reschedule form (hidden by default) ──
            '<div class="reschedule-form" id="rs-' + b.id + '" style="display:none;width:100%;">' +
                '<p style="font-size:0.82rem;color:var(--grey);margin-bottom:10px;letter-spacing:1px;text-transform:uppercase;">New date & time</p>' +
                '<div style="display:flex;gap:12px;flex-wrap:wrap;">' +
                    '<input type="date" class="rs-date" style="padding:10px 14px;border:1px solid var(--grey-light);border-radius:2px;font-family:Jost,sans-serif;font-size:0.9rem;background:var(--white);color:var(--black);outline:none;" />' +
                    '<select class="rs-time" style="padding:10px 14px;border:1px solid var(--grey-light);border-radius:2px;font-family:Jost,sans-serif;font-size:0.9rem;background:var(--white);color:var(--black);outline:none;">' +
                        '<option value="">Select time</option>' +
                        allTimeSlots.map(s => '<option value="' + s.value + '">' + s.label + '</option>').join('') +
                    '</select>' +
                    '<button class="btn-primary rs-confirm" data-id="' + b.id + '" style="font-size:0.82rem;padding:10px 20px;">Confirm</button>' +
                    '<button class="btn-outline rs-cancel-form" style="font-size:0.82rem;padding:10px 20px;">Cancel</button>' +
                '</div>' +
                '<p class="rs-feedback" style="font-size:0.82rem;margin-top:8px;min-height:18px;"></p>' +
            '</div>';

        list.appendChild(li);
    });

    // ── Reschedule toggle buttons ──
    document.querySelectorAll('#admin-bookings-list .reschedule-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const id   = this.getAttribute('data-id');
            const form = document.getElementById('rs-' + id);
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
        });
    });

    // ── Cancel buttons ──
    document.querySelectorAll('#admin-bookings-list .cancel-btn').forEach(btn => {
        btn.addEventListener('click', async function () {
            await adminCancelBooking(parseInt(this.getAttribute('data-id')));
        });
    });

    // ── Reschedule confirm buttons ──
    document.querySelectorAll('#admin-bookings-list .rs-confirm').forEach(btn => {
        btn.addEventListener('click', async function () {
            const id       = this.getAttribute('data-id');
            const form     = document.getElementById('rs-' + id);
            const newDate  = form.querySelector('.rs-date').value;
            const newTime  = form.querySelector('.rs-time').value;
            const feedback = form.querySelector('.rs-feedback');

            feedback.textContent = '';
            feedback.style.color = 'var(--grey)';

            if (!newDate || !newTime) {
                feedback.textContent = 'Please select both a date and a time.';
                feedback.style.color = '#cc0000';
                return;
            }

            this.disabled    = true;
            this.textContent = 'Saving...';

            try {
                const res = await fetch(
                    `${ADMIN_API}/${id}/reschedule`,
                    {
                        method  : 'PATCH',
                        headers : {
                            'Content-Type'     : 'application/json',
                            'x-admin-password' : adminPassword
                        },
                        body: JSON.stringify({ date: newDate, time: newTime })
                    }
                );

                if (res.status === 409) {
                    feedback.textContent = 'That slot is already booked. Please choose another.';
                    feedback.style.color = '#cc0000';
                    this.disabled    = false;
                    this.textContent = 'Confirm';
                    return;
                }

                if (!res.ok) {
                    feedback.textContent = 'Could not reschedule. Please try again.';
                    feedback.style.color = '#cc0000';
                    this.disabled    = false;
                    this.textContent = 'Confirm';
                    return;
                }

                // Refresh the full list so the updated date/time shows
                await fetchAdminBookings();

            } catch (err) {
                console.error(err);
                feedback.textContent = 'Could not reach the server.';
                feedback.style.color = '#cc0000';
                this.disabled    = false;
                this.textContent = 'Confirm';
            }
        });
    });

    // ── Reschedule cancel-form buttons ──
    document.querySelectorAll('#admin-bookings-list .rs-cancel-form').forEach(btn => {
        btn.addEventListener('click', function () {
            const form = this.closest('.reschedule-form');
            if (form) form.style.display = 'none';
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
                'Content-Type'     : 'application/json',
                'x-admin-password' : adminPassword
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

        adminPassword = newInput;
        feedback.textContent = '✅ Password changed successfully.';
        feedback.style.color = '#39a845';

        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value     = '';
        document.getElementById('confirm-password').value = '';

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

    document.getElementById('admin-login-btn').addEventListener('click', adminLogin);
    document.getElementById('admin-password-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') adminLogin();
    });

    document.getElementById('admin-refresh-btn').addEventListener('click', fetchAdminBookings);
    document.getElementById('admin-clear-all-btn').addEventListener('click', adminClearAll);
    document.getElementById('admin-logout-btn').addEventListener('click', adminLogout);

    document.getElementById('admin-change-pw-btn').addEventListener('click', function () {
        const section  = document.getElementById('pw-change-section');
        const isHidden = section.style.display === 'none' || section.style.display === '';
        section.style.display = isHidden ? 'block' : 'none';
        if (isHidden) document.getElementById('current-password').focus();
    });

    document.getElementById('pw-submit-btn').addEventListener('click', changePassword);

    document.getElementById('confirm-password').addEventListener('keydown', e => {
        if (e.key === 'Enter') changePassword();
    });

    document.getElementById('pw-cancel-btn').addEventListener('click', () => {
        document.getElementById('pw-change-section').style.display = 'none';
        document.getElementById('current-password').value  = '';
        document.getElementById('new-password').value      = '';
        document.getElementById('confirm-password').value  = '';
        document.getElementById('pw-feedback').textContent = '';
    });
});