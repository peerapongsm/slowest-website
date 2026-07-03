// Local-only stats (localStorage). Honesty joke: this device only ever knows
// about itself, so the panel says so out loud instead of pretending to be global.

const STATS_KEY = "slowest-website:stats";

export interface LocalStats {
  certCount: number;
  totalWaitMs: number;
}

function readStats(storage: Storage): LocalStats {
  try {
    const raw = storage.getItem(STATS_KEY);
    if (!raw) return { certCount: 0, totalWaitMs: 0 };
    const parsed = JSON.parse(raw) as Partial<LocalStats>;
    return {
      certCount: Number(parsed.certCount) || 0,
      totalWaitMs: Number(parsed.totalWaitMs) || 0,
    };
  } catch {
    return { certCount: 0, totalWaitMs: 0 };
  }
}

export function getStats(storage: Storage): LocalStats {
  return readStats(storage);
}

export function recordCertReached(storage: Storage, elapsedMs: number): LocalStats {
  const stats = readStats(storage);
  const next: LocalStats = {
    certCount: stats.certCount + 1,
    totalWaitMs: stats.totalWaitMs + elapsedMs,
  };
  storage.setItem(STATS_KEY, JSON.stringify(next));
  return next;
}
