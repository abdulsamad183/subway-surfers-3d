/** Lightweight Web Audio SFX — no external files */
export class AudioBus {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  ensure() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  tone({ freq = 440, dur = 0.12, type = 'sine', gain = 0.08, slide = 0 }) {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slide) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(40, freq + slide),
        ctx.currentTime + dur
      );
    }
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.02);
  }

  coin() {
    this.tone({ freq: 880, dur: 0.08, type: 'triangle', gain: 0.06 });
    this.tone({ freq: 1320, dur: 0.1, type: 'sine', gain: 0.04, slide: 200 });
  }

  jump() {
    this.tone({ freq: 220, dur: 0.14, type: 'square', gain: 0.04, slide: 280 });
  }

  slide() {
    this.tone({ freq: 180, dur: 0.12, type: 'sawtooth', gain: 0.03, slide: -80 });
  }

  lane() {
    this.tone({ freq: 320, dur: 0.06, type: 'triangle', gain: 0.035 });
  }

  crash() {
    this.tone({ freq: 90, dur: 0.35, type: 'sawtooth', gain: 0.09, slide: -50 });
    this.tone({ freq: 55, dur: 0.45, type: 'square', gain: 0.06, slide: -20 });
  }

  start() {
    this.tone({ freq: 392, dur: 0.1, type: 'triangle', gain: 0.05 });
    this.tone({ freq: 523, dur: 0.14, type: 'triangle', gain: 0.045, slide: 40 });
  }
}
