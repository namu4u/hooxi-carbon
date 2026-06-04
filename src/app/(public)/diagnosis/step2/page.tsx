"use client";

// A-03: 기업 규모·KCU 이력 입력 + 백그라운드 calculate

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, LoaderCircleIcon } from "lucide-react";

import { DiagnosisProgress } from "@/components/diagnosis/DiagnosisProgress";
import { useDiagnosis, type Step2Data } from "@/hooks/useDiagnosis";
import { EMPLOYEE_TIERS } from "@/lib/diagnosis-data";

// ── 스키마 ───────────────────────────────────────────────────────────────────
const schema = z.object({
  employeeTier: z.number().int().min(1).max(5),
  kcuHistory:   z.enum(["none", "partial", "all"]),
  etsAllocated: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const KCU_HISTORY_OPTIONS = [
  { value: "none",    label: "없음",           desc: "KOC 신청 이력이 없습니다" },
  { value: "partial", label: "일부 신청",       desc: "일부 설비만 신청한 이력이 있습니다" },
  { value: "all",     label: "전부 신청 완료",  desc: "모든 설비가 이미 KOC에 등록됐습니다" },
] as const;

const ETS_OPTIONS = [
  { value: false, label: "미해당",  desc: "ETS 할당 대상이 아닙니다" },
  { value: "partial", label: "일부 해당", desc: "일부만 ETS 할당 대상입니다" },
  { value: true,  label: "전부 해당", desc: "모든 설비가 ETS 할당 대상입니다" },
] as const;

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────
export default function DiagnosisStep2() {
  const router = useRouter();
  const { step1, step2, save, hydrated } = useDiagnosis();
  const [loading, setLoading] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  const {
    control, handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeTier: step2?.employeeTier ?? 2,
      kcuHistory:   step2?.kcuHistory   ?? "none",
      etsAllocated: step2?.etsAllocated ?? false,
    },
  });

  // Step1 없으면 처음으로
  useEffect(() => {
    if (hydrated && !step1) router.replace("/diagnosis");
  }, [hydrated, step1, router]);

  if (!hydrated || !step1) return null;

  const onSubmit = handleSubmit(async (data) => {
    save({ step2: data });
    setLoading(true);
    setCalcError(null);

    try {
      const res = await fetch("/api/v1/diagnosis/calculate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sector_code:   step1.sectorCode,
          equip_codes:   step1.equipCodes,
          elec_tier:     step1.elecTier,
          employee_tier: data.employeeTier,
          install_year:  step1.installYear,
          kcu_history:   data.kcuHistory,
          ets_allocated: data.etsAllocated,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setCalcError(json.error ?? "계산 중 오류가 발생했습니다");
        setLoading(false);
        return;
      }

      save({ result: json.data });
      router.push("/result");
    } catch {
      setCalcError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
      setLoading(false);
    }
  });

  return (
    <div>
      <DiagnosisProgress step={2} />

      {/* 뒤로가기 */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground mb-4 -ml-1"
      >
        <ChevronLeftIcon className="w-4 h-4" /> 이전 단계
      </button>

      <h1 className="text-xl font-bold text-foreground mb-1">기업 규모 정보</h1>
      <p className="text-sm text-muted-foreground mb-7">
        정확한 수익 추정을 위해 기업 규모를 입력해주세요
      </p>

      <form onSubmit={onSubmit} noValidate className="space-y-8">
        {/* 종업원 수 */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            종업원 수 <span className="text-destructive">*</span>
          </label>
          <Controller
            name="employeeTier"
            control={control}
            render={({ field }) => (
              <select
                value={field.value}
                onChange={(e) => field.onChange(Number(e.target.value))}
                className={fieldCls}
              >
                {EMPLOYEE_TIERS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            )}
          />
        </div>

        {/* KCU 신청 이력 */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            KOC(탄소상쇄크레딧) 신청 이력 <span className="text-destructive">*</span>
          </label>
          <p className="text-xs text-muted-foreground mb-3">
            이전에 KOC를 신청하거나 발급받은 이력이 있나요?
          </p>
          <Controller
            name="kcuHistory"
            control={control}
            render={({ field }) => (
              <div className="space-y-2.5">
                {KCU_HISTORY_OPTIONS.map((opt) => (
                  <RadioCard
                    key={opt.value}
                    label={opt.label}
                    desc={opt.desc}
                    checked={field.value === opt.value}
                    onChange={() => field.onChange(opt.value)}
                    disabled={loading}
                  />
                ))}
              </div>
            )}
          />
          {errors.kcuHistory && (
            <p className="text-xs text-destructive mt-1.5">{errors.kcuHistory.message}</p>
          )}
        </div>

        {/* ETS 할당 대상 */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            배출권거래제(ETS) 할당 대상 여부 <span className="text-destructive">*</span>
          </label>
          <p className="text-xs text-muted-foreground mb-3">
            온실가스 배출권거래제에 할당된 업체인가요?
          </p>
          <Controller
            name="etsAllocated"
            control={control}
            render={({ field }) => (
              <div className="space-y-2.5">
                {ETS_OPTIONS.map((opt) => (
                  <RadioCard
                    key={String(opt.value)}
                    label={opt.label}
                    desc={opt.desc}
                    checked={field.value === (opt.value === "partial" ? false : opt.value)}
                    onChange={() => field.onChange(opt.value === true)}
                    disabled={loading}
                  />
                ))}
              </div>
            )}
          />
        </div>

        {/* 에러 메시지 */}
        {calcError && (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-sm text-destructive">
            {calcError}
          </div>
        )}

        {/* CTA — 삼쩜삼 방식: 결과 먼저 확인 */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-colors bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
        >
          {loading ? (
            <>
              <LoaderCircleIcon className="w-5 h-5 animate-spin" />
              결과 계산 중…
            </>
          ) : (
            "결과 먼저 확인하기 →"
          )}
        </button>

        <p className="text-center text-xs text-muted-foreground -mt-3">
          개인정보 입력 전에 예상 수익을 먼저 확인할 수 있습니다
        </p>
      </form>
    </div>
  );
}

// ── Radio 카드 컴포넌트 ───────────────────────────────────────────────────────
function RadioCard({
  label, desc, checked, onChange, disabled,
}: {
  label: string; desc: string;
  checked: boolean; onChange: () => void; disabled: boolean;
}) {
  return (
    <label
      className={[
        "flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-colors",
        checked   ? "border-primary bg-secondary"
                  : "border-border bg-white",
        disabled  ? "opacity-60 cursor-not-allowed" : "",
      ].join(" ")}
    >
      <div
        className={[
          "w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center",
          checked ? "border-primary" : "border-border",
        ].join(" ")}
      >
        {checked && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
      </div>
      <input
        type="radio"
        className="sr-only"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </label>
  );
}

const fieldCls =
  "w-full h-12 px-3 border border-border rounded-lg bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring";
