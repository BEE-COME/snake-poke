import * as THREE from 'three';
import { EnemyConfig, EnemyType } from '../types/game';
import { ENEMY_CONFIGS } from '../data/enemies';

export class SnakeSegment {
  public mesh: THREE.Group;
  public baseMesh: THREE.Mesh;
  public chestMesh: THREE.Group | null = null;
  public type: EnemyType;
  public config: EnemyConfig;
  public isHead: boolean;

  public hp: number;
  public maxHp: number;
  public position: THREE.Vector3 = new THREE.Vector3();
  public radius: number = 0.95;

  // Status effects
  public burnTimer: number = 0;
  public burnDps: number = 0;
  public freezeTimer: number = 0;
  public slowTimer: number = 0;
  public hitFlashTimer: number = 0;

  private originalColor: number;
  private glowMesh: THREE.Mesh | null = null;

  constructor(type: EnemyType, isHead: boolean = false, waveMultiplier: number = 1.0) {
    this.type = type;
    this.isHead = isHead;
    this.config = ENEMY_CONFIGS[type];
    this.originalColor = this.config.color;

    // HP scales with wave
    this.maxHp = Math.round(this.config.baseHp * waveMultiplier);
    this.hp = this.maxHp;

    this.mesh = new THREE.Group();

    // Base segment mesh
    const radius = isHead ? 1.25 : type === 'ELITE' ? 1.5 : type === 'BOSS' ? 2.5 : 0.95;
    this.radius = radius;

    const geo = isHead 
      ? new THREE.ConeGeometry(radius * 1.1, radius * 2.2, 12) 
      : new THREE.SphereGeometry(radius, 14, 12);

    if (isHead) {
      geo.rotateX(-Math.PI / 2); // Point forward along Z+
    }

    // Material with vibrant emissive glow so it never looks dim or muddy!
    const mat = new THREE.MeshStandardMaterial({
      color: this.originalColor,
      emissive: new THREE.Color(this.originalColor),
      emissiveIntensity: isHead ? 0.45 : 0.35,
      metalness: type === 'ARMOR' ? 0.7 : 0.35,
      roughness: type === 'ARMOR' ? 0.2 : 0.3,
      flatShading: false
    });

    this.baseMesh = new THREE.Mesh(geo, mat);
    this.baseMesh.castShadow = true;
    this.mesh.add(this.baseMesh);

    // Glowing equator contour ring on body segments for sharp high-contrast silhouette
    if (!isHead) {
      const ringGeo = new THREE.TorusGeometry(radius * 1.02, 0.05, 8, 20);
      ringGeo.rotateX(Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: this.config.glowColor || this.originalColor
      });
      this.glowMesh = new THREE.Mesh(ringGeo, ringMat);
      this.mesh.add(this.glowMesh);
    }

    // Head eyes / glowing visor
    if (isHead) {
      const eyeGeo = new THREE.SphereGeometry(radius * 0.26, 8, 8);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfff044 }); // Brilliant electric yellow eyes

      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.position.set(-radius * 0.45, radius * 0.32, radius * 0.55);
      this.mesh.add(leftEye);

      const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
      rightEye.position.set(radius * 0.45, radius * 0.32, radius * 0.55);
      this.mesh.add(rightEye);

      // Head crest horn
      const crestGeo = new THREE.ConeGeometry(radius * 0.35, radius * 1.1, 6);
      crestGeo.rotateX(-0.4);
      const crestMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
      const crest = new THREE.Mesh(crestGeo, crestMat);
      crest.position.set(0, radius * 0.9, -radius * 0.2);
      this.mesh.add(crest);
    }

    // Chest mounting: If this segment carries a chest!
    if (type === 'CHEST') {
      this.buildChestModel();
    } else if (type === 'ARMOR') {
      // Add metallic armor plates
      const plateGeo = new THREE.BoxGeometry(radius * 1.6, radius * 0.35, radius * 1.6);
      const plateMat = new THREE.MeshStandardMaterial({
        color: 0x93c5fd,
        emissive: 0x3b82f6,
        emissiveIntensity: 0.3,
        metalness: 0.95,
        roughness: 0.1
      });
      const plate = new THREE.Mesh(plateGeo, plateMat);
      plate.position.y = radius * 0.6;
      this.mesh.add(plate);
    } else if (type === 'HEALER') {
      // Glowing turquoise halo
      const haloGeo = new THREE.TorusGeometry(radius * 1.25, 0.12, 8, 16);
      const haloMat = new THREE.MeshBasicMaterial({ color: 0x5eead4 });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = Math.PI / 2;
      this.mesh.add(halo);
    } else if (type === 'EXPLOSIVE') {
      // Pulsing red hazard spikes
      const spikeGeo = new THREE.ConeGeometry(radius * 0.35, radius * 0.85, 6);
      const spikeMat = new THREE.MeshBasicMaterial({ color: 0xff2244 });
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      spike.position.y = radius * 0.9;
      this.mesh.add(spike);
    }
  }

  private buildChestModel() {
    this.chestMesh = new THREE.Group();

    // Radiant Golden Treasure Chest Base
    const chestBaseGeo = new THREE.BoxGeometry(1.25, 0.75, 0.95);
    const chestBaseMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.45,
      metalness: 0.85,
      roughness: 0.15
    });
    const chestBase = new THREE.Mesh(chestBaseGeo, chestBaseMat);
    chestBase.position.y = 0.4;
    this.chestMesh.add(chestBase);

    // Chest Lid
    const lidGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.26, 12, 1, false, 0, Math.PI);
    lidGeo.rotateZ(Math.PI / 2);
    const lidMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xfbbf24,
      emissiveIntensity: 0.5,
      metalness: 0.9,
      roughness: 0.1
    });
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.y = 0.75;
    this.chestMesh.add(lid);

    // Dazzling Golden Core Lock
    const lockGeo = new THREE.BoxGeometry(0.32, 0.32, 0.18);
    const lockMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const lock = new THREE.Mesh(lockGeo, lockMat);
    lock.position.set(0, 0.48, 0.52);
    this.chestMesh.add(lock);

    // Shimmering aura halo above chest
    const auraGeo = new THREE.TorusGeometry(0.8, 0.05, 8, 20);
    auraGeo.rotateX(Math.PI / 2);
    const auraMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const aura = new THREE.Mesh(auraGeo, auraMat);
    aura.position.y = 1.35;
    this.chestMesh.add(aura);

    this.mesh.add(this.chestMesh);
  }

  public takeDamage(amount: number, isCrit: boolean = false): number {
    let finalDmg = amount;
    if (this.config.armorReduction) {
      finalDmg *= (1 - this.config.armorReduction);
    }
    this.hp -= finalDmg;
    this.hitFlashTimer = 0.12; // Flash white
    return finalDmg;
  }

  public update(dt: number) {
    this.position.copy(this.mesh.position);

    const mat = this.baseMesh.material as THREE.MeshStandardMaterial;

    // Hit flash & status coloring
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
      mat.color.setHex(0xffffff);
      mat.emissive.setHex(0xffffff);
      mat.emissiveIntensity = 0.9;
    } else if (this.freezeTimer > 0) {
      mat.color.setHex(0x38bdf8); // Frozen cyan
      mat.emissive.setHex(0x0284c7);
      mat.emissiveIntensity = 0.6;
    } else if (this.burnTimer > 0) {
      mat.color.setHex(0xf97316); // Burning orange
      mat.emissive.setHex(0xea580c);
      mat.emissiveIntensity = 0.7;
    } else {
      mat.color.setHex(this.originalColor);
      mat.emissive.setHex(this.originalColor);
      mat.emissiveIntensity = this.isHead ? 0.45 : 0.35;
    }

    // Freeze countdown
    if (this.freezeTimer > 0) {
      this.freezeTimer -= dt;
    }

    // Slow countdown
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
    }

    // Burn tick
    if (this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.hp -= this.burnDps * dt;
    }

    // Chest breathing and glowing animation
    if (this.chestMesh) {
      const t = Date.now() * 0.006;
      const breathe = 1.0 + Math.sin(t) * 0.12;
      this.chestMesh.scale.set(breathe, breathe, breathe);
      this.chestMesh.rotation.y += 1.8 * dt;
    }
  }
}
