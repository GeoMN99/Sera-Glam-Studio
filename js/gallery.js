(function () {
    'use strict';

    if (!document.querySelector('.gallery-grid')) return;

    // ─── BUILD LIGHTBOX DOM ───────────────────────────────────────────
    const lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('role', 'dialog');
    lb.innerHTML = `
        <div class="lb-backdrop"></div>
        <button class="lb-close" aria-label="Close lightbox">×</button>
        <button class="lb-prev" aria-label="Previous image">&#8249;</button>
        <button class="lb-next" aria-label="Next image">&#8250;</button>
        <div class="lb-content">
            <img class="lb-img" src="" alt=""/>
            <p class="lb-caption"></p>
            <p class="lb-counter"></p>
        </div>
    `;
    document.body.appendChild(lb);

    // ─── STATE ────────────────────────────────────────────────────────
    let items   = [];
    let current = 0;

    // ─── COLLECT VISIBLE GALLERY IMAGES ───────────────────────────────
    // Called on load and whenever a filter button is clicked,
    // so the lightbox only cycles through currently visible items.
    function collectItems() {
        items = Array.from(
            document.querySelectorAll('.gallery-item')
        ).filter(el => el.style.display !== 'none' && el.tagName === 'IMG');
    }

    // ─── OPEN ─────────────────────────────────────────────────────────
    function open(index) {
        collectItems();
        if (!items.length) return;
        current = ((index % items.length) + items.length) % items.length;

        const img = items[current];
        lb.querySelector('.lb-img').src    = img.src;
        lb.querySelector('.lb-img').alt    = img.alt;
        lb.querySelector('.lb-caption').textContent = img.alt || '';
        lb.querySelector('.lb-counter').textContent = (current + 1) + ' / ' + items.length;

        // Show/hide nav arrows
        lb.querySelector('.lb-prev').style.display = items.length > 1 ? '' : 'none';
        lb.querySelector('.lb-next').style.display = items.length > 1 ? '' : 'none';

        lb.classList.add('active');
        document.body.style.overflow = 'hidden';
        lb.querySelector('.lb-close').focus();
    }

    // ─── CLOSE ────────────────────────────────────────────────────────
    function close() {
        lb.classList.remove('active');
        document.body.style.overflow = '';
        // Clear src after transition so old image doesn't flash on next open
        setTimeout(() => { lb.querySelector('.lb-img').src = ''; }, 320);
    }

    function prev() {
        open(current - 1);
    }

    function next() {
        open(current + 1);
    }

    // ─── WIRE UP GALLERY IMAGES ───────────────────────────────────────
    function initGallery() {
        collectItems();
        items.forEach((img, i) => {
            img.style.cursor = 'zoom-in';
            // Remove old listener before adding (avoids duplicates on re-init)
            img.removeEventListener('click', img._lbHandler);
            img._lbHandler = () => open(i);
            img.addEventListener('click', img._lbHandler);
        });
    }
    initGallery();

    // Re-init after filter clicks so indices stay correct
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => setTimeout(initGallery, 60));
    });

    // ─── LIGHTBOX EVENT LISTENERS ─────────────────────────────────────
    lb.querySelector('.lb-backdrop').addEventListener('click', close);
    lb.querySelector('.lb-close').addEventListener('click', close);

    lb.querySelector('.lb-prev').addEventListener('click', e => {
        e.stopPropagation();
        prev();
    });
    lb.querySelector('.lb-next').addEventListener('click', e => {
        e.stopPropagation();
        next();
    });

    // Keyboard navigation
    document.addEventListener('keydown', e => {
        if (!lb.classList.contains('active')) return;
        if (e.key === 'Escape')      close();
        if (e.key === 'ArrowLeft')   prev();
        if (e.key === 'ArrowRight')  next();
    });

    // Touch swipe
    let touchStartX = 0;
    lb.addEventListener('touchstart', e => {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });
    lb.addEventListener('touchend', e => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 48) diff > 0 ? next() : prev();
    });

})();