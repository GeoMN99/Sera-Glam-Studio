// Dark mode toggle

//Check If user previously selected dark mode
const saveTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    document.getElementById('theme-toggle').textContent ='☀️';
}

//Add event listeners to toggle button
document.getElementById('theme-toggle').addEventListener('click', function() {
    // Toggle dark mode class on body
    document.body.classList.toggle('dark-mode');

    // Check which mode we are now in
    const isDark = document.body.classList.contains('dark-mode');

    // Update the button emoji
    this.textContent = isDark ? '☀️' : '🌙';

    //Save the preference to local storage
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});