function showContactSuccess() {
    const formBox = document.querySelector('.contact-form-box');
    if (!formBox) return;

    formBox.innerHTML = `
        <div class="contact-success">
            <span class="success-icon">✨</span>
            <h3>Message <em style="color:var(--purple);font-style:italic;">Sent!</em></h3>
            <p>
                Thank you for reaching out.<br/>
                We will get back to you shortly via WhatsApp.
            </p>
            <button class="btn-outline" onclick="resetContactForm()">Send Another Message</button>
        </div>
    `;
}

function resetContactForm() {
    const formBox = document.querySelector('.contact-form-box');
    if (!formBox) return;

    formBox.innerHTML = `
        <h2>Send a <em>Message</em></h2>

        <div class="form-group">
            <label for="contact-name">Your Name</label>
            <input type="text" id="contact-name" placeholder="e.g. Yvonne Waithira"/>
        </div>

        <div class="form-group">
            <label for="contact-phone">Phone Number</label>
            <input type="tel" id="contact-phone" placeholder="e.g. 0712 345 678"/>
        </div>

        <div class="form-group">
            <label for="contact-message">Message</label>
            <textarea id="contact-message" placeholder="Type your message here..."></textarea>
        </div>

        <button id="send-message-btn" class="btn-primary full-width">Send Message</button>
    `;

    // Re-wire the button
    document.getElementById('send-message-btn').addEventListener('click', sendMessage);
}

function sendMessage() {
    const name    = document.getElementById('contact-name').value.trim();
    const phone   = document.getElementById('contact-phone').value.trim();
    const message = document.getElementById('contact-message').value.trim();

    if (!name || !phone || !message) {
        alert('Please fill in all fields before sending.');
        return;
    }

    if (phone.replace(/\s/g, '').length < 10) {
        alert('Please enter a valid phone number.');
        return;
    }

    const ownerPhone = '254790549541';

    const waMessage =
        '💌 *New Message — Sera Glam Studio* 💌\n\n' +
        '👤 *From:* '   + name    + '\n' +
        '📞 *Phone:* '  + phone   + '\n\n' +
        '💬 *Message:*' + '\n'    + message;

    window.open(
        'https://wa.me/' + ownerPhone + '?text=' + encodeURIComponent(waMessage),
        '_blank'
    );

    // Show success state instead of toast
    showContactSuccess();
}

document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('send-message-btn');
    if (btn) btn.addEventListener('click', sendMessage);

    const textarea = document.getElementById('contact-message');
    if (textarea) {
        textarea.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && e.ctrlKey) sendMessage();
        });
    }
});