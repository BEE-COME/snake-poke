import { Particle2D, FlyingCoin2D } from './types';
import { gameState } from '../GameState';

export class ParticleSystem2D {
  public particles: Particle2D[] = [];
  public coins: FlyingCoin2D[] = [];

  public emitSparks(x: number, y: number, color: string, count = 6, speed = 120) {
    const isPerf = gameState.performanceMode;
    const maxParticles = isPerf ? 45 : 85;
    if (this.particles.length >= maxParticles) return;

    const actualCount = isPerf ? Math.min(3, count) : count;
    for (let i = 0; i < actualCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = (0.4 + Math.random() * 0.8) * speed;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        size: 2 + Math.random() * 2.5,
        color,
        life: 0.18 + Math.random() * 0.2,
        maxLife: 0.38,
        shape: 'SPARK'
      });
    }
  }

  public emitExplosion(x: number, y: number, color: string, count = 12, radius = 16) {
    const isPerf = gameState.performanceMode;
    const maxParticles = isPerf ? 45 : 85;
    if (this.particles.length >= maxParticles) {
      this.particles.splice(0, 10);
    }

    // Shockwave ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: radius * 0.5,
      color,
      life: 0.25,
      maxLife: 0.25,
      shape: 'RING'
    });

    const actualCount = isPerf ? Math.min(6, count) : count;
    for (let i = 0; i < actualCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 140;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 2.5 + Math.random() * 3,
        color,
        life: 0.25 + Math.random() * 0.25,
        maxLife: 0.5,
        shape: Math.random() > 0.4 ? 'CIRCLE' : 'SPARK'
      });
    }
  }

  public emitGoldChestBurst(x: number, y: number, coinCount = 6, goldPerCoin = 10, targetX = 350, targetY = 30) {
    // Golden sparkles
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 140;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 4 + Math.random() * 3,
        color: '#fbbf24',
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9,
        shape: 'STAR'
      });
    }

    // Flying Coins
    for (let i = 0; i < coinCount; i++) {
      const scatterX = x + (Math.random() - 0.5) * 40;
      const scatterY = y + (Math.random() - 0.5) * 30;
      this.coins.push({
        x: scatterX,
        y: scatterY,
        startX: scatterX,
        startY: scatterY,
        targetX,
        targetY,
        progress: 0,
        speed: 1.2 + Math.random() * 0.6,
        arcHeight: 50 + Math.random() * 60,
        goldValue: goldPerCoin
      });
    }
  }

  public update(dt: number, onCoinArrived?: (gold: number) => void) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
      if (p.shape === 'RING') {
        p.size += dt * 90;
      }
    }

    // Update flying coins
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      c.progress += dt * c.speed;
      if (c.progress >= 1) {
        if (onCoinArrived) {
          onCoinArrived(c.goldValue);
        }
        this.coins.splice(i, 1);
        continue;
      }

      // Bezier curve to target
      const t = c.progress;
      const easeT = t * t * (3 - 2 * t);
      c.x = c.startX + (c.targetX - c.startX) * easeT;
      const linearY = c.startY + (c.targetY - c.startY) * easeT;
      const arc = Math.sin(t * Math.PI) * c.arcHeight;
      c.y = linearY - arc;
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    // Draw particles
    for (const p of this.particles) {
      const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      ctx.save();
      ctx.globalAlpha = alpha;

      if (p.shape === 'RING') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'SPARK') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.75, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'STAR') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Draw flying coins (crisp stroke without blur pass)
    for (const c of this.coins) {
      ctx.save();
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner coin detail
      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', c.x, c.y + 0.5);
      ctx.restore();
    }
  }

  public clear() {
    this.particles = [];
    this.coins = [];
  }
}
