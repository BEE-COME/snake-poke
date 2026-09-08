export type GameModeState = 
  | 'MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'LEVEL_UP'
  | 'CHEST_PICK'
  | 'SHOP'
  | 'BOSS_INTRO'
  | 'VICTORY'
  | 'GAME_OVER';

export type SkillRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export type SkillCategory = 'PROJECTILE' | 'DAMAGE' | 'FIRE_RATE' | 'CONTROL' | 'DEFENSE' | 'ULTIMATE';

export interface SkillLevelEffect {
  level: number;
  description: string;
  modifiers: Partial<PlayerStats>;
}

export interface SkillDefinition {
  id: string;
  name: string;
  nameZh: string;
  category: SkillCategory;
  rarity: SkillRarity;
  icon: string;
  description: string;
  maxLevel: number;
  synergyIds?: string[];
  levels: SkillLevelEffect[];
}

export interface ActiveSkill {
  id: string;
  level: number;
}

export interface SynergyDefinition {
  id: string;
  name: string;
  nameZh: string;
  requiredSkills: [string, string];
  description: string;
  icon: string;
  applyBonus: (stats: PlayerStats) => void;
}

export interface PlayerStats {
  maxHp: number;
  hp: number;
  maxShield: number;
  shield: number;
  damage: number;
  fireRate: number; // shots per second
  projectileCount: number;
  projectileSpeed: number;
  critChance: number; // 0 - 1
  critMultiplier: number;
  pierce: number;
  aoeRadius: number;
  aoeDamageMultiplier: number;
  moveSpeed: number;
  pickupRadius: number;
  // Status effects & Elements
  fireChance: number;
  fireDps: number;
  lightningChance: number;
  lightningChains: number;
  freezeChance: number;
  freezeDuration: number;
  poisonChance: number;
  knockback: number;
  homingStrength: number;
  ricochetCount: number;
  nukeCooldown: number;
  satelliteCount: number;
  droneActive: boolean;
  blackHoleChance: number;
  damageReduction: number;
  bossDamageMultiplier?: number;
  armorPenetration?: number;
}

export type ChestRarity = 'GOLD' | 'RARE' | 'EPIC' | 'RISK';

export interface ChestReward {
  rarity: ChestRarity;
  title: string;
  titleZh: string;
  description: string;
  gold: number;
  guaranteedRarity?: SkillRarity;
  riskPenalty?: string;
  riskEffect?: () => void;
}

export type EnemyType = 
  | 'NORMAL'
  | 'ARMOR'
  | 'FAST'
  | 'HEALER'
  | 'EXPLOSIVE'
  | 'SPLITTER'
  | 'CHEST'
  | 'ELITE'
  | 'BOSS';

export interface EnemyConfig {
  type: EnemyType;
  nameZh: string;
  baseHp: number;
  speed: number;
  scoreValue: number;
  goldValue: number;
  xpValue: number;
  armorReduction?: number;
  color: number;
  glowColor?: number;
}

export interface WaveConfig {
  waveNumber: number;
  name: string;
  nameZh: string;
  enemyTypes: EnemyType[];
  snakeCount: number;
  segmentsPerSnake: number;
  chestChance: number; // 0 - 1 chance of segments being chest
  spawnInterval: number; // seconds
  hasShopAfter: boolean;
  isBossWave?: boolean;
}

export interface FloatingDamageNumber {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  scale: number;
  isCrit?: boolean;
  isNuke?: boolean;
  life: number;
}

export interface MetaProgressionData {
  gold: number;
  highScore: number;
  maxWave: number;
  totalKills: number;
  gamesPlayed: number;
  upgrades: {
    baseDamageLevel: number; // +5% per lvl
    baseShieldLevel: number; // +15 shield per lvl
    goldBonusLevel: number;  // +10% gold per lvl
    chestLuckLevel: number;  // +3% rare/epic chest chance per lvl
  };
}
