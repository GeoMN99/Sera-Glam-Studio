// js/hero.js — Sera Glam Studio Hero Animation

(function () {
    'use strict';

    const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const TOUCH   = window.matchMedia('(hover: none)').matches;

    const hero = document.getElementById('hero');
    if (!hero) return;

    // ─── CANVAS RESIZE HELPER ─────────────────────────────────────────
    function fitCanvas(canvas) {
        canvas.width  = hero.offsetWidth;
        canvas.height = hero.offsetHeight;
    }

    // ─── 1. PARTICLE CANVAS ───────────────────────────────────────────
    const pc   = document.getElementById('particle-canvas');
    const pctx = pc.getContext('2d');
    fitCanvas(pc);

    let cc = null; // cursor canvas — assigned below if not touch

    window.addEventListener('resize', () => {
        fitCanvas(pc);
        if (cc) fitCanvas(cc);
    });

    // Build particle pool
    const PARTICLE_COUNT = 55;
    const pts = Array.from({ length: PARTICLE_COUNT }, () => ({
        x      : Math.random() * pc.width,
        y      : Math.random() * pc.height,
        r      : Math.random() * 1.5 + 0.4,
        alpha  : Math.random() * 0.45 + 0.08,
        vx     : (Math.random() - 0.5) * 0.22,
        vy     : (Math.random() - 0.5) * 0.22,
        phase  : Math.random() * Math.PI * 2,
        isStar : Math.random() > 0.70
    }));

    function draw4Star(ctx, x, y, r, alpha, color) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = color;
        ctx.translate(x, y);
        ctx.beginPath();
        for (let k = 0; k < 8; k++) {
            const ang = (k * Math.PI) / 4 - Math.PI / 4;
            const rad = k % 2 === 0 ? r : r * 0.30;
            k === 0
                ? ctx.moveTo(Math.cos(ang) * rad, Math.sin(ang) * rad)
                : ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function tickParticles() {
        pctx.clearRect(0, 0, pc.width, pc.height);
        const t = performance.now() * 0.001;

        pts.forEach(p => {
            p.x += p.vx;  p.y += p.vy;
            if (p.x < -8) p.x = pc.width  + 8;
            if (p.x > pc.width  + 8) p.x = -8;
            if (p.y < -8) p.y = pc.height + 8;
            if (p.y > pc.height + 8) p.y = -8;

            const tw = p.alpha * (0.45 + 0.55 * Math.sin(t * 1.2 + p.phase));

            if (p.isStar) {
                draw4Star(pctx, p.x, p.y, p.r * 2.8, tw, '#c4b5fd');
            } else {
                pctx.beginPath();
                pctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                pctx.fillStyle   = '#c4b5fd';
                pctx.globalAlpha = tw;
                pctx.fill();
                pctx.globalAlpha = 1;
            }
        });
        requestAnimationFrame(tickParticles);
    }
    tickParticles();

    // ─── LASH INITIALISE (sets dashoffset so strokes are invisible) ───
    // Called immediately so the browser registers the initial state
    // long before the draw animation fires at 2 s.
    const LASH_LENGTHS = [63, 73, 81, 87, 91, 94, 95, 94, 91, 87, 81, 73, 63];
    const BASE_LENGTH  = 445; // arc-length approximation of the Q-bezier base

    function initLashDraw() {
        const base = document.getElementById('lash-base');
        if (base) {
            base.style.strokeDasharray  = BASE_LENGTH;
            base.style.strokeDashoffset = BASE_LENGTH;
            base.style.opacity          = '1';
        }
        document.querySelectorAll('.lash-stroke').forEach((el, i) => {
            const len = LASH_LENGTHS[i] ?? 80;
            el.style.strokeDasharray  = len;
            el.style.strokeDashoffset = len;
            el.style.opacity          = '1';
        });
    }
    initLashDraw();

    // ─── REDUCED MOTION: reveal everything immediately ────────────────
    if (REDUCED) {
        const wrap = document.getElementById('hero-content-wrap');
        if (wrap) { wrap.style.clipPath = 'none'; wrap.style.transition = 'none'; }

        document.getElementById('hero-brand')  ?.classList.add('shimmer-active');
        document.getElementById('hero-divider') ?.classList.add('fade-up-active');
        document.getElementById('hero-subtitle')?.classList.add('fade-up-active');
        document.getElementById('hero-cta')    ?.classList.add('fade-up-active');

        const base = document.getElementById('lash-base');
        if (base) { base.style.strokeDashoffset = '0'; }
        document.querySelectorAll('.lash-stroke').forEach(el => {
            el.style.strokeDashoffset = '0';
        });
        return; // skip all timed animations
    }

    // ─── 3. EYE-OPENING CLIP-PATH ─────────────────────────────────────
    // CSS already sets initial clip-path = inset(50% 0 50% 0).
    // At 800 ms we trigger the opening transition.
    const wrap = document.getElementById('hero-content-wrap');
    setTimeout(() => {
        wrap.style.transition = 'clip-path 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        // rAF ensures transition is registered before value changes
        requestAnimationFrame(() => {
            wrap.style.clipPath = 'inset(0% 0 0% 0)';
        });
    }, 800);

    // ─── 4. LASH SVG DRAW (starts at 2 s, after eye fully opens) ─────
    function startLashDraw() {
        const base = document.getElementById('lash-base');
        if (base) {
            requestAnimationFrame(() => {
                base.style.transition       = 'stroke-dashoffset 0.55s ease';
                base.style.strokeDashoffset = '0';
            });
        }

        // Draw order: centre (index 6) first, edges last
        const drawOrder = [6, 5, 7, 4, 8, 3, 9, 2, 10, 1, 11, 0, 12];
        const strokes   = document.querySelectorAll('.lash-stroke');

        drawOrder.forEach((lashIdx, step) => {
            const el = strokes[lashIdx];
            if (!el) return;
            // Base takes ~550 ms; lashes stagger every 75 ms after that
            setTimeout(() => {
                el.style.transition         = 'stroke-dashoffset 0.32s ease';
                el.style.strokeDashoffset   = '0';
            }, 520 + step * 75);
        });
    }
    setTimeout(startLashDraw, 2000);

    // ─── 5. SPARKLE BURST (at 2 s) ───────────────────────────────────
    setTimeout(() => {
        const burst = document.getElementById('sparkle-burst');
        if (!burst) return;
        for (let i = 0; i < 14; i++) {
            const el = document.createElement('div');
            el.className = 'burst-star';
            el.style.setProperty('--angle',    (i / 14 * 360) + 'deg');
            el.style.setProperty('--distance', (72 + Math.random() * 88) + 'px');
            el.style.animationDelay = (Math.random() * 0.14) + 's';
            burst.appendChild(el);
            setTimeout(() => el.remove(), 1100);
        }
    }, 2000);

    // ─── 6. SHIMMER TEXT (at 2.5 s) ──────────────────────────────────
    setTimeout(() => {
        document.getElementById('hero-brand')?.classList.add('shimmer-active');
    }, 2500);

    // ─── 7. TAGLINE / CTA FADE-UP (at 2.9 s) ─────────────────────────
    setTimeout(() => {
        document.getElementById('hero-divider') ?.classList.add('fade-up-active');
        document.getElementById('hero-subtitle')?.classList.add('fade-up-active');
        document.getElementById('hero-cta')    ?.classList.add('fade-up-active');
    }, 2900);

    // ─── 8. CURSOR TRAIL (desktop / pointer devices only) ─────────────
    if (!TOUCH) {
        cc = document.getElementById('cursor-canvas');
        const cctx = cc.getContext('2d');
        fitCanvas(cc);

        const trail = [];
        let mx = -999, my = -999;

        hero.addEventListener('mousemove', e => {
            const r = hero.getBoundingClientRect();
            mx = e.clientX - r.left;
            my = e.clientY - r.top;
            trail.push({ x: mx, y: my, life: 1, size: Math.random() * 5 + 3 });
            if (trail.length > 28) trail.shift();
        });
        hero.addEventListener('mouseleave', () => { mx = -999; my = -999; });

        function drawTrailStar(ctx, x, y, size, alpha) {
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle   = '#ffd700';
            ctx.translate(x, y);
            ctx.rotate(Math.PI / 4);
            ctx.beginPath();
            for (let k = 0; k < 8; k++) {
                const ang = (k * Math.PI) / 4;
                const rad = k % 2 === 0 ? size : size * 0.36;
                k === 0
                    ? ctx.moveTo(Math.cos(ang) * rad, Math.sin(ang) * rad)
                    : ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        function drawGlowDot(ctx, x, y) {
            const g = ctx.createRadialGradient(x, y, 0, x, y, 14);
            g.addColorStop(0,   'rgba(124, 58, 237, 0.58)');
            g.addColorStop(0.4, 'rgba(124, 58, 237, 0.18)');
            g.addColorStop(1,   'rgba(124, 58, 237, 0)');
            ctx.beginPath();
            ctx.arc(x, y, 14, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x, y, 3.5, 0, Math.PI * 2);
            ctx.fillStyle    = '#c4b5fd';
            ctx.globalAlpha  = 0.92;
            ctx.fill();
            ctx.globalAlpha  = 1;
        }

        function tickCursor() {
            cctx.clearRect(0, 0, cc.width, cc.height);
            for (let i = trail.length - 1; i >= 0; i--) {
                trail[i].life -= 0.054;
                if (trail[i].life <= 0) { trail.splice(i, 1); continue; }
                drawTrailStar(cctx, trail[i].x, trail[i].y, trail[i].size, trail[i].life * 0.75);
            }
            if (mx !== -999) drawGlowDot(cctx, mx, my);
            requestAnimationFrame(tickCursor);
        }
        tickCursor();
    }

})();