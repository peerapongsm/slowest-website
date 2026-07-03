"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  initialState,
  currentScene,
  tick,
  tap as tapScene,
  registerVisit,
  SCENE_DURATIONS_MS,
  SCENE_ORDER,
  type ScriptState,
} from "@/lib/script";
import { getStats, recordCertReached, type LocalStats } from "@/lib/stats";
import { ConnectingScene } from "@/components/ConnectingScene";
import { ProgressScene } from "@/components/ProgressScene";
import { LandscapeScene } from "@/components/LandscapeScene";
import { FontLoadScene } from "@/components/FontLoadScene";
import { AdScene } from "@/components/AdScene";
import { StallScene } from "@/components/StallScene";
import { CertScene } from "@/components/CertScene";
import { ReloadBanner } from "@/components/ReloadBanner";

declare global {
  interface Window {
    umami?: { track: (eventName: string, data?: Record<string, unknown>) => void };
  }
}

interface CertResult {
  elapsedMs: number;
  date: Date;
}

export default function Home() {
  const [scriptState, setScriptState] = useState<ScriptState>(initialState());
  const [reloadCount, setReloadCount] = useState(0);
  const [certResult, setCertResult] = useState<CertResult | null>(null);
  const [stats, setStats] = useState<LocalStats>({ certCount: 0, totalWaitMs: 0 });

  const totalElapsedRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const certRecordedRef = useRef(false);

  useEffect(() => {
    setReloadCount(registerVisit(window.sessionStorage));
    setStats(getStats(window.localStorage));
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      const now = performance.now();
      const last = lastTimeRef.current ?? now;
      const delta = now - last;
      lastTimeRef.current = now;
      totalElapsedRef.current += delta;
      setScriptState((s) => tick(s, delta));
    }, 200);
    return () => window.clearInterval(id);
  }, []);

  const scene = currentScene(scriptState);

  useEffect(() => {
    if (scene === "cert" && !certRecordedRef.current) {
      certRecordedRef.current = true;
      const elapsedMs = totalElapsedRef.current;
      const date = new Date();
      setCertResult({ elapsedMs, date });
      const nextStats = recordCertReached(window.localStorage, elapsedMs);
      setStats(nextStats);
      if (typeof window !== "undefined" && window.umami) {
        window.umami.track("reached-certificate", {
          cheated: scriptState.cheated,
          elapsedMs: Math.round(elapsedMs),
        });
      }
    }
  }, [scene, scriptState.cheated]);

  const handleTap = () => setScriptState((s) => tapScene(s));
  const sceneNumber = SCENE_ORDER.indexOf(scene) + 1;

  return (
    <main>
      <Header />
      <ReloadBanner reloadCount={reloadCount} />

      {scene === "connecting" && (
        <ConnectingScene elapsedMs={scriptState.elapsedInSceneMs} durationMs={SCENE_DURATIONS_MS.connecting} />
      )}
      {scene === "progress" && (
        <ProgressScene elapsedMs={scriptState.elapsedInSceneMs} durationMs={SCENE_DURATIONS_MS.progress} />
      )}
      {scene === "landscape" && (
        <LandscapeScene elapsedMs={scriptState.elapsedInSceneMs} durationMs={SCENE_DURATIONS_MS.landscape} />
      )}
      {scene === "fontload" && (
        <FontLoadScene elapsedMs={scriptState.elapsedInSceneMs} durationMs={SCENE_DURATIONS_MS.fontload} />
      )}
      {scene === "ad" && <AdScene elapsedMs={scriptState.elapsedInSceneMs} durationMs={SCENE_DURATIONS_MS.ad} />}
      {scene === "stall" && <StallScene stallTaps={scriptState.stallTaps} onTap={handleTap} />}
      {scene === "cert" && certResult && (
        <CertScene
          totalElapsedMs={certResult.elapsedMs}
          reachedAt={certResult.date}
          cheated={scriptState.cheated}
          stats={stats}
        />
      )}

      <p className="scene-footer">ฉากที่ {sceneNumber} จาก 7</p>

      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="app-header">
      <h1>🐢 เว็บที่ช้าที่สุดในประเทศไทย</h1>
      <p>อินเทอร์เน็ตเร็วขึ้นทุกปี เว็บนี้ขอสวนกระแส</p>
      <div className="nav-buttons">
        <Link href="/method/" className="btn btn-outline btn-sm">
          คำสารภาพ (/method)
        </Link>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="app-footer">
      <p>เว็บที่ช้าที่สุดในประเทศไทย · client-side theater ล้วนๆ ไม่มีอะไรช้าจริง</p>
    </footer>
  );
}
