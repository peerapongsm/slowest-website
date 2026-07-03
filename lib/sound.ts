// Web Audio synth for the 7-scene journey — zero audio assets, everything is
// oscillators + filtered noise, in keeping with the 56k-modem parody.
// Pure helpers up top are unit-tested; the SoundEngine needs a real
// AudioContext (jsdom has none) so it is verified live in the browser.

import type { SceneId } from "./script";

export type BlipKind = "up" | "down";

/** Which blip (if any) a progress keyframe change should make. */
export function progressBlipKind(prev: number, next: number): BlipKind | null {
  if (next === prev) return null;
  return next > prev ? "up" : "down";
}

// --- sound preference (storage injected for testability, same idiom as script.ts) ---

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const SOUND_PREF_KEY = "slowest-website:sound:v1";

/** Default is off — no surprise audio. */
export function getSoundPref(storage: StorageLike): boolean {
  return storage.getItem(SOUND_PREF_KEY) === "on";
}

export function setSoundPref(storage: StorageLike, on: boolean): void {
  storage.setItem(SOUND_PREF_KEY, on ? "on" : "off");
}

// --- synth data ---

const MASTER_GAIN = 0.15;

const DTMF_PAIRS: [number, number][] = [
  [697, 1209],
  [770, 1336],
  [852, 1477],
  [697, 1336],
  [941, 1336],
  [770, 1209],
];

// Cheesy ad jingle, square-wave: C5 E5 G5 C6 / G5 E5 G5 C6.
const JINGLE_NOTES = [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 783.99, 1046.5];
const JINGLE_STEP_S = 0.16;

// Triumphant arpeggio for the certificate: C5 E5 G5 C6.
const FANFARE_NOTES = [523.25, 659.25, 783.99, 1046.5];

interface ToneOpts {
  freq: number;
  type?: OscillatorType;
  t0: number;
  dur: number;
  peak?: number;
  glideTo?: number;
}

interface NoiseOpts {
  t0: number;
  dur: number;
  peak?: number;
  filterFreq?: number;
  filterType?: BiquadFilterType;
}

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private cleanups: (() => void)[] = [];
  private scene: SceneId | null = null;
  private enabled = false;

  /** Create/resume the AudioContext. Must be called from a user gesture. */
  enable(): void {
    if (typeof window === "undefined" || !("AudioContext" in window)) return;
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = MASTER_GAIN;
      this.master.connect(this.ctx.destination);
      this.noise = makeNoiseBuffer(this.ctx);
    }
    void this.ctx.resume();
    this.enabled = true;
    this.playScene();
  }

  disable(): void {
    this.enabled = false;
    this.stopAll();
    if (this.ctx) void this.ctx.suspend();
  }

  /** Remembers the scene even while disabled, so enable() can pick it up. */
  setScene(scene: SceneId): void {
    if (scene === this.scene) return;
    this.scene = scene;
    if (this.enabled) this.playScene();
  }

  /** Scene 2: keyframe jumped. Up = happy blips, down (the lie) = sad gliss. */
  progressBlip(kind: BlipKind): void {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    if (kind === "up") {
      this.tone({ freq: 660, type: "square", t0: t, dur: 0.08, peak: 0.1 });
      this.tone({ freq: 880, type: "square", t0: t + 0.09, dur: 0.1, peak: 0.1 });
    } else {
      this.tone({ freq: 620, type: "sawtooth", t0: t, dur: 0.7, peak: 0.12, glideTo: 140 });
    }
  }

  /** Scene 6 easter egg: pitch climbs with each tap toward the skip. */
  tapBlip(count: number): void {
    if (!this.enabled || !this.ctx) return;
    this.tone({ freq: 380 + count * 70, type: "square", t0: this.ctx.currentTime, dur: 0.09, peak: 0.12 });
  }

  // --- internals ---

  // Record<SceneId, ...> makes tsc enforce that every scene has a recipe.
  private recipes: Record<SceneId, () => void> = {
    connecting: () => this.playConnecting(),
    progress: () => {}, // blips are event-driven via progressBlip()
    landscape: () => this.playCrackle(),
    fontload: () => this.playTypewriter(),
    ad: () => this.playJingle(),
    stall: () => this.playStallTicks(),
    cert: () => this.playFanfare(),
  };

  private playScene(): void {
    this.stopAll();
    if (!this.enabled || !this.ctx || !this.scene) return;
    this.recipes[this.scene]();
  }

  private stopAll(): void {
    for (const stop of this.cleanups) stop();
    this.cleanups = [];
  }

  private every(ms: number, fn: () => void): void {
    const id = window.setInterval(fn, ms);
    this.cleanups.push(() => window.clearInterval(id));
  }

  /** Self-stopping oscillator with a quick attack/decay envelope. */
  private tone(opts: ToneOpts): void {
    if (!this.ctx || !this.master) return;
    const { freq, type = "sine", t0, dur, peak = 0.12, glideTo } = opts;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  /** Self-stopping filtered-noise burst. */
  private noiseBurst(opts: NoiseOpts): void {
    if (!this.ctx || !this.master || !this.noise) return;
    const { t0, dur, peak = 0.08, filterFreq = 2000, filterType = "bandpass" } = opts;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  /** Continuous filtered hiss until the scene changes (registered for cleanup). */
  private loopingNoise(opts: { peak: number; filterFreq: number; startDelay?: number }): void {
    if (!this.ctx || !this.master || !this.noise) return;
    const { peak, filterFreq, startDelay = 0 } = opts;
    const t0 = this.ctx.currentTime + startDelay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + 1);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(t0);
    this.cleanups.push(() => {
      try {
        src.stop();
      } catch {
        // already stopped
      }
    });
  }

  /** Scene 1: dial tone → DTMF digits → carrier warble → static → settle to hiss. */
  private playConnecting(): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone({ freq: 350, t0: t, dur: 1.1, peak: 0.07 });
    this.tone({ freq: 440, t0: t, dur: 1.1, peak: 0.07 });
    DTMF_PAIRS.forEach(([lo, hi], i) => {
      const d0 = t + 1.4 + i * 0.22;
      this.tone({ freq: lo, t0: d0, dur: 0.13, peak: 0.06 });
      this.tone({ freq: hi, t0: d0, dur: 0.13, peak: 0.06 });
    });
    for (let i = 0; i < 6; i++) {
      this.tone({ freq: i % 2 ? 1080 : 1750, type: "sawtooth", t0: t + 3.2 + i * 0.35, dur: 0.3, peak: 0.05 });
    }
    this.tone({ freq: 2250, type: "square", t0: t + 5.6, dur: 0.35, peak: 0.05 });
    this.tone({ freq: 2250, type: "square", t0: t + 6.1, dur: 0.35, peak: 0.05 });
    this.noiseBurst({ t0: t + 6.8, dur: 0.8, peak: 0.07, filterFreq: 1800 });
    this.noiseBurst({ t0: t + 7.8, dur: 0.6, peak: 0.07, filterFreq: 900 });
    this.loopingNoise({ peak: 0.02, filterFreq: 3000, startDelay: 8.6 });
  }

  /** Scene 3: quiet modem-data crackle while the landscape "downloads". */
  private playCrackle(): void {
    this.every(700, () => {
      if (!this.ctx || Math.random() > 0.6) return;
      this.noiseBurst({
        t0: this.ctx.currentTime,
        dur: 0.03 + Math.random() * 0.04,
        peak: 0.05,
        filterFreq: 800 + Math.random() * 1800,
      });
    });
  }

  /** Scene 4: typewriter ticks with an occasional ding. */
  private playTypewriter(): void {
    let count = 0;
    this.every(800, () => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      this.noiseBurst({ t0: t, dur: 0.02, peak: 0.09, filterFreq: 2500, filterType: "highpass" });
      this.tone({ freq: 1400, type: "square", t0: t, dur: 0.02, peak: 0.04 });
      count += 1;
      if (count % 5 === 0) this.tone({ freq: 1318.5, t0: t + 0.05, dur: 0.5, peak: 0.05 });
    });
  }

  /** Scene 5: looping ad jingle. */
  private playJingle(): void {
    const playOnce = () => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      JINGLE_NOTES.forEach((freq, i) => {
        this.tone({ freq, type: "square", t0: t + i * JINGLE_STEP_S, dur: 0.14, peak: 0.06 });
      });
    };
    playOnce();
    this.every(JINGLE_NOTES.length * JINGLE_STEP_S * 1000 + 500, playOnce);
  }

  /** Scene 6: slow clock tick while stuck at 99%. */
  private playStallTicks(): void {
    this.every(2000, () => {
      if (!this.ctx) return;
      this.tone({ freq: 700, t0: this.ctx.currentTime, dur: 0.06, peak: 0.08 });
    });
  }

  /** Scene 7: one-shot fanfare, then silence for the certificate. */
  private playFanfare(): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    FANFARE_NOTES.forEach((freq, i) => {
      this.tone({ freq, type: "triangle", t0: t + i * 0.13, dur: 0.4, peak: 0.1 });
    });
    [523.25, 659.25, 783.99].forEach((freq) => {
      this.tone({ freq, type: "triangle", t0: t + 0.65, dur: 1.1, peak: 0.07 });
    });
  }
}

function makeNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}
