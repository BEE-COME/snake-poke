import * as THREE from 'three';
import { SnakeSegment } from './SnakeSegment';
import { sounds } from '../audio/SoundSystem';

export class BossSnake {
  public segments: SnakeSegment[] = [];
  public isDead: boolean = false;
  public maxHp: number = 4200;
  public currentHp: number = 4200;
  public phase: number = 1;

  private scene: THREE.Scene;
  private headZ: number = -48;
  private baseX: number = 0;
  private wavePhase: number = 0;
  private baseSpeed: number = 3.2;
  private segmentSpacing: number = 2.4;

  // Boss attack timers
  public fireballCooldown: number = 3.5;
  public bossProjectiles: Array<{
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    life: number;
  }> = [];

  private enrageAura: THREE.Mesh | null = null;

  constructor(scene: THREE.Scene, maxHp: number = 4200) {
    this.scene = scene;
    this.maxHp = maxHp;
    this.currentHp = maxHp;

    const segmentCount = 22;
    for (let i = 0; i < segmentCount; i++) {
      const isHead = i === 0;
      // Scatter some Chests and Armor on the Boss body!
      const type = isHead ? 'BOSS' : (i === 4 || i === 9 || i === 15) ? 'CHEST' : (i % 3 === 0) ? 'ARMOR' : 'NORMAL';
      const seg = new SnakeSegment(type, isHead, 1.0);

      // Scale up boss segments
      if (isHead) {
        seg.mesh.scale.set(2.4, 2.4, 2.4);
        seg.radius = 2.5;
      } else {
        seg.mesh.scale.set(1.8, 1.8, 1.8);
        seg.radius = 1.9;
      }

      this.segments.push(seg);
      this.scene.add(seg.mesh);
    }

    // Add glowing boss horn / crown on head
    const head = this.segments[0];
    const hornGeo = new THREE.ConeGeometry(0.8, 2.4, 6);
    hornGeo.rotateX(-0.5);
    const hornMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
    const hornL = new THREE.Mesh(hornGeo, hornMat);
    hornL.position.set(-1.2, 1.6, 0.4);
    head.mesh.add(hornL);

    const hornR = new THREE.Mesh(hornGeo, hornMat);
    hornR.position.set(1.2, 1.6, 0.4);
    head.mesh.add(hornR);

    // Initial positioning
    for (let i = 0; i < this.segments.length; i++) {
      const z = this.headZ - i * this.segmentSpacing;
      this.segments[i].mesh.position.set(0, 1.4, z);
      this.segments[i].position.set(0, 1.4, z);
    }
  }

  public takeBossDamage(amount: number): boolean {
    this.currentHp -= amount;
    if (this.currentHp <= 0) {
      this.currentHp = 0;
      this.isDead = true;
      return true;
    }

    // Check phase transitions
    const hpPercent = this.currentHp / this.maxHp;
    if (hpPercent <= 0.30 && this.phase < 3) {
      this.phase = 3;
      this.baseSpeed = 4.8; // Enrage speed
      sounds.playBossRoar();
      this.activateEnrageVisual();
    } else if (hpPercent <= 0.65 && this.phase < 2) {
      this.phase = 2;
      this.baseSpeed = 3.8;
      sounds.playBossRoar();
    }

    return false;
  }

  private activateEnrageVisual() {
    if (this.enrageAura) return;
    const auraGeo = new THREE.SphereGeometry(3.6, 16, 16);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xff0022,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });
    this.enrageAura = new THREE.Mesh(auraGeo, auraMat);
    this.segments[0].mesh.add(this.enrageAura);
  }

  public update(dt: number, playerX: number): { breached: boolean; spawnedFireball: THREE.Vector3 | null } {
    if (this.segments.length === 0 || this.isDead) {
      return { breached: false, spawnedFireball: null };
    }

    const head = this.segments[0];

    // Speed modifiers
    let speed = this.baseSpeed;
    if (head.freezeTimer > 0) speed = 0;
    else if (head.slowTimer > 0) speed *= 0.6;

    this.headZ += speed * dt;
    this.wavePhase += 1.4 * dt;

    // Head weaves toward player X gradually
    this.baseX += (playerX - this.baseX) * Math.min(1.0, 0.4 * dt);
    const headX = Math.max(-8.5, Math.min(8.5, this.baseX + Math.sin(this.wavePhase) * 2.6));
    const newHeadPos = new THREE.Vector3(headX, 1.4, this.headZ);

    head.mesh.position.copy(newHeadPos);
    head.position.copy(newHeadPos);
    head.update(dt);

    if (this.enrageAura) {
      this.enrageAura.rotation.y += 3.0 * dt;
      this.enrageAura.rotation.z += 2.0 * dt;
    }

    // Following segments
    for (let i = 1; i < this.segments.length; i++) {
      const seg = this.segments[i];
      const prevSeg = this.segments[i - 1];

      const dir = seg.position.clone().sub(prevSeg.position);
      const dist = dir.length();
      if (dist > this.segmentSpacing) {
        dir.normalize();
        const targetPos = prevSeg.position.clone().addScaledVector(dir, this.segmentSpacing);
        seg.mesh.position.lerp(targetPos, Math.min(1.0, 16 * dt));
      }
      seg.update(dt);
    }

    // Boss fireball attack
    let spawnedFireball: THREE.Vector3 | null = null;
    this.fireballCooldown -= dt;
    const cooldownInterval = this.phase === 3 ? 1.4 : this.phase === 2 ? 2.2 : 3.2;
    if (this.fireballCooldown <= 0 && head.position.z < 6) {
      this.fireballCooldown = cooldownInterval;
      spawnedFireball = head.position.clone();
      sounds.playExplosion();
    }

    // Check breach
    const breached = head.position.z >= 10.8;
    return { breached, spawnedFireball };
  }

  public destroy() {
    for (const seg of this.segments) {
      this.scene.remove(seg.mesh);
    }
    this.segments = [];
    this.isDead = true;
  }
}
