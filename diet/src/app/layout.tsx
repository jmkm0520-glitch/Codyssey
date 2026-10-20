import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { AuthGate } from "../components/AuthGate";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "오늘도 가볍게",
  description: "다이어트 식단과 체중을 기록하는 웹사이트",
  icons: {
    icon: [{ url: "/broccoli-logo.png", type: "image/png" }],
    apple: [{ url: "/broccoli-logo.png", type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={notoSansKr.variable}>
      <body><AuthGate>{children}</AuthGate></body>
    </html>
  );
}
