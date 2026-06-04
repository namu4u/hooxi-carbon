"use client";

// A-02: 업종·설비 정보 입력

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { ChevronRightIcon, InfoIcon } from "lucide-react";

import { DiagnosisProgress } from "@/components/diagnosis/DiagnosisProgress";
import { useDiagnosis, type Step1Data } from "@/hooks/useDiagnosis";
import { SECTORS, EQUIP_BY_SECTOR, ELEC_TIERS, INSTALL_YEARS } from "@/lib/diagnosis-data";

// ── Zod 스키마 ────────────────────────────────────────────────────────────────
const schema = z.object({
  sectorCode:  z.string().min(1, "업종을 선택해주세요"),
  equipCodes:  z.array(z.string()).min(1, "설비를 1개 이상 선택해주세요"),
  elecTier:    z.number().int().min(1).max(4),
  installYear: z.number().int().min(2021).max(2025),
});

type FormData = z.infer<typeof schema>;

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────
export default function DiagnosisStep1() {
  const router                    = useRouter();
  const { step1, save, hydrated } = useDiagnosis();

  const {
    register, control, handleSubmit,
    watch, setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      sectorCode:  step1?.sectorCode  ?? "",
      equipCodes:  step1?.equipCodes  ?? [],
      elecTier:    step1?.elecTier    ?? 2,
      installYear: step1?.installYear ?? 2023,
    },
  });

  const sectorCode = watch("sectorCode");
  const equipCodes = watch("equipCodes");

  // 업종 변경 시 설비 선택 초기화
  useEffect(() => {
    setValue("equipCodes", []);
  }, [sectorCode, setValue]);

  // onChange → localStorage 임시 저장 (이탈 감지)
  useEffect(() => {
    const { unsubscribe } = watch((values) => {
      if (values.sectorCode) save({ step1: values as Step1Data });
    });
    return unsubscribe;
  }, [watch, save]);

  // beforeunload 이탈 감지
  useEffect(() => {
    const handler = () => {
      const v = { sectorCode, equipCodes };
      if (v.sectorCode) save({ step1: v as Step1Data });
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [sectorCode, equipCodes, save]);

  if (!hydrated) return null;

  const availableEquip = sectorCode ? (EQUIP_BY_SECTOR[sectorCode] ?? []) : [];
  const canProceed     = equipCodes.length > 0 && Boolean(sectorCode);

  const onSubmit = handleSubmit((data) => {
    save({ step1: data });
    router.push("/diagnosis/step2");
  });

  return (
    <div>
      <DiagnosisProgress step={1} />

      <h1 className="text-xl font-bold text-foreground mb-1">업종 및 설비 정보</h1>
      <p className="text-sm text-muted-foreground mb-7">
        KOC 발급 가능 여부와 예상 수익을 계산합니다
      </p>

      <form onSubmit={onSubmit} noValidate className="space-y-7">
        {/* 업종 */}
        <Field label="업종" error={errors.sectorCode?.message}>
          <select {...register("sectorCode")} className={fieldCls}>
            <option value="">업종을 선택하세요</option>
            {SECTORS.map((s) => (
              <option key={s.code} value={s.code}>{s.label}</option>
            ))}
          </select>
        </Field>

        {/* 설비 (업종 선택 후 동적 렌더) */}
        {sectorCode && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              대상 설비 <span className="text-destructive">*</span>
            </label>
            <p className="text-xs text-muted-foreground mb-3">해당하는 설비를 모두 선택하세요</p>

            <div className="space-y-2.5">
              {availableEquip.map((equip) => (
                <Controller
                  key={equip.code}
                  name="equipCodes"
                  control={control}
                  render={({ field }) => {
                    const checked  = field.value.includes(equip.code);
                    const disabled = equip.ineligible === true;
                    return (
                      <label
                        className={[
                          "flex items-center gap-3 p-4 border rounded-xl transition-colors select-none",
                          disabled  ? "border-border bg-muted/50 opacity-60 cursor-not-allowed"
                          : checked ? "border-primary bg-secondary cursor-pointer"
                                    : "border-border bg-white cursor-pointer",
                        ].join(" ")}
                      >
                        <input
                          type="checkbox"
                          className="w-5 h-5 accent-primary flex-shrink-0"
                          disabled={disabled}
                          checked={checked}
                          onChange={(e) => {
                            if (disabled) return;
                            field.onChange(
                              e.target.checked
                                ? [...field.value, equip.code]
                                : field.value.filter((c: string) => c !== equip.code)
                            );
                          }}
                        />
                        <span className="text-sm font-medium flex-1">{equip.label}</span>
                        {disabled && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                            <InfoIcon className="w-3 h-3" />
                            {equip.ineligibleReason}
                          </span>
                        )}
                      </label>
                    );
                  }}
                />
              ))}
            </div>

            {errors.equipCodes && (
              <p className="text-xs text-destructive mt-1.5">{errors.equipCodes.message}</p>
            )}
          </div>
        )}

        {/* 연간 전기사용량 */}
        <Field label="연간 전기사용량">
          <Controller
            name="elecTier"
            control={control}
            render={({ field }) => (
              <select
                value={field.value}
                onChange={(e) => field.onChange(Number(e.target.value))}
                className={fieldCls}
              >
                {ELEC_TIERS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            )}
          />
        </Field>

        {/* 설비 도입 연도 */}
        <div>
          <Field label="설비 도입(교체) 연도">
            <Controller
              name="installYear"
              control={control}
              render={({ field }) => (
                <select
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className={fieldCls}
                >
                  {INSTALL_YEARS.map((y) => (
                    <option key={y} value={y}>{y}년</option>
                  ))}
                </select>
              )}
            />
          </Field>
          <p className="text-xs text-muted-foreground mt-1.5">
            2021년 이후 도입 설비만 KOC 발급 대상입니다
          </p>
        </div>

        {/* CTA */}
        <button
          type="submit"
          disabled={!canProceed}
          className="w-full h-14 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-colors disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed bg-primary text-primary-foreground hover:bg-primary/90 mt-4"
        >
          다음 단계
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}

// ── 공용 서브컴포넌트 ─────────────────────────────────────────────────────────
const fieldCls =
  "w-full h-12 px-3 border border-border rounded-lg bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label} <span className="text-destructive">*</span>
      </label>
      {children}
      {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
    </div>
  );
}
