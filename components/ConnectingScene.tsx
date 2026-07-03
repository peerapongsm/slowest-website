"use client";

import { TitlebarButtons } from "@/components/TitlebarButtons";

const LINES = [
  "กำลังเชื่อมต่อ...",
  "*กดดดดด กรี๊ดดดด แชะ แชะ ตื่ดดดดด*",
  "ปิงไปที่เซิร์ฟเวอร์... 1 ครั้ง... 2 ครั้ง... 3 ครั้ง...",
  "เซิร์ฟเวอร์รับสายแล้ว (คิดว่านะ)",
  "กำลังดาวน์โหลดอินเทอร์เน็ตทั้งหมดลงเครื่องคุณ...",
];

const FULL_TEXT = LINES.join("\n");

interface Props {
  elapsedMs: number;
  durationMs: number;
}

export function ConnectingScene({ elapsedMs, durationMs }: Props) {
  const fraction = Math.min(1, durationMs > 0 ? elapsedMs / durationMs : 1);
  const charsShown = Math.floor(fraction * FULL_TEXT.length);
  const shown = FULL_TEXT.slice(0, charsShown);

  return (
    <div className="scene-card">
      <div className="scene-titlebar">
        <span className="scene-titlebar-text">
          <span>ฉากที่ 1 / 7</span>
          <span className="scene-titlebar-file">connect.exe</span>
        </span>
        <TitlebarButtons />
      </div>
      <div className="scene-body connecting-body">
        <p className="connecting-lines">
          {shown}
          <span className="connecting-cursor">&nbsp;</span>
        </p>
      </div>
      <div className="scene-footer">โมเด็ม 56k จำลอง เพื่อความคิดถึง (และความรำคาญ)</div>
    </div>
  );
}
