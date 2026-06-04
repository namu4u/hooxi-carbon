"use client";

// B-01: 진단 결과 리포트

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangleIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  InfoIcon,
  LeafIcon,
  XCircleIcon,
} from "lucide-react";

import { DiagnosisProgress } from "@/components/diagnosis/DiagnosisProgress";
import { useDiagnosis, type CalcResult } from "@/hooks/useDiagnosis";
import { EQUIP_LABEL } from "@/lib/diagnosis-data";
import { formatKRW, formatNumber } from "@/lib/utils";

// ── KCU 시장가 기준일 (표시용) ───────────────────────────────────────────────
const PRICE_BASE_DATE = "2025년 12월 31일";
const URGENT_YEAR_CUTOFF = 2022;  // install_year <= 이 값이면 긴급 배너

export default function ResultPage() {
  const router = useRouter();
  const { step1, step2, result, hydrated } = useDiagnosis();
  const [ready, setReady] = useState(false);

  // localStorage 복원 후 상태 점검
  useEffect(() => {
    if (!hydrated) return;
    if (!result || !step1 || !step2) {
      router.replace("/diagnosis");
      return;
    }
    setReady(true);
  }, [hydrated, result, step1, step2, router]);

  if (!ready || !result || !step1) return null;

  // ── 부적격 화면 ──────────────────────────────────────────────────────────
  if (!result.eligible) {
    return (
      <div>
        <DiagnosisProgress step={3} />

        <div className="flex flex-col items-center text-center py-10 gap-4">
          <XCircleIcon className="w-16 h-16 text-destructive" />
          <div>
            <h2 className="text-xl font-bold text-foreground">KCU 발급 대상이 아닙니다</h2>
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

  // ── 적격 결과 ────────────────────────────────────────────────────────────
  const netValue   = result.est_net_value   ?? 0;
  const grossValue = result.est_gross_value ?? 0;
  const kcuVol     = result.est_kcu_volume  ?? 0;

  // 범위: ±20%
  const lowValue  = Math.round(netValue * 0.80);
  const highValue = Math.round(netValue * 1.20);

  const isUrgent  = step1.installYear <= URGENT_YEAR_CUTOFF;
  const yearsLeft = 2026 - step1.installYear;

  return (
    <div className="pb-10">
      <DiagnosisProgress step={3} />

      {/* ── 긴급 배너 ────────────────────────────────────────────────── */}
      {isUrgent && (
        <div className="mb-5 flex gap-2.5 items-start p-4 bg-amber-50 border border-amber-300 rounded-xl">
          <AlertTriangleIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {step1.installYear}년 설치 — 신청 가능 기간이 얼마 남지 않았습니다!
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              KCU 발급 가능 기간은 최대 5년입니다. 2026년까지 {yearsLeft}년 남았습니다.
              지금 바로 신청하세요.
            </p>
          </div>
        </div>
      )}

      {/* ── 메인 카드: 예상 순수익 ───────────────────────────────────── */}
      <div className="bg-primary rounded-2xl p-6 text-white mb-5 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <LeafIcon className="w-5 h-5" />
          <span className="text-sm font-medium opacity-90">예상 고객 순수익</span>
        </div>

        <p className="text-4xl font-extrabold tracking-tight">
          {formatKRW(netValue)}
        </p>
        <p className="text-sm opacity-80 mt-1">
          범위: {formatKRW(lowValue)} ~ {formatKRW(highValue)}
        </p>

        <div className="mt-5 pt-4 border-t border-white/20 grid grid-cols-2 gap-3">
          <Stat label="예상 KCU 물량"      value={`${formatNumber(Math.round(kcuVol))} tCO₂`} />
          <Stat label="KCU 판매 총액"       value={formatKRW(grossValue)} />
          <Stat label="후시 수수료(20%)"    value={formatKRW(result.fee_amount ?? 0)} />
          <Stat label="적격 기간"           value={`${result.eligible_years ?? 0}년`} />
        </div>
      </div>

      {/* ── 적격 설비 태그 ────────────────────────────────────────────── */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-foreground mb-2">KCU 적격 설비</h3>
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

      {/* ── 설비별 내역 테이블 ────────────────────────────────────────── */}
      {(result.breakdown?.length ?? 0) > 0 && (
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-foreground mb-2">설비별 KCU 내역</h3>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">설비</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">예상 KCU(tCO₂)</th>
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

      {/* ── 주석 / 안내 ───────────────────────────────────────────────── */}
      <div className="flex items-start gap-2 p-3.5 bg-muted rounded-xl mb-8 text-xs text-muted-foreground">
        <InfoIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p>KCU 시장가 기준: {formatKRW(result.kcu_price_ref ?? 16000)}/tCO₂ ({PRICE_BASE_DATE})</p>
          <p>예상 수익은 참고용이며, 실제 발급량·정산 금액은 환경부 심사 결과에 따라 달라질 수 있습니다.</p>
          {result.is_multi_equip && (
            <p>복수 설비 적용 시 중복 감산(×0.88)이 적용됩니다.</p>
          )}
        </div>
      </div>

      {/* ── 메인 CTA: Step 3 이동 ─────────────────────────────────────── */}
      <button
        onClick={() => router.push("/diagnosis/step3")}
        className="w-full h-14 rounded-xl font-semibold text-base flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors mb-3 shadow-md"
      >
        결과 받고 정밀 진단 신청
        <ChevronRightIcon className="w-5 h-5" />
      </button>

      {/* ── 서브 CTA: 전문가 미팅 ────────────────────────────────────── */}
      <a
        href="https://calendly.com/hooxi"   // TODO: 실제 Calendly URL
        target="_blank"
        rel="noreferrer"
        className="w-full h-12 rounded-xl font-medium text-sm flex items-center justify-center gap-2 border border-border text-foreground hover:bg-muted transition-colors"
      >
        <CalendarClockIcon className="w-4 h-4 text-primary" />
        전문가 미팅 바로 예약
      </a>
    </div>
  );
}

// ── 서브컴포넌트 ──────────────────────────────────────────────────────────────
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs opacity-70">{label}</p>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}
