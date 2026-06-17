import Link from "next/link";
import type { ReactNode } from "react";

export default function ResultLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* 데스크탑 전용 헤더 */}
      <header className="hidden md:flex items-center h-14 border-b border-border bg-white/95 backdrop-blur sticky top-0 z-40">
        <div className="section-inner flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="font-bold text-primary text-lg">탄소잇</span>
            <span className="text-xs text-muted-foreground">by 후시파트너스</span>
          </Link>
        </div>
      </header>

      <div className="max-w-[390px] md:max-w-3xl mx-auto px-4 md:px-0 pt-6 pb-24 md:pt-10 md:pb-16">
        {children}
      </div>
    </div>
  );
}
