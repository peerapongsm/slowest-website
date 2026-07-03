"use client";

import { progressState } from "@/lib/script";

interface Props {
  elapsedMs: number;
  durationMs: number;
}

export function ProgressScene({ elapsedMs, durationMs }: Props) {
  const { value, message } = progressState(elapsedMs, durationMs);

  return (
    <div className="scene-card">
      <div className="scene-titlebar">
        <span>ฉากที่ 2 / 7</span>
        <span>loading.dll</span>
      </div>
      <div className="scene-body">
        <div className="progress-pct">{value}%</div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${value}%` }} />
        </div>
        <p className="progress-message">{message}</p>
      </div>
      <div className="scene-footer">แถบนี้ไม่โกหกหรอกนะ (โกหก)</div>
    </div>
  );
}
