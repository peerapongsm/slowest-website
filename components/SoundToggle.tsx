"use client";

interface Props {
  on: boolean;
  onToggle: () => void;
}

export function SoundToggle({ on, onToggle }: Props) {
  return (
    <button type="button" className="btn btn-outline btn-sm" aria-pressed={on} onClick={onToggle}>
      {on ? "🔊 เสียง: เปิด" : "🔇 เสียง: ปิด"}
    </button>
  );
}
