import * as THREE from 'three';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  startScale: number;
  rotSpeed: THREE.Vector3;
  color: THREE.Color;
  active: boolean;
}

export class ParticleEngine {
  private particles: Particle[] = [];
  private scene: THREE.Scene;
  private maxParticles: number = 200;
  private sharedBoxGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
  private sharedSphereGeo = new THREE.SphereGeometry(0.18, 6, 6);

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    for (let i = 0; i < this.maxParticles; i++) {
      const geo = i % 3 === 0 ? this.sharedSphereGeo : this.sharedBoxGeo;
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      this.scene.add(mesh);

      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        startScale: 1,
        rotSpeed: new THREE.Vector3(),
        color: new THREE.Color(0xffffff),
        active: false
      });
    }
  }

  private getFreeParticle(): Particle | null {
    for (const p of this.particles) {
      if (!p.active) return p;
    }
    // Recycle the one with lowest remaining life
    let oldest = this.particles[0];
    for (const p of this.particles) {
      if (p.life < oldest.life) oldest = p;
    }
    return oldest;
  }

  public emitSparks(pos: THREE.Vector3, colorHex: number = 0x38bdf8, count: number = 6) {
    for (let i = 0; i < count; i++) {
      const p = this.getFreeParticle();
      if (!p) break;

      p.active = true;
      p.mesh.visible = true;
      p.mesh.position.copy(pos);
      p.mesh.position.x += (Math.random() - 0.5) * 0.4;
      p.mesh.position.y += (Math.random() - 0.5) * 0.4;
      p.mesh.position.z += (Math.random() - 0.5) * 0.4;

      const speed = 3 + Math.random() * 6;
      p.velocity.set(
        (Math.random() - 0.5) * speed,
        Math.random() * speed * 0.8 + 1,
        (Math.random() - 0.5) * speed
      );

      p.rotSpeed.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );

      p.maxLife = 0.3 + Math.random() * 0.3;
      p.life = p.maxLife;
      p.startScale = 0.5 + Math.random() * 0.5;
      p.mesh.scale.setScalar(p.startScale);

      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.color.setHex(colorHex);
      mat.opacity = 1;
    }
  }

  public emitExplosion(pos: THREE.Vector3, colorHex: number = 0xef4444, count: number = 18, radius: number = 1.0) {
    for (let i = 0; i < count; i++) {
      const p = this.getFreeParticle();
      if (!p) break;

      p.active = true;
      p.mesh.visible = true;
      p.mesh.position.copy(pos);

      const speed = 4 + Math.random() * 8 * radius;
      p.velocity.set(
        (Math.random() - 0.5) * speed,
        Math.random() * speed * 0.7 + 2,
        (Math.random() - 0.5) * speed
      );

      p.rotSpeed.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      p.maxLife = 0.5 + Math.random() * 0.4;
      p.life = p.maxLife;
      p.startScale = (0.8 + Math.random() * 0.8) * radius;
      p.mesh.scale.setScalar(p.startScale);

      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.color.setHex(colorHex);
      mat.opacity = 1;
    }
  }

  public emitChestBurst(pos: THREE.Vector3) {
    // 1. Golden coin bursts
    for (let i = 0; i < 24; i++) {
      const p = this.getFreeParticle();
      if (!p) break;

      p.active = true;
      p.mesh.visible = true;
      p.mesh.position.copy(pos);

      const angle = (i / 24) * Math.PI * 2;
      const speed = 6 + Math.random() * 5;
      p.velocity.set(
        Math.cos(angle) * speed,
        4 + Math.random() * 6,
        Math.sin(angle) * speed
      );

      p.rotSpeed.set(8, 8, 8);
      p.maxLife = 0.8 + Math.random() * 0.4;
      p.life = p.maxLife;
      p.startScale = 0.9 + Math.random() * 0.5;
      p.mesh.scale.setScalar(p.startScale);

      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.color.setHex(i % 2 === 0 ? 0xfacc15 : 0xffffff); // Golden & Diamond sparkle
      mat.opacity = 1;
    }
  }

  public emitNukeBlast(center: THREE.Vector3) {
    // Radial massive ring explosion
    for (let i = 0; i < 60; i++) {
      const p = this.getFreeParticle();
      if (!p) break;

      p.active = true;
      p.mesh.visible = true;
      p.mesh.position.copy(center);

      const angle = (i / 60) * Math.PI * 2;
      const speed = 15 + Math.random() * 12;
      p.velocity.set(
        Math.cos(angle) * speed,
        Math.random() * 8 + 3,
        Math.sin(angle) * speed
      );

      p.rotSpeed.set(10, 10, 10);
      p.maxLife = 1.2 + Math.random() * 0.5;
      p.life = p.maxLife;
      p.startScale = 1.5 + Math.random() * 1.2;
      p.mesh.scale.setScalar(p.startScale);

      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.color.setHex(Math.random() > 0.4 ? 0xef4444 : 0xf97316);
      mat.opacity = 1;
    }
  }

  public update(dt: number) {
    const gravity = -18;
    for (const p of this.particles) {
      if (!p.active) continue;

      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }

      p.velocity.y += gravity * dt;
      p.mesh.position.addScaledVector(p.velocity, dt);

      // Bounce on ground Y = 0.2
      if (p.mesh.position.y < 0.2) {
        p.mesh.position.y = 0.2;
        p.velocity.y = -p.velocity.y * 0.4;
        p.velocity.x *= 0.8;
        p.velocity.z *= 0.8;
      }

      p.mesh.rotation.x += p.rotSpeed.x * dt;
      p.mesh.rotation.y += p.rotSpeed.y * dt;
      p.mesh.rotation.z += p.rotSpeed.z * dt;

      const progress = p.life / p.maxLife;
      p.mesh.scale.setScalar(p.startScale * progress);

      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.min(1, progress * 1.5);
    }
  }

  public clear() {
    for (const p of this.particles) {
      p.active = false;
      p.mesh.visible = false;
    }
  }
}
