"use client";

// B-01: 진단 결과 리포트 — 반응형 (모바일 + 데스크탑 2열)

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangleIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  InfoIcon,
  LeafIcon,
  RotateCcwIcon,
  XCircleIcon,
} from "lucide-react";

import { DiagnosisProgress } from "@/components/diagnosis/DiagnosisProgress";
import { useDiagnosis, type CalcResult } from "@/hooks/useDiagnosis";
import { EQUIP_LABEL } from "@/lib/diagnosis-data";
import { formatKRW, formatNumber } from "@/lib/utils";

const PRICE_BASE_DATE   = "2026년 6월 기준";
const URGENT_YEAR_CUTOFF = 2022;

export default function ResultPage() {
  const router = useRouter();
  const { step1, step2, result, reset, hydrated } = useDiagnosis();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!result || !step1 || !step2) {
      router.replace("/diagnosis");
      return;
    }
    setReady(true);
  }, [hydrated, result, step1, step2, router]);

  if (!ready || !result || !step1) return null;

  // ── 부적격 화면 ────────────────────────────────────────────────────────────
  if (!result.eligible) {
    return (
      <div>
        <DiagnosisProgress step={3} />
        <div className="flex flex-col items-center text-center py-10 gap-4">
          <XCircleIcon className="w-16 h-16 text-destructive" />
          <div>
            <h2 className="text-xl font-bold text-foreground">KOC 발급 대상이 아닙니다</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{result.reason}</p>
          </div>
          <button
            onClick={() => router.push("/diagnosis")}
            className="mt-4 h-12 px-6 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            다시 진단하기
          </button>
        </div>
      </div>
    );
  }

  // ── 수치 계산 ──────────────────────────────────────────────────────────────
  const netValue   = result.est_net_value   ?? 0;
  const grossValue = result.est_gross_value ?? 0;
  const kcuVol     = result.est_kcu_volume  ?? 0;
  const lowValue   = Math.round(netValue * 0.80);
  const highValue  = Math.round(netValue * 1.20);
  const isUrgent   = step1.installYear <= URGENT_YEAR_CUTOFF;
  const yearsLeft  = 2026 - step1.installYear;

  // 데모 여부 체크 (result에 breakdown 있고 step2가 기본값이면 데모)
  const isDemo = step2?.kcuHistory === "none" && step2?.etsAllocated === false;

  return (
    <div className="pb-10">
      <DiagnosisProgress step={3} />

      {/* ── 데스크탑: 2열 그리드 레이아웃 ──────────────────────────────────── */}
      <div className="md:grid md:grid-cols-[1fr_320px] md:gap-8 md:items-start">

        {/* ── 왼쪽 열: 결과 수치 ──────────────────────────────────────────── */}
        <div>
          {/* 긴급 배너 */}
          {isUrgent && (
            <div className="mb-5 flex gap-2.5 items-start p-4 bg-amber-50 border border-amber-300 rounded-xl">
              <AlertTriangleIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {step1.installYear}년 설치 — 신청 가능 기간이 얼마 남지 않았습니다!
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  KOC 발급 가능 기간은 최대 5년입니다. 2026년까지 {yearsLeft}년 남았습니다.
                  지금 바로 신청하세요.
                </p>
              </div>
            </div>
          )}

          {/* 메인 카드: 예상 순수익 */}
          <div className="bg-primary rounded-2xl p-6 text-white mb-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <LeafIcon className="w-5 h-5" />
                <span className="text-sm font-medium opacity-90">예상 고객 순수익</span>
              </div>
              {isDemo && (
                <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold tracking-wide">
                  DEMO
                </span>
              )}
            </div>

            <p className="text-4xl md:text-5xl font-extrabold tracking-tight">
              {formatKRW(netValue)}
            </p>
            <p className="text-sm opacity-80 mt-1">
              범위: {formatKRW(lowValue)} ~ {formatKRW(highValue)}
            </p>

            <div className="mt-5 pt-4 border-t border-white/20 grid grid-cols-2 gap-3">
              <Stat label="예상 KOC 물량"      value={`${formatNumber(Math.round(kcuVol))} tCO₂`} />
              <Stat label="KOC 판매 총액"       value={formatKRW(grossValue)} />
              <Stat label="후시 수수료(20%)"    value={formatKRW(result.fee_amount ?? 0)} />
              <Stat label="적격 기간"           value={`${result.eligible_years ?? 0}년`} />
            </div>
          </div>

          {/* 적격 설비 태그 */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-foreground mb-2">KOC 적격 설비</h3>
            <div className="flex flex-wrap gap-2">
              {step1.equipCodes.map((code) => (
                <span
                  key={code}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground text-xs font-medium rounded-full"
                >
                  <CheckCircle2Icon className="w-3.5 h-3.5 text-primary" />
                  {EQUIP_LABEL[code] ?? code}
                </span>
              ))}
            </div>
          </div>

          {/* 설비별 내역 테이블 */}
          {(result.breakdown?.length ?? 0) > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-foreground mb-2">설비별 KOC 내역</h3>
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">설비</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">예상 KOC(tCO₂)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.breakdown?.map((item, i) => (
                      <tr key={item.equip_code} className={i % 2 === 0 ? "bg-white" : "bg-muted/30"}>
                        <td className="px-4 py-3 text-foreground">
                          {EQUIP_LABEL[item.equip_code] ?? item.equip_code}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-primary">
                          {formatNumber(Math.round(item.est_kcu_vol * 10) / 10)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 주석 / 안내 */}
          <div className="flex items-start gap-2 p-3.5 bg-muted rounded-xl mb-8 md:mb-0 text-xs text-muted-foreground">
            <InfoIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p>KOC 참고가: {formatKRW(result.kcu_price_ref ?? 18000)}/tCO₂ ({PRICE_BASE_DATE})</p>
              <p>예상 수익은 참고용이며, 실제 매각가는 시장 상황에 따라 변동됩니다. 실제 발급량·정산 금액은 환경부 심사 결과에 따라 달라질 수 있습니다.</p>
              {result.is_multi_equip && (
                <p>복수 설비 적용 시 중복 감산(×0.88)이 적용됩니다.</p>
              )}
            </div>
          </div>
        </div>

        {/* ── 오른쪽 열: CTA 패널 (데스크탑) + 모바일 하단 CTA ──────────── */}
        <div>
          {/* CTA 카드 (데스크탑 전용 스티키) */}
          <div className="hidden md:block sticky top-24">
            <div className="border border-border rounded-2xl p-5 bg-white shadow-sm">
              <h3 className="text-base font-bold text-foreground mb-1">지금 정밀 진단 신청</h3>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                담당 컨설턴트가 정확한 KOC 발급 가능 여부와
                최적 신청 시기를 알려드립니다.
              </p>

              <button
                onClick={() => router.push("/diagnosis/step3")}
                className="w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors mb-3 shadow-md"
              >
                결과 받고 정밀 진단 신청
                <ChevronRightIcon className="w-4 h-4" />
              </button>

              <a
                href="https://calendly.com/hooxi"
                target="_blank"
                rel="noreferrer"
                className="w-full h-10 rounded-xl font-medium text-xs flex items-center justify-center gap-2 border border-border text-foreground hover:bg-muted transition-colors mb-4"
              >
                <CalendarClockIcon className="w-3.5 h-3.5 text-primary" />
                전문가 미팅 바로 예약
              </a>

              {/* 요약 수치 */}
              <div className="bg-secondary rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">예상 순수익</span>
                  <span className="text-sm font-extrabold text-primary">{formatKRW(netValue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">KOC 물량</span>
                  <span className="text-xs font-semibold text-foreground">{formatNumber(Math.round(kcuVol))} tCO₂</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">선비용</span>
                  <span className="text-xs font-semibold text-foreground">₩0</span>
                </div>
              </div>
            </div>

            {/* 데모 초기화 버튼 (부스 시연용) */}
            {isDemo && (
              <button
                type="button"
                onClick={() => { reset(); router.push("/"); }}
                className="w-full mt-3 h-9 rounded-xl border border-border text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcwIcon className="w-3.5 h-3.5" />
                데모 초기화 (처음부터)
              </button>
            )}
          </div>

          {/* 모바일 CTA (데스크탑에서는 숨김) */}
          <div className="md:hidden mt-8">
            <button
              onClick={() => router.push("/diagnosis/step3")}
              className="w-full h-14 rounded-xl font-semibold text-base flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors mb-3 shadow-md"
            >
              결과 받고 정밀 진단 신청
              <ChevronRightIcon className="w-5 h-5" />
            </button>

            <a
              href="https://calendly.com/hooxi"
              target="_blank"
              rel="noreferrer"
              className="w-full h-12 rounded-xl font-medium text-sm flex items-center justify-center gap-2 border border-border text-foreground hover:bg-muted transition-colors mb-3"
            >
              <CalendarClockIcon className="w-4 h-4 text-primary" />
              전문가 미팅 바로 예약
            </a>

            {isDemo && (
              <button
                type="button"
                onClick={() => { reset(); router.push("/"); }}
                className="w-full h-10 rounded-xl border border-border text-xs text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcwIcon className="w-3.5 h-3.5" />
                데모 초기화 (처음부터)
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs opacity-70">{label}</p>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}
