import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "เว็บที่ช้าที่สุดในประเทศไทย",
  description:
    "อินเทอร์เน็ตเร็วขึ้นทุกปี เว็บนี้ขอสวนกระแส — ทุกอย่างช้าอย่างตั้งใจ ผู้ชนะคือคนที่รอจนจบ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <script
          defer
          src="https://umami-host-peerapongsms-projects.vercel.app/script.js"
          data-website-id="3f09453d-0b39-443e-8845-5e65611cc58a"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
