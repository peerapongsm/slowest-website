"use client";

const MICRO_HINTS = [
  "",
  "เอ๊ะ?",
  "ทำอะไรน่ะ",
  "...",
  "รู้สึกอะไรไหม",
  "ลองอีกที",
  "ใกล้แล้วมั้ง",
  "จริงจังแล้วนะ",
  "อีกนิดเดียว",
  "สุดท้ายแล้ว!",
];

interface Props {
  stallTaps: number;
  onTap: () => void;
}

export function StallScene({ stallTaps, onTap }: Props) {
  const hint = MICRO_HINTS[Math.min(stallTaps, MICRO_HINTS.length - 1)];

  return (
    <div className="scene-card">
      <div className="scene-titlebar">
        <span>ฉากที่ 6 / 7</span>
        <span>almost-done.exe (ค้าง)</span>
      </div>
      <div className="scene-body">
        <div className="stall-zone" onClick={onTap} role="button" tabIndex={0}>
          <span className="stall-spin">⏳</span>
          <div className="stall-pct">99%</div>
          <p>เกือบเสร็จแล้ว... รอสักครู่นะ</p>
          <p className="stall-hint">{hint}</p>
        </div>
      </div>
      <div className="scene-footer">ค้างไว้แบบนี้แหละ คือศิลปะ</div>
    </div>
  );
}
