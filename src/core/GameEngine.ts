import { gameState } from './GameState';
import { sounds } from '../audio/SoundSystem';
import { WAVES } from '../data/waves';
import { ParticleSystem2D } from './2d/ParticleSystem2D';
import { SnakeManager2D } from './2d/Snake2D';
import { Turret2D } from './2d/Turret2D';
import { ProjectileManager2D } from './2d/ProjectileManager2D';
import { Segment2D, Snake2DInstance } from './2d/types';
import { ChoiceGatesManager2D, ChoiceGateOption } from './2d/ChoiceGates2D';
import { MultiplierGateManager2D } from './2d/MultiplierGateManager2D';

export class GameEngine {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private width = 400;
  private height = 800;
  private dpr = 1;

  // Subsystems
  public turret: Turret2D;
  public snakeManager: SnakeManager2D;
  public projectileManager: ProjectileManager2D;
  public particleSystem: ParticleSystem2D;
  public choiceGatesManager: ChoiceGatesManager2D;
  public multiplierGates: MultiplierGateManager2D;

  // Input states
  private keysPressed = new Set<string>();

  // Wave spawn state
  private snakesToSpawn = 0;
  private spawnTimer = 0;
  private currentWaveIndex = 0;
  private waveClearTimer = 0;
  private bossActive = false;

  // Combat loop
  private fireTimer = 0;
  private orbitalLaserTimer = 0;
  private droneFireTimer = 0;
  private nukeCooldownTimer = 0;
  private nukeFlash = 0;

  // Screen shake
  private shakeAmount = 0;

  // Background stars
  private stars: { x: number; y: number; speed: number; size: number; alpha: number }[] = [];
  private gridOffset = 0;

  // Loop control
  private animId: number | null = null;
  private lastTime = 0;
  private isDestroyed = false;

  constructor(container: HTMLElement, _overlayCanvas?: HTMLCanvasElement) {
    this.container = container;

    // Create primary 2D canvas inside container
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'w-full h-full block select-none touch-none';
    this.canvas.id = 'game-2d-canvas';
    this.container.innerHTML = '';
    this.container.appendChild(this.canvas);

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;

    // Initialize subsystems
    this.turret = new Turret2D();
    this.snakeManager = new SnakeManager2D();
    this.projectileManager = new ProjectileManager2D();
    this.particleSystem = new ParticleSystem2D();
    this.choiceGatesManager = new ChoiceGatesManager2D();
    this.multiplierGates = new MultiplierGateManager2D();

    this.initStars();
    this.setupInputs();
    this.handleResize();

    // Start requestAnimationFrame loop
    this.lastTime = performance.now();
    this.animId = requestAnimationFrame(this.renderLoop);
  }

  private initStars() {
    this.stars = [];
    for (let i = 0; i < 45; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random(),
        speed: 25 + Math.random() * 45,
        size: 1 + Math.random() * 2,
        alpha: 0.2 + Math.random() * 0.6
      });
    }
  }

  public handleResize = () => {
    const rect = this.container.getBoundingClientRect();
    this.width = Math.max(300, rect.width || window.innerWidth);
    this.height = Math.max(500, rect.height || window.innerHeight);
    this.dpr = Math.min(2, window.devicePixelRatio || 1);

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.turret.targetX = this.width * 0.5;
    this.turret.x = this.width * 0.5;
    this.turret.y = this.height - 55;

    if (this.multiplierGates) {
      this.multiplierGates.init(this.width, this.height);
    }
  };

  private setupInputs() {
    const getPos = (e: MouseEvent | Touch) => {
      const rect = this.canvas.getBoundingClientRect();
      return e.clientX - rect.left;
    };

    const onPointerMove = (clientX: number) => {
      if (gameState.mode !== 'PLAYING') return;
      this.turret.targetX = clientX;
    };

    this.canvas.addEventListener('mousemove', (e) => {
      onPointerMove(getPos(e));
    });

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        onPointerMove(getPos(e.touches[0]));
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        onPointerMove(getPos(e.touches[0]));
      }
    }, { passive: true });

    // Keyboard support: ArrowLeft / ArrowRight / A / D
    window.addEventListener('keydown', (e) => {
      this.keysPressed.add(e.key.toLowerCase());
    });
    window.addEventListener('keyup', (e) => {
      this.keysPressed.delete(e.key.toLowerCase());
    });
  }

  public startWave(waveIndex: number) {
    this.currentWaveIndex = waveIndex;
    const wave = WAVES[waveIndex];
    if (!wave) return;

    this.snakeManager.clear();
    this.projectileManager.clear();
    this.particleSystem.clear();
    if (this.multiplierGates) {
      this.multiplierGates.init(this.width, this.height);
    }

    gameState.startWave(wave.waveNumber);
    this.snakesToSpawn = wave.snakeCount;
    this.spawnTimer = 0.5;
    this.waveClearTimer = 0;
    this.bossActive = true;
  }

  private spawnWaveSnake() {
    const wave = WAVES[this.currentWaveIndex];
    if (!wave) return;

    const spawnX = 55;
    const speed = 36 + wave.waveNumber * 4;

    // Directly spawn the Snake King followed by 99 cuboid body segments!
    const snake = this.snakeManager.spawnSnake(
      spawnX,
      35,
      100, // 1 Head + 99 Body segments
      wave.enemyTypes,
      wave.chestChance,
      speed,
      true, // Directly the Snake King
      wave.waveNumber,
      this.width
    );

    // Synchronize initial boss total HP across all segments (including head)
    let totalHp = 0;
    for (const seg of snake.segments) {
      totalHp += seg.hp;
    }
    gameState.bossHp = totalHp;
    gameState.bossMaxHp = totalHp;
    gameState.bossPhase = 1;
    sounds.playBossRoar();
  }

  private spawnBoss() {
    this.spawnWaveSnake();
  }

  private renderLoop = (time: number) => {
    if (this.isDestroyed) return;

    const dt = Math.min(0.1, (time - this.lastTime) / 1000);
    this.lastTime = time;

    this.update(dt);
    this.render();

    this.animId = requestAnimationFrame(this.renderLoop);
  };

  private update(dt: number) {
    if (gameState.mode !== 'PLAYING') return;

    gameState.update(dt);
    const stats = gameState.stats;
    const defenseLineY = this.height - 85;

    // 1. Wave Spawning
    const wave = WAVES[this.currentWaveIndex];
    if (wave) {
      if (this.snakesToSpawn > 0) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          this.spawnWaveSnake();
          this.snakesToSpawn--;
          this.spawnTimer = wave.spawnInterval;
        }
      } else if (wave.isBossWave && this.bossActive && this.snakeManager.snakes.length === 0) {
        this.spawnBoss();
        this.bossActive = false;
      }

      // Wave Progress calculation
      const totalSnakes = wave.snakeCount;
      const remainingSnakes = this.snakesToSpawn + this.snakeManager.snakes.length;
      gameState.waveProgress = totalSnakes > 0 ? (totalSnakes - remainingSnakes) / totalSnakes : 1;

      // Check wave clear
      if (this.snakesToSpawn === 0 && this.snakeManager.snakes.length === 0 && !this.bossActive) {
        this.waveClearTimer += dt;
        if (this.waveClearTimer >= 1.5) {
          this.onWaveCompleted(wave);
        }
      }
    }

    // 1.5 Keyboard smooth movement (A/D, Left/Right arrows)
    if (this.keysPressed.has('arrowleft') || this.keysPressed.has('a')) {
      this.turret.targetX -= 520 * dt;
    }
    if (this.keysPressed.has('arrowright') || this.keysPressed.has('d')) {
      this.turret.targetX += 520 * dt;
    }
    this.turret.targetX = Math.max(35, Math.min(this.width - 35, this.turret.targetX));

    // 2. Turret auto-firing (with Frenzy combo bonus)
    this.turret.update(dt, this.width, this.height);

    const frenzyLvl = gameState.activeSkills.get('frenzy') || 0;
    let frenzyMultiplier = 1.0;
    if (frenzyLvl > 0) {
      const bonusPer10 = [0.05, 0.08, 0.12, 0.16, 0.22][frenzyLvl - 1] || 0.05;
      const comboTiers = Math.floor(gameState.combo / 10);
      frenzyMultiplier = 1.0 + Math.min(1.5, comboTiers * bonusPer10);
    }
    const effectiveFireRate = stats.fireRate * frenzyMultiplier;
    const fireInterval = 1 / Math.max(1, effectiveFireRate);

    this.fireTimer += dt;
    if (this.fireTimer >= fireInterval) {
      this.fireTimer = 0;
      this.projectileManager.spawnPlayerShot(this.turret.x, this.turret.y, stats);
      this.turret.onFire();
      sounds.playLaser();
    }

    // 2.1 Orbital laser skill
    const laserLvl = gameState.activeSkills.get('laser') || (stats.aoeRadius > 3 ? 1 : 0);
    if (laserLvl > 0) {
      const laserInterval = [8.0, 6.0, 4.5, 3.8, 3.0][laserLvl - 1] || 5.0;
      this.orbitalLaserTimer += dt;
      if (this.orbitalLaserTimer >= laserInterval) {
        this.orbitalLaserTimer = 0;
        this.fireOrbitalLaser(laserLvl);
      }
    }

    // 2.2 Tactical Nuke skill automatic countdown
    if (stats.nukeCooldown > 0) {
      this.nukeCooldownTimer += dt;
      if (this.nukeCooldownTimer >= stats.nukeCooldown) {
        this.nukeCooldownTimer = 0;
        this.triggerNuke();
      }
    }

    // 2.3 Combat Drone companion auto-attack
    if (stats.droneActive) {
      this.droneFireTimer += dt;
      if (this.droneFireTimer >= 0.55) {
        this.droneFireTimer = 0;
        const target = this.findClosestSegment();
        if (target) {
          this.projectileManager.spawnDroneShot(this.turret.x - 38, this.turret.y - 48, target.x, target.y, Math.round(stats.damage * 0.8));
          sounds.playLaser();
        }
      }
    }

    // 2.4 Satellite defensive collision barrier
    if (stats.satelliteCount > 0) {
      const sats = this.turret.getSatellitePositions(stats);
      for (const sat of sats) {
        for (const snake of this.snakeManager.snakes) {
          for (const seg of snake.segments) {
            const d = Math.hypot(seg.x - sat.x, seg.y - sat.y);
            if (d < sat.radius + seg.radius + 3) {
              this.applyDamageToSegment(seg, snake, 28 + stats.damage * 0.45, false);
              this.particleSystem.emitSparks(sat.x, sat.y, '#38bdf8', 4);
            }
          }
        }
      }
    }

    // 3. Update Snakes & Boss attacks
    this.snakeManager.update(
      dt,
      this.width,
      defenseLineY,
      (damage) => {
        gameState.takeDamage(damage);
        this.shakeAmount = 14;
        sounds.playDamage();
      },
      (boss) => {
        this.executeBossAttack(boss);
      },
      (eliteSeg) => {
        this.executeEliteAttack(eliteSeg);
      }
    );

    // Sync boss HP if boss is alive
    const bossSnake = this.snakeManager.snakes.find(s => s.isBoss);
    if (bossSnake) {
      let currentBossHp = 0;
      for (const seg of bossSnake.segments) {
        if (!seg.isHead) {
          currentBossHp += seg.hp;
        }
      }
      gameState.bossHp = Math.max(0, currentBossHp);
      gameState.bossRemainingSegments = Math.max(0, bossSnake.segments.length - 1);

      // Boss rage phase progression
      const hpRatio = gameState.bossHp / gameState.bossMaxHp;
      if (hpRatio < 0.35 && bossSnake.bossPhase !== 3) {
        bossSnake.bossPhase = 3;
        gameState.bossPhase = 3;
        this.shakeAmount = 16;
        sounds.playNuke();
      } else if (hpRatio < 0.65 && bossSnake.bossPhase === 1) {
        bossSnake.bossPhase = 2;
        gameState.bossPhase = 2;
        this.shakeAmount = 8;
      }
    }

    // 4. Update Projectiles & Multiplier Gates
    const closestSegment = this.findClosestSegment();
    this.projectileManager.update(dt, this.width, this.height, closestSegment);

    // 4.1 Process Dynamic Oscillating Multiplier Gate (下方1/4左右移动倍率窗口)
    // 存在场上的节数：玩家能看见的节数 (y within canvas bounds)
    const activeSnake = this.snakeManager.snakes[0];
    const onScreenSegments = activeSnake
      ? activeSnake.segments.filter(s => s.y >= -20 && s.y <= this.height + 20).length
      : 0;
    gameState.bossOnScreenSegments = onScreenSegments;
    this.multiplierGates.update(dt, this.width, this.height, onScreenSegments);
    this.multiplierGates.checkBulletInteractions(
      this.projectileManager.projectiles,
      (clonedBullet) => {
        this.projectileManager.projectiles.push(clonedBullet);
      },
      (gate) => {
        sounds.playHit();
        this.particleSystem.emitSparks(gate.x, gate.y, gate.color, 4);
        this.projectileManager.addFloatingText(gate.x, gate.y - 18, `★ ${gate.label} ★`, gate.color, true);
      }
    );

    this.handleCollisions();

    // 5. Update Particles & Coins
    this.particleSystem.update(dt, (gold) => {
      gameState.addGold(gold);
      sounds.playCoin();
    });

    // 5.4 Update Falling 3-Choice Gates (Triggered strictly by breaking chests)
    this.choiceGatesManager.update(
      dt,
      this.width,
      this.turret.x,
      this.turret.y,
      (selected: ChoiceGateOption) => {
        gameState.chestRewardsCount++;
        if (selected.type === 'SKILL' && selected.skill) {
          gameState.applySkill(selected.skill.id);
        } else if (selected.type === 'GOLD') {
          gameState.addGold(350);
        } else if (selected.type === 'OVERLOAD_DMG') {
          gameState.stats.damage = Math.round(gameState.stats.damage * 1.35);
          gameState.stats.fireRate = Number((gameState.stats.fireRate * 1.25).toFixed(1));
          this.projectileManager.addFloatingText(this.turret.x, this.turret.y - 35, '⚡ 火力超载 +35%！', '#f43f5e', true);
        } else if (selected.type === 'INSTANT_NUKE') {
          this.triggerNuke();
          this.projectileManager.addFloatingText(this.turret.x, this.turret.y - 35, '☢️ 轨道天谴轰炸！', '#fbbf24', true);
        }
        gameState.notify();
        // Emit celebratory fireworks & chest particles around turret
        this.particleSystem.emitGoldChestBurst(this.turret.x, this.turret.y - 20, 14, 18, this.width - 45, 25);
        this.shakeAmount = 5;
      }
    );

    // 6. Decay screen shake & nuke flash
    if (this.shakeAmount > 0) {
      this.shakeAmount = Math.max(0, this.shakeAmount - dt * 28);
    }
    if (this.nukeFlash > 0) {
      this.nukeFlash = Math.max(0, this.nukeFlash - dt * 2.5);
    }

    // 7. Update background star scrolling
    this.gridOffset = (this.gridOffset + dt * 45) % 40;
    for (const star of this.stars) {
      star.y += (star.speed * dt) / this.height;
      if (star.y > 1) {
        star.y = 0;
        star.x = Math.random();
      }
    }
  }

  private executeBossAttack(boss: Snake2DInstance) {
    if (boss.segments.length === 0) return;
    const head = boss.segments[0];

    if (boss.bossPhase === 3) {
      // Spiral bullet barrage in rage mode
      for (let i = 0; i < 5; i++) {
        const angle = Math.PI * 0.2 + (i * Math.PI * 0.6) / 4;
        const spd = 200;
        this.projectileManager.spawnEnemyOrb(head.x, head.y, Math.cos(angle) * spd, Math.sin(angle) * spd, 18);
      }
      this.shakeAmount = 6;
      sounds.playHit();
    } else {
      // Targeted venom spit towards turret
      const dx = this.turret.x - head.x;
      const dy = this.turret.y - head.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const spd = 220;
      this.projectileManager.spawnEnemyOrb(head.x, head.y, (dx / dist) * spd, (dy / dist) * spd, 15);
      sounds.playHit();
    }
  }

  private executeEliteAttack(eliteSeg: Segment2D) {
    // Elite snake venom spit aimed at defense turret
    const dx = this.turret.x - eliteSeg.x;
    const dy = this.turret.y - eliteSeg.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      const spd = 210;
      this.projectileManager.spawnEnemyOrb(eliteSeg.x, eliteSeg.y, (dx / dist) * spd, (dy / dist) * spd, 12);
      this.particleSystem.emitSparks(eliteSeg.x, eliteSeg.y, '#a855f7', 4);
    }
  }

  private fireOrbitalLaser(level = 1) {
    const target = this.findClosestSegment();
    if (!target) return;

    const beamWidth = 10 + level * 3;
    const stats = gameState.stats;
    const beamDamage = Math.max(850, stats.damage * (5 + level * 2.5));
    this.projectileManager.addLaserBeam(target.x, 0, target.x, target.y + 40, '#a855f7', beamWidth);
    this.shakeAmount = 6 + level;
    sounds.playLaser();

    // Damage all segments near the laser line
    for (const snake of this.snakeManager.snakes) {
      for (const seg of snake.segments) {
        if (Math.abs(seg.x - target.x) < 32 + level * 4) {
          this.applyDamageToSegment(seg, snake, beamDamage, true);
        }
      }
    }

    // Level 4+ fires secondary dual beam on another target
    if (level >= 4) {
      const allSnakes = this.snakeManager.snakes;
      if (allSnakes.length > 0) {
        const lastSnake = allSnakes[allSnakes.length - 1];
        if (lastSnake.segments.length > 0) {
          const otherSeg = lastSnake.segments[0];
          if (otherSeg && otherSeg !== target) {
            this.projectileManager.addLaserBeam(otherSeg.x, 0, otherSeg.x, otherSeg.y + 40, '#38bdf8', beamWidth * 0.8);
            for (const snake of this.snakeManager.snakes) {
              for (const seg of snake.segments) {
                if (Math.abs(seg.x - otherSeg.x) < 28) {
                  this.applyDamageToSegment(seg, snake, beamDamage * 0.8, true);
                }
              }
            }
          }
        }
      }
    }
  }

  private findClosestSegment(): Segment2D | undefined {
    let closest: Segment2D | undefined;
    let minDist = Infinity;

    for (const snake of this.snakeManager.snakes) {
      for (const seg of snake.segments) {
        const dx = seg.x - this.turret.x;
        const dy = seg.y - this.turret.y;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          minDist = dist;
          closest = seg;
        }
      }
    }
    return closest;
  }

  private handleCollisions() {
    const stats = gameState.stats;

    // 1. Player Projectiles vs Snake Segments
    for (let pIdx = this.projectileManager.projectiles.length - 1; pIdx >= 0; pIdx--) {
      const p = this.projectileManager.projectiles[pIdx];

      for (const snake of this.snakeManager.snakes) {
        let hitAny = false;

        for (let sIdx = snake.segments.length - 1; sIdx >= 0; sIdx--) {
          const seg = snake.segments[sIdx];
          const dx = p.x - seg.x;
          const dy = p.y - seg.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < p.radius + seg.radius) {
            hitAny = true;
            this.applyDamageToSegment(seg, snake, p.damage, p.isCrit);

            // 1.1 Fire DoT (炼狱烈焰)
            if (stats.fireChance > 0 && Math.random() < stats.fireChance) {
              seg.burnTimer = 3.5;
              this.particleSystem.emitSparks(seg.x, seg.y, '#f97316', 5);
            }

            // 1.2 Explosion AOE (高爆弹头)
            if (stats.aoeRadius > 0 && p.type !== 'SHRAPNEL') {
              const blastRadius = stats.aoeRadius * 22;
              const aoeDmg = p.damage * (stats.aoeDamageMultiplier || 0.65);
              this.particleSystem.emitExplosion(p.x, p.y, '#f97316', 8, blastRadius * 0.6);
              for (const snk of this.snakeManager.snakes) {
                for (const s of snk.segments) {
                  if (s === seg) continue;
                  const d = Math.hypot(s.x - p.x, s.y - p.y);
                  if (d < blastRadius) {
                    this.applyDamageToSegment(s, snk, aoeDmg, p.isCrit);
                    if (gameState.activeSynergyIds.has('inferno')) {
                      s.burnTimer = 3.0;
                    }
                  }
                }
              }
            }

            // 1.3 Scatter (散射风暴)
            const scatterLvl = gameState.activeSkills.get('scatter') || 0;
            if (scatterLvl > 0 && p.type === 'BULLET') {
              this.projectileManager.spawnShrapnel(p.x, p.y, 2 + scatterLvl, p.damage * 0.35);
            }

            // 1.4 Chain lightning proc
            if (stats.lightningChance > 0 && Math.random() < stats.lightningChance) {
              this.procChainLightning(seg);
            }

            // 1.9 Ricochet bounce check
            let didRicochet = false;
            if (p.bouncesLeft && p.bouncesLeft > 0) {
              p.bouncesLeft--;
              let nextTarget: Segment2D | null = null;
              let minD = Infinity;
              for (const snk of this.snakeManager.snakes) {
                for (const s of snk.segments) {
                  if (s === seg || s.hp <= 0) continue;
                  const d = Math.hypot(s.x - p.x, s.y - p.y);
                  if (d < 180 && d < minD) {
                    minD = d;
                    nextTarget = s;
                  }
                }
              }
              if (nextTarget) {
                const spd = Math.hypot(p.vx, p.vy) || 900;
                const bdx = nextTarget.x - p.x;
                const bdy = nextTarget.y - p.y;
                const bdist = Math.hypot(bdx, bdy) || 1;
                p.vx = (bdx / bdist) * spd;
                p.vy = (bdy / bdist) * spd;
                p.x = seg.x;
                p.y = seg.y;
                this.particleSystem.emitSparks(p.x, p.y, '#38bdf8', 5);
                didRicochet = true;
              }
            }

            if (didRicochet) {
              break;
            }

            // Pierce check
            p.pierce--;
            if (p.pierce < 0) {
              this.projectileManager.projectiles.splice(pIdx, 1);
            }
            break;
          }
        }
        if (hitAny) break;
      }
    }

    // 2. Enemy Orbs vs Turret
    for (let oIdx = this.projectileManager.enemyOrbs.length - 1; oIdx >= 0; oIdx--) {
      const o = this.projectileManager.enemyOrbs[oIdx];
      const dx = o.x - this.turret.x;
      const dy = o.y - this.turret.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < o.radius + 22) {
        gameState.takeDamage(o.damage);
        this.shakeAmount = 8;
        sounds.playDamage();
        this.particleSystem.emitExplosion(o.x, o.y, '#ef4444', 8, 12);
        this.projectileManager.enemyOrbs.splice(oIdx, 1);
      }
    }
  }

  private applyDamageToSegment(seg: Segment2D, snake: Snake2DInstance, damage: number, isCrit: boolean) {
    // 👑 蛇头不无敌，可正常受到伤害！
    let effectiveDamage = damage;
    if (seg.isArmored) {
      const pen = gameState.stats.armorPenetration || 0;
      effectiveDamage = Math.max(1, damage * (0.45 + pen * 0.55));
    }

    if (snake.isBoss || seg.isHead) {
      const bossMult = gameState.stats.bossDamageMultiplier || 1.0;
      effectiveDamage *= bossMult;
    }

    seg.hp -= effectiveDamage;
    seg.hitFlash = 3;

    // Floating text
    this.projectileManager.addFloatingText(
      seg.x,
      seg.y,
      Math.round(effectiveDamage).toString(),
      isCrit ? '#f59e0b' : (seg.isHead ? '#f43f5e' : '#38bdf8'),
      isCrit || seg.isHead
    );

    // Sparks
    this.particleSystem.emitSparks(seg.x, seg.y, seg.glowColor, isCrit ? 6 : 4);
    sounds.playHit();

    // Synchronize remaining Boss HP for living segments
    if (snake.isBoss) {
      let remainingHp = 0;
      for (const s of snake.segments) {
        if (s.hp > 0) {
          remainingHp += s.hp;
        }
      }
      gameState.bossHp = remainingHp;
    }

    // Segment Destruction
    if (seg.hp <= 0) {
      this.onSegmentDestroyed(seg, snake);
    }
  }

  private onSegmentDestroyed(seg: Segment2D, snake: Snake2DInstance) {
    const segIdx = snake.segments.indexOf(seg);
    if (segIdx === -1) return;

    // 👑 蛇头死就全死！斩首触发全蛇连锁大爆炸与通关！
    if (seg.isHead) {
      this.shakeAmount = 24;
      sounds.playBossExplode();

      // Emit huge explosions across all remaining segments
      for (const s of snake.segments) {
        this.particleSystem.emitExplosion(s.x, s.y, s.color || '#f59e0b', 18, s.radius * 2.2);
        this.particleSystem.emitGoldChestBurst(s.x, s.y, 8, 12, this.width - 45, 20);
      }

      this.projectileManager.addFloatingText(seg.x, seg.y - 30, '★ 蛇头斩首！全蛇暴毙覆灭！ ★', '#facc15', true);

      // Huge clear rewards
      gameState.addGold(300 + this.currentWaveIndex * 80);
      gameState.addScore(1500 + this.currentWaveIndex * 300);
      gameState.addXp(200 + this.currentWaveIndex * 50);

      gameState.bossHp = 0;
      this.bossActive = false;
      snake.dead = true;
      snake.segments = [];
      return;
    }

    snake.segments.splice(segIdx, 1);

    // Update remaining Boss HP
    if (snake.isBoss) {
      let remainingHp = 0;
      for (const s of snake.segments) {
        if (s.hp > 0) {
          remainingHp += s.hp;
        }
      }
      gameState.bossHp = remainingHp;
    }

    // 🐍 每消灭一个蛇身，蛇头要回退一个蛇身长度！
    if (snake.segments.length > 1 && snake.segments[0]?.isHead) {
      const retreatedPos = this.snakeManager.retreatSnake(snake);
      if (retreatedPos) {
        sounds.playPushback();
        this.shakeAmount = Math.max(this.shakeAmount, 5);
        this.particleSystem.emitSparks(retreatedPos.x, retreatedPos.y, '#38bdf8', 9);
        this.projectileManager.addFloatingText(retreatedPos.x, retreatedPos.y - 18, '◄◄ 蛇头回退 -1节!', '#38bdf8', false);
      }
    }

    if (seg.isChest) {
      // 📦 CHEST CRACKED!
      sounds.playChest();
      this.shakeAmount = 10;
      this.particleSystem.emitGoldChestBurst(seg.x, seg.y, 16, 18, this.width - 45, 25);
      this.projectileManager.addFloatingText(seg.x, seg.y - 25, '★ 宝箱击破！获得战术成长！ ★', '#fbbf24', true);
      
      const chestGold = 150 + this.currentWaveIndex * 40;
      gameState.addGold(chestGold);
      gameState.addXp(40 + this.currentWaveIndex * 15);

      // Spawn falling 3-choice tactical gates directly on screen
      const guaranteedRarity = this.currentWaveIndex >= 5 ? 'EPIC' : (this.currentWaveIndex >= 3 ? 'RARE' : undefined);
      this.choiceGatesManager.spawnGates(this.width, guaranteedRarity);
    } else {
      // Regular segment
      sounds.playKill();
      this.particleSystem.emitExplosion(seg.x, seg.y, seg.color, 12, seg.radius);
      const killScore = 20 + this.currentWaveIndex * 6;
      const killGold = 8 + this.currentWaveIndex * 2;
      const killXp = 10 + this.currentWaveIndex * 3;
      gameState.recordKill(seg.type, killScore, killGold, killXp);
    }

    // Explosive segment AOE
    if (seg.type === 'EXPLOSIVE') {
      this.shakeAmount = 8;
      const killed: Segment2D[] = [];
      for (const otherSeg of snake.segments) {
        if (otherSeg.isHead || otherSeg === seg) continue;
        const d = Math.hypot(otherSeg.x - seg.x, otherSeg.y - seg.y);
        if (d < 85) {
          otherSeg.hp -= 40;
          otherSeg.hitFlash = 4;
          if (otherSeg.hp <= 0) {
            killed.push(otherSeg);
          }
        }
      }
      for (const k of killed) {
        this.onSegmentDestroyed(k, snake);
      }
    }

    // Victory Check: If all body segments eliminated, head loses all body and self-destructs!
    if (snake.segments.length <= 1 && snake.segments[0]?.isHead) {
      const head = snake.segments[0];
      this.shakeAmount = 14;
      sounds.playBossExplode();
      this.particleSystem.emitExplosion(head.x, head.y, '#f59e0b', 28, 70);
      this.projectileManager.addFloatingText(head.x, head.y - 30, '★ 99节躯体全灭！蛇王自爆！ ★', '#facc15', true);

      // Bonus clear reward
      gameState.addGold(60 + this.currentWaveIndex * 25);
      gameState.addScore(250 + this.currentWaveIndex * 60);

      gameState.bossHp = 0;
      this.bossActive = false;
      snake.dead = true;
      snake.segments = [];
    }
  }

  private procChainLightning(sourceSeg: Segment2D) {
    let chainCount = gameState.stats.lightningChains || 3;
    let currentSource = sourceSeg;

    for (const snake of this.snakeManager.snakes) {
      for (const seg of snake.segments) {
        if (seg === currentSource || seg.hp <= 0) continue;
        const d = Math.hypot(seg.x - currentSource.x, seg.y - currentSource.y);
        if (d < 240) {
          this.projectileManager.addLightningArc(
            { x: currentSource.x, y: currentSource.y },
            { x: seg.x, y: seg.y },
            '#60a5fa'
          );
          const lightningDmg = Math.max(120, gameState.stats.damage * 0.95);
          this.applyDamageToSegment(seg, snake, lightningDmg, false);
          currentSource = seg;
          chainCount--;
          if (chainCount <= 0) return;
        }
      }
    }
  }

  public triggerNuke() {
    this.nukeFlash = 1.0;
    this.shakeAmount = 24;
    sounds.playNuke();

    // Destroy all enemy projectiles
    this.projectileManager.enemyOrbs = [];

    // Damage all visible snake segments with massive nuclear strike
    const stats = gameState.stats;
    const nukeDamage = Math.max(3500, stats.damage * 25);
    for (const snake of this.snakeManager.snakes) {
      for (let sIdx = snake.segments.length - 1; sIdx >= 0; sIdx--) {
        const seg = snake.segments[sIdx];
        this.applyDamageToSegment(seg, snake, nukeDamage, true);
      }
    }
  }

  public triggerChoiceGates(guaranteedRarity?: string) {
    this.choiceGatesManager.spawnGates(this.width, guaranteedRarity);
  }

  private onWaveCompleted(wave: (typeof WAVES)[0]) {
    this.waveClearTimer = 0;
    if (wave.hasShopAfter) {
      gameState.setMode('SHOP');
    } else if (this.currentWaveIndex >= WAVES.length - 1) {
      gameState.setMode('VICTORY');
    } else {
      // Next wave continuous upgrade choice: spawn gates without pausing!
      this.currentWaveIndex++;
      this.startWave(this.currentWaveIndex);
      this.choiceGatesManager.spawnGates(this.width, this.currentWaveIndex >= 4 ? 'EPIC' : 'RARE');
    }
  }

  private render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    // Apply Screen Shake
    if (this.shakeAmount > 0) {
      const sx = (Math.random() - 0.5) * this.shakeAmount;
      const sy = (Math.random() - 0.5) * this.shakeAmount;
      ctx.translate(sx, sy);
    }

    // 1. Cyber vertical space background
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle moving vertical grid
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < this.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = (this.gridOffset % gridSize); y < this.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Starfield particles
    for (const s of this.stars) {
      ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
      ctx.fillRect(s.x * this.width, s.y * this.height, s.size, s.size);
    }

    // 2. Left & Right Glowing Barrier Rails
    const railColor = 'rgba(14, 165, 233, 0.35)';
    ctx.strokeStyle = railColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(14, this.height);
    ctx.moveTo(this.width - 14, 0);
    ctx.lineTo(this.width - 14, this.height);
    ctx.stroke();

    // 3. Bottom Defense Laser Demarcation Line
    const defenseY = this.height - 85;
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(16, defenseY);
    ctx.lineTo(this.width - 16, defenseY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Draw Snakes and Boss (3D Cuboids 1/6 screen width)
    this.snakeManager.draw(ctx, this.width);

    // 4.2 Draw Mid-Field Multiplier Gates (广告同款倍率门)
    this.multiplierGates.draw(ctx);

    // 4.5 Draw Falling 3-Choice Energy Gates (3个等分的门)
    this.choiceGatesManager.draw(ctx, this.width, this.turret.x, this.turret.y);

    // 5. Draw Projectiles, Lasers & Floating Texts
    this.projectileManager.draw(ctx);

    // 6. Draw Player Turret
    this.turret.draw(ctx, gameState.stats, gameState.combo);

    // 7. Draw Particles & Flying Coins
    this.particleSystem.draw(ctx);

    // 8. Tactical Nuke Flash Screen Overlay
    if (this.nukeFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.nukeFlash * 0.75})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    ctx.restore();
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
    }
  }
}
