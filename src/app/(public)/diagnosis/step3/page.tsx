"use client";

// A-04: 담당자 정보 입력 + POST /api/v1/leads — 반응형

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  ChevronLeftIcon,
  CheckCircle2Icon,
  LoaderCircleIcon,
  MailIcon,
  LeafIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { DiagnosisProgress } from "@/components/diagnosis/DiagnosisProgress";
import { useDiagnosis } from "@/hooks/useDiagnosis";
import { TITLES } from "@/lib/diagnosis-data";
import { formatKRW } from "@/lib/utils";

const schema = z.object({
  companyName:  z.string().min(1,  "회사명을 입력해주세요").max(100),
  contactName:  z.string().min(1,  "담당자명을 입력해주세요").max(50),
  contactTitle: z.string().min(1,  "직책을 선택해주세요"),
  email: z
    .string()
    .min(1,   "이메일을 입력해주세요")
    .email("올바른 이메일 형식이 아닙니다"),
  phone: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^[\d\-+\s]{9,15}$/.test(v),
      "올바른 연락처 형식이 아닙니다"
    ),
  agreed: z.literal(true, { error: "개인정보 수집·이용에 동의해주세요" }),
});

type FormData = z.infer<typeof schema>;

export default function DiagnosisStep3() {
  const router = useRouter();
  const { step1, step2, result, reset, hydrated } = useDiagnosis();
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register, handleSubmit,
    formState: { errors, dirtyFields },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      companyName: "", contactName: "", contactTitle: "",
      email: "", phone: "",
    },
  });

  const emailValue = watch("email");

  useEffect(() => {
    if (hydrated && (!step1 || !step2 || !result)) {
      router.replace("/diagnosis");
    }
  }, [hydrated, step1, step2, result, router]);

  if (!hydrated || !step1 || !step2 || !result) return null;

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true);
    setApiError(null);

    try {
      const res = await fetch("/api/v1/leads", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName:  data.companyName,
          contactName:  data.contactName,
          contactTitle: data.contactTitle,
          email:        data.email,
          phone:        data.phone ?? null,
          sectorCode:       step1.sectorCode,
          equipCodes:       step1.equipCodes,
          elecTier:         step1.elecTier,
          employeeTier:     step2.employeeTier,
          installYear:      step1.installYear,
          kcuHistory:       step2.kcuHistory,
          etsAllocated:     step2.etsAllocated,
          estimatedNetValue:   result.est_net_value   ?? null,
          estimatedGrossValue: result.est_gross_value ?? null,
          eligibleYears:       result.eligible_years  ?? null,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setApiError(json.error ?? "제출 중 오류가 발생했습니다");
        setLoading(false);
        return;
      }

      reset();
      setSuccess(true);
    } catch {
      setApiError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
      setLoading(false);
    }
  });

  // ── 성공 화면 ───────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex flex-col items-center text-center py-10 gap-5">
        <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center">
          <CheckCircle2Icon className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">신청이 완료됐습니다!</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            영업일 기준 1일 이내에 담당 컨설턴트가 연락드립니다.
          </p>
        </div>

        <div className="w-full p-4 bg-secondary border border-primary/20 rounded-xl text-left">
          <div className="flex items-center gap-2 mb-3">
            <MailIcon className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">결과 리포트 발송 완료</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            입력하신 이메일로 상세 KOC 진단 결과와 다음 절차 안내 메일이 발송됐습니다.
            스팸함도 확인해주세요.
          </p>
        </div>

        {result.est_net_value && (
          <div className="w-full p-4 border border-border rounded-xl">
            <p className="text-xs text-muted-foreground">예상 고객 순수익</p>
            <p className="text-2xl font-extrabold text-primary mt-1">
              {formatKRW(result.est_net_value)}
            </p>
          </div>
        )}

        <div className="w-full text-left space-y-3 mt-2">
          <h3 className="text-sm font-semibold text-foreground">앞으로의 절차</h3>
          {[
            { step: "01", label: "컨설턴트 초기 미팅",  sub: "서비스 범위·조건 상세 협의" },
            { step: "02", label: "위임 계약 체결",       sub: "디지털 서명, 선비용 0원" },
            { step: "03", label: "서류·현장 검증",       sub: "후시파트너스가 전담 처리" },
            { step: "04", label: "KOC 발급 및 판매",     sub: "환경부 승인 후 시장 매각" },
            { step: "05", label: "수익 정산",            sub: "판매 대금의 80% 지급" },
          ].map(({ step, label, sub }) => (
            <div key={step} className="flex gap-3">
              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                {step}
              </span>
              <div className="pt-1">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => router.push("/")}
          className="w-full h-12 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors mt-4"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  // ── 폼 화면 ─────────────────────────────────────────────────────────────────
  const isEmailValid = emailValue && !errors.email;

  return (
    <div>
      <DiagnosisProgress step={4} />

      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground mb-4 -ml-1"
      >
        <ChevronLeftIcon className="w-4 h-4" /> 결과 화면으로
      </button>

      <h1 className="text-xl font-bold text-foreground mb-1">담당자 정보 입력</h1>
      <p className="text-sm text-muted-foreground mb-7">
        정밀 진단 신청 및 결과 리포트 발송을 위해 입력해주세요
      </p>

      {/* 데스크탑: 2열 (폼 + 요약 패널) */}
      <div className="md:grid md:grid-cols-[1fr_260px] md:gap-8 md:items-start">

        <form onSubmit={onSubmit} noValidate className="space-y-5">
          {/* 회사명 + 담당자명 — 데스크탑에서 나란히 */}
          <div className="md:grid md:grid-cols-2 md:gap-4">
            <Field label="회사명" error={errors.companyName?.message} required>
              <input
                {...register("companyName")}
                type="text"
                placeholder="(주)후시파트너스"
                className={inputCls}
              />
            </Field>

            <Field label="담당자명" error={errors.contactName?.message} required>
              <input
                {...register("contactName")}
                type="text"
                placeholder="홍길동"
                className={inputCls}
              />
            </Field>
          </div>

          {/* 직책 */}
          <Field label="직책" error={errors.contactTitle?.message} required>
            <select {...register("contactTitle")} className={selectCls}>
              <option value="">직책을 선택하세요</option>
              {TITLES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>

          {/* 이메일 + 연락처 — 데스크탑에서 나란히 */}
          <div className="md:grid md:grid-cols-2 md:gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                이메일 <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <input
                  {...register("email")}
                  type="email"
                  placeholder="name@company.com"
                  className={[
                    inputCls,
                    "pr-10",
                    dirtyFields.email && errors.email   ? "border-destructive" : "",
                    dirtyFields.email && isEmailValid   ? "border-primary"     : "",
                  ].join(" ")}
                />
                {dirtyFields.email && isEmailValid && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CheckCircle2Icon className="w-4 h-4 text-primary" />
                  </span>
                )}
              </div>
              {errors.email && (
                <p className="text-xs text-destructive mt-1.5">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                연락처 <span className="text-muted-foreground text-xs font-normal">(선택)</span>
              </label>
              <input
                {...register("phone")}
                type="tel"
                placeholder="010-0000-0000"
                className={inputCls}
              />
              {errors.phone && (
                <p className="text-xs text-destructive mt-1.5">{errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* 개인정보 동의 */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                {...register("agreed")}
                type="checkbox"
                className="w-5 h-5 accent-primary flex-shrink-0 mt-0.5"
              />
              <span className="text-sm text-foreground leading-relaxed">
                <span className="font-medium">[필수] 개인정보 수집·이용 동의</span>
                <br />
                <span className="text-xs text-muted-foreground">
                  수집 항목: 회사명, 담당자명, 이메일, 연락처 / 이용 목적: KOC 진단 서비스 제공 및 연락
                </span>
              </span>
            </label>
            {errors.agreed && (
              <p className="text-xs text-destructive mt-1.5 ml-8">{errors.agreed.message}</p>
            )}
          </div>

          {apiError && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-sm text-destructive">
              {apiError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-xl font-semibold text-base flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-70 mt-2"
          >
            {loading ? (
              <>
                <LoaderCircleIcon className="w-5 h-5 animate-spin" />
                신청 중…
              </>
            ) : (
              "정밀 진단 신청하기"
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            선비용 0원 · 성과 수수료 20% · 언제든 취소 가능
          </p>
        </form>

        {/* 오른쪽: 예상 수익 요약 패널 (데스크탑 전용) */}
        <div className="hidden md:block sticky top-24 space-y-3">
          {result.est_net_value && (
            <div className="bg-primary rounded-2xl p-5 text-white">
              <div className="flex items-center gap-1.5 mb-3">
                <LeafIcon className="w-4 h-4 opacity-80" />
                <span className="text-xs opacity-80">예상 고객 순수익</span>
              </div>
              <p className="text-2xl font-extrabold">{formatKRW(result.est_net_value)}</p>
              <div className="mt-3 pt-3 border-t border-white/20 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="opacity-70">KOC 판매 총액</span>
                  <span className="font-semibold">{formatKRW(result.est_gross_value ?? 0)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="opacity-70">후시 수수료</span>
                  <span className="font-semibold">{formatKRW(result.fee_amount ?? 0)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="opacity-70">적격 기간</span>
                  <span className="font-semibold">{result.eligible_years ?? 0}년</span>
                </div>
              </div>
            </div>
          )}

          <div className="border border-border rounded-2xl p-4 bg-white space-y-3">
            {[
              { icon: <ShieldCheckIcon className="w-4 h-4 text-primary" />, text: "선비용 0원 — 결과 없으면 수수료 없음" },
              { icon: <CheckCircle2Icon className="w-4 h-4 text-primary" />, text: "영업일 1일 이내 컨설턴트 연락" },
              { icon: <MailIcon className="w-4 h-4 text-primary" />,         text: "진단 결과 리포트 이메일 발송" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-2.5">
                <div className="flex-shrink-0 mt-0.5">{icon}</div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

const inputCls =
  "w-full h-12 px-3 border border-border rounded-lg bg-white text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors";

const selectCls =
  "w-full h-12 px-3 border border-border rounded-lg bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function Field({
  label, error, required, children,
}: {
  label: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
    </div>
  );
}
