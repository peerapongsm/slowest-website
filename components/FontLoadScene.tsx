"use client";

const SENTENCE = "ระบบกำลังโหลดฟอนต์ไทยที่ถูกต้อง กรุณารอสักครู่ (อีกสักครู่ อีกนิดเดียว จริงๆ)";
const WORDS = SENTENCE.split(" ");

function tofu(word: string): string {
  return Array.from(word)
    .map((ch) => (ch === " " ? " " : "▯"))
    .join("");
}

interface Props {
  elapsedMs: number;
  durationMs: number;
}

export function FontLoadScene({ elapsedMs, durationMs }: Props) {
  const fraction = Math.min(1, durationMs > 0 ? elapsedMs / durationMs : 1);
  const wordsRevealed = Math.floor(fraction * WORDS.length);

  const rendered = WORDS.map((word, i) => (i < wordsRevealed ? word : tofu(word))).join(" ");

  return (
    <div className="scene-card">
      <div className="scene-titlebar">
        <span>ฉากที่ 4 / 7</span>
        <span>font-loader.woff2</span>
      </div>
      <div className="scene-body">
        <p className="tofu-text">{rendered}</p>
      </div>
      <div className="scene-footer">
        คำที่โหลดแล้ว {wordsRevealed}/{WORDS.length}
      </div>
    </div>
  );
}
