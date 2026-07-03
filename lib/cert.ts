// Certificate text composition for the final scene: elapsed-time formatting,
// Thai (Buddhist Era) date formatting, and the honorable/cheat stamp rule.

/** "M:SS" for under an hour, "H:MM:SS" beyond that. Truncates partial seconds. */
export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
}

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

/** e.g. "3 กรกฎาคม 2569" (Buddhist Era = CE + 543). */
export function formatThaiDate(date: Date): string {
  const day = date.getDate();
  const month = THAI_MONTHS[date.getMonth()];
  const beYear = date.getFullYear() + 543;
  return `${day} ${month} ${beYear}`;
}

export interface CertificateData {
  elapsedLabel: string;
  dateLabel: string;
  title: string;
  bodyLine: string;
  stamp: string;
}

/**
 * Cheat stamp rule: skipping the 99% stall via the 10-tap easter egg gets a
 * different title and a "ขี้โกง" stamp instead of the honorable one.
 */
export function composeCertificate(elapsedMs: number, date: Date, cheated: boolean): CertificateData {
  const elapsedLabel = formatElapsed(elapsedMs);
  const dateLabel = formatThaiDate(date);
  const bodyLine = `ผู้กล้ารอครบ ${elapsedLabel} นาที ณ วันที่ ${dateLabel}`;

  if (cheated) {
    return {
      elapsedLabel,
      dateLabel,
      bodyLine,
      title: "ใบประกาศความอดทน (ฉบับขี้โกง)",
      stamp: "ตราประทับ: ขี้โกง 🐍 (แอบกดข้าม แต่ก็ยังได้ใบนี้มา)",
    };
  }

  return {
    elapsedLabel,
    dateLabel,
    bodyLine,
    title: "ใบประกาศความอดทน",
    stamp: "ตราประทับ: ผู้กล้าหาญตัวจริง 🏅 (รอครบทุกวินาที ไม่โกงแม้แต่คลิกเดียว)",
  };
}
