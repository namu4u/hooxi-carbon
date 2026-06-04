// D-01 어드민 리드 관리 — Server Component (초기 데이터 fetch)
import { redirect }         from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { LeadsClient }       from "./_components/LeadsClient";
import type { AdminRole }    from "@/types";

export const dynamic = "force-dynamic"; // 항상 최신 데이터 사용

const ALLOWED: AdminRole[] = ["admin", "super_admin", "consultant", "viewer"];

export default async function AdminLeadsPage() {
  // 1. 인증 및 역할 확인 (layout에서도 체크하지만, page에서도 방어적으로 확인)
  const supabase = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const role = (user.app_metadata?.role ?? "") as AdminRole;
  if (!ALLOWED.includes(role)) redirect("/");

  // 2. 리드 전체 조회 (service_role → RLS 우회)
  const { data: leads, error } = await supabase
    .from("leads")
    .select("*")
    .order("score",      { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);    // 페이지네이션은 추후 고도화

  if (error) {
    console.error("[admin/leads] DB error:", error.message);
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
      </div>
    );
  }

  return (
    <LeadsClient
      initialLeads={leads ?? []}
      role={role}
    />
  );
}
