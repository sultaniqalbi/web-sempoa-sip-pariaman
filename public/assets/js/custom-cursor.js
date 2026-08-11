/**
 * Custom Mascot Cursor & Ultra-Fast Soft Smoke Trail (Zero-RAM Overhead GPU Composited)
 */

(function () {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    // Create Custom Cursor Element (GPU Composited)
    const cursor = document.createElement('div');
    cursor.id = 'custom-mascot-cursor';
    cursor.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 42px;
        height: 42px;
        pointer-events: none;
        z-index: 9999999;
        will-change: transform;
        transform: translate3d(-100px, -100px, 0);
    `;

    const img = document.createElement('img');
    img.src = 'public/assets/image/custom-cursor.png';
    img.alt = 'Cursor Mascot';
    img.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.15));
        transform-origin: center center;
        will-change: transform;
    `;
    cursor.appendChild(img);

    // Create Particle Canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'cursor-smoke-canvas';
    canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 9999998;
    `;
    const ctx = canvas.getContext('2d', { alpha: true });

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas, { passive: true });
    resizeCanvas();

    document.documentElement.appendChild(canvas);
    document.documentElement.appendChild(cursor);

    // CSS animation override
    const style = document.createElement('style');
    style.innerHTML = `
        body, a, button, input, select, textarea, label, [role="button"] {
            cursor: none !important;
        }

        @keyframes mascotFlipJumpSmooth {
            0% { transform: scaleX(1) translateY(0); }
            35% { transform: scaleX(-1) translateY(-14px) rotate(-6deg); }
            50% { transform: scaleX(-1) translateY(-20px) rotate(0deg); }
            70% { transform: scaleX(1) translateY(-8px) rotate(4deg); }
            100% { transform: scaleX(1) translateY(0) rotate(0deg); }
        }

        .mascot-jump-anim {
            animation: mascotFlipJumpSmooth 0.75s cubic-bezier(0.33, 1, 0.68, 1) forwards !important;
        }
    `;
    document.head.appendChild(style);

    // Tracking
    let savedX = sessionStorage.getItem('sempoa_cur_x');
    let savedY = sessionStorage.getItem('sempoa_cur_y');
    let mouseX = savedX !== null ? parseFloat(savedX) : -100;
    let mouseY = savedY !== null ? parseFloat(savedY) : -100;
    let lastX = mouseX;
    let lastY = mouseY;
    let particles = [];
    const MAX_PARTICLES = 15; // Ultra lightweight cap

    if (savedX !== null && savedY !== null) {
        cursor.style.transform = `translate3d(${mouseX - 12}px, ${mouseY - 8}px, 0)`;
    }

    const softColors = ['#FFEB3B', '#FFB74D', '#FFFFFF', '#FFE082'];
    let lastStorageSave = 0;
    let isLoopRunning = false;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        // Hardware accelerated GPU translate3d (0 CPU layout reflows)
        cursor.style.transform = `translate3d(${mouseX - 12}px, ${mouseY - 8}px, 0)`;

        const now = Date.now();
        if (now - lastStorageSave > 400) {
            sessionStorage.setItem('sempoa_cur_x', mouseX);
            sessionStorage.setItem('sempoa_cur_y', mouseY);
            lastStorageSave = now;
        }

        const dist = Math.hypot(mouseX - lastX, mouseY - lastY);
        if (dist > 15 && particles.length < MAX_PARTICLES) {
            spawnSmokePuff(mouseX, mouseY);
            lastX = mouseX;
            lastY = mouseY;
        }
    }, { passive: true });

    function spawnSmokePuff(x, y, isClick = false) {
        const count = isClick ? 3 : 1;
        for (let i = 0; i < count; i++) {
            if (particles.length >= MAX_PARTICLES) particles.shift();
            particles.push({
                x: x + (Math.random() * 4 - 2),
                y: y + (Math.random() * 4 - 2),
                vx: (Math.random() - 0.5) * 0.3,
                vy: -0.4 - Math.random() * 0.2,
                size: isClick ? 7 : 4,
                maxSize: isClick ? 16 : 12,
                color: softColors[Math.floor(Math.random() * softColors.length)],
                alpha: isClick ? 0.4 : 0.25,
                decay: 0.02 + Math.random() * 0.01
            });
        }

        if (!isLoopRunning) {
            isLoopRunning = true;
            requestAnimationFrame(renderSmoke);
        }
    }

    // Click handler
    let isAnimating = false;
    window.addEventListener('mousedown', (e) => {
        if (!isAnimating) {
            isAnimating = true;
            img.classList.remove('mascot-jump-anim');
            void img.offsetWidth;
            img.classList.add('mascot-jump-anim');
            spawnSmokePuff(e.clientX, e.clientY, true);
        }
    }, { passive: true });

    img.addEventListener('animationend', () => {
        img.classList.remove('mascot-jump-anim');
        isAnimating = false;
    });

    // Zero-overhead renderer (Pauses completely when no particles)
    function renderSmoke() {
        if (particles.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            isLoopRunning = false;
            return; // STOP animation frame loop when idle!
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.size += (p.maxSize - p.size) * 0.06;
            p.alpha -= p.decay;

            if (p.alpha <= 0) {
                particles.splice(i, 1);
                continue;
            }

            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        requestAnimationFrame(renderSmoke);
    }
})();
