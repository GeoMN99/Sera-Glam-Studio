// ===== SERA GLAM STUDIO — DARK MODE TOGGLE =====

document.addEventListener('DOMContentLoaded', function() {

    // Check if user previously selected dark mode and apply it
    const savedTheme = localStorage.getItem('seraGlamTheme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }

    // Get the toggle button
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    // Set correct emoji on page load
    function updateToggleButton() {
        const isDark = document.body.classList.contains('dark-mode');
        btn.textContent = isDark ? '☀️' : '🌑';
        btn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }

    // Run on load
    updateToggleButton();

    // Toggle dark mode on button click
    btn.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        updateToggleButton();
        localStorage.setItem('seraGlamTheme', isDark ? 'dark' : 'light');
    });

});