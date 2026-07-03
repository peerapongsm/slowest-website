"use client";

import { reloadTaunt } from "@/lib/script";

interface Props {
  reloadCount: number;
}

export function ReloadBanner({ reloadCount }: Props) {
  if (reloadCount <= 0) return null;

  return (
    <div className="reload-banner">
      <p>
        คุณรีเฟรชไปแล้ว {reloadCount} ครั้ง — {reloadTaunt(reloadCount)}
      </p>
    </div>
  );
}
