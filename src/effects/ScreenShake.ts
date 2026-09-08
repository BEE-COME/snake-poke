import * as THREE from 'three';

export class ScreenShake {
  private trauma: number = 0; // 0 to 1
  private maxOffset: number = 0.9;
  private maxRoll: number = 0.05;
  private traumaDecay: number = 1.8; // decays per second
  private originalPos: THREE.Vector3 = new THREE.Vector3(0, 18, 22);

  public setOriginalPos(pos: THREE.Vector3) {
    this.originalPos.copy(pos);
  }

  public addTrauma(amount: number) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  public update(dt: number, camera: THREE.Camera) {
    if (this.trauma > 0) {
      const shake = this.trauma * this.trauma; // Non-linear quadratic shake
      const offsetX = (Math.random() * 2 - 1) * this.maxOffset * shake;
      const offsetY = (Math.random() * 2 - 1) * this.maxOffset * shake * 0.7;
      const offsetZ = (Math.random() * 2 - 1) * this.maxOffset * shake * 0.5;

      camera.position.set(
        this.originalPos.x + offsetX,
        this.originalPos.y + offsetY,
        this.originalPos.z + offsetZ
      );

      this.trauma = Math.max(0, this.trauma - this.traumaDecay * dt);
    } else {
      camera.position.copy(this.originalPos);
    }
  }
}
