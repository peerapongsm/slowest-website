// The 7-scene state machine for "เว็บที่ช้าที่สุดในประเทศไทย".
// Pure, framework-free, and testable — components drive it with tick()/tap().

export type SceneId = "connecting" | "progress" | "landscape" | "fontload" | "ad" | "stall" | "cert";

export const SCENE_ORDER: SceneId[] = ["connecting", "progress", "landscape", "fontload", "ad", "stall", "cert"];

// Scene timing table (ms). "ad" and "stall" are locked by spec (15s / 30s).
// The rest are tuned so the full journey lands around 3 minutes of forced
// waiting before the reader is free to linger on the cert scene.
export const SCENE_DURATIONS_MS: Record<SceneId, number> = {
  connecting: 20000,
  progress: 45000,
  landscape: 40000,
  fontload: 30000,
  ad: 15000,
  stall: 30000,
  cert: Infinity,
};

export const STALL_SKIP_TAPS = 10;

export interface ScriptState {
  sceneIndex: number;
  elapsedInSceneMs: number;
  stallTaps: number;
  cheated: boolean;
}

export function initialState(): ScriptState {
  return { sceneIndex: 0, elapsedInSceneMs: 0, stallTaps: 0, cheated: false };
}

export function currentScene(state: ScriptState): SceneId {
  return SCENE_ORDER[state.sceneIndex];
}

function advanceScene(state: ScriptState, carryMs: number): ScriptState {
  const nextIndex = Math.min(state.sceneIndex + 1, SCENE_ORDER.length - 1);
  return { ...state, sceneIndex: nextIndex, elapsedInSceneMs: carryMs };
}

/** Advance the clock by deltaMs, rolling over into later scenes as needed. */
export function tick(state: ScriptState, deltaMs: number): ScriptState {
  let next = state;
  let remaining = deltaMs;

  while (remaining > 0) {
    const scene = currentScene(next);
    if (scene === "cert") {
      // Final scene: no auto-advance, extra time is simply discarded.
      return next;
    }
    const duration = SCENE_DURATIONS_MS[scene];
    const elapsed = next.elapsedInSceneMs + remaining;
    if (elapsed < duration) {
      return { ...next, elapsedInSceneMs: elapsed };
    }
    const overflow = elapsed - duration;
    next = advanceScene(next, 0);
    remaining = overflow;
  }

  return next;
}

/** Register a tap. Only meaningful during the "stall" scene's easter egg. */
export function tap(state: ScriptState): ScriptState {
  if (currentScene(state) !== "stall") return state;
  const stallTaps = state.stallTaps + 1;
  if (stallTaps >= STALL_SKIP_TAPS) {
    const skipped = advanceScene({ ...state, stallTaps }, 0);
    return { ...skipped, cheated: true };
  }
  return { ...state, stallTaps };
}

// --- Progress bar choreography (scene 2: runs up, lies, runs back down) ---

interface ProgressKeyframe {
  /** Fraction of the scene's total duration at which this value kicks in. */
  at: number;
  value: number;
  message: string;
}

const PROGRESS_KEYFRAMES: ProgressKeyframe[] = [
  { at: 0, value: 2, message: "กำลังเริ่มต้นการเชื่อมต่อ..." },
  { at: 0.15, value: 38, message: "กำลังปลุกเซิร์ฟเวอร์..." },
  { at: 0.35, value: 87, message: "เกือบเสร็จแล้ว! อีกนิดเดียว..." },
  { at: 0.45, value: 12, message: "เดี๋ยวก่อน เซิร์ฟเวอร์ขอกาแฟก่อน ☕" },
  { at: 0.65, value: 54, message: "โอเค ลองใหม่อีกที..." },
  { at: 0.85, value: 91, message: "ใกล้แล้วจริงๆ นะ (สัญญา)" },
  { at: 1, value: 99, message: "เกือบ 100% แล้ว... เกือบ..." },
];

export interface ProgressState {
  value: number;
  message: string;
}

/** Step function (deliberately jerky, not eased) so the "lie" reads as a jump. */
export function progressState(elapsedMs: number, durationMs: number): ProgressState {
  // Compare in ms (with a 1ms tolerance) rather than as a fraction, so
  // floor()'d millisecond inputs from callers land on the intended keyframe.
  const TOLERANCE_MS = 1;
  let current = PROGRESS_KEYFRAMES[0];
  for (const frame of PROGRESS_KEYFRAMES) {
    if (frame.at * durationMs <= elapsedMs + TOLERANCE_MS) current = frame;
  }
  return { value: current.value, message: current.message };
}

// --- Reload detection (sessionStorage injected for testability) ---

export interface SessionStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const VISITED_KEY = "slowest-website:visited";
const RELOAD_COUNT_KEY = "slowest-website:reloadCount";

/** Call once on mount. Returns the reload count (0 for a fresh session). */
export function registerVisit(storage: SessionStorageLike): number {
  const visited = storage.getItem(VISITED_KEY);
  if (!visited) {
    storage.setItem(VISITED_KEY, "1");
    storage.setItem(RELOAD_COUNT_KEY, "0");
    return 0;
  }
  const count = parseInt(storage.getItem(RELOAD_COUNT_KEY) ?? "0", 10) + 1;
  storage.setItem(RELOAD_COUNT_KEY, String(count));
  return count;
}

export function getReloadCount(storage: SessionStorageLike): number {
  return parseInt(storage.getItem(RELOAD_COUNT_KEY) ?? "0", 10);
}

const RELOAD_TAUNTS: string[] = [
  "เริ่มใหม่นะ ใจเย็นๆ",
  "รีเฟรชแล้วเหรอ... ความช้าเริ่มนับหนึ่งใหม่จ้า",
  "รอบที่ 3 แล้วนะ ยิ่งรีเฟรช ยิ่งช้า (ความจริงคือช้าเท่าเดิม)",
  "คุณรีเฟรชไปหลายครั้งแล้ว เซิร์ฟเวอร์เริ่มจำหน้าคุณได้",
  "ใจร้อนขนาดนี้ ไปเว็บอื่นดีกว่าไหม? (แต่เว็บนี้สนุกกว่านะ)",
  "รีเฟรชอีกแล้ว... ทีมงานขอปรบมือให้ความอดทนที่ไม่มีอยู่จริง",
];

/** Escalating taunt for the reload counter. Clamps at the harshest message. */
export function reloadTaunt(reloadCount: number): string {
  const index = Math.min(Math.max(reloadCount, 0), RELOAD_TAUNTS.length - 1);
  return RELOAD_TAUNTS[index];
}
