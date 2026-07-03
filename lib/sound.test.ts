import { describe, expect, test } from "vitest";
import { progressBlipKind, getSoundPref, setSoundPref, type StorageLike } from "./sound";

function fakeStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

describe("progressBlipKind", () => {
  test("rising value blips up", () => {
    expect(progressBlipKind(38, 87)).toBe("up");
  });

  test("falling value (the lie) blips down", () => {
    expect(progressBlipKind(87, 12)).toBe("down");
  });

  test("no change means no blip", () => {
    expect(progressBlipKind(54, 54)).toBeNull();
  });
});

describe("sound preference", () => {
  test("defaults to off (no surprise audio)", () => {
    expect(getSoundPref(fakeStorage())).toBe(false);
  });

  test("round-trips on", () => {
    const storage = fakeStorage();
    setSoundPref(storage, true);
    expect(getSoundPref(storage)).toBe(true);
  });

  test("round-trips back off", () => {
    const storage = fakeStorage();
    setSoundPref(storage, true);
    setSoundPref(storage, false);
    expect(getSoundPref(storage)).toBe(false);
  });
});
