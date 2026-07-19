// js/hero.js — Sera Glam Studio Hero Animation (theme-aware)

(function () {
    'use strict';

    const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const TOUCH   = window.matchMedia('(hover: none)').matches;

    const hero = document.getElementById('hero');
    if (!hero) return;

    // ─── THEME HELPERS ────────────────────────────────────────────────
    function isDark() {
        return document.body.classList.contains('dark-mode');
    }

    function getColors() {
        return isDark() ? {
            bg           : '#0d0818',
            particleDot  : '#c4b5fd',
            particleStar : '#c4b5fd',
            svgStroke    : '#7c3aed',
            svgStrokeMid : '#8b5cf6',
            trailColor   : '#ffd700',
            shimmerClass : 'shimmer-active'
        } : {
            bg           : '#FAF7FE',
            particleDot  : '#7B2FBE',
            particleStar : '#9B59D6',
            svgStroke    : '#7B2FBE',
            svgStrokeMid : '#9B59D6',
            trailColor   : '#7B2FBE',
            shimmerClass : 'shimmer-light-active'
        };
    }

    // Apply hero background
    function applyBackground() {
        hero.style.background = getColors().bg;
    }
    applyBackground();

    // Apply SVG stroke colours
    function applySVGColors() {
        const c = getColors();
        document.querySelectorAll('.lash-stroke').forEach((el, i) => {
            el.setAttribute('stroke', i === 6 ? c.svgStrokeMid : c.svgStroke);
        });
        const base = document.getElementById('lash-base');
        if (base) base.setAttribute('stroke', c.svgStroke);
    }
    applySVGColors();

    // Apply correct shimmer class
    let shimmerEnabled = false;
    function applyShimmer() {
        const brand = document.getElementById('hero-brand');
        if (!brand || !shimmerEnabled) return;
        brand.classList.remove('shimmer-active', 'shimmer-light-active');
        brand.classList.add(getColors().shimmerClass);
    }

    // Watch for theme toggle changes
    new MutationObserver(() => {
        applyBackground();
        applySVGColors();
        applyShimmer();
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // ─── CANVAS RESIZE HELPER ─────────────────────────────────────────
    function fitCanvas(canvas) {
        canvas.width  = hero.offsetWidth;
        canvas.height = hero.offsetHeight;
    }

    // ─── 1. PARTICLE CANVAS ───────────────────────────────────────────
    const pc   = document.getElementById('particle-canvas');
    const pctx = pc.getContext('2d');
    fitCanvas(pc);

    let cc = null;

    window.addEventListener('resize', () => {
        fitCanvas(pc);
        if (cc) fitCanvas(cc);
    });

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
        const c = getColors(); // reads current theme each frame

        pts.forEach(p => {
            p.x += p.vx;  p.y += p.vy;
            if (p.x < -8) p.x = pc.width  + 8;
            if (p.x > pc.width  + 8) p.x = -8;
            if (p.y < -8) p.y = pc.height + 8;
            if (p.y > pc.height + 8) p.y = -8;

            const tw = p.alpha * (0.45 + 0.55 * Math.sin(t * 1.2 + p.phase));

            if (p.isStar) {
                draw4Star(pctx, p.x, p.y, p.r * 2.8, tw, c.particleStar);
            } else {
                pctx.beginPath();
                pctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                pctx.fillStyle   = c.particleDot;
                pctx.globalAlpha = tw;
                pctx.fill();
                pctx.globalAlpha = 1;
            }
        });
        requestAnimationFrame(tickParticles);
    }
    tickParticles();

    // ─── LASH INITIALISE ──────────────────────────────────────────────
    const LASH_LENGTHS = [63, 73, 81, 87, 91, 94, 95, 94, 91, 87, 81, 73, 63];
    const BASE_LENGTH  = 445;

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

    // ─── REDUCED MOTION ───────────────────────────────────────────────
    if (REDUCED) {
        const wrap = document.getElementById('hero-content-wrap');
        if (wrap) { wrap.style.clipPath = 'none'; wrap.style.transition = 'none'; }

        shimmerEnabled = true;
        applyShimmer();

        document.getElementById('hero-divider') ?.classList.add('fade-up-active');
        document.getElementById('hero-subtitle')?.classList.add('fade-up-active');
        document.getElementById('hero-cta')    ?.classList.add('fade-up-active');

        const base = document.getElementById('lash-base');
        if (base) base.style.strokeDashoffset = '0';
        document.querySelectorAll('.lash-stroke').forEach(el => {
            el.style.strokeDashoffset = '0';
        });
        return;
    }

    // ─── 3. EYE-OPENING CLIP-PATH ─────────────────────────────────────
    const wrap = document.getElementById('hero-content-wrap');
    setTimeout(() => {
        wrap.style.transition = 'clip-path 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        requestAnimationFrame(() => { wrap.style.clipPath = 'inset(0% 0 0% 0)'; });
    }, 800);

    // ─── 4. LASH SVG DRAW ─────────────────────────────────────────────
    function startLashDraw() {
        const base = document.getElementById('lash-base');
        if (base) {
            requestAnimationFrame(() => {
                base.style.transition       = 'stroke-dashoffset 0.55s ease';
                base.style.strokeDashoffset = '0';
            });
        }

        const drawOrder = [6, 5, 7, 4, 8, 3, 9, 2, 10, 1, 11, 0, 12];
        const strokes   = document.querySelectorAll('.lash-stroke');
        drawOrder.forEach((lashIdx, step) => {
            const el = strokes[lashIdx];
            if (!el) return;
            setTimeout(() => {
                el.style.transition         = 'stroke-dashoffset 0.32s ease';
                el.style.strokeDashoffset   = '0';
            }, 520 + step * 75);
        });
    }
    setTimeout(startLashDraw, 2000);

    // ─── 5. SPARKLE BURST ─────────────────────────────────────────────
    setTimeout(() => {
        const burst = document.getElementById('sparkle-burst');
        if (!burst) return;
        for (let i = 0; i < 14; i++) {
            const el = document.createElement('div');
            el.className = 'burst-star';
            el.style.setProperty('--angle',    (i / 14 * 360) + 'deg');
            el.style.setProperty('--distance', (72 + Math.random() * 88) + 'px');
            el.style.animationDelay = (Math.random() * 0.15) + 's';
            // Use theme colour for burst stars
            el.style.background = getColors().svgStroke;
            burst.appendChild(el);
            setTimeout(() => el.remove(), 1100);
        }
    }, 2000);

    // ─── 6. SHIMMER TEXT ──────────────────────────────────────────────
    setTimeout(() => {
        shimmerEnabled = true;
        applyShimmer();
    }, 2500);

    // ─── 7. TAGLINE / CTA FADE-UP ─────────────────────────────────────
    setTimeout(() => {
        document.getElementById('hero-divider') ?.classList.add('fade-up-active');
        document.getElementById('hero-subtitle')?.classList.add('fade-up-active');
        document.getElementById('hero-cta')    ?.classList.add('fade-up-active');
    }, 2900);

    // ─── 8. CURSOR TRAIL ──────────────────────────────────────────────
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
            const c = getColors();
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle   = c.trailColor;
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
            const dark = isDark();
            const g = ctx.createRadialGradient(x, y, 0, x, y, 14);
            g.addColorStop(0,   dark ? 'rgba(124,58,237,0.58)'  : 'rgba(123,47,190,0.4)');
            g.addColorStop(0.4, dark ? 'rgba(124,58,237,0.18)'  : 'rgba(123,47,190,0.12)');
            g.addColorStop(1,   'rgba(124,58,237,0)');
            ctx.beginPath();
            ctx.arc(x, y, 14, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x, y, 3.5, 0, Math.PI * 2);
            ctx.fillStyle    = getColors().trailColor;
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