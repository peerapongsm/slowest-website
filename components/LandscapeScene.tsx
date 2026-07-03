"use client";

import { TitlebarButtons } from "@/components/TitlebarButtons";

const ROWS = 16;
const VIEW_W = 380;
const VIEW_H = 200;
const ROW_H = VIEW_H / ROWS;

/** Classic 4-pass GIF-style interlace order (coarse-to-fine row reveal). */
function interlaceOrder(n: number): number[] {
  const passes = [
    { start: 0, step: 8 },
    { start: 4, step: 8 },
    { start: 2, step: 4 },
    { start: 1, step: 2 },
  ];
  const order: number[] = [];
  const seen = new Set<number>();
  for (const p of passes) {
    for (let row = p.start; row < n; row += p.step) {
      if (!seen.has(row)) {
        seen.add(row);
        order.push(row);
      }
    }
  }
  for (let row = 0; row < n; row++) {
    if (!seen.has(row)) order.push(row);
  }
  return order;
}

const REVEAL_ORDER = interlaceOrder(ROWS);

interface Props {
  elapsedMs: number;
  durationMs: number;
}

export function LandscapeScene({ elapsedMs, durationMs }: Props) {
  const fraction = Math.min(1, durationMs > 0 ? elapsedMs / durationMs : 1);
  const revealedCount = Math.floor(fraction * ROWS);
  const revealed = new Set(REVEAL_ORDER.slice(0, revealedCount));

  return (
    <div className="scene-card">
      <div className="scene-titlebar">
        <span className="scene-titlebar-text">
          <span>ฉากที่ 3 / 7</span>
          <span className="scene-titlebar-file">thai_landscape.jpg (interlaced)</span>
        </span>
        <TitlebarButtons />
      </div>
      <div className="scene-body">
        <div className="landscape-wrap">
          <svg
            className="landscape-svg"
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            role="img"
            aria-label="ทิวทัศน์ไทยกำลังโหลดทีละแถวแบบ interlaced"
          >
            {/* --- full artwork, drawn once underneath --- */}
            <rect x={0} y={0} width={VIEW_W} height={VIEW_H} fill="#0f1a2b" />
            <defs>
              <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2a2f6b" />
                <stop offset="60%" stopColor="#e5804a" />
                <stop offset="100%" stopColor="#ffce8a" />
              </linearGradient>
            </defs>
            <rect x={0} y={0} width={VIEW_W} height={128} fill="url(#sky)" />
            <circle cx={296} cy={62} r={26} fill="#fff3c8" />
            <path d="M0,128 L60,80 L110,128 Z" fill="#3a2e55" />
            <path d="M70,128 L150,60 L230,128 Z" fill="#2c2348" />
            <path d="M180,128 L260,90 L340,128 Z" fill="#3a2e55" />
            <rect x={0} y={128} width={VIEW_W} height={VIEW_H - 128} fill="#274a2e" />
            {Array.from({ length: 6 }).map((_, i) => (
              <rect key={i} x={0} y={132 + i * 11} width={VIEW_W} height={5} fill={i % 2 === 0 ? "#356b3d" : "#1f3d24"} />
            ))}
            <g transform="translate(30,96)">
              <rect x={-2} y={0} width={4} height={34} fill="#4a3520" />
              <path d="M0,0 C-16,-6 -24,-16 -26,-26 C-14,-20 -4,-12 0,0 Z" fill="#2f6b3a" />
              <path d="M0,0 C16,-6 24,-16 26,-26 C14,-20 4,-12 0,0 Z" fill="#2f6b3a" />
              <path d="M0,0 C-4,-14 -2,-24 0,-32 C2,-24 4,-14 0,0 Z" fill="#3d7d47" />
            </g>

            {/* --- interlace placeholder rows, removed as they "load" --- */}
            {Array.from({ length: ROWS }).map((_, row) => {
              if (revealed.has(row)) return null;
              const isSky = row * ROW_H < 128;
              return (
                <rect
                  key={row}
                  x={0}
                  y={row * ROW_H}
                  width={VIEW_W}
                  height={ROW_H}
                  fill={isSky ? "#141a2e" : "#141d16"}
                />
              );
            })}
          </svg>
        </div>
      </div>
      <div className="scene-footer">
        โหลดแบบ interlace ยุค 90 · {revealedCount}/{ROWS} แถว
      </div>
    </div>
  );
}
