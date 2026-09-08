import { EnemyConfig, EnemyType } from '../types/game';

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  NORMAL: {
    type: 'NORMAL',
    nameZh: '侦察青蛇',
    baseHp: 40,
    speed: 2.2, // Moderate comfortable slither speed
    scoreValue: 50,
    goldValue: 3,
    xpValue: 12,
    color: 0x22c55e, // Luminous electric lime/emerald
    glowColor: 0x86efac
  },
  ARMOR: {
    type: 'ARMOR',
    nameZh: '装甲巨蟒',
    baseHp: 95,
    speed: 1.8,
    scoreValue: 120,
    goldValue: 6,
    xpValue: 24,
    armorReduction: 0.40,
    color: 0x60a5fa, // Bright cobalt chrome steel
    glowColor: 0xbfdbfe
  },
  FAST: {
    type: 'FAST',
    nameZh: '疾风毒蝰',
    baseHp: 30,
    speed: 3.5,
    scoreValue: 80,
    goldValue: 4,
    xpValue: 18,
    color: 0x00e5ff, // Ultra-bright neon cyan
    glowColor: 0xa5f3fc
  },
  HEALER: {
    type: 'HEALER',
    nameZh: '生命律动蛇',
    baseHp: 65,
    speed: 1.9,
    scoreValue: 150,
    goldValue: 8,
    xpValue: 30,
    color: 0x2dd4bf, // Luminous turquoise
    glowColor: 0x99f6e4
  },
  EXPLOSIVE: {
    type: 'EXPLOSIVE',
    nameZh: '烈性自爆蛇',
    baseHp: 48,
    speed: 2.4,
    scoreValue: 100,
    goldValue: 5,
    xpValue: 22,
    color: 0xf43f5e, // Radiant magma red
    glowColor: 0xfecdd3
  },
  SPLITTER: {
    type: 'SPLITTER',
    nameZh: '晶化分裂蛇',
    baseHp: 55,
    speed: 2.1,
    scoreValue: 130,
    goldValue: 6,
    xpValue: 28,
    color: 0xc084fc, // Radiant amethyst
    glowColor: 0xf3e8ff
  },
  CHEST: {
    type: 'CHEST',
    nameZh: '黄金宝箱蛇节',
    baseHp: 80,
    speed: 2.0,
    scoreValue: 350,
    goldValue: 35,
    xpValue: 60,
    color: 0xfbbf24, // Gleaming Pure Gold
    glowColor: 0xfef08a
  },
  ELITE: {
    type: 'ELITE',
    nameZh: '生化精英领主',
    baseHp: 450,
    speed: 2.0,
    scoreValue: 800,
    goldValue: 45,
    xpValue: 150,
    color: 0xa855f7, // Royal electric purple
    glowColor: 0xe9d5ff
  },
  BOSS: {
    type: 'BOSS',
    nameZh: '灭世巨蛇王',
    baseHp: 3600,
    speed: 2.0,
    scoreValue: 5000,
    goldValue: 200,
    xpValue: 500,
    color: 0xff0055, // Hyper neon ruby crimson
    glowColor: 0xff6699
  }
};
