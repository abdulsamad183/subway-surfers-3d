import * as THREE from 'three';
import { Player } from './player.js';
import { World } from './world.js';
import { EntitySystem } from './entities.js';
import { AudioBus } from './audio.js';

const BEST_KEY = 'rail-rush-best';
const START_BOARDS = 5;
const SKATE_DURATION = 10;
const DOUBLE_TAP_MS = 320;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.audio = new AudioBus();
    this.running = false;
    this.score = 0;
    this.coins = 0;
    this.boards = START_BOARDS;
    this.speed = 14;
    this.baseSpeed = 14;
    this.distance = 0;
    this.shake = 0;
    this.lastTapAt = 0;
    this.clock = new THREE.Clock();

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    this.camera.position.set(0, 4.2, 8.5);
    this.camera.lookAt(0, 1.2, -4);

    this.world = new World(this.scene);
    this.player = new Player(this.scene);
    this.entities = new EntitySystem(this.scene);

    this.particles = [];
    this.particleGeo = new THREE.SphereGeometry(0.07, 6, 6);
    this.particleMat = new THREE.MeshBasicMaterial({ color: 0xffd24a });

    this._bindUI();
    this._bindInput();
    window.addEventListener('resize', () => this._onResize());

    this._raf = requestAnimationFrame(() => this._loop());
  }

  _bindUI() {
    this.ui = {
      overlay: document.getElementById('overlay'),
      title: document.getElementById('overlay-title'),
      sub: document.getElementById('overlay-sub'),
      play: document.getElementById('play-btn'),
      hud: document.getElementById('hud'),
      score: document.getElementById('score'),
      coins: document.getElementById('coins'),
      boards: document.getElementById('boards'),
      skateTimer: document.getElementById('skate-timer'),
      skateSecs: document.getElementById('skate-secs'),
      finalStats: document.getElementById('final-stats'),
      finalScore: document.getElementById('final-score'),
      finalCoins: document.getElementById('final-coins'),
      best: document.getElementById('best-score'),
    };

    this.ui.play.addEventListener('click', () => this.start());
    this.ui.best.textContent = String(Number(localStorage.getItem(BEST_KEY) || 0));
  }

  _tryActivateBoard() {
    if (!this.running || this.player.skating || this.boards <= 0) return false;
    if (!this.player.activateSkate(SKATE_DURATION)) return false;
    this.boards -= 1;
    this.audio.skate();
    this._updateHud();
    return true;
  }

  _registerTap() {
    const now = performance.now();
    if (now - this.lastTapAt < DOUBLE_TAP_MS) {
      this.lastTapAt = 0;
      this._tryActivateBoard();
      return true;
    }
    this.lastTapAt = now;
    return false;
  }

  _bindInput() {
    const onKey = (e) => {
      if (!this.running) {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          this.start();
        }
        return;
      }
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault();
          if (this.player.moveLeft()) this.audio.lane();
          break;
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault();
          if (this.player.moveRight()) this.audio.lane();
          break;
        case 'ArrowUp':
        case 'KeyW':
          e.preventDefault();
          if (this.player.jump()) this.audio.jump();
          break;
        case 'Space': {
          e.preventDefault();
          const now = performance.now();
          if (now - this.lastTapAt < DOUBLE_TAP_MS) {
            this.lastTapAt = 0;
            this._tryActivateBoard();
          } else {
            const tapId = now;
            this.lastTapAt = tapId;
            setTimeout(() => {
              if (this.lastTapAt === tapId) {
                this.lastTapAt = 0;
                if (this.running && this.player.jump()) this.audio.jump();
              }
            }, DOUBLE_TAP_MS);
          }
          break;
        }
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault();
          if (this.player.slide()) this.audio.slide();
          break;
        case 'KeyF':
        case 'ShiftLeft':
        case 'ShiftRight':
          e.preventDefault();
          this._tryActivateBoard();
          break;
      }
    };
    window.addEventListener('keydown', onKey);

    let sx = 0;
    let sy = 0;
    let tracking = false;
    const el = this.canvas;

    el.addEventListener(
      'pointerdown',
      (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        sx = e.clientX;
        sy = e.clientY;
        tracking = true;
      },
      { passive: true }
    );

    el.addEventListener(
      'pointerup',
      (e) => {
        if (!tracking) return;
        tracking = false;
        const dx = e.clientX - sx;
        const dy = e.clientY - sy;
        if (!this.running) {
          this.start();
          return;
        }

        // Tap (small movement) → double-tap board / ignore single
        if (Math.abs(dx) < 22 && Math.abs(dy) < 22) {
          this._registerTap();
          return;
        }

        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx < 0) {
            if (this.player.moveLeft()) this.audio.lane();
          } else if (this.player.moveRight()) this.audio.lane();
        } else if (dy < 0) {
          if (this.player.jump()) this.audio.jump();
        } else if (this.player.slide()) this.audio.slide();
      },
      { passive: true }
    );
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  start() {
    this.audio.start();
    this.running = true;
    this.score = 0;
    this.coins = 0;
    this.boards = START_BOARDS;
    this.distance = 0;
    this.speed = this.baseSpeed;
    this.shake = 0;
    this.lastTapAt = 0;
    this.player.reset();
    this.world.reset();
    this.entities.clear();
    this._clearParticles();

    this.ui.overlay.classList.add('hidden');
    this.ui.hud.classList.remove('hidden');
    this.ui.finalStats.classList.add('hidden');
    this.ui.skateTimer.classList.add('hidden');
    this._updateHud();
    this.clock.getDelta();
  }

  gameOver() {
    this.running = false;
    this.player.endSkate();
    this.audio.crash();
    this.shake = 0.55;

    const best = Math.max(Number(localStorage.getItem(BEST_KEY) || 0), Math.floor(this.score));
    localStorage.setItem(BEST_KEY, String(best));

    this.ui.title.textContent = 'Wrecked on the rails';
    this.ui.sub.textContent = 'Slide under blocks. Double-tap for a board.';
    this.ui.play.textContent = 'RUN AGAIN';
    this.ui.finalScore.textContent = String(Math.floor(this.score));
    this.ui.finalCoins.textContent = String(this.coins);
    this.ui.best.textContent = String(best);
    this.ui.finalStats.classList.remove('hidden');
    this.ui.hud.classList.add('hidden');
    this.ui.skateTimer.classList.add('hidden');
    this.ui.overlay.classList.remove('hidden');
  }

  _updateHud() {
    this.ui.score.textContent = String(Math.floor(this.score));
    this.ui.coins.textContent = String(this.coins);
    this.ui.boards.textContent = String(this.boards);

    if (this.player.skating) {
      this.ui.skateTimer.classList.remove('hidden');
      this.ui.skateSecs.textContent = String(Math.ceil(Math.max(0, this.player.skateTimer)));
    } else {
      this.ui.skateTimer.classList.add('hidden');
    }
  }

  _spawnCoinBurst(x, y, z, color = 0xffd24a) {
    for (let i = 0; i < 8; i++) {
      const mat = new THREE.MeshBasicMaterial({ color });
      const m = new THREE.Mesh(this.particleGeo, mat);
      m.position.set(x, y, z);
      m.userData.v = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        2 + Math.random() * 3,
        (Math.random() - 0.5) * 2
      );
      m.userData.life = 0.45 + Math.random() * 0.25;
      this.scene.add(m);
      this.particles.push(m);
    }
  }

  _clearParticles() {
    for (const p of this.particles) this.scene.remove(p);
    this.particles = [];
  }

  _updateParticles(dt) {
    for (const p of this.particles) {
      p.userData.life -= dt;
      p.userData.v.y -= 10 * dt;
      p.position.addScaledVector(p.userData.v, dt);
      p.scale.setScalar(Math.max(0.01, p.userData.life * 2));
      if (p.material.opacity !== undefined) {
        p.material.transparent = true;
        p.material.opacity = Math.max(0, p.userData.life * 2);
      }
    }
    this.particles = this.particles.filter((p) => {
      if (p.userData.life <= 0) {
        this.scene.remove(p);
        return false;
      }
      return true;
    });
  }

  _updateCamera(dt) {
    const targetX = this.player.x * 0.35;
    const targetY = 4.0 + this.player.y * 0.25;
    const targetZ = 8.2;
    this.camera.position.x += (targetX - this.camera.position.x) * Math.min(1, dt * 5);
    this.camera.position.y += (targetY - this.camera.position.y) * Math.min(1, dt * 5);
    this.camera.position.z += (targetZ - this.camera.position.z) * Math.min(1, dt * 5);

    const lookY = 1.1 + this.player.y * 0.2;
    this.camera.lookAt(this.player.x * 0.2, lookY, -6);

    const skateBoost = this.player.skating ? 4 : 0;
    const wantFov = 58 + Math.min(12, (this.speed - this.baseSpeed) * 0.45) + skateBoost;
    this.camera.fov += (wantFov - this.camera.fov) * Math.min(1, dt * 3);
    this.camera.updateProjectionMatrix();

    if (this.shake > 0) {
      this.shake -= dt;
      this.camera.position.x += (Math.random() - 0.5) * this.shake * 1.4;
      this.camera.position.y += (Math.random() - 0.5) * this.shake * 1.0;
    }
  }

  _loop() {
    this._raf = requestAnimationFrame(() => this._loop());
    const dt = Math.min(0.05, this.clock.getDelta());

    if (this.running) {
      const skateMul = this.player.skating ? 1.18 : 1;
      this.speed = (this.baseSpeed + Math.min(28, this.distance * 0.015)) * skateMul;
      this.distance += this.speed * dt;
      this.score = this.distance * 1.2 + this.coins * 10;

      this.player.update(dt, this.speed);
      this.world.update(dt, this.speed);
      const { coins, skates, crashed } = this.entities.update(dt, this.speed, this.player);

      if (coins > 0) {
        this.coins += coins;
        this.audio.coin();
        this._spawnCoinBurst(this.player.x, 1.2 + this.player.y, 0);
      }

      if (skates > 0) {
        this.boards += skates;
        this.audio.skatePickup();
        this._spawnCoinBurst(this.player.x, 1.3 + this.player.y, 0, 0x3de0c5);
      }

      this._updateHud();

      if (crashed) this.gameOver();
    } else {
      this.world.update(dt, 4);
      this.player.update(dt, 4);
    }

    this._updateParticles(dt);
    this._updateCamera(dt);
    this.renderer.render(this.scene, this.camera);
  }
}
