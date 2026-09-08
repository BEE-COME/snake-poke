import { ActiveSkill, ChestReward, EnemyType, GameModeState, PlayerStats, SkillDefinition } from '../types/game';
import { SKILLS, SYNERGIES } from '../data/skills';
import { SaveSystem } from './SaveSystem';
import { sounds } from '../audio/SoundSystem';

export const BASE_STATS: PlayerStats = {
  maxHp: 100,
  hp: 100,
  maxShield: 40,
  shield: 40,
  damage: 15, // 初始平衡基础攻击
  fireRate: 4.0, // 4.0发/秒
  projectileCount: 1, // 单发主炮
  projectileSpeed: 980,
  critChance: 0.10,
  critMultiplier: 1.8,
  pierce: 0, // 初始0穿透
  aoeRadius: 0,
  aoeDamageMultiplier: 0,
  moveSpeed: 18,
  pickupRadius: 5,
  fireChance: 0,
  fireDps: 0,
  lightningChance: 0,
  lightningChains: 0,
  freezeChance: 0,
  freezeDuration: 0,
  poisonChance: 0,
  knockback: 0,
  homingStrength: 0,
  ricochetCount: 0,
  nukeCooldown: 0,
  satelliteCount: 0,
  droneActive: false,
  blackHoleChance: 0,
  damageReduction: 0,
  bossDamageMultiplier: 1.0,
  armorPenetration: 0,
};

type StateListener = () => void;

export class GameState {
  public mode: GameModeState = 'MENU';
  public stats: PlayerStats = { ...BASE_STATS };
  public activeSkills: Map<string, number> = new Map();
  public activeSynergyIds: Set<string> = new Set();

  public currentWave: number = 1;
  public totalWaves: number = 8;
  public waveProgress: number = 0; // 0 to 1

  public score: number = 0;
  public gold: number = 0;
  public kills: number = 0;
  public combo: number = 0;
  public maxCombo: number = 0;
  public comboTimer: number = 0;

  public level: number = 1;
  public xp: number = 0;
  public maxXp: number = 40;

  public bossHp: number = 0;
  public bossMaxHp: number = 0;
  public bossPhase: number = 1;
  public bossRemainingSegments: number = 99;
  public bossOnScreenSegments: number = 0; // 场上可见节数
  public chestRewardsCount: number = 0;

  public pendingChest: ChestReward | null = null;
  public upgradeOptions: SkillDefinition[] = [];
  public pendingLevelUps: number = 0;
  public onLevelUp?: (level: number) => void;

  public gameDuration: number = 0; // seconds

  private listeners: Set<StateListener> = new Set();

  constructor() {
    this.applyMetaUpgrades();
  }

  public subscribe(fn: StateListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public notify(): void {
    for (const fn of this.listeners) {
      fn();
    }
  }

  public applyMetaUpgrades(): void {
    const meta = SaveSystem.load();
    const dmgBonus = 1 + meta.upgrades.baseDamageLevel * 0.05;
    const shieldBonus = meta.upgrades.baseShieldLevel * 20;

    this.stats.damage = BASE_STATS.damage * dmgBonus;
    this.stats.maxShield = BASE_STATS.maxShield + shieldBonus;
    this.stats.shield = this.stats.maxShield;
  }

  public resetRun(): void {
    this.stats = { ...BASE_STATS };
    this.applyMetaUpgrades();
    this.activeSkills.clear();
    this.activeSynergyIds.clear();

    this.currentWave = 1;
    this.waveProgress = 0;
    this.score = 0;
    this.gold = 0;
    this.kills = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.comboTimer = 0;

    this.level = 1;
    this.xp = 0;
    this.maxXp = 40;

    this.bossHp = 0;
    this.bossMaxHp = 0;
    this.bossPhase = 1;
    this.bossRemainingSegments = 99;
    this.bossOnScreenSegments = 0;

    this.pendingChest = null;
    this.upgradeOptions = [];
    this.pendingLevelUps = 0;
    this.chestRewardsCount = 0;
    this.gameDuration = 0;

    this.mode = 'PLAYING';
    this.notify();
  }

  public setMode(newMode: GameModeState): void {
    this.mode = newMode;
    this.notify();
  }

  public addScore(amount: number): void {
    // Score scales with combo
    const multiplier = 1 + Math.min(2.5, this.combo * 0.05);
    this.score += Math.round(amount * multiplier);
  }

  public registerHit(): void {
    this.combo += 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.comboTimer = 2.6; // 2.6 seconds combo window
  }

  public addGold(amount: number): void {
    const meta = SaveSystem.load();
    const goldMultiplier = 1 + meta.upgrades.goldBonusLevel * 0.10;
    this.gold += Math.round(amount * goldMultiplier);
    this.notify();
  }

  /**
   * Leveling & EXP System:
   * Gaining XP fills the meter; leveling up triggers tactical skill choice modal.
   */
  public addXp(amount: number): boolean {
    if (amount <= 0) return false;
    this.xp += amount;
    let leveledUp = false;

    while (this.xp >= this.maxXp) {
      this.xp -= this.maxXp;
      this.level += 1;
      this.maxXp = Math.round(this.maxXp * 1.30 + 15);
      this.pendingLevelUps += 1;
      leveledUp = true;
      if (this.onLevelUp) {
        this.onLevelUp(this.level);
      }
    }

    if (leveledUp) {
      sounds.playLevelUp();
      this.upgradeOptions = this.generateUpgradeChoices();
      this.setMode('LEVEL_UP');
    }

    this.notify();
    return leveledUp;
  }

  public update(dt: number): void {
    if (this.mode === 'PLAYING') {
      this.gameDuration += dt;

      // Combo countdown
      if (this.comboTimer > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) {
          this.combo = 0;
          this.notify();
        }
      }

      // Shield auto-recharge if player hasn't taken hit recently
      if (this.stats.shield < this.stats.maxShield) {
        this.stats.shield = Math.min(this.stats.maxShield, this.stats.shield + 4 * dt);
      }

      // Health repair skill
      const repairLvl = this.activeSkills.get('repair') || 0;
      if (repairLvl > 0 && this.stats.hp < this.stats.maxHp) {
        const hpPerSec = [1.6, 3.2, 5.2, 8.0, 14.0][repairLvl - 1] || 1.6;
        this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + hpPerSec * dt);
      }
    }
  }

  public takePlayerDamage(amount: number): boolean {
    // Apply damage reduction
    let actualDamage = amount * (1 - (this.stats.damageReduction || 0));

    if (this.stats.shield > 0) {
      if (this.stats.shield >= actualDamage) {
        this.stats.shield -= actualDamage;
        actualDamage = 0;
      } else {
        actualDamage -= this.stats.shield;
        this.stats.shield = 0;
      }
    }

    if (actualDamage > 0) {
      this.stats.hp -= actualDamage;
    }

    this.notify();

    if (this.stats.hp <= 0) {
      this.stats.hp = 0;
      this.mode = 'GAME_OVER';
      SaveSystem.recordGameEnd(this.score, this.currentWave, this.kills, this.gold);
      this.notify();
      return true; // Dead
    }
    return false;
  }

  public takeDamage(amount: number): boolean {
    return this.takePlayerDamage(amount);
  }

  public startWave(waveNum: number): void {
    this.currentWave = waveNum;
    this.waveProgress = 0;
    this.notify();
  }

  public recordKill(type: EnemyType, score = 15, gold = 5, xp = 10): void {
    this.kills += 1;
    this.registerHit();
    this.addScore(score);
    this.addGold(gold);
    this.addXp(xp);
    this.notify();
  }

  public triggerChest(reward?: ChestReward): void {
    this.pendingChest = reward || {
      rarity: 'GOLD',
      title: '黄金宝箱',
      titleZh: '黄金宝箱',
      description: '金币 +100，并获得稀有技能三选一！',
      gold: 100,
      guaranteedRarity: 'RARE'
    };
    // No pause / CHEST_PICK mode - handled directly via descending in-game choice gates
  }

  public applySkill(skillId: string): void {
    const currentLevel = this.activeSkills.get(skillId) || 0;
    const newLevel = Math.min(5, currentLevel + 1);
    this.activeSkills.set(skillId, newLevel);

    this.recalculateStats();
    this.checkSynergies();
    this.notify();
  }

  public recalculateStats(): void {
    // Start from base stats + meta upgrades
    const base = { ...BASE_STATS };
    const meta = SaveSystem.load();
    const dmgBonus = 1 + meta.upgrades.baseDamageLevel * 0.05;
    const shieldBonus = meta.upgrades.baseShieldLevel * 20;

    base.damage *= dmgBonus;
    base.maxShield += shieldBonus;

    // Apply active skill modifiers
    for (const [skillId, lvl] of this.activeSkills.entries()) {
      const skillDef = SKILLS.find(s => s.id === skillId);
      if (!skillDef) continue;
      const levelEffect = skillDef.levels[lvl - 1];
      if (levelEffect && levelEffect.modifiers) {
        Object.assign(base, levelEffect.modifiers);
      }
    }

    // Apply active synergy bonuses
    for (const synId of this.activeSynergyIds) {
      const syn = SYNERGIES.find(s => s.id === synId);
      if (syn) {
        syn.applyBonus(base);
      }
    }

    // Preserve current HP/Shield ratios or clamp
    const currentHpRatio = this.stats.hp / this.stats.maxHp;
    base.hp = Math.min(base.maxHp, Math.max(1, Math.round(base.maxHp * currentHpRatio)));
    base.shield = Math.min(base.maxShield, this.stats.shield);

    this.stats = base;
  }

  public checkSynergies(): void {
    for (const syn of SYNERGIES) {
      const hasFirst = (this.activeSkills.get(syn.requiredSkills[0]) || 0) >= 1;
      const hasSecond = (this.activeSkills.get(syn.requiredSkills[1]) || 0) >= 1;
      if (hasFirst && hasSecond && !this.activeSynergyIds.has(syn.id)) {
        this.activeSynergyIds.add(syn.id);
        syn.applyBonus(this.stats);
      }
    }
  }

  public generateUpgradeChoices(guaranteedRarity?: string): SkillDefinition[] {
    // Filter skills that aren't at max level 5
    const available = SKILLS.filter(s => {
      const lvl = this.activeSkills.get(s.id) || 0;
      return lvl < s.maxLevel;
    });

    if (available.length <= 3) return available;

    // Shuffle and pick 3 with rarity weighting
    const shuffled = [...available].sort(() => 0.5 - Math.random());
    const choices: SkillDefinition[] = [];

    // Prioritize synergies or guaranteed rarity if requested
    for (const s of shuffled) {
      if (choices.length >= 3) break;
      if (guaranteedRarity && choices.length === 0 && s.rarity !== guaranteedRarity) {
        continue;
      }
      choices.push(s);
    }

    // Fallback if needed
    while (choices.length < 3 && choices.length < available.length) {
      const next = available.find(s => !choices.includes(s));
      if (next) choices.push(next);
      else break;
    }

    return choices;
  }
}

export const gameState = new GameState();
