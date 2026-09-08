import * as THREE from 'three';
import { PlayerStats } from '../types/game';
import { SnakeSegment } from './SnakeSegment';

export interface Projectile {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  damage: number;
  isCrit: boolean;
  pierceRemaining: number;
  ricochetsRemaining: number;
  homingStrength: number;
  aoeRadius: number;
  aoeDamageMultiplier: number;
  fireChance: number;
  fireDps: number;
  freezeChance: number;
  lightningChance: number;
  lightningChains: number;
  knockback: number;
  active: boolean;
  life: number;
  hitSegments: Set<SnakeSegment>;
}

export class ProjectilePool {
  private pool: Projectile[] = [];
  private activeProjectiles: Projectile[] = [];
  private scene: THREE.Scene;
  private maxProjectiles: number = 180;

  private sharedGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.9, 8);
  private sharedMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  private critMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.sharedGeo.rotateX(Math.PI / 2); // Point forward along Z-

    for (let i = 0; i < this.maxProjectiles; i++) {
      const mesh = new THREE.Mesh(this.sharedGeo, this.sharedMat);
      mesh.visible = false;
      this.scene.add(mesh);

      this.pool.push({
        mesh,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        damage: 10,
        isCrit: false,
        pierceRemaining: 0,
        ricochetsRemaining: 0,
        homingStrength: 0,
        aoeRadius: 0,
        aoeDamageMultiplier: 0,
        fireChance: 0,
        fireDps: 0,
        freezeChance: 0,
        lightningChance: 0,
        lightningChains: 0,
        knockback: 0,
        active: false,
        life: 0,
        hitSegments: new Set()
      });
    }
  }

  public fire(
    startPos: THREE.Vector3,
    direction: THREE.Vector3,
    stats: PlayerStats,
    isSpread: boolean = false,
    spreadAngle: number = 0
  ): Projectile | null {
    let p = this.pool.pop();
    if (!p) {
      if (this.activeProjectiles.length > 0) {
        p = this.activeProjectiles.shift()!;
      } else {
        return null;
      }
    }

    p.active = true;
    p.life = 2.4;
    p.hitSegments.clear();

    p.position.copy(startPos);
    p.mesh.position.copy(startPos);
    p.mesh.visible = true;

    // Crit roll
    p.isCrit = Math.random() < stats.critChance;
    const critMult = p.isCrit ? stats.critMultiplier : 1.0;
    p.damage = stats.damage * critMult;

    p.mesh.material = p.isCrit ? this.critMat : this.sharedMat;

    // Direction with spread
    const finalDir = direction.clone().normalize();
    if (isSpread && spreadAngle !== 0) {
      finalDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), spreadAngle);
    }

    p.velocity.copy(finalDir).multiplyScalar(stats.projectileSpeed);

    // Orient mesh
    p.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), finalDir);

    p.pierceRemaining = stats.pierce || 0;
    p.ricochetsRemaining = stats.ricochetCount || 0;
    p.homingStrength = stats.homingStrength || 0;
    p.aoeRadius = stats.aoeRadius || 0;
    p.aoeDamageMultiplier = stats.aoeDamageMultiplier || 0;
    p.fireChance = stats.fireChance || 0;
    p.fireDps = stats.fireDps || 0;
    p.freezeChance = stats.freezeChance || 0;
    p.lightningChance = stats.lightningChance || 0;
    p.lightningChains = stats.lightningChains || 0;
    p.knockback = stats.knockback || 0;

    this.activeProjectiles.push(p);
    return p;
  }

  public update(dt: number, nearestTargetPos: THREE.Vector3 | null) {
    for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
      const p = this.activeProjectiles[i];
      p.life -= dt;

      if (p.life <= 0 || p.position.z < -52 || Math.abs(p.position.x) > 20) {
        this.recycle(i);
        continue;
      }

      // Homing guidance
      if (p.homingStrength > 0 && nearestTargetPos) {
        const toTarget = nearestTargetPos.clone().sub(p.position).normalize();
        p.velocity.lerp(toTarget.multiplyScalar(p.velocity.length()), p.homingStrength);
        p.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), p.velocity.clone().normalize());
      }

      p.position.addScaledVector(p.velocity, dt);
      p.mesh.position.copy(p.position);
    }
  }

  public recycle(index: number) {
    const p = this.activeProjectiles.splice(index, 1)[0];
    p.active = false;
    p.mesh.visible = false;
    p.hitSegments.clear();
    this.pool.push(p);
  }

  public getActiveProjectiles(): Projectile[] {
    return this.activeProjectiles;
  }

  public clear() {
    while (this.activeProjectiles.length > 0) {
      this.recycle(this.activeProjectiles.length - 1);
    }
  }
}
