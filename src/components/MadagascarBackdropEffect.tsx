import React, { useEffect, useRef } from 'react';

interface BokehOrb {
  baseX: number;
  baseY: number;
  radius: number;
  speedX: number;
  speedY: number;
  phase: number;
  color: string;
}

export const MadagascarBackdropEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let animationId = 0;
    let width = 0;
    let height = 0;

    const orbs: BokehOrb[] = [
      {
        baseX: 0.16,
        baseY: 0.18,
        radius: 260,
        speedX: 0.00045,
        speedY: 0.00032,
        phase: 0.2,
        color: 'rgba(255, 255, 255, 0.09)', // Blanc Madagascar
      },
      {
        baseX: 0.82,
        baseY: 0.22,
        radius: 310,
        speedX: 0.00038,
        speedY: 0.00041,
        phase: 1.8,
        color: 'rgba(252, 61, 50, 0.20)', // Rouge Madagascar (#FC3D32)
      },
      {
        baseX: 0.54,
        baseY: 0.56,
        radius: 320,
        speedX: 0.00031,
        speedY: 0.00027,
        phase: 3.1,
        color: 'rgba(234, 88, 12, 0.14)', // Terre rouge / orange chaud
      },
      {
        baseX: 0.24,
        baseY: 0.78,
        radius: 330,
        speedX: 0.00035,
        speedY: 0.00036,
        phase: 4.4,
        color: 'rgba(0, 166, 81, 0.20)', // Vert Madagascar (#00A651)
      },
      {
        baseX: 0.84,
        baseY: 0.82,
        radius: 280,
        speedX: 0.00042,
        speedY: 0.00029,
        phase: 5.5,
        color: 'rgba(0, 126, 58, 0.18)', // Vert émeraude (#007E3A)
      },
    ];

    const resize = () => {
      const parent = canvas.parentElement;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = parent ? parent.clientWidth : window.innerWidth;
      height = parent ? parent.clientHeight : window.innerHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    let time = 0;

    const drawSilkWave = (
      yFactor: number,
      amplitude: number,
      frequency: number,
      speed: number,
      phaseOffset: number,
      strokeColor: string,
      fillColorTop: string,
      lineWidth: number
    ) => {
      const baseY = height * yFactor;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 24) {
        const wave =
          Math.sin(x * frequency + time * speed + phaseOffset) * amplitude +
          Math.cos(x * (frequency * 0.55) - time * (speed * 0.7) + phaseOffset) *
            (amplitude * 0.45);
        ctx.lineTo(x, baseY + wave);
      }
      ctx.lineTo(width, height);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, baseY - amplitude * 1.4, 0, baseY + 260);
      grad.addColorStop(0, fillColorTop);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fill();

      // Subtle glowing ribbon crest
      ctx.beginPath();
      for (let x = 0; x <= width; x += 24) {
        const wave =
          Math.sin(x * frequency + time * speed + phaseOffset) * amplitude +
          Math.cos(x * (frequency * 0.55) - time * (speed * 0.7) + phaseOffset) *
            (amplitude * 0.45);
        if (x === 0) ctx.moveTo(x, baseY + wave);
        else ctx.lineTo(x, baseY + wave);
      }
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
      ctx.restore();
    };

    const renderFrame = () => {
      ctx.clearRect(0, 0, width, height);

      // Drifting Madagascar tricolor ambient aurora halos (Blanc, Rouge, Vert)
      for (const orb of orbs) {
        const cx =
          width * orb.baseX + Math.sin(time * orb.speedX * 60 + orb.phase) * (width * 0.06);
        const cy =
          height * orb.baseY + Math.cos(time * orb.speedY * 60 + orb.phase) * (height * 0.05);
        const r = orb.radius * Math.max(0.9, Math.min(1.45, width / 1100));

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, orb.color);
        grad.addColorStop(0.55, orb.color.replace(/[\d.]+\)$/, '0.06)'));
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // Three flowing silk ribbons in Madagascar colors (White, Red-Orange, Emerald Green)
      drawSilkWave(
        0.26,
        32,
        0.0026,
        0.012,
        0.4,
        'rgba(255, 255, 255, 0.16)',
        'rgba(255, 255, 255, 0.045)',
        1.5
      );
      drawSilkWave(
        0.52,
        42,
        0.0021,
        0.0095,
        2.1,
        'rgba(252, 61, 50, 0.28)',
        'rgba(252, 61, 50, 0.065)',
        2
      );
      drawSilkWave(
        0.77,
        38,
        0.0024,
        0.011,
        4.0,
        'rgba(0, 166, 81, 0.30)',
        'rgba(0, 166, 81, 0.07)',
        2
      );

      if (!prefersReducedMotion) {
        time += 1;
        animationId = window.requestAnimationFrame(renderFrame);
      }
    };

    renderFrame();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationId) window.cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
    />
  );
};
