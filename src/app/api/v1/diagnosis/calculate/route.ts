import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { computeLeadScore } from "@/lib/scoring";
import type { ApiResponse } from "@/types";

// ══════════════════════════════════════════════════════════════════════════════
// 상수 — 변경 시 algo_params 테이블 또는 이 파일만 수정
// ══════════════════════════════════════════════════════════════════════════════

/**
 * 전력 사용량 구간 중간값(kWh/년), tier 1~5.
 * algo_params.alpha 는 반드시 같은 단위(kWh)로 보정된 배출계수여야 함.
 * 예: alpha ≈ 0.000474 tCO₂/kWh (한국 전력 배출계수 기준) × 절감률
 * seed.sql의 alpha·beta는 실운영 전 도메인 전문가 교정 필수.
 */
const ELEC_MID_KWH = [125_000, 1_250_000, 3_500_000, 7_500_000, 15_000_000] as const;

/** 종업원 규모 보정 계수 γ, tier 1~5 */
const GAMMA = [0.7, 1.0, 1.3, 1.6, 2.0] as const;

const MULTI_EQUIP_FACTOR = 0.88;   // 복수 설비 중복 감산율
const CERT_SUCCESS_RATE  = 0.80;   // KCU 인증 성공률(보수적 추정)
const FEE_RATE           = 0.20;   // 후시파트너스 성과 수수료
const REF_YEAR           = 2026;   // 기준 연도(KCU 적격 연수 산정)
const MAX_ELIGIBLE_YEARS = 5;      // 최대 인정 연수
const INSTALL_YEAR_CUTOFF = 2021;  // 최소 설치 연도

// ══════════════════════════════════════════════════════════════════════════════
// Zod 스키마
// ══════════════════════════════════════════════════════════════════════════════

const BodySchema = z.object({
  sector_code:   z.string().min(1).max(10),
  equip_codes:   z.array(z.string().min(1).max(50)).min(1).max(10),
  elec_tier:     z.number().int().min(1).max(5),
  employee_tier: z.number().int().min(1).max(5),
  install_year:  z.number().int().min(2010).max(REF_YEAR - 1),
  kcu_history:   z.enum(["none", "partial", "all"]),
  ets_allocated: z.boolean().optional().default(false),
});

type Body = z.infer<typeof BodySchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 내부 타입
// ══════════════════════════════════════════════════════════════════════════════

interface AlgoParam {
  equip_code:   string;
  alpha:        number;
  beta:         number;
  kcu_price_ref: number;
}

interface EquipContrib {
  equip_code:    string;
  annual_term:   number;  // β × elec_mid × α (연간 단순 환산값)
  est_kcu_vol:   number;  // CERT_SUCCESS_RATE 적용 후 eligible_years 누적
}

interface CalcIntermediate {
  elec_mid:       number;
  base_reduction: number;  // 복수 설비 보정 전후 합계
  eligible_years: number;
  kcu_base:       number;
  gamma:          number;
  kcu_price_ref:  number;
  gross_value:    number;
  fee_amount:     number;
  net_value:      number;
  is_multi_equip: boolean;
  contribs:       EquipContrib[];
}

// ══════════════════════════════════════════════════════════════════════════════
// Route Handler
// ══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  // ── 1. Request Body 파싱 및 검증 ───────────────────────────────────────────
  let body: Body;
  try {
    const raw = await request.json();
    const result = BodySchema.safeParse(raw);

    if (!result.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "입력값이 올바르지 않습니다",
          code: "VALIDATION_ERROR",
          // zod 에러 상세 클라이언트 노출 금지 — 서버 로그에만 기록
        },
        { status: 400 }
      );
    }
    body = result.data;
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "요청 형식이 잘못됐습니다", code: "PARSE_ERROR" },
      { status: 400 }
    );
  }

  // ── 2. algo_params 테이블 fetch ────────────────────────────────────────────
  // anon key 사용: algo_params에 authenticated/anon SELECT 정책 있음
  const supabase = await createClient();

  const { data: params, error: paramsError } = await supabase
    .from("algo_params")
    .select("equip_code, alpha, beta, kcu_price_ref")
    .eq("sector_code", body.sector_code)
    .in("equip_code", body.equip_codes)
    .eq("eligible", true);

  if (paramsError) {
    console.error("[calculate] algo_params fetch:", paramsError.message);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "파라미터 조회 실패", code: "PARAMS_FETCH_ERROR" },
      { status: 500 }
    );
  }

  if (!params || params.length === 0) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "해당 업종·설비 조합의 알고리즘 파라미터가 없습니다",
        code: "PARAMS_NOT_FOUND",
      },
      { status: 422 }
    );
  }

  // ── 3. 적격성 판정 ─────────────────────────────────────────────────────────
  if (body.install_year < INSTALL_YEAR_CUTOFF) {
    return NextResponse.json({
      success: true,
      data: {
        eligible: false,
        reason: `설치 연도(${body.install_year}년)가 기준 연도(${INSTALL_YEAR_CUTOFF}년) 이전으로 KCU 발급 대상에 해당하지 않습니다.`,
      },
    });
  }

  if (body.kcu_history === "all") {
    return NextResponse.json({
      success: true,
      data: {
        eligible: false,
        reason: "모든 설비가 이미 배출권거래제(ETS) 또는 KCU에 등록되어 있어 추가 발급 대상이 아닙니다.",
      },
    });
  }

  // ── 4 ~ 9. 핵심 계산 ──────────────────────────────────────────────────────
  const calc = computeKcu(body, params);

  // ── 10. 리드 스코어 계산 — 공유 lib 사용, 응답 미포함 ─────────────────────
  void computeLeadScore({
    elec_tier:      body.elec_tier,
    employee_tier:  body.employee_tier,
    kcu_history:    body.kcu_history,
    ets_allocated:  body.ets_allocated ?? false,
    net_value:      calc.net_value,
    eligible_years: calc.eligible_years,
  });

  // ── 11. 결과 반환 (raw score 미포함) ────────────────────────────────────────
  return NextResponse.json({
    success: true,
    data: {
      eligible: true,
      // KCU 물량
      est_kcu_volume:  roundTo(calc.kcu_base, 4),  // tCO₂
      eligible_years:  calc.eligible_years,
      // 금액
      est_gross_value: calc.gross_value,
      fee_amount:      calc.fee_amount,
      est_net_value:   calc.net_value,
      fee_rate:        FEE_RATE,
      // 계산 근거 (내부 파라미터 α·β 미포함)
      kcu_price_ref:   calc.kcu_price_ref,
      gamma:           calc.gamma,
      is_multi_equip:  calc.is_multi_equip,
      breakdown: calc.contribs.map((c) => ({
        equip_code:  c.equip_code,
        est_kcu_vol: roundTo(c.est_kcu_vol, 4),
      })),
    },
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// 계산 함수 — 모두 서버사이드 전용
// ══════════════════════════════════════════════════════════════════════════════

/**
 * 4~9단계 KCU 추정 계산.
 *
 * base_reduction = Σ(β × elec_mid × α)
 *   복수 설비: × 0.88
 * kcu_base       = base_reduction × 0.80 × eligible_years
 * net_value      = kcu_base × kcu_price_ref × γ × 0.80
 */
function computeKcu(body: Body, params: AlgoParam[]): CalcIntermediate {
  // 4. base_reduction
  const elecMid = ELEC_MID_KWH[body.elec_tier - 1];

  const contribsRaw: EquipContrib[] = params.map((p) => ({
    equip_code:  p.equip_code,
    annual_term: p.beta * elecMid * p.alpha,
    est_kcu_vol: 0,  // 아래에서 채움
  }));

  const annualSum    = contribsRaw.reduce((acc, c) => acc + c.annual_term, 0);
  const isMultiEquip = params.length > 1;
  const baseReduction = isMultiEquip ? annualSum * MULTI_EQUIP_FACTOR : annualSum;

  // 5. eligible_years
  const eligibleYears = Math.min(REF_YEAR - body.install_year, MAX_ELIGIBLE_YEARS);

  // 6. kcu_base
  const kcuBase = baseReduction * CERT_SUCCESS_RATE * eligibleYears;

  // 설비별 기여 비율로 est_kcu_vol 분배
  const multiRatio = isMultiEquip ? MULTI_EQUIP_FACTOR : 1;
  const contribs = contribsRaw.map((c) => ({
    ...c,
    est_kcu_vol: c.annual_term * multiRatio * CERT_SUCCESS_RATE * eligibleYears,
  }));

  // 7. gamma
  const gamma = GAMMA[body.employee_tier - 1];

  // 8. kcu_price_ref — 복수 설비 시 최댓값 사용(보수적 추정)
  const kcuPriceRef = params.reduce((max, p) => Math.max(max, p.kcu_price_ref), 0);

  // 9. net_value = kcu_base × kcu_price_ref × γ × (1 - fee_rate)
  const grossValue = Math.round(kcuBase * kcuPriceRef * gamma);
  const feeAmount  = Math.round(grossValue * FEE_RATE);
  const netValue   = grossValue - feeAmount;   // = grossValue × 0.80

  return {
    elec_mid:       elecMid,
    base_reduction: baseReduction,
    eligible_years: eligibleYears,
    kcu_base:       kcuBase,
    gamma,
    kcu_price_ref:  kcuPriceRef,
    gross_value:    grossValue,
    fee_amount:     feeAmount,
    net_value:      netValue,
    is_multi_equip: isMultiEquip,
    contribs,
  };
}

// ── 유틸 ──────────────────────────────────────────────────────────────────────

function roundTo(n: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}
