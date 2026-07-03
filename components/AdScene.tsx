"use client";

import { TitlebarButtons } from "@/components/TitlebarButtons";

interface Props {
  elapsedMs: number;
  durationMs: number;
}

export function AdScene({ elapsedMs, durationMs }: Props) {
  const remainingSec = Math.max(0, Math.ceil((durationMs - elapsedMs) / 1000));
  const canProceed = remainingSec <= 0;

  return (
    <div className="scene-card">
      <div className="scene-titlebar">
        <span className="scene-titlebar-text">
          <span>ฉากที่ 5 / 7</span>
          <span className="scene-titlebar-file">ad-server (จำลอง)</span>
        </span>
        <TitlebarButtons />
      </div>
      <div className="scene-body">
        <div className="ad-card">
          <div className="ad-card-inner">
            <div className="ad-label">โฆษณา</div>
            <div className="ad-headline">🏛️ Armory — คลังโปรเจกต์ทั้งหมดของเรา</div>
            <p className="ad-body">
              เบื่อเว็บช้าเว็บนี้ยัง? ไปดูโปรเจกต์อื่นที่เร็วกว่านี้ (ไม่มากก็น้อย) ได้ที่ Armory —
              ใช่แล้ว นี่คือโฆษณาที่โปรโมตตัวเราเอง ตลกซ้อนตลก
            </p>
            <a
              href="https://peerapongsm.github.io/armory/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              ดู Armory ทั้งหมด →
            </a>
            <p className="ad-countdown">
              {canProceed ? "ข้ามโฆษณาได้แล้ว..." : `ข้ามโฆษณาได้ในอีก ${remainingSec} วินาที`}
            </p>
          </div>
        </div>
      </div>
      <div className="scene-footer">ปิดไม่ได้จนกว่าจะครบ 15 วิ (ล้อ UX ยุคนี้)</div>
    </div>
  );
}
