import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";
import type { Database, LeadStatus } from "@/types/supabase";

type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];

// ── 스키마 ─────────────────────────────────────────────────────────────────
const PatchSchema = z.object({
  status:        z.enum(["new","contacted","qualified","contracted","processing","completed","disqualified"]).optional(),
  consultant_id: z.string().uuid().nullable().optional(),
  notes:         z.string().max(2000).nullable().optional(),
  score:         z.number().int().min(0).max(100).optional(),
  tier:          z.enum(["A","B","C","D"]).nullable().optional(),
});

// ── PATCH /api/v1/admin/leads/:id ──────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1. 호출자 RBAC 검증
  const callerSupabase = await createClient();
  const { data: { user } } = await callerSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "인증이 필요합니다", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const role = user.app_metadata?.role ?? "";
  const canWrite = ["admin", "super_admin", "consultant"].includes(role);
  if (!canWrite) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "수정 권한이 없습니다", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  // 2. 바디 파싱
  let body: z.infer<typeof PatchSchema>;
  try {
    const raw    = await request.json();
    const parsed = PatchSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "입력값이 올바르지 않습니다", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
    body = parsed.data;
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "요청 형식 오류", code: "PARSE_ERROR" },
      { status: 400 }
    );
  }

  // consultant는 consultant_id 배정 불가 (admin/super_admin만)
  if (body.consultant_id !== undefined && !["admin", "super_admin"].includes(role)) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "컨설턴트 배정 권한이 없습니다", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  // 3. 업데이트 (service_role)
  const supabase = await createAdminClient();

  // 기존 리드 조회 (Slack 메시지 구성용)
  const { data: existing } = await supabase
    .from("leads")
    .select("company_name, contact_name, est_net_value, consultant_id")
    .eq("id", id)
    .single();

  const update: LeadUpdate = {};
  if (body.status        !== undefined) update.status        = body.status as LeadStatus;
  if (body.consultant_id !== undefined) update.consultant_id = body.consultant_id;
  if (body.notes         !== undefined) update.notes         = body.notes;
  if (body.score         !== undefined) update.score         = body.score;
  if (body.tier          !== undefined) update.tier          = body.tier;

  const { data, error } = await supabase
    .from("leads")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[admin/leads/PATCH]", error.message);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "업데이트 실패", code: "DB_ERROR" },
      { status: 500 }
    );
  }

  // 4. 컨설턴트 새로 배정됐을 때 Slack 알림
  const consultantChanged =
    body.consultant_id !== undefined &&
    body.consultant_id !== null &&
    body.consultant_id !== existing?.consultant_id;

  if (consultantChanged && process.env.SLACK_WEBHOOK_URL) {
    const { data: consultant } = await supabase.auth.admin.getUserById(body.consultant_id!);
    const consultantName = consultant?.user?.user_metadata?.name ?? consultant?.user?.email ?? "알 수 없음";

    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: [
          `🔥 *새 리드 배정*`,
          `• 회사: ${existing?.company_name ?? "-"}`,
          `• 담당자: ${existing?.contact_name ?? "-"}`,
          `• 컨설턴트: ${consultantName}`,
          `• 예상 순수익: ${existing?.est_net_value ? `₩${existing.est_net_value.toLocaleString()}` : "-"}`,
        ].join("\n"),
      }),
    }).catch((e) => console.error("[Slack webhook]", e));
  }

  return NextResponse.json<ApiResponse<typeof data>>({ success: true, data });
}
