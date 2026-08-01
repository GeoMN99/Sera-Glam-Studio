const ADMIN_API     = 'https://sera-glam-backend.onrender.com/api/admin/bookings';
const CHANGE_PW_API = 'https://sera-glam-backend.onrender.com/api/admin/change-password';
const SITE_URL      = 'https://seraglamstudio.netlify.app';
const OWNER_PHONE   = '254790549541';

let adminPassword = null;
let allBookings   = [];       // full list from server
let activeTab     = 'upcoming'; // 'upcoming' or 'past'
let searchQuery   = '';

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

function timeLabel(raw) {
    const s = allTimeSlots.find(s => s.value === raw);
    return s ? s.label : raw;
}

function toISODate(date) {
    return date.toISOString().split('T')[0];
}

function isUpcoming(b) {
    const today = toISODate(new Date());
    return b.date > today || (b.date === today);
}

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

        allBookings = await response.json();
        renderAdminBookings();

    } catch (err) {
        console.error(err);
        alert('Could not reach the server. Make sure the backend is running.');
    }
}

// ===== FETCH =====
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

        allBookings = await response.json();
        renderAdminBookings();

    } catch (err) {
        console.error(err);
        alert('Could not reach the server.');
    }
}

// ===== FILTER + SEARCH =====
function getFilteredBookings() {
    let filtered = activeTab === 'upcoming'
        ? allBookings.filter(isUpcoming)
        : allBookings.filter(b => !isUpcoming(b));

    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(b =>
            b.name.toLowerCase().includes(q)    ||
            b.phone.toLowerCase().includes(q)   ||
            b.service.toLowerCase().includes(q) ||
            b.date.includes(q)
        );
    }

    // Sort upcoming ascending, past descending
    filtered.sort((a, b) => activeTab === 'upcoming'
        ? a.date.localeCompare(b.date) || a.time.localeCompare(b.time)
        : b.date.localeCompare(a.date) || b.time.localeCompare(a.time)
    );

    return filtered;
}

// ===== RENDER =====
function renderAdminBookings() {
    const list     = document.getElementById('admin-bookings-list');
    const count    = document.getElementById('admin-booking-count');
    const upcoming = allBookings.filter(isUpcoming).length;
    const past     = allBookings.length - upcoming;

    // Update tab labels with counts
    document.getElementById('tab-upcoming').textContent = `Upcoming (${upcoming})`;
    document.getElementById('tab-past').textContent     = `Past (${past})`;

    const filtered = getFilteredBookings();
    list.innerHTML = '';

    if (filtered.length === 0) {
        count.textContent = 'No bookings found.';
        list.innerHTML = '<li style="color:var(--grey);text-align:center;padding:40px;border:none;background:transparent;">' +
            (searchQuery ? 'No bookings match your search.' : 'No bookings in this tab.') +
            '</li>';
        return;
    }

    count.textContent = `${filtered.length} booking${filtered.length !== 1 ? 's' : ''}`;

    filtered.forEach(b => {
        const tLabel  = timeLabel(b.time);
        const isPast  = !isUpcoming(b);

        const li = document.createElement('li');
        li.style.flexDirection = 'column';
        li.style.alignItems    = 'flex-start';
        li.style.gap           = '14px';
        if (isPast) li.style.opacity = '0.72';

        li.innerHTML =
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;width:100%;gap:12px;">' +
                '<div class="admin-booking-info">' +
                    '<strong>' + b.service + '</strong>' +
                    '<span>👤 ' + b.name + '</span>' +
                    '<span>📞 ' + b.phone + '</span>' +
                    '<span>✉️ ' + (b.email || 'No email') + '</span>' +
                    '<span>📅 ' + b.date + ' at ' + tLabel + '</span>' +
                    '<span class="admin-highlight">💰 ' + b.price + ' · ' + b.duration + '</span>' +
                    (b.notes ? '<span>📝 ' + b.notes + '</span>' : '') +
                    '<span style="color:var(--grey);font-size:0.78rem;">Booked: ' + new Date(b.bookedOn).toLocaleString() + '</span>' +
                '</div>' +
                '<div style="display:flex;flex-direction:column;gap:8px;min-width:130px;">' +
                    (!isPast ? '<button class="btn-outline reschedule-btn" data-id="' + b.id + '" style="font-size:0.75rem;padding:8px 14px;">📅 Reschedule</button>' : '') +
                    (!isPast ? '<button class="btn-outline reminder-btn" data-id="' + b.id + '" style="font-size:0.75rem;padding:8px 14px;">🔔 Remind</button>' : '') +
                    '<button class="btn-danger cancel-btn" data-id="' + b.id + '" style="white-space:nowrap;font-size:0.75rem;padding:8px 14px;">✕ Cancel</button>' +
                '</div>' +
            '</div>' +

            // Reschedule form
            (!isPast ?
            '<div class="reschedule-form" id="rs-' + b.id + '" style="display:none;width:100%;">' +
                '<p style="font-size:0.82rem;color:var(--grey);margin-bottom:10px;letter-spacing:1px;text-transform:uppercase;">New date & time</p>' +
                '<div style="display:flex;gap:12px;flex-wrap:wrap;">' +
                    '<input type="date" class="rs-date" style="padding:10px 14px;border:1px solid var(--grey-light);border-radius:2px;font-family:Jost,sans-serif;font-size:0.9rem;background:var(--white);color:var(--black);outline:none;"/>' +
                    '<select class="rs-time" style="padding:10px 14px;border:1px solid var(--grey-light);border-radius:2px;font-family:Jost,sans-serif;font-size:0.9rem;background:var(--white);color:var(--black);outline:none;">' +
                        '<option value="">Select time</option>' +
                        allTimeSlots.map(s => '<option value="' + s.value + '">' + s.label + '</option>').join('') +
                    '</select>' +
                    '<button class="btn-primary rs-confirm" data-id="' + b.id + '" data-phone="' + b.phone + '" data-name="' + b.name + '" data-service="' + b.service + '" style="font-size:0.82rem;padding:10px 20px;">Confirm</button>' +
                    '<button class="btn-outline rs-cancel-form" style="font-size:0.82rem;padding:10px 20px;">Cancel</button>' +
                '</div>' +
                '<p class="rs-feedback" style="font-size:0.82rem;margin-top:8px;min-height:18px;"></p>' +
            '</div>' : '');

        list.appendChild(li);
    });

    // Wire reschedule toggle
    document.querySelectorAll('#admin-bookings-list .reschedule-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const id   = this.getAttribute('data-id');
            const form = document.getElementById('rs-' + id);
            if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
        });
    });

    // Wire reminder buttons
    document.querySelectorAll('#admin-bookings-list .reminder-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = parseInt(this.getAttribute('data-id'));
            sendReminder(id);
        });
    });

    // Wire cancel buttons
    document.querySelectorAll('#admin-bookings-list .cancel-btn').forEach(btn => {
        btn.addEventListener('click', async function () {
            await adminCancelBooking(parseInt(this.getAttribute('data-id')));
        });
    });

    // Wire reschedule confirm
    document.querySelectorAll('#admin-bookings-list .rs-confirm').forEach(btn => {
        btn.addEventListener('click', async function () {
            const id       = this.getAttribute('data-id');
            const phone    = this.getAttribute('data-phone');
            const name     = this.getAttribute('data-name');
            const service  = this.getAttribute('data-service');
            const form     = document.getElementById('rs-' + id);
            const newDate  = form.querySelector('.rs-date').value;
            const newTime  = form.querySelector('.rs-time').value;
            const feedback = form.querySelector('.rs-feedback');

            feedback.textContent = '';
            if (!newDate || !newTime) {
                feedback.textContent = 'Please select both a date and a time.';
                feedback.style.color = '#cc0000';
                return;
            }

            this.disabled    = true;
            this.textContent = 'Saving...';

            try {
                const res = await fetch(`${ADMIN_API}/${id}/reschedule`, {
                    method  : 'PATCH',
                    headers : {
                        'Content-Type'     : 'application/json',
                        'x-admin-password' : adminPassword
                    },
                    body: JSON.stringify({ date: newDate, time: newTime })
                });

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

                // Send reschedule WhatsApp to client
                sendRescheduleNotification(phone, name, service, newDate, timeLabel(newTime));

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

    // Wire reschedule cancel-form
    document.querySelectorAll('#admin-bookings-list .rs-cancel-form').forEach(btn => {
        btn.addEventListener('click', function () {
            const form = this.closest('.reschedule-form');
            if (form) form.style.display = 'none';
        });
    });
}

// ===== RESCHEDULE NOTIFICATION TO CLIENT =====
function sendRescheduleNotification(phone, name, service, newDate, newTimeLabel) {
    const rawPhone    = phone.replace(/\s/g, '');
    const clientPhone = rawPhone.startsWith('0') ? '254' + rawPhone.slice(1)
                      : rawPhone.startsWith('+') ? rawPhone.slice(1)
                      : rawPhone;

    const message =
        '📅 *Appointment Rescheduled — Sera Glam Studio* 📅\n\n' +
        'Hi ' + name + ', your appointment has been rescheduled.\n\n' +
        '💅 *Service:* ' + service     + '\n' +
        '📅 *New Date:* ' + newDate    + '\n' +
        '🕐 *New Time:* ' + newTimeLabel + '\n\n' +
        'If you have any questions, reply to this message or call us.\n' +
        '✦ Sera Glam Studio';

    window.open(
        'https://wa.me/' + clientPhone + '?text=' + encodeURIComponent(message),
        '_blank'
    );
}

// ===== REMINDER NOTIFICATION TO CLIENT =====
function sendReminder(id) {
    const booking = allBookings.find(b => b.id === id);
    if (!booking) return;

    const rawPhone    = booking.phone.replace(/\s/g, '');
    const clientPhone = rawPhone.startsWith('0') ? '254' + rawPhone.slice(1)
                      : rawPhone.startsWith('+') ? rawPhone.slice(1)
                      : rawPhone;

    const message =
        '✨ *Appointment Reminder — Sera Glam Studio* ✨\n\n' +
        'Hi ' + booking.name + '! Just a reminder about your upcoming appointment.\n\n' +
        '💅 *Service:* ' + booking.service          + '\n' +
        '📅 *Date:* '    + booking.date              + '\n' +
        '🕐 *Time:* '    + timeLabel(booking.time)   + '\n' +
        '💰 *Price:* '   + booking.price             + '\n\n' +
        'Please arrive 10 minutes early.\n' +
        'See you soon! ✦ Sera Glam Studio';

    window.open(
        'https://wa.me/' + clientPhone + '?text=' + encodeURIComponent(message),
        '_blank'
    );
}

// ===== CANCEL =====
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
        feedback.style.color = '#cc0000'; return;
    }
    if (currentInput !== adminPassword) {
        feedback.textContent = '❌ Current password is incorrect.';
        feedback.style.color = '#cc0000'; return;
    }
    if (newInput.length < 6) {
        feedback.textContent = '❌ New password must be at least 6 characters.';
        feedback.style.color = '#cc0000'; return;
    }
    if (newInput !== confirmInput) {
        feedback.textContent = '❌ New passwords do not match.';
        feedback.style.color = '#cc0000'; return;
    }
    if (newInput === currentInput) {
        feedback.textContent = '❌ New password must be different from the current one.';
        feedback.style.color = '#cc0000'; return;
    }

    try {
        const response = await fetch(CHANGE_PW_API, {
            method  : 'POST',
            headers : { 'Content-Type':'application/json', 'x-admin-password': adminPassword },
            body    : JSON.stringify({ newPassword: newInput })
        });

        if (!response.ok) {
            const err = await response.json();
            feedback.textContent = '❌ ' + (err.error || 'Unknown error.');
            feedback.style.color = '#cc0000'; return;
        }

        adminPassword        = newInput;
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
    allBookings   = [];
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

    // Toolbar
    document.getElementById('admin-refresh-btn').addEventListener('click', fetchAdminBookings);
    document.getElementById('admin-clear-all-btn').addEventListener('click', adminClearAll);
    document.getElementById('admin-logout-btn').addEventListener('click', adminLogout);

    // Tabs
    document.getElementById('tab-upcoming').addEventListener('click', function () {
        activeTab = 'upcoming';
        this.classList.add('active');
        document.getElementById('tab-past').classList.remove('active');
        renderAdminBookings();
    });

    document.getElementById('tab-past').addEventListener('click', function () {
        activeTab = 'past';
        this.classList.add('active');
        document.getElementById('tab-upcoming').classList.remove('active');
        renderAdminBookings();
    });

    // Search
    document.getElementById('admin-search').addEventListener('input', function () {
        searchQuery = this.value;
        renderAdminBookings();
    });

    // Password change
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