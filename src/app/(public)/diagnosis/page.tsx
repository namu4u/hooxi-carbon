"use client";

// A-02: 업종·설비 정보 입력 — 반응형

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { ChevronRightIcon, InfoIcon, ShieldCheckIcon, ZapIcon, TrendingUpIcon } from "lucide-react";

import { DiagnosisProgress } from "@/components/diagnosis/DiagnosisProgress";
import { useDiagnosis, type Step1Data } from "@/hooks/useDiagnosis";
import { SECTORS, EQUIP_BY_SECTOR, ELEC_TIERS, INSTALL_YEARS } from "@/lib/diagnosis-data";

const schema = z.object({
  sectorCode:  z.string().min(1, "업종을 선택해주세요"),
  equipCodes:  z.array(z.string()).min(1, "설비를 1개 이상 선택해주세요"),
  elecTier:    z.number().int().min(1).max(4),
  installYear: z.number().int().min(2021).max(2025),
});

type FormData = z.infer<typeof schema>;

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

  useEffect(() => {
    setValue("equipCodes", []);
  }, [sectorCode, setValue]);

  useEffect(() => {
    const { unsubscribe } = watch((values) => {
      if (values.sectorCode) save({ step1: values as Step1Data });
    });
    return unsubscribe;
  }, [watch, save]);

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

      {/* 데스크탑: 2열 그리드 (폼 + 안내 패널) */}
      <div className="md:grid md:grid-cols-[1fr_260px] md:gap-8 md:items-start">

        {/* 왼쪽: 폼 */}
        <div>
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

            {/* 설비 */}
            {sectorCode && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  대상 설비 <span className="text-destructive">*</span>
                </label>
                <p className="text-xs text-muted-foreground mb-3">해당하는 설비를 모두 선택하세요</p>

                {/* 설비 카드: 모바일 1열 / 데스크탑 2열 */}
                <div className="space-y-2.5 md:space-y-0 md:grid md:grid-cols-2 md:gap-2.5">
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

            {/* 연간 전기사용량 + 설비 도입 연도 — 데스크탑에서 나란히 */}
            <div className="md:grid md:grid-cols-2 md:gap-4">
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
            </div>

            <button
              type="submit"
              disabled={!canProceed}
              className="w-full h-14 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-colors disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed bg-primary text-primary-foreground hover:bg-primary/90"
            >
              다음 단계
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* 오른쪽: 안내 패널 (데스크탑 전용) */}
        <div className="hidden md:block sticky top-24 space-y-3">
          <div className="border border-border rounded-2xl p-4 bg-white">
            <p className="text-xs font-semibold text-foreground mb-3">이렇게 진행됩니다</p>
            <div className="space-y-3">
              {[
                { icon: <ZapIcon className="w-4 h-4 text-primary" />,         n: "1", text: "설비·업종 입력 (지금 단계)" },
                { icon: <ShieldCheckIcon className="w-4 h-4 text-primary" />, n: "2", text: "기업 규모 확인" },
                { icon: <TrendingUpIcon className="w-4 h-4 text-primary" />,  n: "3", text: "KOC 예상 수익 즉시 확인" },
              ].map(({ icon, n, text }) => (
                <div key={n} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {icon}
                  </div>
                  <p className="text-xs text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <p className="text-xs font-semibold text-amber-800 mb-1">⚠ 신청 기한 주의</p>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              KOC는 설치 후 최대 5년 이내만 신청 가능합니다.
              2021년 설치 설비는 2026년이 마감입니다.
            </p>
          </div>

          <div className="p-4 bg-secondary rounded-2xl">
            <p className="text-xs font-semibold text-secondary-foreground mb-1">선비용 0원</p>
            <p className="text-[11px] text-secondary-foreground/70 leading-relaxed">
              진단 및 신청 과정에서 어떠한 비용도 발생하지 않습니다.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

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
