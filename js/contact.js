// Show Success Message
function showSuccess(message) {
    const msg = document.createElement('div');
    msg.classList.add('success-message');
    msg.textContent = message;
    document.body.appendChild(msg);

    setTimeout(function() {
        msg.classList.add('fade-out');
    }, 2000);

    setTimeout(function() {
        msg.remove();
    }, 2500);
}

// Send Message
function sendMessage() {
    //Grab values from input fields
    const name = document.getElementById('contact-name').value.trim();
    const phone = document.getElementById('contact-phone').value.trim();
    const message = document.getElementById('contact-message').value.trim();

    // Validate - make sure nothing is empty
    if (!name || !phone || !message) {
        alert('Please fill in all fields before sending.');
        return;
    }

    //Validate phone number - must be at least 10 digits
    if (phone.replace(/\s/g, '').length < 10) {
        alert('Please enter a valid phone number.')
        return;
    }

    // Show Success Message
    showSuccess('✨ Message sent! We will get back to you shortly.');

    //Clear the form
    document.getElementById('contact-name').value = '';
    document.getElementById('contact-phone').value ='';
    document.getElementById('contact-message').value = '';
}

//Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    
    //Send message button
    document.getElementById('send-message-btn').addEventListener('click', sendMessage);

    //Also allow pressing enter in the message field to send
    document.getElementById('contact-message').addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            sendMessage();
        }
    });
});