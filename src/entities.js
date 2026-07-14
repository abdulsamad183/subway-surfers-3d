import * as THREE from 'three';
import { LANE_X } from './player.js';

function aabbHit(a, b) {
  return (
    Math.abs(a.x - b.x) * 2 < a.w + b.w &&
    Math.abs(a.y - b.y) * 2 < a.h + b.h &&
    Math.abs(a.z - b.z) * 2 < a.d + b.d
  );
}

function makeTrain() {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xc45c2a, roughness: 0.4, metalness: 0.35 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1f2a, roughness: 0.5, metalness: 0.4 });
  const accent = new THREE.MeshStandardMaterial({ color: 0x3de0c5, emissive: 0x118877, emissiveIntensity: 0.6 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 6.5), bodyMat);
  body.position.y = 1.2;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.2, 6.3), dark);
  roof.position.y = 2.4;
  g.add(roof);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.18, 6.4), accent);
  stripe.position.y = 1.5;
  g.add(stripe);

  for (const z of [-2, 0, 2]) {
    const win = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x89d6ff, emissive: 0x225577, emissiveIntensity: 0.5, roughness: 0.2 })
    );
    win.position.set(0.91, 1.7, z);
    win.rotation.y = Math.PI / 2;
    g.add(win);
    const win2 = win.clone();
    win2.position.x = -0.91;
    win2.rotation.y = -Math.PI / 2;
    g.add(win2);
  }

  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.8, 0.6), bodyMat);
  nose.position.set(0, 1.1, 3.4);
  nose.castShadow = true;
  g.add(nose);

  g.userData.hit = { w: 1.7, h: 2.2, d: 6.2, y: 1.2 };
  g.userData.kind = 'train';
  return g;
}

function makeBarrier() {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0xc47a2c, roughness: 0.8 });
  const stripe = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 });
  const post = new THREE.MeshStandardMaterial({ color: 0x666d7a, metalness: 0.5, roughness: 0.4 });

  for (const x of [-0.7, 0.7]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.1, 8), post);
    p.position.set(x, 0.55, 0);
    p.castShadow = true;
    g.add(p);
  }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.28, 0.18), wood);
  bar.position.y = 0.95;
  bar.castShadow = true;
  g.add(bar);
  const bar2 = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.28, 0.18), stripe);
  bar2.position.y = 0.55;
  g.add(bar2);

  g.userData.hit = { w: 1.5, h: 1.15, d: 0.45, y: 0.6 };
  g.userData.kind = 'barrier';
  return g;
}

/** Thin overhead bar — slide under */
function makeLowBar() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xff5a4a,
    roughness: 0.45,
    metalness: 0.25,
    emissive: 0x551100,
    emissiveIntensity: 0.3,
  });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.22, 0.22), mat);
  beam.position.y = 1.35;
  beam.castShadow = true;
  g.add(beam);
  for (const x of [-0.75, 0.75]) {
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 1.45, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x888f9c, metalness: 0.6, roughness: 0.35 })
    );
    post.position.set(x, 0.72, 0);
    post.castShadow = true;
    g.add(post);
  }
  g.userData.hit = { w: 1.55, h: 0.45, d: 0.4, y: 1.35 };
  g.userData.kind = 'low';
  return g;
}

/**
 * Solid hanging block / tunnel slab — clearly must slide under.
 * Gap underneath ~1.0 unit so standing hits, sliding clears.
 */
function makeOverhang() {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.45, metalness: 0.55 });
  const warn = new THREE.MeshStandardMaterial({
    color: 0xffb020,
    roughness: 0.5,
    metalness: 0.2,
    emissive: 0x663300,
    emissiveIntensity: 0.45,
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1c222e, roughness: 0.7, metalness: 0.3 });

  // Tall posts on sides
  for (const x of [-0.95, 0.95]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.4, 0.22), metal);
    post.position.set(x, 1.2, 0);
    post.castShadow = true;
    g.add(post);
  }

  // Thick slab hanging above the duck gap
  const slab = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.15, 1.4), dark);
  slab.position.set(0, 1.85, 0);
  slab.castShadow = true;
  slab.receiveShadow = true;
  g.add(slab);

  // Warning stripes on front face of slab
  for (let i = 0; i < 4; i++) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.95, 0.08), warn);
    stripe.position.set(-0.7 + i * 0.46, 1.85, 0.72);
    g.add(stripe);
  }

  // Top cap
  const cap = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.12, 1.55), metal);
  cap.position.set(0, 2.48, 0);
  g.add(cap);

  // Hit volume = the hanging slab only (clearance below ~1.25)
  g.userData.hit = { w: 1.9, h: 1.15, d: 1.35, y: 1.85 };
  g.userData.kind = 'overhang';
  return g;
}

function makeCoin() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffd24a,
    emissive: 0xaa7700,
    emissiveIntensity: 0.55,
    metalness: 0.85,
    roughness: 0.25,
  });
  const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 24), mat);
  coin.rotation.x = Math.PI / 2;
  coin.castShadow = true;
  g.add(coin);
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.035, 8, 24),
    new THREE.MeshStandardMaterial({
      color: 0xfff0a8,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x665500,
      emissiveIntensity: 0.3,
    })
  );
  g.add(rim);
  g.userData.hit = { w: 0.6, h: 0.6, d: 0.6, y: 1.0 };
  g.userData.kind = 'coin';
  return g;
}

/** Pickup skateboard power-up floating on the track */
function makeSkatePickup() {
  const g = new THREE.Group();
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.07, 1.05),
    new THREE.MeshStandardMaterial({
      color: 0x3de0c5,
      roughness: 0.35,
      metalness: 0.4,
      emissive: 0x0a6655,
      emissiveIntensity: 0.55,
    })
  );
  deck.castShadow = true;
  g.add(deck);

  const glow = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.04, 8, 24),
    new THREE.MeshStandardMaterial({
      color: 0xff8a3d,
      emissive: 0xff8a3d,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.85,
    })
  );
  glow.rotation.x = Math.PI / 2;
  glow.position.y = 0.05;
  g.add(glow);

  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1f2a, metalness: 0.6, roughness: 0.35 });
  for (const [x, z] of [
    [-0.16, 0.32],
    [0.16, 0.32],
    [-0.16, -0.32],
    [0.16, -0.32],
  ]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 10), wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, -0.02, z);
    g.add(w);
  }

  g.userData.hit = { w: 0.9, h: 0.7, d: 1.1, y: 1.0 };
  g.userData.kind = 'skate';
  return g;
}

export class EntitySystem {
  constructor(scene) {
    this.scene = scene;
    this.entities = [];
    this.spawnZ = -40;
    this.nextSpawn = 0;
    this.pool = {
      train: [],
      barrier: [],
      low: [],
      overhang: [],
      coin: [],
      skate: [],
    };
  }

  _acquire(kind) {
    const pool = this.pool[kind];
    if (pool.length) {
      const e = pool.pop();
      e.visible = true;
      return e;
    }
    let mesh;
    if (kind === 'train') mesh = makeTrain();
    else if (kind === 'barrier') mesh = makeBarrier();
    else if (kind === 'low') mesh = makeLowBar();
    else if (kind === 'overhang') mesh = makeOverhang();
    else if (kind === 'skate') mesh = makeSkatePickup();
    else mesh = makeCoin();
    this.scene.add(mesh);
    return mesh;
  }

  _release(mesh) {
    mesh.visible = false;
    this.pool[mesh.userData.kind].push(mesh);
  }

  clear() {
    for (const e of this.entities) this._release(e.mesh);
    this.entities = [];
    this.spawnZ = -40;
    this.nextSpawn = 0;
  }

  spawnPattern(difficulty) {
    const lane = Math.floor(Math.random() * 3);
    const roll = Math.random();

    if (roll < 0.2) {
      this._spawn('train', lane, this.spawnZ);
      const other = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
      for (let i = 0; i < 4; i++) {
        this._spawn('coin', other, this.spawnZ - i * 2.2, 1.1);
      }
      if (Math.random() < 0.35) this._spawn('skate', other, this.spawnZ - 9, 1.15);
      this.spawnZ -= 18 + Math.random() * 4;
    } else if (roll < 0.36) {
      this._spawn('barrier', lane, this.spawnZ);
      this._spawn('coin', lane, this.spawnZ - 4, 2.4);
      this.spawnZ -= 12 + Math.random() * 3;
    } else if (roll < 0.52) {
      // Solid hang blocks — must slide under
      this._spawn('overhang', lane, this.spawnZ);
      const side = (lane + (Math.random() < 0.5 ? 1 : 2)) % 3;
      this._spawn('coin', side, this.spawnZ - 2, 1.0);
      if (Math.random() < 0.4) this._spawn('skate', side, this.spawnZ - 5, 1.15);
      this.spawnZ -= 12 + Math.random() * 3;
    } else if (roll < 0.64) {
      this._spawn('low', lane, this.spawnZ);
      const side = (lane + (Math.random() < 0.5 ? 1 : 2)) % 3;
      this._spawn('coin', side, this.spawnZ - 2, 1.0);
      this.spawnZ -= 11 + Math.random() * 3;
    } else if (roll < 0.74) {
      // Twin overhangs — one free lane
      const a = Math.floor(Math.random() * 3);
      let b = Math.floor(Math.random() * 3);
      while (b === a) b = Math.floor(Math.random() * 3);
      this._spawn('overhang', a, this.spawnZ);
      this._spawn('barrier', b, this.spawnZ);
      this.spawnZ -= 13;
    } else if (roll < 0.84) {
      const a = Math.floor(Math.random() * 3);
      let b = Math.floor(Math.random() * 3);
      while (b === a) b = Math.floor(Math.random() * 3);
      this._spawn('barrier', a, this.spawnZ);
      this._spawn('barrier', b, this.spawnZ);
      this.spawnZ -= 13;
    } else {
      // Coin / skate mix line
      const lineLane = Math.floor(Math.random() * 3);
      for (let i = 0; i < 6; i++) {
        if (i === 3 && Math.random() < 0.55) {
          this._spawn('skate', lineLane, this.spawnZ - i * 1.8, 1.15);
        } else {
          this._spawn('coin', lineLane, this.spawnZ - i * 1.8, 1.05 + (i % 2) * 0.35);
        }
      }
      this.spawnZ -= 14;
    }

    if (difficulty > 0.4 && Math.random() < 0.4) {
      const l2 = Math.floor(Math.random() * 3);
      const kinds = ['barrier', 'low', 'overhang'];
      this._spawn(kinds[Math.floor(Math.random() * kinds.length)], l2, this.spawnZ + 6);
    }
  }

  _spawn(kind, lane, z, yOverride) {
    const mesh = this._acquire(kind);
    const yBase = yOverride ?? 0;
    mesh.position.set(LANE_X[lane], yBase, z);
    mesh.rotation.y = 0;
    this.entities.push({
      mesh,
      lane,
      kind,
      alive: true,
      spin: Math.random() * Math.PI * 2,
    });
  }

  update(dt, speed, player) {
    const move = speed * dt;
    this.spawnZ += move;

    while (this.spawnZ > -55) {
      this.spawnPattern(Math.min(1, speed / 40));
    }

    let coins = 0;
    let skates = 0;
    let crashed = false;

    const pBox = player.getHitBox();

    for (const e of this.entities) {
      if (!e.alive) continue;
      e.mesh.position.z += move;

      if (e.kind === 'coin') {
        e.spin += dt * 4;
        e.mesh.rotation.y = e.spin;
        e.mesh.position.y = 1.0 + Math.sin(e.spin * 2) * 0.12;
      }
      if (e.kind === 'skate') {
        e.spin += dt * 2.5;
        e.mesh.rotation.y = e.spin;
        e.mesh.position.y = 1.15 + Math.sin(e.spin * 2.2) * 0.15;
      }

      if (e.mesh.position.z > 8) {
        e.alive = false;
        this._release(e.mesh);
        continue;
      }

      if (Math.abs(e.mesh.position.z) > 4.5) continue;

      const hit = e.mesh.userData.hit;
      const eBox = {
        x: e.mesh.position.x,
        y: e.kind === 'coin' || e.kind === 'skate' ? e.mesh.position.y : hit.y,
        z: e.mesh.position.z,
        w: hit.w,
        h: hit.h,
        d: hit.d,
      };

      if (!aabbHit(pBox, eBox)) continue;

      if (e.kind === 'coin') {
        e.alive = false;
        this._release(e.mesh);
        coins += 1;
        continue;
      }

      if (e.kind === 'skate') {
        e.alive = false;
        this._release(e.mesh);
        skates += 1;
        continue;
      }

      // Must slide under overhead hazards
      if (e.kind === 'low' || e.kind === 'overhang') {
        if (player.sliding) continue;
      }
      if (e.kind === 'barrier') {
        if (player.jumping && player.y > 0.85) continue;
      }
      if (e.kind === 'train' && player.y > 2.3) continue;

      // Active skateboard = full protection for the timer
      if (player.skating) continue;

      if (player.invuln <= 0) crashed = true;
    }

    this.entities = this.entities.filter((e) => e.alive);
    return { coins, skates, crashed };
  }
}

export { aabbHit };
