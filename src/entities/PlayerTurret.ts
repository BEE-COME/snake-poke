import * as THREE from 'three';
import { PlayerStats } from '../types/game';

export class PlayerTurret {
  public mesh: THREE.Group;
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 12);
  public targetX: number = 0;
  public minX: number = -12.5;
  public maxX: number = 12.5;

  private chassis: THREE.Mesh;
  private turretHead: THREE.Group;
  private barrelsGroup: THREE.Group;
  private barrels: THREE.Mesh[] = [];
  private shieldDome: THREE.Mesh;
  private satellites: THREE.Mesh[] = [];
  private satelliteOrbitAngle: number = 0;

  private recoilTime: number = 0;
  private muzzleFlash: THREE.PointLight;

  constructor(scene: THREE.Scene) {
    this.mesh = new THREE.Group();

    // 1. Chassis
    const chassisGeo = new THREE.CylinderGeometry(1.6, 2.0, 0.7, 8);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
      flatShading: true
    });
    this.chassis = new THREE.Mesh(chassisGeo, chassisMat);
    this.chassis.position.y = 0.35;
    this.chassis.castShadow = true;
    this.mesh.add(this.chassis);

    // Chassis glowing ring
    const ringGeo = new THREE.TorusGeometry(1.7, 0.08, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.35;
    this.mesh.add(ring);

    // 2. Turret Head
    this.turretHead = new THREE.Group();
    this.turretHead.position.y = 0.75;
    this.mesh.add(this.turretHead);

    const headGeo = new THREE.SphereGeometry(1.1, 12, 10);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.2
    });
    const headDome = new THREE.Mesh(headGeo, headMat);
    headDome.scale.set(1.0, 0.7, 1.2);
    this.turretHead.add(headDome);

    // Barrels container
    this.barrelsGroup = new THREE.Group();
    this.turretHead.add(this.barrelsGroup);

    // Muzzle flash light
    this.muzzleFlash = new THREE.PointLight(0x38bdf8, 0, 8);
    this.muzzleFlash.position.set(0, 0.4, -2.5);
    this.turretHead.add(this.muzzleFlash);

    // 3. Shield Dome
    const shieldGeo = new THREE.SphereGeometry(2.3, 16, 12);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0,
      wireframe: true
    });
    this.shieldDome = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldDome.position.y = 0.5;
    this.mesh.add(this.shieldDome);

    this.mesh.position.copy(this.position);
    scene.add(this.mesh);

    this.rebuildBarrels(1);
  }

  public rebuildBarrels(count: number) {
    // Clear old barrels
    while (this.barrelsGroup.children.length > 0) {
      this.barrelsGroup.remove(this.barrelsGroup.children[0]);
    }
    this.barrels = [];

    const barrelGeo = new THREE.CylinderGeometry(0.18, 0.22, 2.2, 10);
    barrelGeo.rotateX(-Math.PI / 2);

    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.95,
      roughness: 0.15
    });

    const glowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    const barrelCount = Math.min(count, 5);
    const spacing = 0.48;
    const startX = -((barrelCount - 1) * spacing) / 2;

    for (let i = 0; i < barrelCount; i++) {
      const b = new THREE.Mesh(barrelGeo, barrelMat);
      b.position.set(startX + i * spacing, 0.25, -1.1);
      b.castShadow = true;

      // Glow tip ring
      const tipGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.25, 10);
      tipGeo.rotateX(-Math.PI / 2);
      const tip = new THREE.Mesh(tipGeo, glowMat);
      tip.position.set(0, 0, -1.05);
      b.add(tip);

      this.barrelsGroup.add(b);
      this.barrels.push(b);
    }
  }

  public updateSatellites(scene: THREE.Scene, satelliteCount: number) {
    // Add/remove satellites to match count
    while (this.satellites.length < satelliteCount) {
      const satGeo = new THREE.SphereGeometry(0.4, 12, 12);
      const satMat = new THREE.MeshStandardMaterial({
        color: 0xa855f7, // Purple plasma
        emissive: 0x9333ea,
        emissiveIntensity: 0.8
      });
      const sat = new THREE.Mesh(satGeo, satMat);
      this.satellites.push(sat);
      scene.add(sat);
    }
    while (this.satellites.length > satelliteCount) {
      const sat = this.satellites.pop();
      if (sat) scene.remove(sat);
    }
  }

  public onFire() {
    this.recoilTime = 0.12;
    this.muzzleFlash.intensity = 4.0;
  }

  public getFirePositions(): THREE.Vector3[] {
    const results: THREE.Vector3[] = [];
    if (this.barrels.length === 0) {
      const fallback = new THREE.Vector3();
      this.turretHead.getWorldPosition(fallback);
      fallback.z -= 1.8;
      results.push(fallback);
      return results;
    }

    for (const b of this.barrels) {
      const worldPos = new THREE.Vector3();
      b.getWorldPosition(worldPos);
      worldPos.z -= 1.2;
      results.push(worldPos);
    }
    return results;
  }

  public update(dt: number, stats: PlayerStats, targetAimPoint: THREE.Vector3 | null, scene: THREE.Scene) {
    // Smooth horizontal movement towards targetX
    this.targetX = Math.max(this.minX, Math.min(this.maxX, this.targetX));
    this.mesh.position.x += (this.targetX - this.mesh.position.x) * Math.min(1.0, 16 * dt);
    this.position.copy(this.mesh.position);

    // Barrel count sync with stats
    if (this.barrels.length !== Math.min(stats.projectileCount, 5)) {
      this.rebuildBarrels(stats.projectileCount);
    }

    // Aim turret head towards target or straight forward
    if (targetAimPoint) {
      const localTarget = targetAimPoint.clone().sub(this.mesh.position);
      const angleY = Math.atan2(localTarget.x, -localTarget.z);
      // Clamp angle so it doesn't aim backwards
      const clampedAngle = Math.max(-0.75, Math.min(0.75, angleY));
      this.turretHead.rotation.y += (clampedAngle - this.turretHead.rotation.y) * Math.min(1.0, 12 * dt);
    } else {
      this.turretHead.rotation.y += (0 - this.turretHead.rotation.y) * Math.min(1.0, 8 * dt);
    }

    // Recoil animation
    if (this.recoilTime > 0) {
      this.recoilTime -= dt;
      this.barrelsGroup.position.z = 0.35 * (this.recoilTime / 0.12);
      this.muzzleFlash.intensity = Math.max(0, this.muzzleFlash.intensity - 25 * dt);
    } else {
      this.barrelsGroup.position.z = 0;
      this.muzzleFlash.intensity = 0;
    }

    // Shield dome visual
    const shieldMat = this.shieldDome.material as THREE.MeshBasicMaterial;
    if (stats.shield > 0) {
      const pulse = 0.25 + 0.15 * Math.sin(Date.now() * 0.005);
      shieldMat.opacity = pulse;
      this.shieldDome.rotation.y += 0.8 * dt;
    } else {
      shieldMat.opacity = 0;
    }

    // Satellites orbiting
    this.updateSatellites(scene, stats.satelliteCount || 0);
    if (this.satellites.length > 0) {
      this.satelliteOrbitAngle += 2.8 * dt;
      const orbitRadius = 4.2;
      const count = this.satellites.length;
      for (let i = 0; i < count; i++) {
        const angle = this.satelliteOrbitAngle + (i / count) * Math.PI * 2;
        this.satellites[i].position.set(
          this.mesh.position.x + Math.cos(angle) * orbitRadius,
          1.2,
          this.mesh.position.z + Math.sin(angle) * orbitRadius * 0.8
        );
      }
    }
  }

  public getSatellitePositions(): THREE.Vector3[] {
    return this.satellites.map(s => s.position.clone());
  }

  public destroy(scene: THREE.Scene) {
    scene.remove(this.mesh);
    for (const s of this.satellites) {
      scene.remove(s);
    }
    this.satellites = [];
  }
}
