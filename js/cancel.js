const API_BASE    = 'https://sera-glam-backend.onrender.com';
const OWNER_PHONE = '254790549541';

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

function show(id) {
    ['cancel-loading','cancel-found','cancel-success','cancel-error']
        .forEach(s => {
            document.getElementById(s).style.display = s === id ? 'block' : 'none';
        });
}

function timeLabel(rawTime) {
    const slot = allTimeSlots.find(s => s.value === rawTime);
    return slot ? slot.label : rawTime;
}

document.addEventListener('DOMContentLoaded', async function () {

    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');

    if (!token) { show('cancel-error'); return; }

    try {
        const res = await fetch(`${API_BASE}/api/cancel/${token}`);
        if (!res.ok) { show('cancel-error'); return; }

        const b = await res.json();
        document.getElementById('c-name').textContent    = b.name;
        document.getElementById('c-service').textContent = b.service;
        document.getElementById('c-date').textContent    = b.date;
        document.getElementById('c-time').textContent    = timeLabel(b.time);
        document.getElementById('c-price').textContent   = b.price;

        show('cancel-found');

        document.getElementById('confirm-cancel-btn')
            .addEventListener('click', async function () {
                this.disabled    = true;
                this.textContent = 'Cancelling...';

                try {
                    const delRes = await fetch(`${API_BASE}/api/cancel/${token}`, {
                        method: 'DELETE'
                    });

                    if (!delRes.ok) {
                        alert('Could not cancel. It may have already been cancelled.');
                        this.disabled    = false;
                        this.textContent = 'Cancel My Booking';
                        return;
                    }

                    const data = await delRes.json();
                    show('cancel-success');

                    // Notify owner via WhatsApp
                    const c   = data.cancelled;
                    const msg =
                        '❌ *Booking Cancelled by Client — Sera Glam Studio* ❌\n\n' +
                        '👤 *Client:* '  + c.name              + '\n' +
                        '📞 *Phone:* '   + c.phone             + '\n\n' +
                        '💅 *Service:* ' + c.service           + '\n' +
                        '📅 *Date:* '    + c.date              + '\n' +
                        '🕐 *Time:* '    + timeLabel(c.time)   + '\n' +
                        '💰 *Price:* '   + c.price;

                    window.open(
                        'https://wa.me/' + OWNER_PHONE + '?text=' + encodeURIComponent(msg),
                        '_blank'
                    );

                } catch (err) {
                    console.error(err);
                    alert('Could not reach the server. Please try again.');
                    this.disabled    = false;
                    this.textContent = 'Cancel My Booking';
                }
            });

    } catch (err) {
        console.error(err);
        show('cancel-error');
    }
});