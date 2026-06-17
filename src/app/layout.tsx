import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "숨은 탄소배출권 찾기 | 후시파트너스",
  description: "선비용 0원, 성과 수수료 20%. 내 사업장의 숨은 KOC를 찾아드립니다.",
  openGraph: {
    title: "숨은 탄소배출권 찾기 | 후시파트너스",
    description: "선비용 0원, 성과 수수료 20%",
    locale: "ko_KR",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={geistSans.variable}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
