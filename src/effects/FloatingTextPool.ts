import * as THREE from 'three';

export interface FloatingItem {
  id: number;
  text: string;
  worldPos: THREE.Vector3;
  color: string;
  size: number;
  isCrit: boolean;
  isNuke: boolean;
  life: number;
  maxLife: number;
  vy: number;
  vx: number;
}

export class FloatingTextPool {
  private items: FloatingItem[] = [];
  private pool: FloatingItem[] = [];
  private maxItems: number = 80;
  private nextId: number = 1;
  private tempVec: THREE.Vector3 = new THREE.Vector3();

  constructor() {
    // Pre-allocate pool
    for (let i = 0; i < this.maxItems; i++) {
      this.pool.push({
        id: 0,
        text: '',
        worldPos: new THREE.Vector3(),
        color: '#ffffff',
        size: 16,
        isCrit: false,
        isNuke: false,
        life: 0,
        maxLife: 0.8,
        vy: 2.2,
        vx: 0
      });
    }
  }

  public spawn(worldPos: THREE.Vector3, text: string, type: 'normal' | 'crit' | 'nuke' | 'gold' | 'heal' = 'normal') {
    let item = this.pool.pop();
    if (!item) {
      // Recycle oldest active item
      if (this.items.length > 0) {
        item = this.items.shift()!;
      } else {
        return;
      }
    }

    item.id = this.nextId++;
    item.text = text;
    item.worldPos.copy(worldPos);
    item.worldPos.x += (Math.random() - 0.5) * 0.8;
    item.worldPos.y += 0.5 + Math.random() * 0.5;
    item.vx = (Math.random() - 0.5) * 0.8;
    item.vy = 2.4 + Math.random() * 1.2;

    if (type === 'crit') {
      item.color = '#fbbf24'; // Amber gold
      item.size = 24;
      item.isCrit = true;
      item.isNuke = false;
      item.maxLife = 0.9;
    } else if (type === 'nuke') {
      item.color = '#ef4444'; // Bright Crimson
      item.size = 32;
      item.isCrit = true;
      item.isNuke = true;
      item.maxLife = 1.2;
    } else if (type === 'gold') {
      item.color = '#fde047'; // Bright Yellow
      item.size = 18;
      item.isCrit = false;
      item.isNuke = false;
      item.maxLife = 0.7;
    } else if (type === 'heal') {
      item.color = '#34d399'; // Emerald
      item.size = 18;
      item.isCrit = false;
      item.isNuke = false;
      item.maxLife = 0.8;
    } else {
      item.color = '#ffffff';
      item.size = 16;
      item.isCrit = false;
      item.isNuke = false;
      item.maxLife = 0.65;
    }

    item.life = item.maxLife;
    this.items.push(item);
  }

  public update(dt: number) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.life -= dt;
      item.worldPos.y += item.vy * dt;
      item.worldPos.x += item.vx * dt;
      item.vy = Math.max(0.2, item.vy - 1.5 * dt);

      if (item.life <= 0) {
        this.items.splice(i, 1);
        this.pool.push(item);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, width: number, height: number, camera: THREE.Camera) {
    if (this.items.length === 0) return;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const item of this.items) {
      this.tempVec.copy(item.worldPos);
      this.tempVec.project(camera);

      // Check if in front of camera
      if (this.tempVec.z > 1) continue;

      const screenX = ((this.tempVec.x + 1) / 2) * width;
      const screenY = ((-this.tempVec.y + 1) / 2) * height;

      const progress = 1 - item.life / item.maxLife;
      // Pop scale animation: start larger, settle, then fade
      let scale = 1.0;
      if (progress < 0.2) {
        scale = 1.0 + (1 - progress / 0.2) * (item.isCrit ? 0.7 : 0.4);
      }
      const alpha = Math.max(0, Math.min(1, item.life / 0.25));

      ctx.globalAlpha = alpha;
      ctx.font = `900 ${Math.round(item.size * scale)}px "Chakra Petch", -apple-system, sans-serif`;

      // Text stroke for high readability on any background
      ctx.strokeStyle = item.isNuke ? '#7f1d1d' : item.isCrit ? '#78350f' : '#000000';
      ctx.lineWidth = item.isCrit ? 4 : 3;
      ctx.strokeText(item.text, screenX, screenY);

      ctx.fillStyle = item.color;
      ctx.fillText(item.text, screenX, screenY);
    }

    ctx.restore();
  }

  public clear() {
    while (this.items.length > 0) {
      this.pool.push(this.items.pop()!);
    }
  }
}
