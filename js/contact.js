
// ===== SHOW SUCCESS MESSAGE =====
function showSuccess(message) {
    const msg = document.createElement('div');
    msg.classList.add('success-message');
    msg.textContent = message;
    document.body.appendChild(msg);
    setTimeout(() => msg.classList.add('fade-out'), 2000);
    setTimeout(() => msg.remove(), 2500);
}

// ===== SEND MESSAGE VIA WHATSAPP =====
function sendMessage() {
    const name    = document.getElementById('contact-name').value.trim();
    const phone   = document.getElementById('contact-phone').value.trim();
    const message = document.getElementById('contact-message').value.trim();

    // Validate
    if (!name || !phone || !message) {
        alert('Please fill in all fields before sending.');
        return;
    }

    if (phone.replace(/\s/g, '').length < 10) {
        alert('Please enter a valid phone number.');
        return;
    }

    // Build WhatsApp pre-filled message to owner
    const ownerPhone = '254790549541';

    const waMessage =
        '💌 *New Message — Sera Glam Studio* 💌' + '\n\n' +
        '👤 *From:* '    + name    + '\n' +
        '📞 *Phone:* '   + phone   + '\n\n' +
        '💬 *Message:*'  + '\n'    + message;

    const waURL = 'https://wa.me/' + ownerPhone +
                  '?text=' + encodeURIComponent(waMessage);

    window.open(waURL, '_blank');

    showSuccess('✨ Message sent! We will get back to you shortly.');

    // Clear the form
    document.getElementById('contact-name').value    = '';
    document.getElementById('contact-phone').value   = '';
    document.getElementById('contact-message').value = '';
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', function () {

    document.getElementById('send-message-btn')
        .addEventListener('click', sendMessage);

    // Ctrl + Enter inside message textarea also sends
    document.getElementById('contact-message')
        .addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && e.ctrlKey) sendMessage();
        });
});