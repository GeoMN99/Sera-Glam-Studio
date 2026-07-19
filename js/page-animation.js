(function () {
    'use strict';

    const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const TOUCH   = window.matchMedia('(hover: none)').matches;

    const path = window.location.pathname.toLowerCase();
    let PAGE = 'unknown';
    if (path.includes('services'))                              PAGE = 'services';
    else if (path.includes('book') && !path.includes('admin')) PAGE = 'book';
    else if (path.includes('gallery'))                         PAGE = 'gallery';
    else if (path.includes('contact'))                         PAGE = 'contact';
    else if (path.includes('admin'))                           PAGE = 'admin';
    if (PAGE === 'unknown') return;

    // ─── THEME HELPER ─────────────────────────────────────────────────
    function isDark() { return document.body.classList.contains('dark-mode'); }

    // ─── PAGE CONFIG (dark + light per page) ──────────────────────────
    const CONFIG = {
        services: {
            cursorTrail : true,
            dark  : { bg:'#0d0818', particleDot:'#ffd700', particleStar:'#c4b5fd', svgColor:'#ffd700', svgColor2:'#c4b5fd', trail:'#ffd700' },
            light : { bg:'#FAF7FE', particleDot:'#7B2FBE', particleStar:'#C9A84C', svgColor:'#C9A84C', svgColor2:'#7B2FBE', trail:'#7B2FBE' }
        },
        book: {
            cursorTrail : true,
            dark  : { bg:'#0d0818', particleDot:'#c4b5fd', particleStar:'#7c3aed', svgColor:'#7c3aed', svgColor2:'#c4b5fd', trail:'#c4b5fd' },
            light : { bg:'#FAF7FE', particleDot:'#7B2FBE', particleStar:'#9B59D6', svgColor:'#7B2FBE', svgColor2:'#9B59D6', trail:'#7B2FBE' }
        },
        gallery: {
            cursorTrail : true,
            dark  : { bg:'#0d0818', particleDot:'#ffd700', particleStar:'#c4b5fd', svgColor:'#ffd700', svgColor2:'#7c3aed', trail:'#ffd700' },
            light : { bg:'#FAF7FE', particleDot:'#7B2FBE', particleStar:'#C9A84C', svgColor:'#C9A84C', svgColor2:'#7B2FBE', trail:'#7B2FBE' }
        },
        contact: {
            cursorTrail : true,
            dark  : { bg:'#0d0818', particleDot:'#c4b5fd', particleStar:'#e9d5ff', svgColor:'#c4b5fd', svgColor2:'#7c3aed', trail:'#c4b5fd' },
            light : { bg:'#FAF7FE', particleDot:'#7B2FBE', particleStar:'#9B59D6', svgColor:'#7B2FBE', svgColor2:'#9B59D6', trail:'#7B2FBE' }
        },
        admin: {
            cursorTrail : false,
            dark  : { bg:'#120820', particleDot:'#6d28d9', particleStar:'#4c1d95', svgColor:'#6d28d9', svgColor2:'#4c1d95', trail:null },
            light : { bg:'#FAF7FE', particleDot:'#7B2FBE', particleStar:'#9B59D6', svgColor:'#7B2FBE', svgColor2:'#9B59D6', trail:null }
        }
    };

    function getCfg() {
        const theme = isDark() ? 'dark' : 'light';
        return { ...CONFIG[PAGE][theme], cursorTrail: CONFIG[PAGE].cursorTrail };
    }

    const header = document.querySelector('.page-header');
    if (!header) return;

    header.style.position = 'relative';
    header.style.overflow = 'hidden';
    header.style.borderBottom = '1px solid rgba(124,58,237,0.25)';

    function applyHeaderBg() {
        header.style.background = getCfg().bg;
    }
    applyHeaderBg();

    // ─── PARTICLE CANVAS ──────────────────────────────────────────────
    const pc   = document.createElement('canvas');
    pc.setAttribute('aria-hidden', 'true');
    pc.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
    header.prepend(pc);
    const pctx = pc.getContext('2d');

    function fitCanvas(canvas) {
        canvas.width  = header.offsetWidth;
        canvas.height = header.offsetHeight;
    }
    fitCanvas(pc);

    let cc = null;
    window.addEventListener('resize', () => {
        fitCanvas(pc);
        if (cc) fitCanvas(cc);
    });

    const PARTICLE_COUNT = 38;
    const pts = Array.from({ length: PARTICLE_COUNT }, () => ({
        x      : Math.random() * pc.width,
        y      : Math.random() * pc.height,
        r      : Math.random() * 1.4 + 0.35,
        alpha  : Math.random() * 0.4 + 0.07,
        vx     : (Math.random() - 0.5) * 0.2,
        vy     : (Math.random() - 0.5) * 0.2,
        phase  : Math.random() * Math.PI * 2,
        isStar : Math.random() > 0.68
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
        const c = getCfg(); // reads current theme each frame

        pts.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < -8) p.x = pc.width  + 8;
            if (p.x > pc.width  + 8) p.x = -8;
            if (p.y < -8) p.y = pc.height + 8;
            if (p.y > pc.height + 8) p.y = -8;

            const tw = p.alpha * (0.45 + 0.55 * Math.sin(t * 1.2 + p.phase));
            if (p.isStar) {
                draw4Star(pctx, p.x, p.y, p.r * 2.6, tw, c.particleStar);
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

    // ─── INJECT SVG ILLUSTRATION ──────────────────────────────────────
    const svgWrap = document.createElement('div');
    svgWrap.className = 'ph-svg-wrap';
    svgWrap.setAttribute('aria-hidden', 'true');
    svgWrap.style.cssText = 'position:relative;z-index:1;margin:0 auto 18px;';

    // Build SVG using current theme colors
    svgWrap.innerHTML = buildSVG(PAGE, getCfg());

    const h1 = header.querySelector('h1');
    if (h1) header.insertBefore(svgWrap, h1);

    // Update SVG colors on theme change
    function updateSVGColors() {
        const newSVG = buildSVG(PAGE, getCfg());
        // Only update stroke attributes, not full rebuild (preserves dashoffset state)
        const c = getCfg();
        svgWrap.querySelectorAll('.ph-stroke[stroke]').forEach(el => {
            const current = el.getAttribute('stroke');
            // Update if color has changed
            if (current && current !== 'none') el.setAttribute('stroke', c.svgColor);
        });
        svgWrap.querySelectorAll('.ph-stroke[fill]').forEach(el => {
            const f = el.getAttribute('fill');
            if (f && f !== 'none') el.setAttribute('fill', c.svgColor2);
        });
    }

    // ─── STYLE TITLE ──────────────────────────────────────────────────
    if (h1) {
        h1.classList.add('ph-title');
        h1.style.position = 'relative';
        h1.style.zIndex   = '1';
    }
    const sub = header.querySelector('p');
    if (sub) {
        sub.classList.add('ph-subtitle');
        sub.style.position  = 'relative';
        sub.style.zIndex    = '1';
        sub.style.opacity   = '0';
        sub.style.transform = 'translateY(12px)';
        sub.style.transition= 'opacity 0.6s ease 0.15s, transform 0.6s ease 0.15s';
    }

    // ─── WATCH THEME CHANGES ──────────────────────────────────────────
    new MutationObserver(() => {
        applyHeaderBg();
        updateSVGColors();
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // ─── REDUCED MOTION ───────────────────────────────────────────────
    if (REDUCED) {
        if (sub) { sub.style.opacity = '1'; sub.style.transform = 'none'; }
        svgWrap.querySelectorAll('.ph-stroke').forEach(el => {
            el.style.strokeDashoffset = '0';
            el.style.opacity = '1';
        });
        const fill = svgWrap.querySelector('.ph-fill');
        if (fill) fill.style.opacity = '1';
        return;
    }

    // ─── INIT STROKE DASHOFFSETS ──────────────────────────────────────
    function initStrokes() {
        svgWrap.querySelectorAll('.ph-stroke').forEach(el => {
            let len = 200;
            try { len = el.getTotalLength(); } catch(e) { len = parseFloat(el.getAttribute('data-len') || 200); }
            el.style.strokeDasharray  = len;
            el.style.strokeDashoffset = len;
            el.style.opacity          = '1';
        });
    }
    initStrokes();

    // ─── DRAW ANIMATION ───────────────────────────────────────────────
    function startDraw() {
        const strokes = svgWrap.querySelectorAll('.ph-stroke');
        strokes.forEach((el, i) => {
            setTimeout(() => {
                el.style.transition       = 'stroke-dashoffset 0.55s ease';
                el.style.strokeDashoffset = '0';
            }, i * 180);
        });

        const totalTime = strokes.length * 180 + 550;

        setTimeout(() => {
            const fill = svgWrap.querySelector('.ph-fill');
            if (fill) { fill.style.transition = 'opacity 0.4s ease'; fill.style.opacity = '1'; }
        }, totalTime);

        setTimeout(() => {
            if (sub) { sub.style.opacity = '1'; sub.style.transform = 'translateY(0)'; }
        }, totalTime + 200);
    }
    setTimeout(startDraw, 400);

    // ─── CURSOR TRAIL ─────────────────────────────────────────────────
    if (!TOUCH && CONFIG[PAGE].cursorTrail) {
        cc = document.createElement('canvas');
        cc.setAttribute('aria-hidden', 'true');
        cc.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:10;';
        header.appendChild(cc);
        fitCanvas(cc);
        const cctx = cc.getContext('2d');

        const trail = [];
        let mx = -999, my = -999;

        header.addEventListener('mousemove', e => {
            const r = header.getBoundingClientRect();
            mx = e.clientX - r.left;
            my = e.clientY - r.top;
            trail.push({ x: mx, y: my, life: 1, size: Math.random() * 4.5 + 2.5 });
            if (trail.length > 24) trail.shift();
        });
        header.addEventListener('mouseleave', () => { mx = -999; my = -999; });

        function drawTrailStar(ctx, x, y, size, alpha) {
            const c = getCfg();
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle   = c.trail || '#7B2FBE';
            ctx.translate(x, y);
            ctx.rotate(Math.PI / 4);
            ctx.beginPath();
            for (let k = 0; k < 8; k++) {
                const ang = (k * Math.PI) / 4;
                const rad = k % 2 === 0 ? size : size * 0.35;
                k === 0
                    ? ctx.moveTo(Math.cos(ang) * rad, Math.sin(ang) * rad)
                    : ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        function drawGlowDot(ctx, x, y) {
            const g = ctx.createRadialGradient(x, y, 0, x, y, 12);
            const col = isDark() ? '124,58,237' : '123,47,190';
            g.addColorStop(0,   `rgba(${col},0.55)`);
            g.addColorStop(0.4, `rgba(${col},0.15)`);
            g.addColorStop(1,   `rgba(${col},0)`);
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle    = getCfg().trail || '#7B2FBE';
            ctx.globalAlpha  = 0.9;
            ctx.fill();
            ctx.globalAlpha  = 1;
        }

        function tickCursor() {
            cctx.clearRect(0, 0, cc.width, cc.height);
            for (let i = trail.length - 1; i >= 0; i--) {
                trail[i].life -= 0.06;
                if (trail[i].life <= 0) { trail.splice(i, 1); continue; }
                drawTrailStar(cctx, trail[i].x, trail[i].y, trail[i].size, trail[i].life * 0.7);
            }
            if (mx !== -999) drawGlowDot(cctx, mx, my);
            requestAnimationFrame(tickCursor);
        }
        tickCursor();
    }

    // ─── SVG BUILDER ──────────────────────────────────────────────────
    function buildSVG(page, cfg) {
        const c  = cfg.svgColor;
        const c2 = cfg.svgColor2;

        switch (page) {
            case 'services':
                return `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" style="width:180px;height:auto;display:block;margin:0 auto;overflow:visible">
                    <path class="ph-stroke" data-len="160" d="M 55 90 C 55 70 70 55 90 45" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/>
                    <path class="ph-stroke" data-len="160" d="M 145 90 C 145 70 130 55 110 45" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/>
                    <line class="ph-stroke" data-len="80" x1="70" y1="65" x2="130" y2="65" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>
                    <circle class="ph-stroke" data-len="100" cx="50" cy="95" r="14" fill="none" stroke="${c}" stroke-width="2"/>
                    <circle class="ph-stroke" data-len="100" cx="150" cy="95" r="14" fill="none" stroke="${c2}" stroke-width="2"/>
                    <circle class="ph-fill" cx="100" cy="65" r="4" fill="${c}" opacity="0"/>
                    <text class="ph-stroke" data-len="10" x="28" y="38" font-size="14" fill="${c2}" stroke="none" style="opacity:0;transition:opacity 0.4s ease">✦</text>
                    <text class="ph-stroke" data-len="10" x="158" y="30" font-size="10" fill="${c}" stroke="none" style="opacity:0;transition:opacity 0.4s ease">✦</text>
                </svg>`;

            case 'book':
                return `<svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg" style="width:180px;height:auto;display:block;margin:0 auto;overflow:visible">
                    <rect class="ph-stroke" data-len="580" x="30" y="25" width="140" height="100" rx="6" fill="none" stroke="${c}" stroke-width="2"/>
                    <line class="ph-stroke" data-len="140" x1="30" y1="50" x2="170" y2="50" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>
                    <line class="ph-stroke" data-len="22" x1="70" y1="18" x2="70" y2="35" stroke="${c2}" stroke-width="2.5" stroke-linecap="round"/>
                    <line class="ph-stroke" data-len="22" x1="130" y1="18" x2="130" y2="35" stroke="${c2}" stroke-width="2.5" stroke-linecap="round"/>
                    <line class="ph-stroke" data-len="75" x1="70" y1="50" x2="70" y2="125" stroke="${c}" stroke-width="1" stroke-linecap="round" stroke-dasharray="4 4"/>
                    <line class="ph-stroke" data-len="75" x1="100" y1="50" x2="100" y2="125" stroke="${c}" stroke-width="1" stroke-linecap="round" stroke-dasharray="4 4"/>
                    <line class="ph-stroke" data-len="75" x1="130" y1="50" x2="130" y2="125" stroke="${c}" stroke-width="1" stroke-linecap="round" stroke-dasharray="4 4"/>
                    <line class="ph-stroke" data-len="140" x1="30" y1="75" x2="170" y2="75" stroke="${c}" stroke-width="1" stroke-linecap="round" stroke-dasharray="4 4"/>
                    <line class="ph-stroke" data-len="140" x1="30" y1="100" x2="170" y2="100" stroke="${c}" stroke-width="1" stroke-linecap="round" stroke-dasharray="4 4"/>
                    <rect class="ph-fill" x="101" y="51" width="29" height="24" rx="3" fill="${c}" opacity="0"/>
                    <text class="ph-fill" x="108" y="68" font-size="13" fill="${isDark() ? '#0d0818' : '#ffffff'}" opacity="0">✦</text>
                </svg>`;

            case 'gallery':
                return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width:160px;height:auto;display:block;margin:0 auto;overflow:visible">
                    <circle class="ph-stroke" data-len="502" cx="100" cy="100" r="72" fill="none" stroke="${c}" stroke-width="2"/>
                    <circle class="ph-stroke" data-len="314" cx="100" cy="100" r="44" fill="none" stroke="${c2}" stroke-width="1.5"/>
                    <line class="ph-stroke" data-len="60" x1="100" y1="56" x2="100" y2="100" stroke="${c}" stroke-width="2" stroke-linecap="round"/>
                    <line class="ph-stroke" data-len="60" x1="149" y1="72" x2="114" y2="100" stroke="${c}" stroke-width="2" stroke-linecap="round"/>
                    <line class="ph-stroke" data-len="60" x1="149" y1="128" x2="114" y2="100" stroke="${c}" stroke-width="2" stroke-linecap="round"/>
                    <line class="ph-stroke" data-len="60" x1="100" y1="144" x2="100" y2="100" stroke="${c}" stroke-width="2" stroke-linecap="round"/>
                    <line class="ph-stroke" data-len="60" x1="51" y1="128" x2="86" y2="100" stroke="${c}" stroke-width="2" stroke-linecap="round"/>
                    <line class="ph-stroke" data-len="60" x1="51" y1="72" x2="86" y2="100" stroke="${c}" stroke-width="2" stroke-linecap="round"/>
                    <circle class="ph-fill" cx="100" cy="100" r="8" fill="${c}" opacity="0"/>
                    <text class="ph-stroke" data-len="10" x="15" y="55" font-size="12" fill="${c2}" stroke="none" style="opacity:0;transition:opacity 0.4s ease">✦</text>
                    <text class="ph-stroke" data-len="10" x="168" y="155" font-size="10" fill="${c}" stroke="none" style="opacity:0;transition:opacity 0.4s ease">✦</text>
                </svg>`;

            case 'contact':
                return `<svg viewBox="0 0 220 140" xmlns="http://www.w3.org/2000/svg" style="width:200px;height:auto;display:block;margin:0 auto;overflow:visible">
                    <rect class="ph-stroke" data-len="620" x="20" y="30" width="180" height="110" rx="6" fill="none" stroke="${c}" stroke-width="2"/>
                    <line class="ph-stroke" data-len="120" x1="20" y1="30" x2="110" y2="95" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>
                    <line class="ph-stroke" data-len="120" x1="200" y1="30" x2="110" y2="95" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>
                    <line class="ph-stroke" data-len="90" x1="20" y1="140" x2="85" y2="95" stroke="${c2}" stroke-width="1.4" stroke-linecap="round"/>
                    <line class="ph-stroke" data-len="90" x1="200" y1="140" x2="135" y2="95" stroke="${c2}" stroke-width="1.4" stroke-linecap="round"/>
                    <text class="ph-fill" x="102" y="102" font-size="16" fill="${c}" opacity="0">✦</text>
                    <text class="ph-stroke" data-len="10" x="175" y="22" font-size="11" fill="${c2}" stroke="none" style="opacity:0;transition:opacity 0.4s ease">✦</text>
                    <text class="ph-stroke" data-len="10" x="22" y="20" font-size="9" fill="${c}" stroke="none" style="opacity:0;transition:opacity 0.4s ease">✦</text>
                </svg>`;

            case 'admin':
                return `<svg viewBox="0 0 160 200" xmlns="http://www.w3.org/2000/svg" style="width:120px;height:auto;display:block;margin:0 auto;overflow:visible">
                    <path class="ph-stroke" data-len="200" d="M 42 95 L 42 65 Q 42 25 80 25 Q 118 25 118 65 L 118 95" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/>
                    <rect class="ph-stroke" data-len="380" x="28" y="92" width="104" height="88" rx="10" fill="none" stroke="${c}" stroke-width="2.5"/>
                    <circle class="ph-stroke" data-len="88" cx="80" cy="128" r="14" fill="none" stroke="${c2}" stroke-width="2"/>
                    <line class="ph-stroke" data-len="22" x1="80" y1="142" x2="80" y2="162" stroke="${c2}" stroke-width="2.5" stroke-linecap="round"/>
                    <text class="ph-fill" x="68" y="125" font-size="10" fill="${c}" opacity="0">✦</text>
                </svg>`;

            default: return '';
        }
    }

})();