"use client";

import { useRef } from "react";
import { composeCertificate } from "@/lib/cert";
import type { LocalStats } from "@/lib/stats";
import { TitlebarButtons } from "@/components/TitlebarButtons";

interface Props {
  totalElapsedMs: number;
  reachedAt: Date;
  cheated: boolean;
  stats: LocalStats;
}

function drawCertificate(canvas: HTMLCanvasElement, data: ReturnType<typeof composeCertificate>) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = 900;
  const H = 640;
  canvas.width = W;
  canvas.height = H;

  const parchment = ctx.createRadialGradient(W * 0.3, H * 0.2, 40, W * 0.5, H * 0.5, W * 0.7);
  parchment.addColorStop(0, "#f7ecc8");
  parchment.addColorStop(0.55, "#ecd9a0");
  parchment.addColorStop(1, "#dfc384");
  ctx.fillStyle = parchment;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "#8a5a1c";
  ctx.lineWidth = 10;
  ctx.strokeRect(24, 24, W - 48, H - 48);
  ctx.strokeStyle = "#f7ecc8";
  ctx.lineWidth = 3;
  ctx.strokeRect(38, 38, W - 76, H - 76);
  ctx.strokeStyle = "#8a5a1c";
  ctx.lineWidth = 2;
  ctx.strokeRect(46, 46, W - 92, H - 92);

  const thaiFont = (weight: string, size: number) =>
    `${weight} ${size}px "Noto Sans Thai", "Sarabun", "Leelawadee UI", "Tahoma", sans-serif`;

  ctx.fillStyle = "#7a3a12";
  ctx.textAlign = "center";
  ctx.font = thaiFont("800", 40);
  ctx.fillText("เว็บที่ช้าที่สุดในประเทศไทย", W / 2, 130);

  ctx.fillStyle = "#4a3418";
  ctx.font = thaiFont("700", 30);
  ctx.fillText(data.title, W / 2, 200);

  ctx.font = thaiFont("500", 24);
  wrapText(ctx, data.bodyLine, W / 2, 300, W - 160, 36);

  ctx.fillStyle = "#7a3a12";
  ctx.font = thaiFont("600", 20);
  wrapText(ctx, data.stamp, W / 2, 440, W - 160, 30);

  // gold seal
  const sealX = W / 2;
  const sealY = H - 150;
  const seal = ctx.createRadialGradient(sealX - 15, sealY - 15, 4, sealX, sealY, 44);
  seal.addColorStop(0, "#fff3c0");
  seal.addColorStop(0.55, "#d9a53a");
  seal.addColorStop(1, "#8a5a1c");
  ctx.fillStyle = seal;
  ctx.beginPath();
  ctx.arc(sealX, sealY, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#8a5a1c";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#5a3a0c";
  ctx.font = thaiFont("800", 13);
  ctx.fillText("ผู้อดทน", sealX, sealY - 2);
  ctx.font = thaiFont("700", 11);
  ctx.fillText("ที่สุด", sealX, sealY + 14);

  ctx.fillStyle = "#6b5a3a";
  ctx.font = thaiFont("400", 16);
  ctx.fillText("ทุกความช้าในเว็บนี้เกิดขึ้นในเครื่องคุณเท่านั้น — อ่านคำสารภาพได้ที่ /method", W / 2, H - 60);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let cursorY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cursorY);
}

export function CertScene({ totalElapsedMs, reachedAt, cheated, stats }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cert = composeCertificate(totalElapsedMs, reachedAt, cheated);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawCertificate(canvas, cert);
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = "ใบประกาศความอดทน.png";
    link.click();
  };

  return (
    <div className="scene-card">
      <div className="scene-titlebar">
        <span className="scene-titlebar-text">
          <span>ฉากที่ 7 / 7</span>
          <span className="scene-titlebar-file">คุณมาถึงแล้ว</span>
        </span>
        <TitlebarButtons />
      </div>
      <div className="scene-body">
        <p className="cert-sentence">นี่คือเว็บที่ช้าที่สุดในประเทศไทย และคุณเพิ่งพิสูจน์ว่าคุณอดทนกว่ามันได้</p>

        <div className="cert-preview">
          <h3>{cert.title}</h3>
          <p>{cert.bodyLine}</p>
          <p className="cert-stamp">{cert.stamp}</p>
          <div className="cert-seal" aria-hidden="true">
            ผู้อดทน
            <br />
            ที่สุด
          </div>
        </div>

        <button type="button" className="btn btn-primary" onClick={handleDownload}>
          ดาวน์โหลดใบประกาศ (PNG)
        </button>

        <canvas ref={canvasRef} style={{ display: "none" }} />

        <div className="stats-panel">
          <p>
            คุณคือผู้พิชิตคนที่ {stats.certCount} จากผู้ใช้ทั้งหมด 1 คนบนเครื่องนี้ 😅
          </p>
          <p>เวลารอสะสมทั้งหมดบนเครื่องนี้: {Math.round(stats.totalWaitMs / 1000)} วินาที</p>
        </div>
      </div>
      <div className="scene-footer">อยากรู้ว่าเราโกหกยังไงบ้าง? อ่านคำสารภาพได้ที่หน้า /method</div>
    </div>
  );
}
