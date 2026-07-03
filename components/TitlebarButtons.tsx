"use client";

/** Purely decorative fake window-chrome buttons (minimize/maximize/close). Do nothing on click. */
export function TitlebarButtons() {
  return (
    <span className="titlebar-buttons" aria-hidden="true">
      <span className="titlebar-btn">_</span>
      <span className="titlebar-btn">▢</span>
      <span className="titlebar-btn">×</span>
    </span>
  );
}
