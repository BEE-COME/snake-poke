import * as THREE from 'three';
import { EnemyType } from '../types/game';
import { SnakeSegment } from './SnakeSegment';

export class Snake {
  public segments: SnakeSegment[] = [];
  public isDead: boolean = false;
  public speed: number = 2.2;
  public baseSpeed: number = 2.2;

  private scene: THREE.Scene;
  private pathHistory: THREE.Vector3[] = [];
  private wavePhase: number = Math.random() * Math.PI * 2;
  private waveFrequency: number = 1.3;
  private waveAmplitude: number = 1.8;
  private baseX: number = 0;
  private headZ: number = -52;
  private segmentSpacing: number = 1.7;

  constructor(
    scene: THREE.Scene,
    segmentTypes: EnemyType[],
    spawnX: number = 0,
    spawnZ: number = -42,
    waveMultiplier: number = 1.0,
    speedMultiplier: number = 1.0
  ) {
    this.scene = scene;
    this.baseX = spawnX;
    this.headZ = spawnZ;

    // Create segments
    for (let i = 0; i < segmentTypes.length; i++) {
      const type = segmentTypes[i];
      const isHead = i === 0;
      const seg = new SnakeSegment(type, isHead, waveMultiplier);
      this.segments.push(seg);
      this.scene.add(seg.mesh);
    }

    this.baseSpeed = (this.segments[0]?.config.speed || 4.5) * speedMultiplier;
    this.speed = this.baseSpeed;

    // Initialize initial positions
    for (let i = 0; i < this.segments.length; i++) {
      const z = this.headZ - i * this.segmentSpacing;
      const x = this.baseX;
      const pos = new THREE.Vector3(x, 0.8, z);
      this.segments[i].mesh.position.copy(pos);
      this.segments[i].position.copy(pos);
      this.pathHistory.push(pos.clone());
    }
  }

  public update(dt: number): boolean {
    if (this.segments.length === 0) {
      this.isDead = true;
      return true;
    }

    const head = this.segments[0];

    // Determine current speed based on freeze/slow status
    let currentSpeed = this.baseSpeed;
    if (head.freezeTimer > 0) {
      currentSpeed = 0;
    } else if (head.slowTimer > 0) {
      currentSpeed *= 0.5;
    }

    // Move head forward
    this.headZ += currentSpeed * dt;
    this.wavePhase += this.waveFrequency * dt * (currentSpeed > 0 ? 1 : 0);

    const headX = Math.max(-8.5, Math.min(8.5, this.baseX + Math.sin(this.wavePhase) * this.waveAmplitude));
    const newHeadPos = new THREE.Vector3(headX, 0.8, this.headZ);

    head.mesh.position.copy(newHeadPos);
    head.position.copy(newHeadPos);
    head.update(dt);

    // Save path for segments to follow
    this.pathHistory.unshift(newHeadPos.clone());
    if (this.pathHistory.length > 500) {
      this.pathHistory.pop();
    }

    // Update following segments based on distance constraint along path history
    for (let i = 1; i < this.segments.length; i++) {
      const seg = this.segments[i];
      const prevSeg = this.segments[i - 1];

      // Move toward prevSeg with fixed distance constraint
      const dir = seg.position.clone().sub(prevSeg.position);
      const dist = dir.length();
      if (dist > this.segmentSpacing) {
        dir.normalize();
        const targetPos = prevSeg.position.clone().addScaledVector(dir, this.segmentSpacing);
        seg.mesh.position.lerp(targetPos, Math.min(1.0, 18 * dt));
      }

      seg.update(dt);
    }

    // Check if any segment died
    for (let i = this.segments.length - 1; i >= 0; i--) {
      const seg = this.segments[i];
      if (seg.hp <= 0) {
        // Will be handled by CombatSystem/CollisionSystem for rewards/explosions
      }
    }

    // Return true if head breached defense line
    return head.position.z >= 11.2;
  }

  public removeSegment(index: number): SnakeSegment | null {
    if (index >= 0 && index < this.segments.length) {
      const [removed] = this.segments.splice(index, 1);
      this.scene.remove(removed.mesh);
      if (this.segments.length === 0) {
        this.isDead = true;
      }
      return removed;
    }
    return null;
  }

  public destroy() {
    for (const seg of this.segments) {
      this.scene.remove(seg.mesh);
    }
    this.segments = [];
    this.isDead = true;
  }
}
