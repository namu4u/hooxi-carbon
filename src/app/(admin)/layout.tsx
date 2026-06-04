import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AdminRole } from "@/types";

// 접근 허용 역할 (viewer는 읽기 전용으로 허용)
const ALLOWED: AdminRole[] = ["admin", "super_admin", "consultant", "viewer"];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const role = (user.app_metadata?.role ?? "") as AdminRole;
  if (!ALLOWED.includes(role)) redirect("/");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 어드민 상단 네비 */}
      <header className="bg-white border-b border-border shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* HOOXI 로고 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hooxi_logo_dark.svg"
              alt="HOOXI Partners"
              width={70}
              height={30}
            />
            <span className="text-slate-200">|</span>
            <nav className="flex items-center gap-4">
              <a href="/leads"          className="text-sm font-medium text-foreground hover:text-[#55b4a5] transition-colors">리드</a>
              <a href="/customers"      className="text-sm text-muted-foreground hover:text-[#55b4a5] transition-colors">고객</a>
              <a href="/certifications" className="text-sm text-muted-foreground hover:text-[#55b4a5] transition-colors">인증</a>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
              {role}
            </span>
            <span className="text-xs text-muted-foreground hidden sm:block">
              {user.email}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
