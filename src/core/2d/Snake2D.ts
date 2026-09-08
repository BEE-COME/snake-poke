import { Segment2D, Snake2DInstance } from './types';
import { EnemyType } from '../../types/game';
import { gameState } from '../GameState';

let nextSnakeId = 1;
let nextSegmentId = 1;

/** Fixed interval (gap) between consecutive snake cuboids */
export const SEGMENT_GAP = 18;

export class SnakeManager2D {
  public snakes: Snake2DInstance[] = [];
  public screenWidth: number = 390;
  public screenHeight: number = 844;

  /**
   * Spawns the Snake King followed by 99 cuboid body segments (total 100 segments)
   * with strictly fixed spacing and visible intervals (蛇身之间有明显间隔).
   * Cuboids occupy 1/6th of the screen width.
   * Body HP scales exponentially along the 99 segments.
   */
  public spawnSnake(
    startX: number,
    startY: number,
    segmentCount = 100,
    types: EnemyType[] = ['BOSS', 'ARMOR', 'EXPLOSIVE', 'FAST', 'HEALER'],
    waveChestChance = 1.0,
    speed = 42,
    isBoss = true,
    waveNumber = 1,
    screenWidth = 390
  ): Snake2DInstance {
    this.screenWidth = screenWidth;
    const segments: Segment2D[] = [];
    const totalSegments = Math.max(segmentCount, 100); // 1 Head + 99 Body Cuboids

    // 1. Cuboid Dimensions: Exactly 1/6th of screen width!
    const cuboidWidth = Math.round(screenWidth / 6);
    const cuboidHeight = Math.round(cuboidWidth * 0.58);
    const headWidth = Math.round(cuboidWidth * 1.18);
    const headHeight = Math.round(cuboidHeight * 1.20);
    // 蛇身之间保持明显间隔 (SEGMENT_GAP = 18px)
    const gap = SEGMENT_GAP;
    const segmentSpacing = cuboidWidth + gap;
    const stepDownDistance = cuboidHeight + gap;

    // 2. Exponential HP base formula:
    // Base starting HP for segment 1 (scales with wave)
    const initialBaseHp = Math.round((22 + waveNumber * 5) * Math.pow(1.22, waveNumber - 1));

    // Pre-calculate path history extending vertically upward so all 99 segments
    // start at exact fixed spacing from frame 0!
    const pathHistory: { x: number; y: number }[] = [];
    const totalInitialLength = totalSegments * segmentSpacing + 200;
    for (let d = 0; d <= totalInitialLength; d += 4) {
      pathHistory.push({ x: startX, y: startY - d });
    }

    for (let i = 0; i < totalSegments; i++) {
      const isHead = i === 0;
      // 每隔 5 个蛇身给一个宝箱 (第 5, 10, 15, 20, 25, 30, ... 95 节长方体)
      const isChest = !isHead && i % 5 === 0;
      let type: EnemyType = 'NORMAL';

      if (isHead) {
        type = 'BOSS';
      } else if (isChest) {
        type = 'CHEST';
      } else {
        // Distribute tactical block types across the remaining body segments
        const roll = Math.random();
        if (roll < 0.16) {
          type = 'ARMOR';
        } else if (roll < 0.28) {
          type = 'EXPLOSIVE';
        } else if (roll < 0.40) {
          type = 'FAST';
        } else if (roll < 0.48) {
          type = 'HEALER';
        } else if (roll < 0.55 && waveNumber >= 3) {
          type = 'ELITE';
        } else {
          type = 'NORMAL';
        }
      }

      const isArmored = type === 'ARMOR';
      const isElite = type === 'ELITE';
      const isFast = type === 'FAST';

      // 蛇身起始血量给 300，怪物成长系数 1.18X；蛇王血量为最后一节的 10 倍
      let hp = 300;
      if (isHead) {
        // 蛇王血量设定为最后一节蛇身（第 totalSegments - 1 节）基础血量的 10 倍
        const lastSegBaseHp = Math.round(300 * Math.pow(1.18, totalSegments - 2));
        hp = lastSegBaseHp * 10;
      } else {
        // Segment 1 has 300, Segment 2 has 300 * 1.18^1 = 354, Segment 3 has 418, etc. (1.18X 指数成长)
        const baseHp = Math.round(300 * Math.pow(1.18, i - 1));
        hp = baseHp;
        if (isArmored) {
          hp = Math.round(baseHp * 1.25);
        } else if (isElite) {
          hp = Math.round(baseHp * 1.50);
        } else if (isFast) {
          hp = Math.round(baseHp * 0.85);
        } else if (type === 'EXPLOSIVE') {
          hp = Math.round(baseHp * 0.75);
        }
      }

      let color = '#059669';
      let glowColor = '#34d399';

      if (isHead) {
        color = '#1e1b4b';
        glowColor = '#f43f5e';
      } else if (isChest) {
        color = '#b45309';
        glowColor = '#fbbf24';
      } else if (isArmored) {
        color = '#334155';
        glowColor = '#94a3b8';
      } else if (type === 'FAST') {
        color = '#ca8a04';
        glowColor = '#fde047';
      } else if (type === 'EXPLOSIVE') {
        color = '#c2410c';
        glowColor = '#fb923c';
      } else if (type === 'HEALER') {
        color = '#047857';
        glowColor = '#34d399';
      } else if (type === 'ELITE') {
        color = '#6d28d9';
        glowColor = '#c084fc';
      } else {
        // Dynamic cyber tier coloring based on exponential HP (1.18x growth)
        if (hp < 1500) {
          color = '#059669'; // Emerald (Tier 1)
          glowColor = '#34d399';
        } else if (hp < 8000) {
          color = '#0284c7'; // Sky Blue (Tier 2)
          glowColor = '#38bdf8';
        } else if (hp < 50000) {
          color = '#d97706'; // Amber / Gold (Tier 3)
          glowColor = '#fbbf24';
        } else if (hp < 400000) {
          color = '#7c3aed'; // Purple Void (Tier 4)
          glowColor = '#c084fc';
        } else if (hp < 3000000) {
          color = '#dc2626'; // Crimson Flame (Tier 5)
          glowColor = '#f87171';
        } else {
          color = '#831843'; // Demonic Obsidian (Tier 6)
          glowColor = '#f43f5e';
        }
      }

      // Initial position along the fixed-spacing path
      const pos = this.getPointAtDistance(pathHistory, i * segmentSpacing);
      const segW = isHead ? headWidth : cuboidWidth;
      const segH = isHead ? headHeight : cuboidHeight;

      segments.push({
        id: nextSegmentId++,
        x: pos.x,
        y: pos.y,
        radius: Math.round(segW * 0.45),
        width: segW,
        height: segH,
        depth: isHead ? 8 : 5,
        segmentIndex: i,
        hp,
        maxHp: hp,
        type,
        isHead,
        isChest,
        isArmored,
        color,
        glowColor,
        hitFlash: 0,
        freezeTimer: 0,
        burnTimer: 0,
        poisonTimer: 0
      });
    }

    const initialDirection: 1 | -1 = 1;
    const baseSpeed = speed;

    const snake: Snake2DInstance = {
      id: nextSnakeId++,
      segments,
      speed: baseSpeed,
      baseSpeed,
      direction: initialDirection,
      stepDownDistance,
      pathHistory,
      isDropping: false,
      dropProgress: 0,
      dropStartY: startY,
      dropTargetY: startY,
      isBoss: true,
      bossPhase: 1,
      attackCooldown: 2.2,
      eliteAttackCooldown: 2.8,
      healerCooldown: 2.0,
      isEnraged: false,
      hasChest: true,
      waveNumber,
      dead: false
    };

    this.snakes.push(snake);
    return snake;
  }

  /**
   * Retrieves the point at exact accumulated Euclidean distance along the polyline path.
   * Guarantees 100% strictly fixed spacing between consecutive cuboids at all times.
   */
  public getPointAtDistance(path: { x: number; y: number }[], targetDist: number): { x: number; y: number } {
    if (path.length === 0) return { x: 0, y: 0 };
    if (targetDist <= 0 || path.length === 1) return { x: path[0].x, y: path[0].y };

    let accumulated = 0;
    for (let j = 0; j < path.length - 1; j++) {
      const p1 = path[j];
      const p2 = path[j + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const segDist = Math.hypot(dx, dy);
      if (segDist <= 0.0001) continue;

      if (accumulated + segDist >= targetDist) {
        const remaining = targetDist - accumulated;
        const t = remaining / segDist;
        return {
          x: p1.x + dx * t,
          y: p1.y + dy * t,
        };
      }
      accumulated += segDist;
    }

    // Extrapolate beyond the end of the path along the last segment's direction
    const last = path[path.length - 1];
    const prev = path[path.length - 2] || last;
    const dx = last.x - prev.x;
    const dy = last.y - prev.y;
    const d = Math.hypot(dx, dy) || 1;
    const extra = targetDist - accumulated;
    return {
      x: last.x + (dx / d) * extra,
      y: last.y + (dy / d) * extra,
    };
  }

  public update(
    dt: number,
    screenWidth: number,
    defenseLineY: number,
    onReachDefense: (damage: number) => void,
    onBossAttack?: (boss: Snake2DInstance) => void,
    onEliteAttack?: (eliteSeg: Segment2D) => void
  ) {
    this.screenWidth = screenWidth;
    const cuboidWidth = Math.round(screenWidth / 6);
    const cuboidHeight = Math.round(cuboidWidth * 0.58);
    const gap = SEGMENT_GAP;
    const segmentSpacing = cuboidWidth + gap;
    const halfHeadW = Math.round((cuboidWidth * 1.18) * 0.5);
    const minX = halfHeadW + 8;
    const maxX = screenWidth - minX;

    for (let sIdx = this.snakes.length - 1; sIdx >= 0; sIdx--) {
      const snake = this.snakes[sIdx];
      if (snake.segments.length === 0 || snake.dead) {
        this.snakes.splice(sIdx, 1);
        continue;
      }

      const head = snake.segments[0];
      let speedMult = 1.0;

      // Ensure stepDownDistance has clean gap
      snake.stepDownDistance = cuboidHeight + gap;

      // Proximity Enrage Sprint: triggered when within 110px of defense line
      if (head.y > defenseLineY - 110 && !snake.isEnraged) {
        snake.isEnraged = true;
        snake.speed = snake.baseSpeed * 1.25;
      }

      // 1. Advance Snake King Head along zig-zag grid path
      if (speedMult > 0) {
        const stepDist = snake.speed * speedMult * dt;
        head.x += snake.direction * stepDist;

        // Screen edge collision: step down 1 row and reverse horizontal direction
        if (snake.direction === 1 && head.x >= maxX) {
          head.x = maxX;
          snake.direction = -1;
          head.y += snake.stepDownDistance;
        } else if (snake.direction === -1 && head.x <= minX) {
          head.x = minX;
          snake.direction = 1;
          head.y += snake.stepDownDistance;
        }

        // Record head position into pathHistory
        const lastPt = snake.pathHistory[0];
        if (!lastPt || Math.hypot(head.x - lastPt.x, head.y - lastPt.y) >= 2.0) {
          snake.pathHistory.unshift({ x: head.x, y: head.y });
        }

        // Keep path history bounded to necessary length
        const maxDist = (snake.segments.length + 8) * segmentSpacing;
        const maxPoints = Math.ceil(maxDist / 1.8);
        if (snake.pathHistory.length > maxPoints) {
          snake.pathHistory.length = maxPoints;
        }

        // 2. Position all 99 body cuboids at strictly fixed spacing with visible intervals (蛇身间隔)
        for (let i = 1; i < snake.segments.length; i++) {
          const targetDist = i * segmentSpacing;
          const pos = this.getPointAtDistance(snake.pathHistory, targetDist);
          const seg = snake.segments[i];
          seg.x = pos.x;
          seg.y = pos.y;
          seg.segmentIndex = i;
        }
      }

      // Decrement timers on all segments
      for (let i = snake.segments.length - 1; i >= 0; i--) {
        const seg = snake.segments[i];
        if (seg.freezeTimer > 0) seg.freezeTimer -= dt;
        if (seg.burnTimer > 0) {
          seg.burnTimer -= dt;
          const burnDps = Math.max(80, gameState.stats.fireDps || 80);
          seg.hp -= dt * burnDps; // Scaled Burn DoT
          seg.hitFlash = Math.max(seg.hitFlash, 1);
        }
      }

      // Boss special attacks
      if (snake.isBoss && onBossAttack) {
        snake.attackCooldown -= dt;
        if (snake.attackCooldown <= 0) {
          snake.attackCooldown = snake.bossPhase === 3 ? 1.5 : 2.6;
          onBossAttack(snake);
        }
      }

      // Elite segment venom attack
      if (onEliteAttack) {
        snake.eliteAttackCooldown -= dt;
        if (snake.eliteAttackCooldown <= 0) {
          snake.eliteAttackCooldown = 3.2 + Math.random() * 0.8;
          const eliteSeg = snake.segments.find(s => s.type === 'ELITE');
          if (eliteSeg && eliteSeg.y > 60 && eliteSeg.y < defenseLineY - 60) {
            onEliteAttack(eliteSeg);
          }
        }
      }

      // Healer segment periodic recovery
      snake.healerCooldown -= dt;
      if (snake.healerCooldown <= 0) {
        snake.healerCooldown = 2.0;
        for (let i = 0; i < snake.segments.length; i++) {
          if (snake.segments[i].type === 'HEALER') {
            if (i > 0) {
              const prev = snake.segments[i - 1];
              prev.hp = Math.min(prev.maxHp, prev.hp + prev.maxHp * 0.15);
              prev.hitFlash = 2;
            }
            if (i < snake.segments.length - 1) {
              const next = snake.segments[i + 1];
              next.hp = Math.min(next.maxHp, next.hp + next.maxHp * 0.15);
              next.hitFlash = 2;
            }
          }
        }
      }

      // Breaching defense line triggers defeat
      if (head.y >= defenseLineY) {
        onReachDefense(9999);
        snake.dead = true;
        this.snakes.splice(sIdx, 1);
      }
    }
  }

  /**
   * 🐍 每消灭一个蛇身，蛇头回退一个蛇身长度。
   * 沿蛇行历史轨迹向后回退一个完整蛇身长度（cuboidWidth + SEGMENT_GAP），
   * 并同步带动所有躯体向后回退，重塑队形，提供极具打击感的战略喘息空间。
   */
  public retreatSnake(snake: Snake2DInstance, customDistance?: number): { x: number; y: number } | null {
    if (!snake || snake.segments.length === 0) return null;
    const head = snake.segments[0];
    if (!head || !head.isHead) return null;

    const cuboidWidth = Math.round(this.screenWidth / 6);
    const cuboidHeight = Math.round(cuboidWidth * 0.58);
    const gap = SEGMENT_GAP;
    const segmentSpacing = cuboidWidth + gap;
    const targetDist = customDistance || segmentSpacing;

    let accumulated = 0;
    let newHeadPos = { x: head.x, y: head.y };
    let cutIndex = 0;
    let newDirection: 1 | -1 = snake.direction;

    for (let j = 0; j < snake.pathHistory.length - 1; j++) {
      const p1 = snake.pathHistory[j];
      const p2 = snake.pathHistory[j + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const segDist = Math.hypot(dx, dy);
      if (segDist <= 0.0001) continue;

      if (accumulated + segDist >= targetDist) {
        const remaining = targetDist - accumulated;
        const t = remaining / segDist;
        newHeadPos = {
          x: p1.x + dx * t,
          y: p1.y + dy * t,
        };
        cutIndex = j + 1;

        // 根据历史行进方向判断当前朝向：p1是较新的点，p2是较旧的点，前进方向是从 p2 -> p1
        if (Math.abs(p1.x - p2.x) > 1.0) {
          newDirection = p1.x > p2.x ? 1 : -1;
        }
        break;
      }
      accumulated += segDist;
    }

    // 限制蛇头回退不能超出屏幕顶部最小可视安全区
    newHeadPos.y = Math.max(35, newHeadPos.y);

    if (cutIndex > 0) {
      snake.pathHistory = snake.pathHistory.slice(cutIndex);
      snake.pathHistory.unshift({ x: newHeadPos.x, y: newHeadPos.y });
    } else {
      // 历史点不足时，向上延伸补足历史点
      snake.pathHistory = [{ x: newHeadPos.x, y: newHeadPos.y }];
      for (let d = 4; d <= 2500; d += 4) {
        snake.pathHistory.push({ x: newHeadPos.x, y: newHeadPos.y - d });
      }
    }

    // 更新蛇头坐标与行进朝向
    head.x = newHeadPos.x;
    head.y = newHeadPos.y;
    snake.direction = newDirection;

    // 若被击退离开防线危险区，解除狂暴状态
    if (snake.isEnraged && head.y < 500) {
      snake.isEnraged = false;
      snake.speed = snake.baseSpeed;
    }

    // 立即重新排布剩余所有蛇节，确保保持严格固定间距与清晰间隔
    for (let i = 1; i < snake.segments.length; i++) {
      const d = i * segmentSpacing;
      const pos = this.getPointAtDistance(snake.pathHistory, d);
      const seg = snake.segments[i];
      seg.x = pos.x;
      seg.y = pos.y;
      seg.segmentIndex = i;
    }

    return newHeadPos;
  }

  public draw(ctx: CanvasRenderingContext2D, screenWidth = 390, screenHeight = 844) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    for (const snake of this.snakes) {
      if (snake.segments.length === 0) continue;

      // 1. Draw connecting mechanical linkages between cuboids
      ctx.save();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = snake.segments.length - 1; i >= 0; i--) {
        const seg = snake.segments[i];
        if (i === snake.segments.length - 1) {
          ctx.moveTo(seg.x, seg.y);
        } else {
          ctx.lineTo(seg.x, seg.y);
        }
      }
      ctx.stroke();

      // Energy core spine highlight
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw articulated mechanical joints in the visible gaps between consecutive cuboids
      for (let i = 0; i < snake.segments.length - 1; i++) {
        const segA = snake.segments[i];
        const segB = snake.segments[i + 1];
        const midX = (segA.x + segB.x) * 0.5;
        const midY = (segA.y + segB.y) * 0.5;
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(midX, midY, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(midX, midY, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      const totalSegCount = snake.segments.length;

      // 2. Draw segments from tail to head as 3D Cuboids (占屏幕宽度6分之一)
      for (let i = totalSegCount - 1; i >= 0; i--) {
        const seg = snake.segments[i];

        // Viewport Culling: Skip segments completely outside visible vertical canvas
        if (seg.y < -70 || seg.y > (this.screenHeight || 1000) + 70) {
          continue;
        }

        ctx.save();

        const isHit = seg.hitFlash > 0;
        if (isHit) seg.hitFlash--;

        if (seg.isHead) {
          // 👑 SNAKE KING HEAD (蛇王机甲长方体)
          this.drawBossHead(ctx, seg, snake, isHit);
        } else if (seg.isChest) {
          // 📦 3D GOLDEN TREASURE CHEST CUBOID (长方体宝箱，占屏幕1/6)
          this.drawChestCuboid(ctx, seg, isHit);
        } else {
          // 🧊 3D BODY CUBOID (长方体蛇身，占屏幕1/6)
          this.drawBodyCuboid(ctx, seg, isHit, i, totalSegCount);
        }

        // Status effect overlays
        if (seg.burnTimer > 0) {
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(seg.x, seg.y - 16, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }
  }

  /**
   * Renders the Snake King Head as a grand 3D Armored War Fortress Cuboid
   */
  private drawBossHead(ctx: CanvasRenderingContext2D, seg: Segment2D, snake: Snake2DInstance, isHit: boolean) {
    const w = seg.width || Math.round((this.screenWidth / 6) * 1.30);
    const h = seg.height || Math.round(w * 0.58);
    const dx = Math.round(w * 0.12);
    const dy = -Math.round(h * 0.20);

    const x = seg.x - w * 0.5;
    const y = seg.y - h * 0.5;

    // Glowing Demonic King Horns
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#991b1b';

    // Left horn
    ctx.beginPath();
    ctx.moveTo(x + 8, y);
    ctx.lineTo(x - 10, y - 24);
    ctx.lineTo(x + 16, y - 6);
    ctx.fill();

    // Right horn
    ctx.beginPath();
    ctx.moveTo(x + w - 8, y);
    ctx.lineTo(x + w + 10, y - 24);
    ctx.lineTo(x + w - 16, y - 6);
    ctx.fill();

    // 1. 3D Top Face (Prism Extrusion)
    ctx.fillStyle = isHit ? '#ffffff' : '#312e81';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y + dy);
    ctx.lineTo(x + w + dx, y + dy);
    ctx.lineTo(x + w, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // 2. 3D Right Side Face
    ctx.fillStyle = isHit ? '#ffffff' : '#0f172a';
    ctx.beginPath();
    ctx.moveTo(x + w, y);
    ctx.lineTo(x + w + dx, y + dy);
    ctx.lineTo(x + w + dx, y + h + dy);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. 3D Front Face
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 14;
    ctx.fillStyle = isHit ? '#ffffff' : '#1e1b4b';
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 5);
    ctx.fill();
    ctx.stroke();

    // Center Crown & Live Head HP
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👑', seg.x, seg.y - 7);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 10px system-ui, -apple-system, sans-serif';
    ctx.fillText(this.formatHpText(seg.hp), seg.x, seg.y + 6);

    // Menacing glowing dragon eyes
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.fillRect(seg.x - 14, seg.y + 3, 5, 3);
    ctx.fillRect(seg.x + 9, seg.y + 3, 5, 3);

    // Header Floating Badge: 👑 灭世蛇王 · 斩首即灭 (可击破)
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#000000';
    ctx.fillStyle = '#fbbf24';
    ctx.font = '900 10px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`👑 灭世蛇王 · 斩首即灭 (${this.formatHpText(seg.hp)})`, seg.x, y - 12);
  }

  /** Formats exponential HP cleanly (k, M, B) */
  private formatHpText(val: number): string {
    if (val >= 1e9) return (val / 1e9).toFixed(1) + 'B';
    if (val >= 1e6) return (val / 1e6).toFixed(1) + 'M';
    if (val >= 1e4) return (val / 1e3).toFixed(val >= 1e5 ? 0 : 1) + 'k';
    return Math.round(val).toString();
  }

  /**
   * Renders each body segment as a 3D Cuboid (占屏幕宽度6分之一的长方体)
   * with prominent exponential HP number
   */
  private drawBodyCuboid(
    ctx: CanvasRenderingContext2D,
    seg: Segment2D,
    isHit: boolean,
    index: number,
    totalCount: number
  ) {
    const w = seg.width || Math.round(this.screenWidth / 6);
    const h = seg.height || Math.round(w * 0.58);
    const dx = Math.round(w * 0.12);
    const dy = -Math.round(h * 0.22);

    const x = seg.x - w * 0.5;
    const y = seg.y - h * 0.5;

    // 1. 3D Top Face (Lighter Highlight Cap)
    ctx.fillStyle = isHit ? '#ffffff' : this.adjustBrightness(seg.color, 35);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y + dy);
    ctx.lineTo(x + w + dx, y + dy);
    ctx.lineTo(x + w, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = seg.glowColor;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 2. 3D Right Side Face (Darker Ambient Shadow)
    ctx.fillStyle = isHit ? '#ffffff' : this.adjustBrightness(seg.color, -40);
    ctx.beginPath();
    ctx.moveTo(x + w, y);
    ctx.lineTo(x + w + dx, y + dy);
    ctx.lineTo(x + w + dx, y + h + dy);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. 3D Front Face
    ctx.fillStyle = isHit ? '#ffffff' : seg.color;
    ctx.strokeStyle = seg.glowColor;
    ctx.lineWidth = 2.2;

    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 4);
    ctx.fill();
    ctx.stroke();

    // Front face specular reflection sheen
    ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
    ctx.fillRect(x + 3, y + 2, w - 6, 3.5);

    // Prominent Bold HP Number in center (scales dynamically with digit count)
    const hpVal = Math.max(1, Math.ceil(seg.hp));
    const hpText = this.formatHpText(hpVal);
    let fontSize = 13;
    if (hpText.length >= 6) fontSize = 9;
    else if (hpText.length >= 5) fontSize = 10;
    else if (hpText.length >= 4) fontSize = 11;
    else if (hpText.length >= 3) fontSize = 12;

    ctx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(hpText, seg.x, seg.y + 1);

    // Special type badge
    if (seg.isArmored) {
      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('🛡️', seg.x, y - 6);
    } else if (seg.type === 'EXPLOSIVE') {
      ctx.fillStyle = '#ffedd5';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('💥', seg.x, y - 6);
    } else if (seg.type === 'HEALER') {
      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('💚', seg.x, y - 6);
    } else if (seg.type === 'FAST') {
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('⚡', seg.x, y - 6);
    } else if (seg.type === 'ELITE') {
      ctx.fillStyle = '#e9d5ff';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('⚔️', seg.x, y - 6);
    }
  }

  /**
   * Renders a 3D Golden Treasure Chest Cuboid (占屏幕宽度6分之一的长方体宝箱)
   */
  private drawChestCuboid(ctx: CanvasRenderingContext2D, seg: Segment2D, isHit: boolean) {
    const w = seg.width || Math.round(this.screenWidth / 6);
    const h = seg.height || Math.round(w * 0.60);
    const dx = Math.round(w * 0.12);
    const dy = -Math.round(h * 0.22);

    const x = seg.x - w * 0.5;
    const y = seg.y - h * 0.5;

    // 1. 3D Top Face (Golden Lid)
    ctx.fillStyle = isHit ? '#ffffff' : '#d97706';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y + dy);
    ctx.lineTo(x + w + dx, y + dy);
    ctx.lineTo(x + w, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // 2. 3D Right Side Face
    ctx.fillStyle = isHit ? '#ffffff' : '#78350f';
    ctx.beginPath();
    ctx.moveTo(x + w, y);
    ctx.lineTo(x + w + dx, y + dy);
    ctx.lineTo(x + w + dx, y + h + dy);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. 3D Front Face
    ctx.fillStyle = isHit ? '#ffffff' : '#b45309';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.4;

    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 4);
    ctx.fill();
    ctx.stroke();

    // Gold strapping band & lock
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.42);
    ctx.lineTo(x + w, y + h * 0.42);
    ctx.stroke();

    // Prominent Bold HP Number
    const hpVal = Math.max(1, Math.ceil(seg.hp));
    ctx.fillStyle = '#fef08a';

    const hpText = this.formatHpText(hpVal);
    let fontSize = 13;
    if (hpText.length >= 6) fontSize = 9;
    else if (hpText.length >= 5) fontSize = 10;
    else if (hpText.length >= 4) fontSize = 11;
    else if (hpText.length >= 3) fontSize = 12;

    ctx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(hpText, seg.x, seg.y + 4);

    // Floating 📦 宝箱 badge
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('📦 宝箱', seg.x, y - 8);
  }

  /** Helper to brighten or darken hex color for 3D face shading */
  private adjustBrightness(col: string, percent: number): string {
    let num = parseInt(col.replace('#', ''), 16);
    if (isNaN(num)) return col;
    let r = (num >> 16) + Math.round(255 * (percent / 100));
    let g = ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100));
    let b = (num & 0x0000ff) + Math.round(255 * (percent / 100));
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  public clear() {
    this.snakes = [];
  }
}
