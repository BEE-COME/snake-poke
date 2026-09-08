import { SkillDefinition } from '../../types/game';
import { gameState } from '../GameState';
import { sounds } from '../../audio/SoundSystem';

export interface ChoiceGateOption {
  type: 'SKILL' | 'GOLD' | 'OVERLOAD_DMG' | 'INSTANT_NUKE';
  skill?: SkillDefinition;
  title: string;
  icon: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  color: string;
  glowColor: string;
  currentLevel: number;
  nextLevel: number;
  isNew: boolean;
  desc: string;
}

export interface FallingGateSet {
  id: number;
  y: number;
  height: number;
  speed: number;
  options: [ChoiceGateOption, ChoiceGateOption, ChoiceGateOption];
  state: 'FALLING' | 'COLLECTED';
  collectedIndex: number;
  collectTimer: number;
  pulsePhase: number;
}

export interface FloatingRewardBanner {
  text: string;
  subText: string;
  color: string;
  y: number;
  alpha: number;
  timer: number;
}

export class ChoiceGatesManager2D {
  public currentGates: FallingGateSet | null = null;
  private pendingCount = 0;
  private nextId = 1;
  public banners: FloatingRewardBanner[] = [];

  public spawnGates(screenWidth: number, guaranteedRarity?: string) {
    if (this.currentGates && this.currentGates.state === 'FALLING') {
      // If a gate set is already falling, queue it
      this.pendingCount++;
      return;
    }

    const options = this.generateGateOptions(guaranteedRarity);
    this.currentGates = {
      id: this.nextId++,
      y: -130, // Start just above visible screen
      height: 125,
      speed: 135, // Smooth descent (~4.5 seconds to reach turret)
      options,
      state: 'FALLING',
      collectedIndex: -1,
      collectTimer: 0,
      pulsePhase: 0,
    };
  }

  private generateGateOptions(guaranteedRarity?: string): [ChoiceGateOption, ChoiceGateOption, ChoiceGateOption] {
    const rawChoices = gameState.generateUpgradeChoices(guaranteedRarity);
    const result: ChoiceGateOption[] = [];

    // Map skill choices
    for (const skill of rawChoices) {
      if (result.length >= 3) break;
      const currentLevel = gameState.activeSkills.get(skill.id) || 0;
      const nextLevel = currentLevel + 1;
      const isNew = currentLevel === 0;
      const levelDef = skill.levels[Math.min(skill.levels.length - 1, nextLevel - 1)];

      const rarityColors: Record<string, { color: string; glow: string }> = {
        COMMON: { color: '#38bdf8', glow: '#0284c7' },
        RARE: { color: '#f59e0b', glow: '#d97706' },
        EPIC: { color: '#c084fc', glow: '#9333ea' },
        LEGENDARY: { color: '#fb7185', glow: '#e11d48' }
      };

      const c = rarityColors[skill.rarity] || rarityColors.COMMON;

      result.push({
        type: 'SKILL',
        skill,
        title: skill.nameZh,
        icon: skill.icon,
        rarity: skill.rarity,
        color: c.color,
        glowColor: c.glow,
        currentLevel,
        nextLevel,
        isNew,
        desc: levelDef?.description || skill.description
      });
    }

    // Fallback offensive options if skills run out
    const fallbacks: ChoiceGateOption[] = [
      {
        type: 'OVERLOAD_DMG',
        title: '★ 全域火力超载 ★',
        icon: '⚡',
        rarity: 'EPIC',
        color: '#f43f5e',
        glowColor: '#e11d48',
        currentLevel: 1,
        nextLevel: 1,
        isNew: false,
        desc: '基础攻击力提升 +35%，射速 +25%'
      },
      {
        type: 'INSTANT_NUKE',
        title: '☢️ 战术轨道天谴 ☢️',
        icon: '💥',
        rarity: 'LEGENDARY',
        color: '#fbbf24',
        glowColor: '#b45309',
        currentLevel: 1,
        nextLevel: 1,
        isNew: false,
        desc: '立即引发全屏毁灭天基轨道核轰炸！'
      },
      {
        type: 'GOLD',
        title: '💰 战备军费补给 💰',
        icon: '💰',
        rarity: 'RARE',
        color: '#38bdf8',
        glowColor: '#0284c7',
        currentLevel: 1,
        nextLevel: 1,
        isNew: false,
        desc: '获得 350 战术军备金币'
      }
    ];

    let fbIdx = 0;
    while (result.length < 3) {
      result.push(fallbacks[fbIdx % fallbacks.length]);
      fbIdx++;
    }

    return [result[0], result[1], result[2]];
  }

  public update(
    dt: number,
    screenWidth: number,
    turretX: number,
    turretY: number,
    onApplyOption: (opt: ChoiceGateOption) => void
  ) {
    // Update active banners
    for (let i = this.banners.length - 1; i >= 0; i--) {
      const b = this.banners[i];
      b.timer -= dt;
      b.y -= 25 * dt;
      if (b.timer < 0.4) {
        b.alpha = Math.max(0, b.timer / 0.4);
      }
      if (b.timer <= 0) {
        this.banners.splice(i, 1);
      }
    }

    if (!this.currentGates) return;

    const gates = this.currentGates;
    gates.pulsePhase += dt * 5;

    if (gates.state === 'FALLING') {
      gates.y += gates.speed * dt;

      // Check collision with player turret line
      const colWidth = screenWidth / 3;
      const activeCol = Math.min(2, Math.max(0, Math.floor(turretX / colWidth)));

      // When the bottom of the gates reaches the player turret center
      if (gates.y + gates.height >= turretY - 8) {
        gates.state = 'COLLECTED';
        gates.collectedIndex = activeCol;
        gates.collectTimer = 0.45; // 0.45s celebration zoom

        const selected = gates.options[activeCol];
        onApplyOption(selected);

        // Trigger celebratory floating text
        let bannerTitle = '';
        let bannerSub = '';
        if (selected.type === 'SKILL' && selected.skill) {
          bannerTitle = `✦ 战术升级: ${selected.title} Lv.${selected.nextLevel}!`;
          bannerSub = selected.desc;
        } else if (selected.type === 'GOLD') {
          bannerTitle = `💰 战备物资: +350 金币!`;
          bannerSub = '军备金币已存入金库';
        } else if (selected.type === 'OVERLOAD_DMG') {
          bannerTitle = `⚡ 全域火力超载: 攻击+35% 射速+25%!`;
          bannerSub = '主炮输出矩阵暴增';
        } else {
          bannerTitle = `☢️ 战术轨道天谴: 全屏轰炸!`;
          bannerSub = '天基轨道炮已开火';
        }

        this.banners.push({
          text: bannerTitle,
          subText: bannerSub,
          color: selected.color,
          y: turretY - 90,
          alpha: 1.0,
          timer: 2.2
        });

        sounds.playLevelUp();
      }
    } else if (gates.state === 'COLLECTED') {
      gates.collectTimer -= dt;
      if (gates.collectTimer <= 0) {
        this.currentGates = null;

        // Spawn next queued gate drop if any
        if (this.pendingCount > 0) {
          this.pendingCount--;
          this.spawnGates(screenWidth);
        }
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D, screenWidth: number, turretX: number, turretY: number) {
    // 1. Draw Active Banners first
    for (const b of this.banners) {
      ctx.save();
      ctx.globalAlpha = b.alpha;
      ctx.textAlign = 'center';

      // Background badge
      const textWidth = ctx.measureText(b.text).width;
      const badgeW = Math.max(220, textWidth + 40);
      const badgeH = 44;
      const badgeX = screenWidth / 2 - badgeW / 2;
      const badgeY = b.y - badgeH / 2;

      ctx.fillStyle = 'rgba(10, 18, 35, 0.88)';
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 10;
      this.drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 12);
      ctx.fill();
      ctx.stroke();

      // Main Text
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      ctx.fillText(b.text, screenWidth / 2, b.y - 4);

      // Sub text
      ctx.fillStyle = b.color;
      ctx.font = '11px system-ui, -apple-system, sans-serif';
      ctx.fillText(b.subText, screenWidth / 2, b.y + 12);

      ctx.restore();
    }

    if (!this.currentGates) return;

    const gates = this.currentGates;
    const colWidth = screenWidth / 3;
    const activeCol = Math.min(2, Math.max(0, Math.floor(turretX / colWidth)));

    ctx.save();

    // 2. Draw Top Heading Header over the gates
    const headerY = gates.y - 24;
    if (headerY > -40 && headerY < screenWidth * 2) {
      ctx.save();
      ctx.textAlign = 'center';
      const headerText = '✦ 战术能量门 · 左右移动炮台对齐进门选择强化';
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';

      const hw = ctx.measureText(headerText).width + 24;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
      ctx.lineWidth = 1;
      this.drawRoundedRect(ctx, screenWidth / 2 - hw / 2, headerY - 14, hw, 20, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fde68a';
      ctx.fillText(headerText, screenWidth / 2, headerY);
      ctx.restore();
    }

    // 3. Draw the 3 Equal-Width Gates
    for (let i = 0; i < 3; i++) {
      const opt = gates.options[i];
      const isCurrentTarget = i === activeCol;
      const isCollected = gates.state === 'COLLECTED' && gates.collectedIndex === i;
      const isOtherDiscarded = gates.state === 'COLLECTED' && gates.collectedIndex !== i;

      const cardMargin = 5;
      const cardX = i * colWidth + cardMargin;
      const cardW = colWidth - cardMargin * 2;
      let cardY = gates.y;
      let cardH = gates.height;

      let alpha = 1.0;
      if (isOtherDiscarded) {
        alpha = Math.max(0, gates.collectTimer / 0.45);
      } else if (isCollected) {
        // Pop expansion effect on chosen gate
        const progress = 1 - gates.collectTimer / 0.45;
        cardY -= progress * 8;
        cardH += progress * 10;
      }

      ctx.save();
      ctx.globalAlpha = alpha;

      // If this gate is currently targeted by turret, draw guidance beam to turret
      if (isCurrentTarget && gates.state === 'FALLING') {
        ctx.save();
        const beamGrad = ctx.createLinearGradient(0, cardY + cardH, 0, turretY);
        beamGrad.addColorStop(0, `${opt.color}66`);
        beamGrad.addColorStop(1, `${opt.color}11`);
        ctx.fillStyle = beamGrad;
        ctx.fillRect(cardX + 4, cardY + cardH, cardW - 8, Math.max(0, turretY - (cardY + cardH)));

        // Dashed target beam line
        ctx.strokeStyle = opt.color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cardX + cardW / 2, cardY + cardH);
        ctx.lineTo(turretX, turretY - 16);
        ctx.stroke();
        ctx.restore();
      }

      // Card Background
      const bgGrad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
      if (isCurrentTarget) {
        bgGrad.addColorStop(0, 'rgba(15, 30, 60, 0.95)');
        bgGrad.addColorStop(1, 'rgba(8, 20, 42, 0.92)');
      } else {
        bgGrad.addColorStop(0, 'rgba(12, 20, 36, 0.88)');
        bgGrad.addColorStop(1, 'rgba(6, 12, 24, 0.85)');
      }

      ctx.fillStyle = bgGrad;
      this.drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 10);
      ctx.fill();

      // Card Border & Glow
      ctx.lineWidth = isCurrentTarget ? 2.5 : 1.2;
      ctx.strokeStyle = isCurrentTarget ? opt.color : 'rgba(100, 116, 139, 0.4)';
      if (isCurrentTarget) {
        ctx.shadowColor = opt.glowColor;
        ctx.shadowBlur = 12 + Math.sin(gates.pulsePhase) * 4;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // reset blur

      // Subtle gate portal grid lines inside card
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = `${opt.color}18`;
      ctx.lineWidth = 1;
      for (let gy = cardY; gy < cardY + cardH; gy += 16) {
        ctx.beginPath();
        ctx.moveTo(cardX, gy);
        ctx.lineTo(cardX + cardW, gy);
        ctx.stroke();
      }
      ctx.restore();

      // Content:
      const centerX = cardX + cardW / 2;

      // 1. Rarity tag pill at top
      const rarityLabels: Record<string, string> = {
        COMMON: '✦ 基础',
        RARE: '★ 稀有',
        EPIC: '👑 史诗',
        LEGENDARY: '⚡ 传说'
      };
      const rLabel = rarityLabels[opt.rarity] || '✦ 基础';
      ctx.font = 'bold 9px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = opt.color;
      ctx.fillText(rLabel, centerX, cardY + 16);

      // 2. Icon (Large & Center)
      ctx.font = '22px sans-serif';
      ctx.fillText(opt.icon, centerX, cardY + 44);

      // 3. Title
      ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(opt.title, centerX, cardY + 65);

      // 4. Level indicator
      let levelText = '';
      if (opt.type === 'SKILL') {
        levelText = opt.isNew ? '⚡ 新技能' : `Lv.${opt.currentLevel} ➔ Lv.${opt.nextLevel}`;
      } else {
        levelText = '即时生效';
      }
      ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = opt.color;
      ctx.fillText(levelText, centerX, cardY + 80);

      // 5. Short Description
      ctx.font = '9px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#94a3b8';
      const truncatedDesc = opt.desc.length > 12 ? opt.desc.slice(0, 11) + '..' : opt.desc;
      ctx.fillText(truncatedDesc, centerX, cardY + 95);

      // 6. Bottom Targeting Prompt
      if (isCurrentTarget && gates.state === 'FALLING') {
        ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#fef08a';
        ctx.fillText('▲ 已瞄准 ▲', centerX, cardY + 114);
      } else {
        ctx.font = '9px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText('移动进入', centerX, cardY + 114);
      }

      ctx.restore();
    }

    ctx.restore();
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  public reset() {
    this.currentGates = null;
    this.pendingCount = 0;
    this.banners = [];
  }
}
