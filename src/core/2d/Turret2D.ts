import { PlayerStats } from '../../types/game';

export class Turret2D {
  public x = 200;
  public y = 700;
  public targetX = 200;
  public width = 48;
  public height = 40;
  public recoil = 0;
  public muzzleFlashTimer = 0;
  public droneAngle = 0;

  public update(dt: number, screenWidth: number, screenHeight: number) {
    // Defense line is around height - 85, Turret sits at height - 55
    this.y = screenHeight - 55;

    // Smooth horizontal tracking
    const minX = 35;
    const maxX = screenWidth - 35;
    this.targetX = Math.max(minX, Math.min(maxX, this.targetX));
    this.x += (this.targetX - this.x) * 0.24;

    // Recoil recovery
    if (this.recoil > 0) {
      this.recoil = Math.max(0, this.recoil - dt * 25);
    }
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
    }

    // Satellite drone orbit
    this.droneAngle += dt * 3.0;
  }

  public onFire() {
    this.recoil = 6;
    this.muzzleFlashTimer = 0.08;
  }

  public draw(ctx: CanvasRenderingContext2D, stats: PlayerStats, combo: number) {
    ctx.save();

    // 1. Energy Shield Bubble (if shield active)
    if (stats.shield > 0) {
      const shieldPulse = 1 + Math.sin(Date.now() * 0.005) * 0.05;
      const shieldRadius = 32 * shieldPulse;
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 12;
      ctx.fillStyle = 'rgba(14, 165, 233, 0.15)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, shieldRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 2. Barrels (with dynamic recoil)
    const barrelY = this.y - 12 + this.recoil;
    const barrelCount = stats.projectileCount >= 3 ? 3 : 2;

    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;

    if (barrelCount === 2) {
      // Twin barrels
      ctx.fillRect(this.x - 9, barrelY - 14, 5, 16);
      ctx.strokeRect(this.x - 9, barrelY - 14, 5, 16);
      ctx.fillRect(this.x + 4, barrelY - 14, 5, 16);
      ctx.strokeRect(this.x + 4, barrelY - 14, 5, 16);

      // Muzzle Flash
      if (this.muzzleFlashTimer > 0) {
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(this.x - 6.5, barrelY - 16, 5, 0, Math.PI * 2);
        ctx.arc(this.x + 6.5, barrelY - 16, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Triple barrels
      ctx.fillRect(this.x - 12, barrelY - 12, 4, 14);
      ctx.fillRect(this.x - 2, barrelY - 16, 4, 18);
      ctx.fillRect(this.x + 8, barrelY - 12, 4, 14);

      if (this.muzzleFlashTimer > 0) {
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(this.x, barrelY - 18, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Turret Chassis Body
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = combo >= 10 ? '#f59e0b' : '#38bdf8';
    ctx.lineWidth = 2;

    // Hexagonal armored cockpit
    ctx.beginPath();
    ctx.moveTo(this.x - 20, this.y + 12);
    ctx.lineTo(this.x - 16, this.y - 8);
    ctx.lineTo(this.x + 16, this.y - 8);
    ctx.lineTo(this.x + 20, this.y + 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing core reactor
    ctx.shadowColor = combo >= 10 ? '#fbbf24' : '#38bdf8';
    ctx.shadowBlur = 14;
    ctx.fillStyle = combo >= 10 ? '#f59e0b' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(this.x, this.y + 2, 6, 0, Math.PI * 2);
    ctx.fill();

    // Core highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y + 2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 4. Satellite Drones (if unlocked)
    if (stats.satelliteCount > 0) {
      const droneDist = 44;
      for (let d = 0; d < stats.satelliteCount; d++) {
        const angle = this.droneAngle + (d * (Math.PI * 2)) / stats.satelliteCount;
        const dx = this.x + Math.cos(angle) * droneDist;
        const dy = this.y + Math.sin(angle) * (droneDist * 0.45);

        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(dx, dy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Connecting energy tether
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(dx, dy);
        ctx.stroke();
      }
    }

    // 5. Combat Drone Companion (if unlocked)
    if (stats.droneActive) {
      const droneHoverY = this.y - 48 + Math.sin(Date.now() * 0.005) * 5;
      const droneX = this.x - 38;

      ctx.save();
      ctx.fillStyle = '#a855f7';
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 10;

      // Drone hull
      ctx.beginPath();
      ctx.moveTo(droneX, droneHoverY - 7);
      ctx.lineTo(droneX + 10, droneHoverY + 5);
      ctx.lineTo(droneX - 10, droneHoverY + 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Drone scanner eye
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(droneX, droneHoverY + 1, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  public getSatellitePositions(stats: PlayerStats): { x: number; y: number; radius: number }[] {
    const positions: { x: number; y: number; radius: number }[] = [];
    if (stats.satelliteCount <= 0) return positions;

    const droneDist = 44;
    for (let d = 0; d < stats.satelliteCount; d++) {
      const angle = this.droneAngle + (d * (Math.PI * 2)) / stats.satelliteCount;
      positions.push({
        x: this.x + Math.cos(angle) * droneDist,
        y: this.y + Math.sin(angle) * (droneDist * 0.45),
        radius: 6
      });
    }
    return positions;
  }
}
