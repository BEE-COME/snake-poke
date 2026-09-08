import { Projectile2D, LaserBeam2D, LightningArc2D, FloatingText2D, Segment2D, BlackHole2D } from './types';
import { PlayerStats } from '../../types/game';

let nextProjId = 1;
let nextTextId = 1;
let nextHoleId = 1;

export class ProjectileManager2D {
  public projectiles: Projectile2D[] = [];
  public enemyOrbs: Projectile2D[] = [];
  public laserBeams: LaserBeam2D[] = [];
  public lightningArcs: LightningArc2D[] = [];
  public floatingTexts: FloatingText2D[] = [];
  public blackHoles: BlackHole2D[] = [];

  public spawnPlayerShot(
    x: number,
    y: number,
    stats: PlayerStats
  ) {
    const count = Math.max(1, stats.projectileCount);
    const speed = Math.max(900, (stats.projectileSpeed && stats.projectileSpeed > 100) ? stats.projectileSpeed : 950);
    const baseDamage = stats.damage;
    const isCrit = Math.random() < stats.critChance;
    const damage = isCrit ? baseDamage * stats.critMultiplier : baseDamage;

    if (count === 1) {
      this.projectiles.push({
        id: nextProjId++,
        x,
        y: y - 18,
        vx: 0,
        vy: -speed,
        radius: 5,
        damage,
        isCrit,
        pierce: stats.pierce || 0,
        type: 'BULLET',
        life: 5.0,
        color: isCrit ? '#f59e0b' : '#38bdf8',
        bouncesLeft: stats.ricochetCount || 0
      });
    } else {
      // Fan spread
      const spreadAngle = Math.min(0.35, 0.07 * (count - 1));
      const startAngle = -Math.PI / 2 - spreadAngle / 2;
      const angleStep = count > 1 ? spreadAngle / (count - 1) : 0;

      for (let i = 0; i < count; i++) {
        const angle = count === 1 ? -Math.PI / 2 : startAngle + i * angleStep;
        this.projectiles.push({
          id: nextProjId++,
          x: x + (i - (count - 1) / 2) * 6,
          y: y - 18,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 5,
          damage,
          isCrit,
          pierce: stats.pierce || 0,
          type: 'BULLET',
          life: 5.0,
          color: isCrit ? '#f59e0b' : '#38bdf8',
          bouncesLeft: stats.ricochetCount || 0
        });
      }
    }

    // Secondary homing missiles or fire rounds if active

    if (stats.homingStrength > 0 && Math.random() < 0.35) {
      this.projectiles.push({
        id: nextProjId++,
        x: x + (Math.random() - 0.5) * 24,
        y: y - 15,
        vx: (Math.random() - 0.5) * 100,
        vy: -speed * 0.85,
        radius: 5,
        damage: baseDamage * 1.5,
        isCrit: true,
        pierce: 0,
        type: 'MISSILE',
        life: 5.0,
        color: '#f43f5e',
        homingStrength: stats.homingStrength
      });
    }
  }

  public spawnShrapnel(x: number, y: number, count: number, damage: number) {
    const speed = 650;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      this.projectiles.push({
        id: nextProjId++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3.5,
        damage,
        isCrit: false,
        pierce: 0,
        type: 'SHRAPNEL',
        life: 0.65,
        color: '#f97316'
      });
    }
  }

  public spawnDroneShot(x: number, y: number, targetX: number, targetY: number, damage: number) {
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = 1050;
    this.projectiles.push({
      id: nextProjId++,
      x,
      y,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      radius: 4,
      damage,
      isCrit: false,
      pierce: 1,
      type: 'DRONE_BULLET',
      life: 2.0,
      color: '#a855f7'
    });
  }

  public spawnBlackHole(x: number, y: number, radius = 95, pullStrength = 180, life = 2.8, tickDamage = 35) {
    this.blackHoles.push({
      id: nextHoleId++,
      x,
      y,
      radius,
      pullStrength,
      life,
      maxLife: life,
      tickDamage
    });
  }

  public spawnEnemyOrb(x: number, y: number, vx: number, vy: number, damage = 12) {
    this.enemyOrbs.push({
      id: nextProjId++,
      x,
      y,
      vx,
      vy,
      radius: 6,
      damage,
      isCrit: false,
      pierce: 0,
      type: 'ENEMY_ORB',
      life: 3.5,
      color: '#ef4444'
    });
  }

  public addLaserBeam(x1: number, y1: number, x2: number, y2: number, color = '#38bdf8', width = 6) {
    this.laserBeams.push({
      x1,
      y1,
      x2,
      y2,
      width,
      color,
      life: 0.16,
      maxLife: 0.16
    });
  }

  public addLightningArc(from: { x: number; y: number }, to: { x: number; y: number }, color = '#60a5fa') {
    const points: { x: number; y: number }[] = [from];
    const steps = 4;
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      const jiggle = (Math.random() - 0.5) * 20;
      points.push({
        x: from.x + dx * t + jiggle,
        y: from.y + dy * t + jiggle
      });
    }
    points.push(to);

    this.lightningArcs.push({
      points,
      life: 0.18,
      maxLife: 0.18,
      color
    });
  }

  public addFloatingText(x: number, y: number, text: string, color = '#ffffff', isCrit = false) {
    this.floatingTexts.push({
      id: nextTextId++,
      x: x + (Math.random() - 0.5) * 16,
      y: y + (Math.random() - 0.5) * 8,
      text,
      color,
      size: isCrit ? 16 : 12,
      life: 0.7,
      maxLife: 0.7,
      vy: -55,
      isCrit
    });
  }

  public update(
    dt: number,
    screenWidth: number,
    screenHeight: number,
    closestSegment?: Segment2D
  ) {
    // 1. Update player projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      if (p.life <= 0 || p.y < -80 || p.y > screenHeight + 80 || p.x < -80 || p.x > screenWidth + 80) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Homing steer
      if (p.type === 'MISSILE' && closestSegment && p.homingStrength) {
        const dx = closestSegment.x - p.x;
        const dy = closestSegment.y - p.y;
        const targetAngle = Math.atan2(dy, dx);
        const currentAngle = Math.atan2(p.vy, p.vx);
        const diff = targetAngle - currentAngle;
        const newAngle = currentAngle + diff * dt * 4.0;
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        p.vx = Math.cos(newAngle) * spd;
        p.vy = Math.sin(newAngle) * spd;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    // 2. Update enemy orbs
    for (let i = this.enemyOrbs.length - 1; i >= 0; i--) {
      const o = this.enemyOrbs[i];
      o.life -= dt;
      if (o.life <= 0 || o.y > screenHeight + 30) {
        this.enemyOrbs.splice(i, 1);
        continue;
      }
      o.x += o.vx * dt;
      o.y += o.vy * dt;
    }

    // 3. Update laser beams
    for (let i = this.laserBeams.length - 1; i >= 0; i--) {
      const b = this.laserBeams[i];
      b.life -= dt;
      if (b.life <= 0) {
        this.laserBeams.splice(i, 1);
      }
    }

    // 4. Update lightning arcs
    for (let i = this.lightningArcs.length - 1; i >= 0; i--) {
      const arc = this.lightningArcs[i];
      arc.life -= dt;
      if (arc.life <= 0) {
        this.lightningArcs.splice(i, 1);
      }
    }

    // 5. Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      t.y += t.vy * dt;
    }

    // 6. Update black holes
    for (let i = this.blackHoles.length - 1; i >= 0; i--) {
      const bh = this.blackHoles[i];
      bh.life -= dt;
      if (bh.life <= 0) {
        this.blackHoles.splice(i, 1);
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    // Draw black holes
    for (const bh of this.blackHoles) {
      const progress = 1 - bh.life / bh.maxLife;
      const pulse = 1 + Math.sin(progress * 25) * 0.08;
      const r = bh.radius * pulse;

      ctx.save();
      // Outer distortion accretion aura
      const grad = ctx.createRadialGradient(bh.x, bh.y, r * 0.2, bh.x, bh.y, r);
      grad.addColorStop(0, 'rgba(126, 34, 206, 0.6)');
      grad.addColorStop(0.6, 'rgba(76, 29, 149, 0.3)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(bh.x, bh.y, r, 0, Math.PI * 2);
      ctx.fill();

      // Swirling gravitational vortex ring
      ctx.save();
      ctx.translate(bh.x, bh.y);
      ctx.rotate(Date.now() * 0.006);
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 12]);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Dark Event Horizon center
      ctx.fillStyle = '#090514';
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bh.x, bh.y, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    // Draw lasers
    for (const b of this.laserBeams) {
      const alpha = Math.max(0, b.life / b.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.width;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();

      // White inner core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = b.width * 0.4;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw lightning arcs
    for (const arc of this.lightningArcs) {
      const alpha = Math.max(0, arc.life / arc.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = arc.color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#60a5fa';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      for (let pIdx = 0; pIdx < arc.points.length; pIdx++) {
        const p = arc.points[pIdx];
        if (pIdx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Draw player projectiles
    for (const p of this.projectiles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;

      if (p.type === 'ICE') {
        // Diamond ice shard
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - p.radius * 1.5);
        ctx.lineTo(p.x + p.radius, p.y);
        ctx.lineTo(p.x, p.y + p.radius * 1.5);
        ctx.lineTo(p.x - p.radius, p.y);
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'MISSILE') {
        // Red warhead
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(p.x, p.y + 4, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const angle = Math.atan2(p.vy, p.vx) + Math.PI / 2;
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);

        // Faint glowing tail trail
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.moveTo(-p.radius * 0.7, 0);
        ctx.lineTo(p.radius * 0.7, 0);
        ctx.lineTo(0, 16);
        ctx.closePath();
        ctx.fill();

        // Main plasma core capsule
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.radius * 0.85, p.radius * 2.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // White hot center
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, -2, p.radius * 0.45, p.radius * 1.3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Draw enemy orbs
    for (const o of this.enemyOrbs) {
      ctx.save();
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Draw floating texts
    for (const t of this.floatingTexts) {
      const alpha = Math.max(0, t.life / t.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = t.color;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.font = t.isCrit ? `bold ${t.size}px sans-serif` : `bold ${t.size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
  }

  public clear() {
    this.projectiles = [];
    this.enemyOrbs = [];
    this.laserBeams = [];
    this.lightningArcs = [];
    this.floatingTexts = [];
  }
}
