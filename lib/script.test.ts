import { describe, expect, test } from "vitest";
import {
  SCENE_ORDER,
  SCENE_DURATIONS_MS,
  STALL_SKIP_TAPS,
  initialState,
  currentScene,
  tick,
  tap,
  progressState,
  reloadTaunt,
  registerVisit,
  getReloadCount,
  type SessionStorageLike,
} from "./script";

function fakeStorage(): SessionStorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

describe("scene order", () => {
  test("has exactly the 7 scenes in spec order", () => {
    expect(SCENE_ORDER).toEqual([
      "connecting",
      "progress",
      "landscape",
      "fontload",
      "ad",
      "stall",
      "cert",
    ]);
  });

  test("every scene except cert has a finite duration", () => {
    for (const scene of SCENE_ORDER) {
      if (scene === "cert") {
        expect(SCENE_DURATIONS_MS[scene]).toBe(Infinity);
      } else {
        expect(SCENE_DURATIONS_MS[scene]).toBeGreaterThan(0);
        expect(Number.isFinite(SCENE_DURATIONS_MS[scene])).toBe(true);
      }
    }
  });

  test("ad scene is fixed at 15 seconds (unskippable countdown)", () => {
    expect(SCENE_DURATIONS_MS.ad).toBe(15000);
  });

  test("stall scene is fixed at 30 seconds", () => {
    expect(SCENE_DURATIONS_MS.stall).toBe(30000);
  });
});

describe("initial state", () => {
  test("starts on the connecting scene", () => {
    const state = initialState();
    expect(currentScene(state)).toBe("connecting");
    expect(state.elapsedInSceneMs).toBe(0);
    expect(state.stallTaps).toBe(0);
    expect(state.cheated).toBe(false);
  });
});

describe("tick — scene progression", () => {
  test("stays in the same scene before its duration elapses", () => {
    let state = initialState();
    state = tick(state, SCENE_DURATIONS_MS.connecting - 1);
    expect(currentScene(state)).toBe("connecting");
  });

  test("advances to the next scene once duration elapses", () => {
    let state = initialState();
    state = tick(state, SCENE_DURATIONS_MS.connecting);
    expect(currentScene(state)).toBe("progress");
  });

  test("advances through multiple scenes for a large tick (overflow handling)", () => {
    let state = initialState();
    const bigDelta =
      SCENE_DURATIONS_MS.connecting + SCENE_DURATIONS_MS.progress + SCENE_DURATIONS_MS.landscape + 500;
    state = tick(state, bigDelta);
    expect(currentScene(state)).toBe("fontload");
    expect(state.elapsedInSceneMs).toBe(500);
  });

  test("does not advance past the final cert scene", () => {
    let state = initialState();
    const total = SCENE_ORDER.filter((s) => s !== "cert").reduce((sum, s) => sum + SCENE_DURATIONS_MS[s], 0);
    state = tick(state, total + 999999);
    expect(currentScene(state)).toBe("cert");
  });
});

describe("stall skip via taps", () => {
  function stateAtStall(): ReturnType<typeof initialState> {
    let state = initialState();
    const upToStall = SCENE_ORDER.filter((s) => s !== "stall" && s !== "cert").reduce(
      (sum, s) => sum + SCENE_DURATIONS_MS[s],
      0,
    );
    state = tick(state, upToStall);
    expect(currentScene(state)).toBe("stall");
    return state;
  }

  test("tapping fewer than STALL_SKIP_TAPS times does nothing", () => {
    let state = stateAtStall();
    for (let i = 0; i < STALL_SKIP_TAPS - 1; i++) {
      state = tap(state);
    }
    expect(currentScene(state)).toBe("stall");
    expect(state.cheated).toBe(false);
    expect(state.stallTaps).toBe(STALL_SKIP_TAPS - 1);
  });

  test("reaching STALL_SKIP_TAPS taps skips to cert and marks cheated", () => {
    let state = stateAtStall();
    for (let i = 0; i < STALL_SKIP_TAPS; i++) {
      state = tap(state);
    }
    expect(currentScene(state)).toBe("cert");
    expect(state.cheated).toBe(true);
  });

  test("tapping outside the stall scene does nothing", () => {
    let state = initialState();
    state = tap(state);
    expect(currentScene(state)).toBe("connecting");
    expect(state.stallTaps).toBe(0);
  });

  test("STALL_SKIP_TAPS is exactly 10 per spec", () => {
    expect(STALL_SKIP_TAPS).toBe(10);
  });
});

describe("progress bar choreography", () => {
  test("climbs to 87% then falls back to 12% (the lie)", () => {
    const duration = SCENE_DURATIONS_MS.progress;
    const early = progressState(Math.floor(duration * 0.35), duration);
    const later = progressState(Math.floor(duration * 0.45), duration);
    expect(early.value).toBe(87);
    expect(later.value).toBe(12);
    expect(later.value).toBeLessThan(early.value);
  });

  test("starts near zero and ends near (but not at) 100", () => {
    const duration = SCENE_DURATIONS_MS.progress;
    const start = progressState(0, duration);
    const end = progressState(duration, duration);
    expect(start.value).toBeLessThan(10);
    expect(end.value).toBeGreaterThanOrEqual(90);
    expect(end.value).toBeLessThan(100);
  });

  test("each keyframe carries a status message", () => {
    const duration = SCENE_DURATIONS_MS.progress;
    const state = progressState(0, duration);
    expect(state.message.length).toBeGreaterThan(0);
  });
});

describe("reload counter (sessionStorage-injected)", () => {
  test("first visit is not counted as a reload", () => {
    const storage = fakeStorage();
    const count = registerVisit(storage);
    expect(count).toBe(0);
    expect(getReloadCount(storage)).toBe(0);
  });

  test("second registerVisit call (simulating a mid-journey refresh) increments the count", () => {
    const storage = fakeStorage();
    registerVisit(storage);
    const count = registerVisit(storage);
    expect(count).toBe(1);
  });

  test("repeated reloads keep incrementing", () => {
    const storage = fakeStorage();
    registerVisit(storage);
    registerVisit(storage);
    registerVisit(storage);
    const count = registerVisit(storage);
    expect(count).toBe(3);
  });
});

describe("reload taunt escalation", () => {
  test("returns a non-empty message for zero reloads", () => {
    expect(reloadTaunt(0).length).toBeGreaterThan(0);
  });

  test("escalates to a different message for more reloads", () => {
    expect(reloadTaunt(0)).not.toBe(reloadTaunt(5));
  });

  test("clamps gracefully for very large reload counts", () => {
    expect(() => reloadTaunt(999)).not.toThrow();
    expect(reloadTaunt(999).length).toBeGreaterThan(0);
  });
});
