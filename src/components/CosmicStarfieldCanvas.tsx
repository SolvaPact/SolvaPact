import React, { useEffect, useRef } from 'react';
import { LoyaltyTier } from '../types';

interface CosmicStarfieldCanvasProps {
  tier: LoyaltyTier;
}

interface TwinkleStar {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  phase: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  alpha: number;
  color: string;
  width: number;
}

function getTierStarColors(tier: LoyaltyTier): {
  primary: string;
  secondary: string;
  glow: string;
} {
  switch (tier) {
    case 'diamond':
      return {
        primary: '#22d3ee', // Cyan Diamond
        secondary: '#a5f3fc',
        glow: 'rgba(34, 211, 238, 0.85)',
      };
    case 'gold':
      return {
        primary: '#fbbf24', // Luminous Gold
        secondary: '#fef08a',
        glow: 'rgba(251, 191, 36, 0.85)',
      };
    case 'silver':
      return {
        primary: '#e2e8f0', // Radiant Silver
        secondary: '#ffffff',
        glow: 'rgba(226, 232, 240, 0.85)',
      };
    case 'bronze':
      return {
        primary: '#fb923c', // Warm Bronze
        secondary: '#fdba74',
        glow: 'rgba(251, 146, 60, 0.85)',
      };
    default:
      return {
        primary: '#60a5fa', // Electric Blue
        secondary: '#bfdbfe',
        glow: 'rgba(96, 165, 250, 0.8)',
      };
  }
}

export const CosmicStarfieldCanvas: React.FC<CosmicStarfieldCanvasProps> = ({ tier }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const palette = getTierStarColors(tier);
    let animationId = 0;
    let width = 0;
    let height = 0;

    const stars: TwinkleStar[] = [];
    const shootingStars: ShootingStar[] = [];

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = parent.clientWidth || 760;
      height = parent.clientHeight || 620;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (stars.length === 0) {
        const count = 85;
        for (let i = 0; i < count; i++) {
          stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 1.9 + 0.6,
            baseAlpha: Math.random() * 0.55 + 0.35,
            twinkleSpeed: Math.random() * 0.04 + 0.015,
            phase: Math.random() * Math.PI * 2,
            color: i % 3 === 0 ? palette.secondary : palette.primary,
          });
        }
      }
    };

    const spawnShootingStar = () => {
      const startFromTop = Math.random() > 0.35;
      const x = startFromTop ? Math.random() * width * 0.95 : width + 20;
      const y = startFromTop ? -20 : Math.random() * height * 0.45;
      const speed = Math.random() * 5.5 + 5.5;
      const angle = (Math.PI * 138) / 180 + (Math.random() - 0.5) * 0.14;
      shootingStars.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: Math.random() * 90 + 70,
        alpha: 1,
        color: Math.random() > 0.3 ? palette.primary : palette.secondary,
        width: Math.random() * 1.5 + 1.4,
      });
    };

    resize();
    window.addEventListener('resize', resize);

    // Seed initial shooting stars for immediate visual feedback
    spawnShootingStar();
    spawnShootingStar();

    let frame = 0;
    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Subtle futuristic cosmic blue nebula aura
      const nebula = ctx.createRadialGradient(
        width * 0.5,
        height * 0.25,
        20,
        width * 0.5,
        height * 0.45,
        Math.max(width, height) * 0.75
      );
      nebula.addColorStop(0, 'rgba(30, 88, 200, 0.28)');
      nebula.addColorStop(0.5, 'rgba(15, 45, 115, 0.14)');
      nebula.addColorStop(1, 'rgba(3, 10, 32, 0)');
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, width, height);

      // Twinkling loyalty-colored stars
      for (const star of stars) {
        star.phase += star.twinkleSpeed;
        const pulse = (Math.sin(star.phase) + 1) * 0.5;
        const alpha = Math.min(1, star.baseAlpha * (0.45 + 0.55 * pulse));

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = star.color;
        ctx.shadowBlur = star.radius * 5;
        ctx.shadowColor = palette.glow;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();

        // Sparkle cross on larger stars
        if (star.radius > 1.7 && pulse > 0.7) {
          ctx.strokeStyle = palette.secondary;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(star.x - 4, star.y);
          ctx.lineTo(star.x + 4, star.y);
          ctx.moveTo(star.x, star.y - 4);
          ctx.lineTo(star.x, star.y + 4);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Periodically spawn shooting stars streaming across the modal
      if (frame % 38 === 0 && shootingStars.length < 7) {
        spawnShootingStar();
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= 0.008;

        if (s.alpha <= 0 || s.x < -160 || s.y > height + 160) {
          shootingStars.splice(i, 1);
          continue;
        }

        const norm = Math.hypot(s.vx, s.vy) || 1;
        const tailX = s.x - (s.vx / norm) * s.length;
        const tailY = s.y - (s.vy / norm) * s.length;

        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(0.55, s.color);
        grad.addColorStop(1, '#ffffff');

        ctx.save();
        ctx.globalAlpha = Math.max(0, s.alpha);
        ctx.strokeStyle = grad;
        ctx.lineWidth = s.width;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = palette.glow;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();

        // Bright star head
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.width * 1.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationId = window.requestAnimationFrame(render);
    };

    animationId = window.requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(animationId);
    };
  }, [tier]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
    />
  );
};
