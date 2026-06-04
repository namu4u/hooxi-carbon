import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { computeLeadScore } from "@/lib/scoring";
import type { ApiResponse } from "@/types";

// ── Zod 스키마 ────────────────────────────────────────────────────────────────
const BodySchema = z.object({
  // 담당자 정보
  companyName:  z.string().min(1).max(100),
  contactName:  z.string().min(1).max(50),
  contactTitle: z.string().min(1).max(50),
  email:        z.string().email(),
  phone:        z.string().nullish(),

  // 진단 데이터 (서버에서 score 재계산)
  sectorCode:    z.string().min(1),
  equipCodes:    z.array(z.string()).min(1),
  elecTier:      z.number().int().min(1).max(5),
  employeeTier:  z.number().int().min(1).max(5),
  installYear:   z.number().int().min(2010).max(2026),
  kcuHistory:    z.enum(["none", "partial", "all"]),
  etsAllocated:  z.boolean().optional().default(false),

  // 계산 결과 (클라이언트 전달, DB 저장용)
  estimatedNetValue:   z.number().int().nullish(),
  estimatedGrossValue: z.number().int().nullish(),
  eligibleYears:       z.number().int().nullish(),
});

// ── POST /api/v1/leads ────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // 1. 파싱 및 검증
  let body: z.infer<typeof BodySchema>;
  try {
    const raw    = await request.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "입력값이 올바르지 않습니다", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
    body = parsed.data;
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "요청 형식이 잘못됐습니다", code: "PARSE_ERROR" },
      { status: 400 }
    );
  }

  // 2. 리드 스코어 서버사이드 계산 (클라이언트 값 무시)
  const { total: score, tier } = computeLeadScore({
    elec_tier:      body.elecTier,
    employee_tier:  body.employeeTier,
    kcu_history:    body.kcuHistory,
    ets_allocated:  body.etsAllocated ?? false,
    net_value:      body.estimatedNetValue  ?? 0,
    eligible_years: body.eligibleYears      ?? 0,
  });

  // 3. leads 테이블에 저장 (service_role — RLS 우회)
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("leads")
    .insert({
      company_name:  body.companyName,
      contact_name:  body.contactName,
      contact_title: body.contactTitle,
      email:         body.email,
      phone:         body.phone ?? "",
      sector_code:   body.sectorCode,
      equip_types:   body.equipCodes,     // jsonb 배열
      elec_tier:     body.elecTier,
      employee_tier: body.employeeTier,
      kcu_history:   null,               // numeric 이력값 미수집; 이력 유무는 equip_types jsonb
      ets_allocated: body.etsAllocated ?? false,
      score:         score as number,
      tier:          tier,
      status:        "new",
      est_net_value: body.estimatedNetValue   ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[leads/POST] DB error:", error.message);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "저장 중 오류가 발생했습니다", code: "DB_ERROR" },
      { status: 500 }
    );
  }

  // 4. TODO: Stibee 이메일 발송, 카카오 알림

  return NextResponse.json<ApiResponse<{ id: string }>>({
    success: true,
    data: { id: data.id },
  });
}
