import * as THREE from 'three';

export const LANE_X = [-2.4, 0, 2.4];
export const LANE_COUNT = 3;

export function createMaterials() {
  return {
    skin: new THREE.MeshStandardMaterial({ color: 0xe8b896, roughness: 0.35, metalness: 0.05 }),
    hoodie: new THREE.MeshStandardMaterial({ color: 0xff6b2c, roughness: 0.55, metalness: 0.1 }),
    pants: new THREE.MeshStandardMaterial({ color: 0x1d2a44, roughness: 0.7 }),
    shoe: new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.4, metalness: 0.2 }),
    hair: new THREE.MeshStandardMaterial({ color: 0x1a1520, roughness: 0.85 }),
  };
}

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.lane = 1;
    this.targetLane = 1;
    this.x = LANE_X[1];
    this.y = 0;
    this.vy = 0;
    this.jumping = false;
    this.sliding = false;
    this.slideTimer = 0;
    this.runPhase = 0;
    this.alive = true;
    this.invuln = 0;

    const m = createMaterials();
    this.parts = {};

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.55, 6, 10), m.hoodie);
    body.position.y = 1.05;
    body.castShadow = true;
    this.group.add(body);
    this.parts.body = body;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), m.skin);
    head.position.y = 1.62;
    head.castShadow = true;
    this.group.add(head);
    this.parts.head = head;

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), m.hair);
    hair.position.set(0, 1.72, -0.02);
    this.group.add(hair);

    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.18), new THREE.MeshStandardMaterial({ color: 0x2bb8a0, roughness: 0.45 }));
    backpack.position.set(0, 1.15, -0.28);
    backpack.castShadow = true;
    this.group.add(backpack);

    this.parts.legL = this.makeLimb(m.pants, m.shoe, -0.12);
    this.parts.legR = this.makeLimb(m.pants, m.shoe, 0.12);
    this.parts.armL = this.makeArm(m.hoodie, m.skin, -0.34);
    this.parts.armR = this.makeArm(m.hoodie, m.skin, 0.34);

    this.group.position.set(this.x, 0, 0);
    scene.add(this.group);

    this.hitBoxStand = { w: 0.55, h: 1.7, d: 0.45 };
    this.hitBoxSlide = { w: 0.55, h: 0.85, d: 0.7 };
  }

  makeLimb(pantsMat, shoeMat, x) {
    const g = new THREE.Group();
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.28, 4, 8), pantsMat);
    thigh.position.y = 0.45;
    thigh.castShadow = true;
    g.add(thigh);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.32), shoeMat);
    shoe.position.set(0, 0.06, 0.05);
    shoe.castShadow = true;
    g.add(shoe);
    g.position.set(x, 0, 0);
    this.group.add(g);
    return g;
  }

  makeArm(hoodieMat, skinMat, x) {
    const g = new THREE.Group();
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.28, 4, 8), hoodieMat);
    upper.position.y = -0.2;
    upper.castShadow = true;
    g.add(upper);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), skinMat);
    hand.position.y = -0.42;
    g.add(hand);
    g.position.set(x, 1.35, 0);
    this.group.add(g);
    return g;
  }

  reset() {
    this.lane = 1;
    this.targetLane = 1;
    this.x = LANE_X[1];
    this.y = 0;
    this.vy = 0;
    this.jumping = false;
    this.sliding = false;
    this.slideTimer = 0;
    this.runPhase = 0;
    this.alive = true;
    this.invuln = 0.6;
    this.group.rotation.set(0, 0, 0);
    this.group.scale.set(1, 1, 1);
    this.group.position.set(this.x, 0, 0);
  }

  moveLeft() {
    if (!this.alive) return false;
    if (this.targetLane > 0) {
      this.targetLane -= 1;
      return true;
    }
    return false;
  }

  moveRight() {
    if (!this.alive) return false;
    if (this.targetLane < LANE_COUNT - 1) {
      this.targetLane += 1;
      return true;
    }
    return false;
  }

  jump() {
    if (!this.alive || this.jumping || this.sliding) return false;
    this.jumping = true;
    this.vy = 9.5;
    return true;
  }

  slide() {
    if (!this.alive || this.jumping || this.sliding) return false;
    this.sliding = true;
    this.slideTimer = 0.75;
    return true;
  }

  getHitBox() {
    const box = this.sliding ? this.hitBoxSlide : this.hitBoxStand;
    const h = this.sliding ? 0.85 : 1.7;
    const cy = this.y + (this.sliding ? 0.42 : h * 0.5);
    return {
      x: this.x,
      y: cy,
      z: 0,
      w: box.w,
      h: this.sliding ? 0.85 : 1.55,
      d: box.d,
    };
  }

  update(dt, speed) {
    const targetX = LANE_X[this.targetLane];
    this.x += (targetX - this.x) * Math.min(1, dt * 14);
    if (Math.abs(targetX - this.x) < 0.02) {
      this.x = targetX;
      this.lane = this.targetLane;
    }

    if (this.jumping) {
      this.vy -= 24 * dt;
      this.y += this.vy * dt;
      if (this.y <= 0) {
        this.y = 0;
        this.vy = 0;
        this.jumping = false;
      }
    }

    if (this.sliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) this.sliding = false;
    }

    if (this.invuln > 0) this.invuln -= dt;

    this.runPhase += dt * (8 + speed * 0.15);
    const swing = Math.sin(this.runPhase);
    const swing2 = Math.cos(this.runPhase);

    if (!this.sliding) {
      this.parts.legL.rotation.x = swing * 0.7;
      this.parts.legR.rotation.x = -swing * 0.7;
      this.parts.armL.rotation.x = -swing * 0.6;
      this.parts.armR.rotation.x = swing * 0.6;
      this.parts.body.position.y = 1.05 + Math.abs(swing2) * 0.04;
      this.parts.head.position.y = 1.62 + Math.abs(swing2) * 0.04;
      this.group.scale.y = this.jumping ? 1.05 : 1;
      this.group.scale.x = this.jumping ? 0.95 : 1;
      this.group.rotation.x = this.jumping ? -0.12 : 0;
    } else {
      this.parts.legL.rotation.x = 1.2;
      this.parts.legR.rotation.x = 1.2;
      this.parts.armL.rotation.x = 0.4;
      this.parts.armR.rotation.x = 0.4;
      this.parts.body.position.y = 0.55;
      this.parts.head.position.y = 1.0;
      this.group.scale.y = 0.55;
      this.group.scale.x = 1.15;
      this.group.rotation.x = 0.85;
    }

    this.group.position.set(this.x, this.y, 0);
    this.group.visible = this.invuln <= 0 || Math.floor(this.invuln * 20) % 2 === 0;
  }
}
