import { SkillDefinition, SynergyDefinition } from '../types/game';

export const SKILLS: SkillDefinition[] = [
  // 1. PROJECTILE 输出弹幕
  {
    id: 'multiShot',
    name: 'Multi Shot',
    nameZh: '多重弹幕',
    category: 'PROJECTILE',
    rarity: 'COMMON',
    icon: '🚀',
    description: '增加主炮同时发射的子弹数量，形成铺天盖地的扇形弹幕。',
    maxLevel: 5,
    synergyIds: ['chainLightning', 'gatlingOverdrive'],
    levels: [
      { level: 1, description: '发射子弹数量 +1 (双联齐射)', modifiers: { projectileCount: 2 } },
      { level: 2, description: '发射子弹数量 +2 (三连齐射)', modifiers: { projectileCount: 3 } },
      { level: 3, description: '发射子弹数量 +4 (五路散射)', modifiers: { projectileCount: 5 } },
      { level: 4, description: '发射子弹数量 +7 (八路弹幕)', modifiers: { projectileCount: 8 } },
      { level: 5, description: '终极齐射：同时发射 12 路密集弹幕！', modifiers: { projectileCount: 12 } },
    ]
  },
  {
    id: 'pierce',
    name: 'Pierce',
    nameZh: '强力穿透',
    category: 'PROJECTILE',
    rarity: 'COMMON',
    icon: '🗡️',
    description: '子弹击中后无损贯穿敌人，沿直线撕裂整条蛇身。',
    maxLevel: 5,
    synergyIds: ['piercingBlast'],
    levels: [
      { level: 1, description: '子弹穿透次数 +1', modifiers: { pierce: 1 } },
      { level: 2, description: '子弹穿透次数 +2', modifiers: { pierce: 2 } },
      { level: 3, description: '子弹穿透次数 +4', modifiers: { pierce: 4 } },
      { level: 4, description: '子弹穿透次数 +7', modifiers: { pierce: 7 } },
      { level: 5, description: '万刃贯体：穿透 12 节长方体！', modifiers: { pierce: 12 } },
    ]
  },
  {
    id: 'homing',
    name: 'Homing Ammo',
    nameZh: '智能巡航',
    category: 'PROJECTILE',
    rarity: 'RARE',
    icon: '🎯',
    description: '子弹自动修正弹道，优先锁定宝箱长方体与高危蛇头。',
    maxLevel: 5,
    levels: [
      { level: 1, description: '子弹获得强导引力，弹速 +20%', modifiers: { homingStrength: 0.15, projectileSpeed: 1200 } },
      { level: 2, description: '导向力提升 80%，弹速 +40%', modifiers: { homingStrength: 0.28, projectileSpeed: 1350 } },
      { level: 3, description: '超高敏捷追踪，优先追踪宝箱', modifiers: { homingStrength: 0.45, projectileSpeed: 1500 } },
      { level: 4, description: '精准巡航制导，弹道折角追踪', modifiers: { homingStrength: 0.65, projectileSpeed: 1700 } },
      { level: 5, description: '神级天眼制导：100% 自动死锁致命弱点！', modifiers: { homingStrength: 0.90, projectileSpeed: 2000 } },
    ]
  },
  {
    id: 'ricochet',
    name: 'Ricochet',
    nameZh: '弹射反射',
    category: 'PROJECTILE',
    rarity: 'RARE',
    icon: '🪃',
    description: '子弹击中目标后在相邻蛇节之间高能弹射，引发连锁反应。',
    maxLevel: 5,
    levels: [
      { level: 1, description: '子弹命中后弹射 2 次', modifiers: { ricochetCount: 2 } },
      { level: 2, description: '子弹命中后弹射 4 次', modifiers: { ricochetCount: 4 } },
      { level: 3, description: '子弹命中后弹射 7 次', modifiers: { ricochetCount: 7 } },
      { level: 4, description: '子弹命中后弹射 11 次', modifiers: { ricochetCount: 11 } },
      { level: 5, description: '无限折射：弹射 16 次，全场弹丸乱舞', modifiers: { ricochetCount: 16 } },
    ]
  },
  {
    id: 'scatter',
    name: 'Scatter Storm',
    nameZh: '散射风暴',
    category: 'PROJECTILE',
    rarity: 'RARE',
    icon: '💥',
    description: '主弹击中瞬间向四周二次爆发破片风暴。',
    maxLevel: 5,
    levels: [
      { level: 1, description: '命中爆裂 3 颗弹片，范围 +30%', modifiers: { aoeRadius: 2.5 } },
      { level: 2, description: '爆裂 5 颗弹片，范围 +60%', modifiers: { aoeRadius: 3.5 } },
      { level: 3, description: '爆裂 8 颗弹片，范围 +100%', modifiers: { aoeRadius: 4.8 } },
      { level: 4, description: '爆裂 12 颗弹片，范围 +150%', modifiers: { aoeRadius: 6.2 } },
      { level: 5, description: '超限破片海：爆裂 18 颗弹片，撕裂整段蛇节', modifiers: { aoeRadius: 8.0 } },
    ]
  },

  // 2. DAMAGE 强力增伤
  {
    id: 'damageUp',
    name: 'Damage Booster',
    nameZh: '高能聚合',
    category: 'DAMAGE',
    rarity: 'COMMON',
    icon: '⚡',
    description: '强化等离子裂变核心，指数级暴涨初始基础伤害。',
    maxLevel: 5,
    synergyIds: ['plasmaCritical'],
    levels: [
      { level: 1, description: '基础攻击提升至 32 (+110%)', modifiers: { damage: 32 } },
      { level: 2, description: '基础攻击提升至 68 (+350%)', modifiers: { damage: 68 } },
      { level: 3, description: '基础攻击提升至 140 (+830%)', modifiers: { damage: 140 } },
      { level: 4, description: '基础攻击提升至 320 (+2000%)', modifiers: { damage: 320 } },
      { level: 5, description: '超核质子聚变：基础攻击暴涨至 750！', modifiers: { damage: 750 } },
    ]
  },
  {
    id: 'critical',
    name: 'Critical Strike',
    nameZh: '致命弱点',
    category: 'DAMAGE',
    rarity: 'COMMON',
    icon: '🎯',
    description: '瞄准蛇节晶核弱点，触发极高暴击率与翻倍爆伤。',
    maxLevel: 5,
    synergyIds: ['plasmaCritical'],
    levels: [
      { level: 1, description: '暴击率 +30%，暴击伤害 3.0x', modifiers: { critChance: 0.30, critMultiplier: 3.0 } },
      { level: 2, description: '暴击率 +50%，暴击伤害 4.5x', modifiers: { critChance: 0.50, critMultiplier: 4.5 } },
      { level: 3, description: '暴击率 +70%，暴击伤害 6.5x', modifiers: { critChance: 0.70, critMultiplier: 6.5 } },
      { level: 4, description: '暴击率 +88%，暴击伤害 9.5x', modifiers: { critChance: 0.88, critMultiplier: 9.5 } },
      { level: 5, description: '神格洞悉：100% 满暴击，15.0x 超核暴伤！', modifiers: { critChance: 1.0, critMultiplier: 15.0 } },
    ]
  },
  {
    id: 'colossusSlayer',
    name: 'Colossus Slayer',
    nameZh: '巨蛇克星',
    category: 'DAMAGE',
    rarity: 'EPIC',
    icon: '⚔️',
    description: '专门针对高血量灭世蛇王与蛇头的特攻强化，造成数倍毁灭斩首伤害。',
    maxLevel: 5,
    synergyIds: ['colossusBreaker'],
    levels: [
      { level: 1, description: '对巨蛇及蛇头增伤 +100% (2.0x 伤害)', modifiers: { bossDamageMultiplier: 2.0 } },
      { level: 2, description: '对巨蛇及蛇头增伤 +250% (3.5x 伤害)', modifiers: { bossDamageMultiplier: 3.5 } },
      { level: 3, description: '对巨蛇及蛇头增伤 +450% (5.5x 伤害)', modifiers: { bossDamageMultiplier: 5.5 } },
      { level: 4, description: '对巨蛇及蛇头增伤 +750% (8.5x 伤害)', modifiers: { bossDamageMultiplier: 8.5 } },
      { level: 5, description: '弑神斩首：对蛇身及蛇头造成 15.0x 极刑特攻！', modifiers: { bossDamageMultiplier: 15.0 } },
    ]
  },
  {
    id: 'armorPiercer',
    name: 'Armor Piercer',
    nameZh: '破甲碎裂',
    category: 'DAMAGE',
    rarity: 'RARE',
    icon: '🔱',
    description: '装填贫铀破甲穿甲核芯，无视装甲减伤并附带破甲撕裂。',
    maxLevel: 5,
    synergyIds: ['colossusBreaker'],
    levels: [
      { level: 1, description: '穿甲率 +50%，穿透 +2', modifiers: { armorPenetration: 0.5, pierce: 3 } },
      { level: 2, description: '穿甲率 +80%，穿透 +4', modifiers: { armorPenetration: 0.8, pierce: 5 } },
      { level: 3, description: '100% 忽视装甲减伤，穿透 +7', modifiers: { armorPenetration: 1.0, pierce: 8 } },
      { level: 4, description: '完全破甲，基础伤害额外 +300', modifiers: { armorPenetration: 1.0, pierce: 12 } },
      { level: 5, description: '绝对破防：完全穿甲，穿透 +18，伤害裂变！', modifiers: { armorPenetration: 1.0, pierce: 18 } },
    ]
  },
  {
    id: 'explosion',
    name: 'Explosion Ammo',
    nameZh: '高爆弹头',
    category: 'DAMAGE',
    rarity: 'RARE',
    icon: '💣',
    description: '子弹命中时发生剧烈核化爆炸，造成超大范围群伤。',
    maxLevel: 5,
    synergyIds: ['inferno', 'piercingBlast'],
    levels: [
      { level: 1, description: '爆炸半径 3.0，范围伤害 90%', modifiers: { aoeRadius: 3.0, aoeDamageMultiplier: 0.9 } },
      { level: 2, description: '爆炸半径 4.2，范围伤害 140%', modifiers: { aoeRadius: 4.2, aoeDamageMultiplier: 1.4 } },
      { level: 3, description: '爆炸半径 5.5，范围伤害 200%', modifiers: { aoeRadius: 5.5, aoeDamageMultiplier: 2.0 } },
      { level: 4, description: '爆炸半径 7.2，范围伤害 280%', modifiers: { aoeRadius: 7.2, aoeDamageMultiplier: 2.8 } },
      { level: 5, description: '超核聚变殉爆：半径 9.5，380% 巨量毁伤！', modifiers: { aoeRadius: 9.5, aoeDamageMultiplier: 3.8 } },
    ]
  },
  {
    id: 'fire',
    name: 'Inferno Fire',
    nameZh: '炼狱烈焰',
    category: 'DAMAGE',
    rarity: 'RARE',
    icon: '🔥',
    description: '附带超高温等离子烈焰，每秒对蛇节造成巨额真实燃烧伤害。',
    maxLevel: 5,
    synergyIds: ['inferno'],
    levels: [
      { level: 1, description: '50% 概率点燃，每秒造成 120 真实伤害', modifiers: { fireChance: 0.50, fireDps: 120 } },
      { level: 2, description: '75% 概率点燃，每秒造成 300 真实伤害', modifiers: { fireChance: 0.75, fireDps: 300 } },
      { level: 3, description: '100% 点燃，每秒造成 750 真实伤害', modifiers: { fireChance: 1.0, fireDps: 750 } },
      { level: 4, description: '100% 点燃，每秒造成 1800 真实伤害', modifiers: { fireChance: 1.0, fireDps: 1800 } },
      { level: 5, description: '太阳耀斑：每秒 4500 绝对真伤并向全蛇传染！', modifiers: { fireChance: 1.0, fireDps: 4500 } },
    ]
  },
  {
    id: 'lightning',
    name: 'Pulse Lightning',
    nameZh: '脉冲电弧',
    category: 'DAMAGE',
    rarity: 'EPIC',
    icon: '⚡',
    description: '击中目标释放狂暴闪电弧，在数十个蛇节之间连锁传导跳跃。',
    maxLevel: 5,
    synergyIds: ['chainLightning'],
    levels: [
      { level: 1, description: '60% 概率释放电弧，连锁 4 个目标', modifiers: { lightningChance: 0.6, lightningChains: 4 } },
      { level: 2, description: '80% 概率释放电弧，连锁 7 个目标', modifiers: { lightningChance: 0.8, lightningChains: 7 } },
      { level: 3, description: '100% 触发电弧，连锁 12 个目标', modifiers: { lightningChance: 1.0, lightningChains: 12 } },
      { level: 4, description: '100% 触发电弧，连锁 18 个目标', modifiers: { lightningChance: 1.0, lightningChains: 18 } },
      { level: 5, description: '雷霆万钧：全屏狂暴连锁 26 个蛇节！', modifiers: { lightningChance: 1.0, lightningChains: 26 } },
    ]
  },

  // 3. FIRE RATE 极速狂攻
  {
    id: 'rapidFire',
    name: 'Rapid Fire',
    nameZh: '磁轨速射',
    category: 'FIRE_RATE',
    rarity: 'COMMON',
    icon: '⏩',
    description: '超导充能回路，成倍提升主炮发射射频。',
    maxLevel: 5,
    synergyIds: ['gatlingOverdrive'],
    levels: [
      { level: 1, description: '射频提升至 5.8 发/秒', modifiers: { fireRate: 5.8 } },
      { level: 2, description: '射频提升至 8.2 发/秒', modifiers: { fireRate: 8.2 } },
      { level: 3, description: '射频提升至 12.0 发/秒', modifiers: { fireRate: 12.0 } },
      { level: 4, description: '射频提升至 18.0 发/秒', modifiers: { fireRate: 18.0 } },
      { level: 5, description: '极限超频：每秒 28 发暴雨级倾泻！', modifiers: { fireRate: 28.0 } },
    ]
  },
  {
    id: 'gatling',
    name: 'Gatling Motor',
    nameZh: '六管转轮',
    category: 'FIRE_RATE',
    rarity: 'EPIC',
    icon: '⚙️',
    description: '重构为重装多管旋转加特林机炮，弹流遮天蔽日。',
    maxLevel: 5,
    levels: [
      { level: 1, description: '加特林机炮：射速 14 发/秒，弹速 +30%', modifiers: { fireRate: 14.0, projectileSpeed: 1250 } },
      { level: 2, description: '高速射击：射速 22 发/秒，弹速 +50%', modifiers: { fireRate: 22.0, projectileSpeed: 1400 } },
      { level: 3, description: '金属风暴：射速 32 发/秒，弹速 +75%', modifiers: { fireRate: 32.0, projectileSpeed: 1600 } },
      { level: 4, description: '双联过载：每秒 45 发，弹道密度翻倍', modifiers: { fireRate: 45.0, projectileCount: 3, projectileSpeed: 1800 } },
      { level: 5, description: '神级毁灭加特林：每秒 65 发高能穿甲弹雨！', modifiers: { fireRate: 65.0, projectileCount: 4, projectileSpeed: 2100 } },
    ]
  },
  {
    id: 'frenzy',
    name: 'Combo Frenzy',
    nameZh: '连击狂热',
    category: 'FIRE_RATE',
    rarity: 'RARE',
    icon: '🔥',
    description: '连击越高，武器射击频率越呈疯狂加速。',
    maxLevel: 5,
    levels: [
      { level: 1, description: '每 10 连击提升 10% 射速 (最高 +50%)', modifiers: {} },
      { level: 2, description: '每 10 连击提升 18% 射速 (最高 +90%)', modifiers: {} },
      { level: 3, description: '每 10 连击提升 28% 射速 (最高 +140%)', modifiers: {} },
      { level: 4, description: '每 10 连击提升 40% 射速 (最高 +200%)', modifiers: {} },
      { level: 5, description: '30 连击直接进入无上限光速狂暴模式！', modifiers: {} },
    ]
  },

  // 4. ULTIMATE 终极大杀器
  {
    id: 'nuke',
    name: 'Tactical Nuke',
    nameZh: '战术核弹',
    category: 'ULTIMATE',
    rarity: 'LEGENDARY',
    icon: '☢️',
    description: '自动充能发射核聚变巡航弹，全屏强光闪白并瞬间抹除整屏蛇节！',
    maxLevel: 5,
    levels: [
      { level: 1, description: '每 16 秒释放一次全屏核爆，造成全屏巨额伤害', modifiers: { nukeCooldown: 16 } },
      { level: 2, description: '冷却缩短至 12 秒，全屏伤害翻倍', modifiers: { nukeCooldown: 12 } },
      { level: 3, description: '冷却缩短至 9 秒，摧毁全场敌方子弹', modifiers: { nukeCooldown: 9 } },
      { level: 4, description: '冷却缩短至 6.5 秒，极速轰炸', modifiers: { nukeCooldown: 6.5 } },
      { level: 5, description: '末日天劫：每 4.5 秒一次全屏毁灭性湮灭轰炸！', modifiers: { nukeCooldown: 4.5 } },
    ]
  },
  {
    id: 'satellite',
    name: 'Plasma Satellite',
    nameZh: '环绕卫星',
    category: 'ULTIMATE',
    rarity: 'EPIC',
    icon: '🛰️',
    description: '高能等离子护卫卫星，高速旋转并释放连线死光绞杀靠近的蛇节。',
    maxLevel: 5,
    levels: [
      { level: 1, description: '召唤 2 枚超聚能等离子护卫卫星', modifiers: { satelliteCount: 2 } },
      { level: 2, description: '召唤 3 枚卫星，旋转半径与速度提升', modifiers: { satelliteCount: 3 } },
      { level: 3, description: '召唤 4 枚卫星，旋转速度大幅增加', modifiers: { satelliteCount: 4 } },
      { level: 4, description: '召唤 5 枚卫星，切割伤害提升 100%', modifiers: { satelliteCount: 5 } },
      { level: 5, description: '天体绞杀矩阵：6 枚超维卫星布下死亡防线！', modifiers: { satelliteCount: 6 } },
    ]
  },
  {
    id: 'drone',
    name: 'Combat Drone',
    nameZh: '自律无人机',
    category: 'ULTIMATE',
    rarity: 'RARE',
    icon: '🛸',
    description: '部署智能浮游僚机，在蛇群上空盘旋并定点狙击高血量蛇节。',
    maxLevel: 5,
    levels: [
      { level: 1, description: '激活 1 架自律无人僚机自动开火', modifiers: { droneActive: true } },
      { level: 2, description: '僚机射速提升 80%，伤害翻倍', modifiers: { droneActive: true } },
      { level: 3, description: '僚机发射穿透高能激光束', modifiers: { droneActive: true } },
      { level: 4, description: '部署第 2 架重装战斗僚机', modifiers: { droneActive: true } },
      { level: 5, description: '蜂群战术：僚机超频并发射连环微型飞弹！', modifiers: { droneActive: true } },
    ]
  },
  {
    id: 'laser',
    name: 'Orbital Lance',
    nameZh: '轨道天穹死光',
    category: 'ULTIMATE',
    rarity: 'LEGENDARY',
    icon: '⚡',
    description: '引导天基离子轨道炮，垂直贯通整条蛇身引发湮灭！',
    maxLevel: 5,
    levels: [
      { level: 1, description: '每 5.5 秒降下一道离子死光贯穿全场', modifiers: {} },
      { level: 2, description: '冷却缩短至 4.0 秒，光束宽度提升', modifiers: {} },
      { level: 3, description: '冷却缩短至 2.8 秒，伤害提升 150%', modifiers: {} },
      { level: 4, description: '双重天谴：同时落下两道平行天基光束', modifiers: {} },
      { level: 5, description: '天基终焉：每 1.8 秒全纵深激光横扫，瞬间蒸发！', modifiers: {} },
    ]
  }
];

// BUILD SYNERGIES - 极致火力共鸣
export const SYNERGIES: SynergyDefinition[] = [
  {
    id: 'colossusBreaker',
    name: 'God Slayer',
    nameZh: '弑神破晓',
    requiredSkills: ['colossusSlayer', 'armorPiercer'],
    description: '巨蛇克星与破甲碎裂共鸣，完全无视防御并对巨蛇与蛇头造成 3 倍终极毁灭特攻！',
    icon: '⚔️🔱',
    applyBonus: (stats) => {
      stats.bossDamageMultiplier = (stats.bossDamageMultiplier || 1) * 3.0;
      stats.armorPenetration = 1.0;
      stats.pierce += 6;
    }
  },
  {
    id: 'chainLightning',
    name: 'Chain Lightning',
    nameZh: '连锁电暴',
    requiredSkills: ['multiShot', 'lightning'],
    description: '发射的所有密集弹幕均附带超高压电弧，整条蛇身化为雷霆炼狱！',
    icon: '⚡⚡',
    applyBonus: (stats) => {
      stats.lightningChance = 1.0;
      stats.lightningChains += 10;
    }
  },
  {
    id: 'inferno',
    name: 'Infernal Bombardment',
    nameZh: '炼狱轰炸',
    requiredSkills: ['fire', 'explosion'],
    description: '高爆弹头引爆烈焰火海，持续对整条蛇身施加巨额真实燃烧暴击！',
    icon: '🔥💥',
    applyBonus: (stats) => {
      stats.aoeRadius *= 1.6;
      stats.fireDps *= 3.0;
    }
  },
  {
    id: 'piercingBlast',
    name: 'Piercing Blast',
    nameZh: '穿甲爆轰',
    requiredSkills: ['pierce', 'explosion'],
    description: '子弹穿透的每一个蛇节都会诱发一次超核连锁爆炸！',
    icon: '🗡️💣',
    applyBonus: (stats) => {
      stats.pierce += 8;
      stats.aoeDamageMultiplier *= 1.8;
    }
  },
  {
    id: 'plasmaCritical',
    name: 'Overcharged Core',
    nameZh: '超载聚能',
    requiredSkills: ['damageUp', 'critical'],
    description: '高能聚合与弱点暴击完美谐振，基础伤害翻倍并突破极限暴击倍率！',
    icon: '⚡🎯',
    applyBonus: (stats) => {
      stats.critMultiplier += 6.0;
      stats.damage = Math.round(stats.damage * 2.2);
    }
  },
  {
    id: 'gatlingOverdrive',
    name: 'Metal Storm',
    nameZh: '金属风暴',
    requiredSkills: ['rapidFire', 'multiShot'],
    description: '极速射频与多重弹头融为一体，形成无法抵挡的超音速金属风暴！',
    icon: '⏩🚀',
    applyBonus: (stats) => {
      stats.fireRate *= 1.6;
      stats.projectileCount += 3;
    }
  }
];
