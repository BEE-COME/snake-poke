import { EnemyType } from '../../types/game';

export interface Segment2D {
  id: number;
  x: number;
  y: number;
  radius: number;
  width?: number;
  height?: number;
  depth?: number;
  angle?: number;
  segmentIndex?: number;
  hp: number;
  maxHp: number;
  type: EnemyType;
  isHead: boolean;
  isChest: boolean;
  isArmored: boolean;
  color: string;
  glowColor: string;
  hitFlash: number;
  freezeTimer: number;
  burnTimer: number;
  poisonTimer: number;
}

export interface Snake2DInstance {
  id: number;
  segments: Segment2D[];
  speed: number;
  baseSpeed: number;
  direction: 1 | -1; // 1 = right, -1 = left
  stepDownDistance: number;
  pathHistory: { x: number; y: number }[];
  isDropping: boolean;
  dropProgress: number;
  dropStartY: number;
  dropTargetY: number;
  isBoss: boolean;
  bossPhase: number;
  attackCooldown: number;
  eliteAttackCooldown: number;
  healerCooldown: number;
  isEnraged: boolean;
  hasChest: boolean;
  waveNumber: number;
  slowTimer?: number;
  slowMultiplier?: number;
  dead: boolean;
}

export type MultiplierGateType = 'MULTIPLY_2' | 'MULTIPLY_3' | 'MULTIPLY_5' | 'ADD_BULLETS' | 'FIRE_RATE' | 'CRIT_SURGE';

export interface MultiplierGate2D {
  id: number;
  x: number; // center x
  y: number; // center y
  width: number;
  height: number;
  type: MultiplierGateType;
  label: string;
  subLabel: string;
  multiplier: number;
  hits: number;
  maxHitsForUpgrade: number;
  color: string;
  glowColor: string;
  pulse: number;
  vy: number;
  vx: number;
  baseX: number;
  minY: number;
  maxY: number;
}

export type ProjectileType = 'BULLET' | 'MISSILE' | 'ICE' | 'GLAIVE' | 'ENEMY_ORB' | 'SHRAPNEL' | 'DRONE_BULLET';

export interface BlackHole2D {
  id: number;
  x: number;
  y: number;
  radius: number;
  pullStrength: number;
  life: number;
  maxLife: number;
  tickDamage: number;
}

export interface Projectile2D {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  isCrit: boolean;
  pierce: number;
  type: ProjectileType;
  life: number;
  color: string;
  homingStrength?: number;
  bouncesLeft?: number;
  multiplied?: boolean;
  lastGateId?: number;
}

export interface LaserBeam2D {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface LightningArc2D {
  points: { x: number; y: number }[];
  life: number;
  maxLife: number;
  color: string;
}

export interface Particle2D {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  shape: 'CIRCLE' | 'SPARK' | 'RING' | 'STAR' | 'FLAME';
}

export interface FlyingCoin2D {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  startX: number;
  startY: number;
  arcHeight: number;
  goldValue: number;
}

export interface FloatingText2D {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  vy: number;
  isCrit?: boolean;
}
