(function () {
    'use strict';

    // ─── 1. BACK TO TOP BUTTON ────────────────────────────────────────
    const btn = document.createElement('button');
    btn.className   = 'back-to-top';
    btn.innerHTML   = '↑';
    btn.title       = 'Back to top';
    btn.setAttribute('aria-label', 'Scroll back to top');
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 380);
    }, { passive: true });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ─── 2. SUMMARY PANEL FLASH ON UPDATE ─────────────────────────────
    // Watches for text changes in summary values and flashes them purple
    // Only runs on book.html
    if (window.location.pathname.toLowerCase().includes('book')) {
        const summaryIds = ['sum-name','sum-phone','sum-service','sum-date','sum-time','sum-price'];

        function flashOnChange(el) {
            if (!el) return;
            const observer = new MutationObserver(() => {
                el.classList.remove('updated');
                void el.offsetWidth; // force reflow to restart animation
                el.classList.add('updated');
            });
            observer.observe(el, { childList: true, characterData: true, subtree: true });
        }

        document.addEventListener('DOMContentLoaded', () => {
            summaryIds.forEach(id => flashOnChange(document.getElementById(id)));
        });
    }

    // ─── 3. SMOOTH SCROLL FOR ANCHOR LINKS ───────────────────────────
    document.addEventListener('click', function (e) {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

})();