import * as THREE from 'three';
import { LANE_X } from './player.js';

const SEGMENT_LEN = 20;
const SEGMENT_COUNT = 12;

export class World {
  constructor(scene) {
    this.scene = scene;
    this.segments = [];
    this.buildingsL = [];
    this.buildingsR = [];
    this.scroll = 0;
    this.rails = [];
    this.ties = [];

    this.groundMat = new THREE.MeshStandardMaterial({
      color: 0x2a3140,
      roughness: 0.92,
      metalness: 0.05,
    });
    this.railMat = new THREE.MeshStandardMaterial({
      color: 0x9aa3b5,
      roughness: 0.35,
      metalness: 0.85,
    });
    this.tieMat = new THREE.MeshStandardMaterial({
      color: 0x5a3a28,
      roughness: 0.9,
    });
    this.gravelMat = new THREE.MeshStandardMaterial({
      color: 0x3d4454,
      roughness: 1,
    });

    this._buildSky();
    this._buildLights();
    this._buildTrack();
    this._buildCity();
  }

  _buildSky() {
    this.scene.background = new THREE.Color(0x1a2740);
    this.scene.fog = new THREE.Fog(0x1a2740, 28, 95);

    const hemi = new THREE.HemisphereLight(0x8eb6ff, 0x2a1f18, 0.55);
    this.scene.add(hemi);

    // Distant sky dome gradient feel via large sphere
    const skyGeo = new THREE.SphereGeometry(120, 24, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        top: { value: new THREE.Color(0x0d1b33) },
        mid: { value: new THREE.Color(0x2a4068) },
        bottom: { value: new THREE.Color(0xff8f4a) },
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 top;
        uniform vec3 mid;
        uniform vec3 bottom;
        varying vec3 vPos;
        void main() {
          float h = normalize(vPos).y;
          vec3 col = mix(bottom, mid, smoothstep(-0.2, 0.25, h));
          col = mix(col, top, smoothstep(0.2, 0.85, h));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    this.scene.add(new THREE.Mesh(skyGeo, skyMat));
  }

  _buildLights() {
    const sun = new THREE.DirectionalLight(0xffd2a8, 1.35);
    sun.position.set(-20, 35, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 80;
    sun.shadow.camera.left = -25;
    sun.shadow.camera.right = 25;
    sun.shadow.camera.top = 25;
    sun.shadow.camera.bottom = -25;
    sun.shadow.bias = -0.0002;
    this.scene.add(sun);
    this.sun = sun;

    const fill = new THREE.DirectionalLight(0x6ec8ff, 0.35);
    fill.position.set(15, 10, -10);
    this.scene.add(fill);

    // Neon rim feel
    const rim = new THREE.PointLight(0xff8a3d, 1.2, 40);
    rim.position.set(0, 4, 6);
    this.scene.add(rim);
    this.rim = rim;
  }

  _buildTrack() {
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const seg = new THREE.Group();
      const bed = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.25, SEGMENT_LEN), this.gravelMat);
      bed.position.y = -0.12;
      bed.receiveShadow = true;
      seg.add(bed);

      // Platform edges
      const edgeL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.55, SEGMENT_LEN), this.groundMat);
      edgeL.position.set(-5.2, 0.1, 0);
      edgeL.receiveShadow = true;
      edgeL.castShadow = true;
      seg.add(edgeL);
      const edgeR = edgeL.clone();
      edgeR.position.x = 5.2;
      seg.add(edgeR);

      for (const lx of LANE_X) {
        for (const side of [-0.35, 0.35]) {
          const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, SEGMENT_LEN), this.railMat);
          rail.position.set(lx + side, 0.04, 0);
          rail.castShadow = true;
          seg.add(rail);
        }
      }

      for (let t = -SEGMENT_LEN / 2 + 1; t < SEGMENT_LEN / 2; t += 1.2) {
        const tie = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.1, 0.28), this.tieMat);
        tie.position.set(0, 0.0, t);
        tie.receiveShadow = true;
        seg.add(tie);
      }

      // Lane dashed center markers
      for (const lx of LANE_X) {
        for (let z = -8; z <= 8; z += 4) {
          const dash = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.02, 1.2),
            new THREE.MeshStandardMaterial({ color: 0xffc15a, emissive: 0x442200, emissiveIntensity: 0.4 })
          );
          dash.position.set(lx, 0.06, z);
          seg.add(dash);
        }
      }

      seg.position.z = -i * SEGMENT_LEN;
      this.scene.add(seg);
      this.segments.push(seg);
    }
  }

  _makeBuilding(w, h, d, color) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.85,
      metalness: 0.15,
    });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.y = h / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);

    const winMat = new THREE.MeshStandardMaterial({
      color: 0x101820,
      emissive: new THREE.Color().setHSL(0.08 + Math.random() * 0.08, 0.7, 0.35),
      emissiveIntensity: 0.7 + Math.random() * 0.6,
      roughness: 0.4,
    });
    const cols = Math.max(2, Math.floor(w / 1.4));
    const rows = Math.max(3, Math.floor(h / 2.2));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() < 0.18) continue;
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.5), winMat);
        win.position.set(-w / 2 + 0.6 + c * ((w - 1.2) / Math.max(1, cols - 1)), 1.2 + r * ((h - 2) / Math.max(1, rows - 1)), d / 2 + 0.01);
        g.add(win);
      }
    }
    return g;
  }

  _buildCity() {
    const colors = [0x2c3648, 0x243044, 0x334058, 0x1e2838, 0x3a465c];
    for (let i = 0; i < 28; i++) {
      const h = 8 + Math.random() * 28;
      const w = 3 + Math.random() * 4;
      const d = 4 + Math.random() * 8;
      const bL = this._makeBuilding(w, h, d, colors[i % colors.length]);
      bL.position.set(-9 - Math.random() * 6, 0, -i * 7 - Math.random() * 4);
      this.scene.add(bL);
      this.buildingsL.push(bL);

      const h2 = 8 + Math.random() * 28;
      const bR = this._makeBuilding(w, h2, d, colors[(i + 2) % colors.length]);
      bR.position.set(9 + Math.random() * 6, 0, -i * 7 - Math.random() * 4);
      this.scene.add(bR);
      this.buildingsR.push(bR);
    }
  }

  update(dt, speed) {
    const move = speed * dt;
    this.scroll += move;

    for (const seg of this.segments) {
      seg.position.z += move;
      if (seg.position.z > SEGMENT_LEN) {
        seg.position.z -= SEGMENT_COUNT * SEGMENT_LEN;
      }
    }

    const recycleDist = 100;
    for (const b of this.buildingsL) {
      b.position.z += move * 0.92;
      if (b.position.z > 30) b.position.z -= recycleDist;
    }
    for (const b of this.buildingsR) {
      b.position.z += move * 0.92;
      if (b.position.z > 30) b.position.z -= recycleDist;
    }

    if (this.rim) {
      this.rim.intensity = 1.0 + Math.sin(performance.now() * 0.003) * 0.25;
    }
  }

  reset() {
    this.scroll = 0;
    this.segments.forEach((seg, i) => {
      seg.position.z = -i * SEGMENT_LEN;
    });
  }
}
