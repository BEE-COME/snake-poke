import { MultiplierGate2D, Projectile2D } from './types';
import { sounds } from '../../audio/SoundSystem';

export class MultiplierGateManager2D {
  public windowGate: MultiplierGate2D | null = null;
  private nextId = 1000;

  // Window physical properties
  private windowX: number = 200;
  private windowVx: number = 135; // Pixels per second horizontal movement
  private windowWidth: number = 130;
  private windowHeight: number = 44;
  private pulsePhase: number = 0;
  private currentMultiplier: number = 0; // 2, 3, or 5
  private isActive: boolean = false;
  public onScreenSegments: number = 0;

  public init(screenWidth: number, screenHeight: number) {
    this.windowX = screenWidth * 0.5;
    this.windowVx = 135;
    this.pulsePhase = 0;
    this.updateWindow(0, screenWidth, screenHeight, 0);
  }

  /**
   * Updates the tactical multiplier window:
   * Position: Bottom 1/4 of the screen (y = screenHeight * 0.75)
   * Movement: Oscillates left and right back and forth
   * Tiers based on segments present on field (玩家能看见的场上节数):
   *   > 20 segments: *5 window (★ ×5 终极倍率窗口)
   *   > 10 segments: *3 window (◆ ×3 强化倍率窗口)
   *   > 5 segments: *2 window (▲ ×2 战术倍率窗口)
   *   <= 5 segments: Inactive / hidden (自动隐藏并待命)
   */
  public update(dt: number, screenWidth: number, screenHeight: number, onScreenSegments: number) {
    this.onScreenSegments = onScreenSegments;
    this.updateWindow(dt, screenWidth, screenHeight, onScreenSegments);
  }

  private updateWindow(dt: number, screenWidth: number, screenHeight: number, onScreenSegments: number) {
    // 1. Determine active multiplier tier based on on-screen segments visible to player
    let targetMultiplier = 0;
    if (onScreenSegments > 20) {
      targetMultiplier = 5;
    } else if (onScreenSegments > 10) {
      targetMultiplier = 3;
    } else if (onScreenSegments > 5) {
      targetMultiplier = 2;
    } else {
      targetMultiplier = 0; // Inactive when <= 5 on-screen segments
    }

    this.currentMultiplier = targetMultiplier;
    this.isActive = targetMultiplier > 0;

    if (!this.isActive) {
      this.windowGate = null;
      return;
    }

    // 2. Window width responsive to screen
    this.windowWidth = Math.min(136, Math.max(110, screenWidth * 0.30));
    this.windowHeight = 44;

    // 3. Horizontal oscillation back and forth (左右来回移动)
    this.windowX += this.windowVx * dt;
    const halfW = this.windowWidth * 0.5;
    const minX = halfW + 16;
    const maxX = screenWidth - halfW - 16;

    if (this.windowX < minX) {
      this.windowX = minX;
      this.windowVx = Math.abs(this.windowVx);
    } else if (this.windowX > maxX) {
      this.windowX = maxX;
      this.windowVx = -Math.abs(this.windowVx);
    }

    // 4. Fixed at bottom 1/4 of the screen (下方 1/4 位置)
    const windowY = screenHeight * 0.75;
    this.pulsePhase = (this.pulsePhase + dt * 4.5) % (Math.PI * 2);

    // 5. Visual attributes per multiplier tier
    let label = '×2';
    let subLabel = '战术倍率 (场上>5节)';
    let color = '#38bdf8';
    let glowColor = '#0284c7';

    if (targetMultiplier === 5) {
      label = '★ ×5';
      subLabel = '终极倍率 (场上>20节)';
      color = '#f43f5e';
      glowColor = '#e11d48';
    } else if (targetMultiplier === 3) {
      label = '◆ ×3';
      subLabel = '强化倍率 (场上>10节)';
      color = '#c084fc';
      glowColor = '#9333ea';
    } else if (targetMultiplier === 2) {
      label = '▲ ×2';
      subLabel = '战术倍率 (场上>5节)';
      color = '#38bdf8';
      glowColor = '#0284c7';
    }

    if (!this.windowGate) {
      this.windowGate = {
        id: this.nextId++,
        x: this.windowX,
        y: windowY,
        width: this.windowWidth,
        height: this.windowHeight,
        type: targetMultiplier === 5 ? 'MULTIPLY_5' : targetMultiplier === 3 ? 'MULTIPLY_3' : 'MULTIPLY_2',
        label,
        subLabel,
        multiplier: targetMultiplier,
        hits: 0,
        maxHitsForUpgrade: 999,
        color,
        glowColor,
        pulse: this.pulsePhase,
        vy: 0,
        vx: this.windowVx,
        baseX: this.windowX,
        minY: windowY,
        maxY: windowY
      };
    } else {
      this.windowGate.x = this.windowX;
      this.windowGate.y = windowY;
      this.windowGate.width = this.windowWidth;
      this.windowGate.height = this.windowHeight;
      this.windowGate.type = targetMultiplier === 5 ? 'MULTIPLY_5' : targetMultiplier === 3 ? 'MULTIPLY_3' : 'MULTIPLY_2';
      this.windowGate.label = label;
      this.windowGate.subLabel = subLabel;
      this.windowGate.multiplier = targetMultiplier;
      this.windowGate.color = color;
      this.windowGate.glowColor = glowColor;
      this.windowGate.pulse = this.pulsePhase;
    }
  }

  /**
   * Checks player bullets passing through the moving multiplier window
   */
  public checkBulletInteractions(
    projectiles: Projectile2D[],
    onSpawnBullet: (bullet: Projectile2D) => void,
    onGateHit?: (gate: MultiplierGate2D) => void
  ) {
    if (!this.isActive || !this.windowGate) return;

    const gate = this.windowGate;
    const halfW = gate.width * 0.5;
    const halfH = gate.height * 0.5;
    const gx1 = gate.x - halfW;
    const gx2 = gate.x + halfW;
    const gy1 = gate.y - halfH;
    const gy2 = gate.y + halfH;

    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      if (p.type === 'ENEMY_ORB') continue;
      // Only bullets moving upwards through the portal
      if (p.vy >= 0) continue;
      if (p.lastGateId === gate.id) continue;

      // Check bounding box intersection
      if (p.x >= gx1 && p.x <= gx2 && p.y >= gy1 && p.y <= gy2) {
        p.lastGateId = gate.id;
        gate.hits++;

        if (onGateHit) onGateHit(gate);

        const spd = Math.hypot(p.vx, p.vy) || 900;
        const baseAngle = Math.atan2(p.vy, p.vx);

        if (gate.multiplier === 5) {
          // ×5 Volley Fan
          p.damage = Math.round(p.damage * 1.30);
          p.color = '#f43f5e';
          p.radius = Math.min(9, p.radius + 1.5);

          const angles = [-0.18, -0.09, 0.09, 0.18];
          for (const offset of angles) {
            const angle = baseAngle + offset;
            onSpawnBullet({
              ...p,
              id: Math.random() * 1000000 | 0,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd,
              color: '#fb7185',
              lastGateId: gate.id
            });
          }
        } else if (gate.multiplier === 3) {
          // ×3 Triple Spray
          p.damage = Math.round(p.damage * 1.20);
          p.color = '#c084fc';
          p.radius = Math.min(8.5, p.radius + 1);

          const angles = [-0.12, 0.12];
          for (const offset of angles) {
            const angle = baseAngle + offset;
            onSpawnBullet({
              ...p,
              id: Math.random() * 1000000 | 0,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd,
              color: '#d8b4fe',
              lastGateId: gate.id
            });
          }
        } else if (gate.multiplier === 2) {
          // ×2 Double Shot
          p.damage = Math.round(p.damage * 1.15);
          p.color = '#38bdf8';
          p.radius = Math.min(8, p.radius + 0.5);

          const angle = baseAngle + 0.09;
          onSpawnBullet({
            ...p,
            id: Math.random() * 1000000 | 0,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            color: '#7dd3fc',
            lastGateId: gate.id
          });
        }
      }
    }
  }

  /**
   * Renders the oscillating tactical multiplier window at the lower 1/4 screen
   */
  public draw(ctx: CanvasRenderingContext2D) {
    if (!this.isActive || !this.windowGate) return;

    const gate = this.windowGate;
    const halfW = gate.width * 0.5;
    const halfH = gate.height * 0.5;
    const x = gate.x - halfW;
    const y = gate.y - halfH;

    ctx.save();

    // 1. Moving Guide Track (Subtle guide line showing oscillation path at lower 1/4)
    ctx.strokeStyle = `${gate.color}22`;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(halfW + 16, gate.y);
    ctx.lineTo(ctx.canvas.width - halfW - 16, gate.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Outer Neon Glow
    ctx.shadowColor = gate.glowColor;
    ctx.shadowBlur = 16 + Math.sin(gate.pulse) * 6;

    // 3. Translucent Cyber Energy Window
    const grad = ctx.createLinearGradient(0, y, 0, y + gate.height);
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.85)');
    grad.addColorStop(0.5, `${gate.color}35`);
    grad.addColorStop(1, `${gate.glowColor}55`);
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.roundRect(x, y, gate.width, gate.height, 10);
    ctx.fill();

    // 4. Glowing Cybernetic Border
    ctx.strokeStyle = gate.color;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // 5. Upward energetic flow streams inside the window
    ctx.strokeStyle = `${gate.color}99`;
    ctx.lineWidth = 1.6;
    const streamOffset = (Date.now() * 0.08) % 16;
    for (let sx = x + 14; sx < x + gate.width - 12; sx += 16) {
      ctx.beginPath();
      ctx.moveTo(sx, y + gate.height - 4);
      ctx.lineTo(sx, y + 4 + (streamOffset % 6));
      ctx.stroke();
    }

    // 6. Left and right motion arrows (左右来回移动)
    const arrowDir = this.windowVx > 0 ? '▶' : '◀';
    ctx.shadowBlur = 0;
    ctx.fillStyle = `${gate.color}bb`;
    ctx.font = 'bold 9px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(arrowDir, this.windowVx > 0 ? x + gate.width - 10 : x + 10, gate.y);

    // 7. Prominent Multiplier Center Label (×5 / ×3 / ×2)
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 21px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(gate.label, gate.x, gate.y - 4);

    // 8. Sub-Label & Remaining Segment Requirement
    ctx.fillStyle = gate.color;
    ctx.font = '900 9px system-ui, -apple-system, sans-serif';
    ctx.fillText(gate.subLabel, gate.x, gate.y + 12);

    // 9. Floating Top Badge: 战术倍率窗口 · 左右移动
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#000000';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 8.5px system-ui, -apple-system, sans-serif';
    ctx.fillText(`⚡ 战术倍率窗口 (场上${this.onScreenSegments}节)`, gate.x, y - 6);

    ctx.restore();
  }

  public clear() {
    this.windowGate = null;
    this.isActive = false;
  }
}
