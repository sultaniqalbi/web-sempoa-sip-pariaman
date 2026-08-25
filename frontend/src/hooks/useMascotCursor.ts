import { useEffect } from 'react';

export function useMascotCursor() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (document.getElementById('custom-mascot-cursor')) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    const init = () => {
      if (cancelled) return;
      if (document.getElementById('custom-mascot-cursor')) return;

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
        opacity: 0;
        transition: opacity 0.2s ease;
      `;

      const img = document.createElement('img');
      img.src = '/assets/image/custom-cursor.webp';
      img.alt = '';
      img.onerror = () => {
        img.src = '/assets/image/custom-cursor.webp';
      };
      img.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.15));
        transform-origin: center center;
        will-change: transform;
        display: block;
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

      const targetContainer = document.body || document.documentElement;
      targetContainer.appendChild(canvas);
      targetContainer.appendChild(cursor);

      // CSS animation override
      const style = document.createElement('style');
      style.id = 'custom-mascot-cursor-style';
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
      interface Particle {
        x: number;
        y: number;
        vx: number;
        vy: number;
        size: number;
        maxSize: number;
        color: string;
        alpha: number;
        decay: number;
      }
      let particles: Particle[] = [];
      const MAX_PARTICLES = 15;

      if (savedX !== null && savedY !== null) {
        cursor.style.transform = `translate3d(${mouseX - 12}px, ${mouseY - 8}px, 0)`;
        cursor.style.opacity = '1';
      }

      const softColors = ['#FFEB3B', '#FFB74D', '#FFFFFF', '#FFE082'];
      let lastStorageSave = 0;
      let isLoopRunning = false;

      const handleMouseMove = (e: MouseEvent) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursor.style.opacity = '1';
        cursor.style.transform = `translate3d(${mouseX - 12}px, ${mouseY - 8}px, 0)`;

        const now = Date.now();
        if (now - lastStorageSave > 400) {
          sessionStorage.setItem('sempoa_cur_x', mouseX.toString());
          sessionStorage.setItem('sempoa_cur_y', mouseY.toString());
          lastStorageSave = now;
        }

        const dist = Math.hypot(mouseX - lastX, mouseY - lastY);
        if (dist > 15 && particles.length < MAX_PARTICLES) {
          spawnSmokePuff(mouseX, mouseY);
          lastX = mouseX;
          lastY = mouseY;
        }
      };

      function spawnSmokePuff(x: number, y: number, isClick = false) {
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

      function renderSmoke() {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.size += (p.maxSize - p.size) * 0.08;
          p.alpha -= p.decay;

          if (p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fill();
        }

        if (particles.length > 0) {
          requestAnimationFrame(renderSmoke);
        } else {
          isLoopRunning = false;
        }
      }

      let isAnimating = false;
      const handleMouseDown = (e: MouseEvent) => {
        spawnSmokePuff(e.clientX, e.clientY, true);
        if (!isAnimating) {
          isAnimating = true;
          img.classList.remove('mascot-jump-anim');
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              img.classList.add('mascot-jump-anim');
            });
          });
          setTimeout(() => {
            img.classList.remove('mascot-jump-anim');
            isAnimating = false;
          }, 750);
        }
      };

      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('mousedown', handleMouseDown, { passive: true });

      cleanup = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('resize', resizeCanvas);
        cursor.remove();
        canvas.remove();
        style.remove();
      };
    };

    const idleId = 'requestIdleCallback' in window
      ? (window as any).requestIdleCallback(init, { timeout: 3000 })
      : window.setTimeout(init, 2000);

    return () => {
      cancelled = true;
      if ('cancelIdleCallback' in window) {
        (window as any).cancelIdleCallback(idleId);
      } else {
        clearTimeout(idleId);
      }
      cleanup?.();
    };
  }, []);
}

export default useMascotCursor;
