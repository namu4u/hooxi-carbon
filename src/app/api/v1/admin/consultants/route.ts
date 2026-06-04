import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";

export interface ConsultantItem {
  id:   string;
  name: string;
  email: string;
}

// GET /api/v1/admin/consultants
export async function GET() {
  // 호출자 인증
  const callerClient = await createClient();
  const { data: { user } } = await callerClient.auth.getUser();

  if (!user || !["admin","super_admin","consultant"].includes(user.app_metadata?.role ?? "")) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "인증이 필요합니다", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const supabase = await createAdminClient();

  // auth.users에서 admin/consultant 역할 유저 조회
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });

  if (error) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "컨설턴트 목록 조회 실패", code: "DB_ERROR" },
      { status: 500 }
    );
  }

  const consultants: ConsultantItem[] = (data.users ?? [])
    .filter((u) => ["admin", "super_admin", "consultant"].includes(u.app_metadata?.role ?? ""))
    .map((u) => ({
      id:    u.id,
      name:  u.user_metadata?.name ?? u.email?.split("@")[0] ?? "Unknown",
      email: u.email ?? "",
    }));

  return NextResponse.json<ApiResponse<ConsultantItem[]>>({ success: true, data: consultants });
}
