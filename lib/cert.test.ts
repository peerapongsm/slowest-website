import { describe, expect, test } from "vitest";
import { formatElapsed, formatThaiDate, composeCertificate } from "./cert";

describe("formatElapsed", () => {
  test("formats zero as 0:00", () => {
    expect(formatElapsed(0)).toBe("0:00");
  });

  test("formats sub-minute durations", () => {
    expect(formatElapsed(5000)).toBe("0:05");
  });

  test("pads seconds under 10", () => {
    expect(formatElapsed(65000)).toBe("1:05");
  });

  test("formats multi-minute durations", () => {
    expect(formatElapsed(185000)).toBe("3:05");
  });

  test("rounds down partial seconds", () => {
    expect(formatElapsed(65999)).toBe("1:05");
  });

  test("handles durations over an hour with hour:minute:second", () => {
    expect(formatElapsed(3661000)).toBe("1:01:01");
  });
});

describe("formatThaiDate", () => {
  test("formats a known date in Buddhist Era with Thai month name", () => {
    const date = new Date(2026, 6, 3); // 3 กรกฎาคม 2026 (month index 6 = July)
    expect(formatThaiDate(date)).toBe("3 กรกฎาคม 2569");
  });

  test("formats another month correctly", () => {
    const date = new Date(2025, 0, 15); // 15 มกราคม 2025
    expect(formatThaiDate(date)).toBe("15 มกราคม 2568");
  });
});

describe("composeCertificate", () => {
  test("honorable variant when not cheated", () => {
    const date = new Date(2026, 6, 3);
    const cert = composeCertificate(185000, date, false);
    expect(cert.elapsedLabel).toBe("3:05");
    expect(cert.dateLabel).toBe("3 กรกฎาคม 2569");
    expect(cert.bodyLine).toContain("3:05");
    expect(cert.bodyLine).toContain("3 กรกฎาคม 2569");
    expect(cert.stamp).not.toContain("ขี้โกง");
  });

  test("cheat stamp variant when the stall was skipped via taps", () => {
    const date = new Date(2026, 6, 3);
    const cert = composeCertificate(90000, date, true);
    expect(cert.stamp).toContain("ขี้โกง");
    expect(cert.title).not.toBe(composeCertificate(90000, date, false).title);
  });
});
