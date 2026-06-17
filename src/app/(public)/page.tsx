"use client";

// A-01 랜딩페이지 — 반응형 (모바일 + 태블릿/노트북)

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ZapIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  ClockIcon,
  CheckCircle2Icon,
  CalendarClockIcon,
  PhoneIcon,
  MailIcon,
  TriangleAlertIcon,
  PlayCircleIcon,
  LeafIcon,
  ArrowRightIcon,
} from "lucide-react";

// ── 상수 ─────────────────────────────────────────────────────────────────────

const STATS = [
  { value: "₩0",      label: "선비용",      sub: "성공 후 수수료" },
  { value: "20%",     label: "성과 수수료", sub: "판매 대금 기준" },
  { value: "최대 5년", label: "소급 적용",  sub: "2021년부터" },
  { value: "18,000",  label: "KOC 참고가",  sub: "원/tCO₂ (26년 기준)" },
] as const;

const STEPS = [
  {
    icon: <ZapIcon className="w-6 h-6" />,
    step: "01",
    tag: "30초 완료",
    title: "무료 진단",
    desc: "업종·설비를 선택하면 예상 KOC 물량과 고객 순수익을 즉시 계산합니다. 개인정보 불필요.",
  },
  {
    icon: <ShieldCheckIcon className="w-6 h-6" />,
    step: "02",
    tag: "전자 서명",
    title: "위임 계약 체결",
    desc: "선비용 없이 전자 서명으로 계약합니다. 진행 중 취소해도 비용이 없습니다.",
  },
  {
    icon: <TrendingUpIcon className="w-6 h-6" />,
    step: "03",
    tag: "판매 대금 80%",
    title: "KOC 발급 및 수익 정산",
    desc: "환경부 심사·승인 후 KOC를 시장에 매각합니다. 판매 대금의 80%를 사업주가 수령합니다.",
  },
] as const;

const EQUIPMENT = [
  { emoji: "💡", label: "LED 조명 교체",        sector: "전 업종" },
  { emoji: "⚙️", label: "인버터 모터",           sector: "제조업" },
  { emoji: "🔥", label: "고효율 보일러",         sector: "제조업" },
  { emoji: "❄️", label: "냉난방 효율화",        sector: "건물·부동산" },
  { emoji: "🚛", label: "전기지게차 전환",       sector: "운수·창고" },
  { emoji: "🌿", label: "기타 에너지 절감 설비", sector: "업종별 상이" },
] as const;

const FAQ_ITEMS = [
  {
    q: "KOC(탄소상쇄크레딧)가 무엇인가요?",
    a: "KOC(Korea Offset Credit)는 에너지 효율화 설비 도입으로 온실가스를 실제 감축한 기업에 환경부가 발급하는 탄소상쇄크레딧입니다. 발급된 KOC는 국내 탄소 시장에서 매각해 현금 수익을 실현할 수 있습니다. 기업 규모·업종에 관계없이 적격 설비가 있다면 신청 가능하며, 이미 투자한 설비로 추가 수익을 만드는 것이 핵심입니다.",
  },
  {
    q: "선비용 0원이 어떻게 가능한가요?",
    a: "후시파트너스는 서류 준비·현장 검증·환경부 접수·KOC 매각까지 전 과정을 선투자해 대행합니다. KOC 판매에 성공한 후에만 판매 대금의 20%를 수수료로 수취하며, 발급에 실패하면 수수료도 0원입니다. 고객은 결과가 나오기 전까지 아무런 비용도 지불하지 않습니다.",
  },
  {
    q: "어떤 설비가 KOC 발급 대상인가요?",
    a: "2021년 이후 도입·교체한 ▲LED 조명 ▲인버터 모터 ▲고효율 보일러 ▲냉난방 효율화 설비 ▲전기지게차가 주요 대상입니다. 단, 이미 타 온실가스 감축 사업(KCU·REC 등)에 등록된 설비는 중복 신청이 제한됩니다. 30초 무료 진단으로 설비별 적격 여부를 즉시 확인하세요.",
  },
  {
    q: "KOC 발급까지 얼마나 걸리나요?",
    a: "계약 체결 후 현장 검증 → 방법론 검토 → 환경부 제출 → 심사·승인 순으로 진행되며, 통상 4~9개월이 소요됩니다. 이 기간 동안 모든 행정 절차는 후시파트너스가 전담하며, 고객 포털에서 단계별 진행 현황을 실시간으로 확인하실 수 있습니다.",
  },
  {
    q: "신청 과정에서 기업이 직접 해야 하는 일이 있나요?",
    a: "설비 관련 기초 자료(설치 확인서, 전기 사용량 증빙 등) 제출만 협조해 주시면 됩니다. 방법론 작성·현장 검증 일정 조율·환경부 접수·KOC 매각까지 후시파트너스가 전담하므로, 담당자 업무 부담은 최소화됩니다.",
  },
  {
    q: "K-ETS(배출권거래제) 할당 대상 기업도 신청할 수 있나요?",
    a: "K-ETS 할당 기업은 동일 설비로 외부 감축 사업을 중복 신청하기 어려울 수 있습니다. 다만 ETS 할당 범위 밖의 설비이거나 일부 방법론에서는 예외가 있을 수 있습니다. 30초 진단 후 컨설턴트가 개별 적격 여부를 정확하게 안내해드립니다.",
  },
  {
    q: "KOC 판매 수익에도 세금을 내야 하나요?",
    a: "KOC 판매 수익은 일반적으로 영업 외 수익(잡수익)으로 회계 처리하며 법인세 과세 대상이 됩니다. 정확한 세무·회계 처리 방식은 기업의 업종과 회계 기준에 따라 다를 수 있으므로 담당 세무사와 확인하시기를 권장합니다. 계약 체결 시 관련 참고 자료를 함께 제공해드립니다.",
  },
] as const;

// 부스 시연용 데모 데이터
const DEMO_PAYLOAD = {
  step1: {
    sectorCode:  "manufacturing",
    equipCodes:  ["led", "inverter"],
    elecTier:    3,
    installYear: 2022,
  },
  step2: {
    employeeTier: 2,
    kcuHistory:   "none" as const,
    etsAllocated: false,
  },
  result: {
    eligible:         true,
    est_kcu_volume:   840,
    eligible_years:   3,
    est_gross_value:  15120000,
    fee_amount:       3024000,
    est_net_value:    12096000,
    fee_rate:         0.20,
    kcu_price_ref:    18000,
    is_multi_equip:   true,
    breakdown: [
      { equip_code: "led",      est_kcu_vol: 480 },
      { equip_code: "inverter", est_kcu_vol: 360 },
    ],
  },
  ts: 0,
};

// ── 서브컴포넌트 ─────────────────────────────────────────────────────────────

function ResultPreviewCard() {
  return (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
      {/* 진행바 */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 bg-muted">
        <div className="flex gap-1 flex-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-colors ${i <= 3 ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground">3 / 4 단계</span>
      </div>

      {/* 결과 카드 */}
      <div className="p-5 bg-primary text-white">
        <div className="flex items-center gap-1.5 mb-3">
          <LeafIcon className="w-4 h-4 opacity-80" />
          <span className="text-xs opacity-80">예상 고객 순수익</span>
        </div>
        <p className="text-3xl font-extrabold tracking-tight">₩12,096,000</p>
        <p className="text-xs opacity-70 mt-1">범위: ₩9,676,800 ~ ₩14,515,200</p>

        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/20">
          {[
            { label: "예상 KOC 물량",   value: "840 tCO₂" },
            { label: "KOC 판매 총액",   value: "₩15,120,000" },
            { label: "후시 수수료(20%)", value: "₩3,024,000" },
            { label: "적격 기간",       value: "3년" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] opacity-60">{label}</p>
              <p className="text-xs font-semibold mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 적격 설비 태그 */}
      <div className="px-4 py-3 bg-white">
        <div className="flex gap-1.5 flex-wrap mb-3">
          {["LED 조명 교체", "인버터 모터"].map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 text-[11px] bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full font-medium"
            >
              <CheckCircle2Icon className="w-3 h-3 text-primary" />
              {label}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex-1 h-9 bg-primary rounded-lg flex items-center justify-center text-white text-xs font-semibold">
            정밀 진단 신청
          </div>
          <div className="flex-1 h-9 bg-muted rounded-lg flex items-center justify-center text-foreground text-xs">
            전문가 미팅
          </div>
        </div>
      </div>

      {/* KOC 기준 주석 */}
      <div className="px-4 py-2 bg-muted/60 border-t border-border">
        <p className="text-[10px] text-muted-foreground">
          KOC 참고가 18,000원/tCO₂ 기준 · 2026년 6월 기준 · 예상치
        </p>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router                       = useRouter();
  const [openFaq, setOpenFaq]        = useState<number | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  // 히어로 영역을 벗어나면 고정 CTA 바 노출 (모바일 전용)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  // 부스 시연용: 데모 데이터 주입 후 결과 화면으로 이동
  const handleDemoScenario = () => {
    setDemoLoading(true);
    try {
      localStorage.setItem(
        "hooxi_dx_v1",
        JSON.stringify({ ...DEMO_PAYLOAD, ts: Date.now() })
      );
    } catch { /* quota/private */ }
    router.push("/result");
  };

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════
          DESKTOP HEADER
      ════════════════════════════════════════════════════════════════ */}
      <header className="hidden md:flex items-center h-14 border-b border-white/10 bg-transparent absolute top-0 left-0 right-0 z-50">
        <div className="section-inner flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-lg">탄소잇</span>
            <span className="text-xs text-white/60">by 후시파트너스</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#how-it-works" className="text-sm text-white/80 hover:text-white transition-colors">서비스 소개</a>
            <a href="#equipment"    className="text-sm text-white/80 hover:text-white transition-colors">대상 설비</a>
            <a href="#faq"          className="text-sm text-white/80 hover:text-white transition-colors">FAQ</a>
            <Link
              href="/diagnosis"
              className="inline-flex items-center h-9 px-4 bg-white text-primary rounded-lg text-sm font-semibold hover:bg-green-50 transition-colors"
            >
              무료 진단
            </Link>
          </nav>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="w-full bg-gradient-to-br from-primary via-green-600 to-emerald-700 text-white"
      >
        <div className="section-inner pt-10 pb-12 md:pt-28 md:pb-20">
          <div className="md:grid md:grid-cols-2 md:gap-16 md:items-center">

            {/* 왼쪽: 텍스트 + CTA */}
            <div>
              {/* 모바일 전용 브랜드 로고 */}
              <div className="mb-6 md:hidden">
                <span className="font-bold text-white text-xl">탄소잇</span>
                <span className="text-xs text-white/60 ml-1">by 후시파트너스</span>
              </div>

              {/* 헤드라인 */}
              <h1 className="text-[30px] md:text-[42px] lg:text-[52px] font-extrabold leading-[1.15] mb-4">
                우리 회사에도<br />
                <span className="text-green-200">숨은 탄소배출권</span>이<br />
                있을 수 있습니다
              </h1>

              <p className="text-sm md:text-base leading-relaxed opacity-90 mb-2">
                2021년 이후 교체한 LED·인버터·보일러…<br />
                이미 투자한 설비로 <strong>KOC 판매 수익</strong>을 받을 수 있습니다.
              </p>

              {/* 뱃지 */}
              <div className="flex gap-2 flex-wrap mb-8">
                {["선비용 0원", "성과 수수료 20%", "영업일 1일 내 연락"].map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/15 rounded-full text-[11px] md:text-xs font-medium"
                  >
                    <CheckCircle2Icon className="w-3 h-3" /> {t}
                  </span>
                ))}
              </div>

              {/* CTA 버튼 그룹 */}
              <div className="flex flex-col md:flex-row gap-3 md:max-w-sm">
                <Link
                  href="/diagnosis"
                  className="flex items-center justify-center gap-2 h-14 md:h-12 bg-white text-primary rounded-xl font-bold text-[15px] md:text-sm shadow-xl hover:bg-green-50 active:scale-[.98] transition-all flex-1"
                >
                  30초 무료 수익 계산하기
                  <ChevronRightIcon className="w-5 h-5 md:w-4 md:h-4" />
                </Link>

                {/* 부스 시연용 데모 버튼 (데스크탑 전용) */}
                <button
                  type="button"
                  onClick={handleDemoScenario}
                  disabled={demoLoading}
                  className="hidden md:flex items-center justify-center gap-2 h-12 px-5 bg-white/15 border border-white/30 text-white rounded-xl font-semibold text-sm hover:bg-white/25 transition-all disabled:opacity-60 shrink-0"
                >
                  <PlayCircleIcon className="w-4 h-4" />
                  {demoLoading ? "로딩 중…" : "시나리오 체험"}
                </button>
              </div>

              <p className="text-center md:text-left text-[11px] opacity-70 mt-3">
                개인정보 없이 예상 수익 먼저 확인
              </p>

              {/* 안내 박스 */}
              <div className="mt-5 p-3 bg-white/10 rounded-xl flex items-start gap-2.5">
                <ZapIcon className="w-4 h-4 opacity-80 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] opacity-90 leading-relaxed">
                  결과를 먼저 확인한 후 신청 여부를 결정하세요.
                  예상 수익 확인에는 개인·사업자 정보가 필요하지 않습니다.
                </p>
              </div>
            </div>

            {/* 오른쪽: 결과 화면 미리보기 (데스크탑 전용) */}
            <div className="hidden md:block">
              <div className="relative max-w-sm mx-auto">
                <ResultPreviewCard />
                {/* 긴급 마감 배지 */}
                <div className="absolute -top-3 -right-3 bg-amber-400 text-amber-900 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                  2021~2022년 설비 마감 임박!
                </div>
                {/* 데모 시나리오 설명 */}
                <p className="text-center text-[11px] text-white/60 mt-3">
                  ↑ 제조업 · LED+인버터 · 2022년 설치 시 예상 결과
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          KEY METRICS
      ════════════════════════════════════════════════════════════════ */}
      <section className="w-full bg-white border-b border-border">
        <div className="section-inner py-8 md:py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {STATS.map(({ value, label, sub }) => (
              <div
                key={label}
                className="bg-muted rounded-2xl p-4 md:p-5 text-center hover:bg-secondary/50 transition-colors"
              >
                <p className="text-2xl md:text-3xl font-extrabold text-primary leading-none">{value}</p>
                <p className="text-sm font-semibold text-foreground mt-1">{label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="w-full bg-muted">
        <div className="section-inner py-9 md:py-16">
          <div className="mb-6 md:mb-10 md:text-center">
            <h2 className="text-[18px] md:text-2xl font-bold text-foreground mb-1">이렇게 진행됩니다</h2>
            <p className="text-sm md:text-base text-muted-foreground">복잡한 행정은 후시파트너스가 전담합니다</p>
          </div>

          {/* 모바일: 세로 카드 스택 / 데스크탑: 3열 수평 */}
          <div className="space-y-3.5 md:space-y-0 md:grid md:grid-cols-3 md:gap-6">
            {STEPS.map(({ icon, step, tag, title, desc }, idx) => (
              <div key={step} className="relative">
                <div className="bg-white rounded-2xl p-5 md:p-6 flex gap-4 md:flex-col md:gap-3 items-start shadow-sm h-full">
                  <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-bold text-primary">STEP {step}</span>
                      <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-semibold">
                        {tag}
                      </span>
                    </div>
                    <p className="text-sm md:text-base font-bold text-foreground">{title}</p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1.5 leading-relaxed">{desc}</p>
                  </div>
                </div>

                {/* 데스크탑 연결 화살표 */}
                {idx < STEPS.length - 1 && (
                  <div className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-primary text-white items-center justify-center shadow">
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 md:mt-10 flex justify-center">
            <Link
              href="/diagnosis"
              className="flex items-center gap-2 px-8 h-12 md:h-14 bg-primary text-primary-foreground rounded-xl font-semibold text-sm md:text-base hover:bg-primary/90 transition-colors shadow-md"
            >
              지금 무료 진단 시작
              <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          대상 설비
      ════════════════════════════════════════════════════════════════ */}
      <section id="equipment" className="w-full bg-white">
        <div className="section-inner py-9 md:py-16">
          <div className="mb-5 md:mb-8 md:text-center">
            <h2 className="text-[18px] md:text-2xl font-bold text-foreground mb-1">이런 설비가 대상입니다</h2>
            <p className="text-sm md:text-base text-muted-foreground">
              2021년 이후 도입한 설비 중 해당 항목 확인
            </p>
          </div>

          {/* 모바일: 2열 / 데스크탑: 3열 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
            {EQUIPMENT.map(({ emoji, label, sector }) => (
              <div
                key={label}
                className="border border-border rounded-2xl p-4 md:p-5 bg-white hover:border-primary/40 hover:bg-secondary/50 transition-colors cursor-default"
              >
                <span className="text-2xl md:text-3xl leading-none">{emoji}</span>
                <p className="text-[13px] md:text-sm font-semibold text-foreground mt-2.5 leading-tight">{label}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{sector}</p>
              </div>
            ))}
          </div>

          {/* 긴급 마감 안내 */}
          <div className="p-4 md:p-5 bg-amber-50 border border-amber-300 rounded-2xl flex gap-3 items-start">
            <TriangleAlertIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">신청 가능 기간을 확인하세요</p>
              <p className="text-xs md:text-sm text-amber-800 mt-1 leading-relaxed">
                KOC는 설치 후 <strong>최대 5년</strong> 이내만 신청 가능합니다.
                2021년 설치 설비는 <strong>2026년이 마감</strong>입니다. 지금 바로 확인하세요.
              </p>
              <Link
                href="/diagnosis"
                className="inline-flex items-center gap-1 mt-2.5 text-xs font-semibold text-amber-700 underline underline-offset-2"
              >
                기간 내 신청 가능 여부 확인 <ChevronRightIcon className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          TRUST / WHY HOOXI
      ════════════════════════════════════════════════════════════════ */}
      <section className="w-full bg-primary/5 border-y border-primary/10">
        <div className="section-inner py-9 md:py-16">
          <div className="mb-6 md:mb-10 md:text-center">
            <h2 className="text-[18px] md:text-2xl font-bold text-foreground mb-1">후시파트너스가 다른 이유</h2>
            <p className="text-sm md:text-base text-muted-foreground">결과가 없으면 수수료도 없습니다</p>
          </div>

          {/* 모바일: 세로 / 데스크탑: 2열 그리드 */}
          <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
            {[
              {
                icon: <ShieldCheckIcon className="w-5 h-5 text-primary" />,
                title: "완전 성과 보수제",
                desc: "KOC 판매 대금 수령 후 20% 수수료. 발급 실패 시 0원.",
              },
              {
                icon: <ZapIcon className="w-5 h-5 text-primary" />,
                title: "풀서비스 대행",
                desc: "서류 작성, 현장 검증, 환경부 접수, 판매까지 전 과정 대행.",
              },
              {
                icon: <CalendarClockIcon className="w-5 h-5 text-primary" />,
                title: "실시간 진행 현황 공유",
                desc: "고객 포털에서 단계별 진행 상황을 언제든 확인 가능.",
              },
              {
                icon: <TrendingUpIcon className="w-5 h-5 text-primary" />,
                title: "최적 매각 타이밍",
                desc: "KOC 참고가를 모니터링해 최적 시점에 매각, 수익 극대화.",
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-3 items-start bg-white rounded-2xl p-4 md:p-5 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {icon}
                </div>
                <div>
                  <p className="text-sm md:text-base font-semibold text-foreground">{title}</p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FAQ
      ════════════════════════════════════════════════════════════════ */}
      <section id="faq" className="w-full bg-white">
        <div className="section-inner py-9 md:py-16">
          <h2 className="text-[18px] md:text-2xl font-bold text-foreground mb-5 md:mb-8">자주 묻는 질문</h2>

          <div className="space-y-2 md:max-w-3xl md:mx-auto">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="border border-border rounded-2xl overflow-hidden bg-white">
                <button
                  type="button"
                  aria-expanded={openFaq === i}
                  className="w-full flex items-center gap-3 p-4 md:p-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-[13px] md:text-sm font-medium text-foreground flex-1 leading-relaxed">
                    {item.q}
                  </span>
                  <ChevronDownIcon
                    className={[
                      "w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200",
                      openFaq === i ? "rotate-180" : "",
                    ].join(" ")}
                  />
                </button>
                <div
                  className={[
                    "overflow-hidden transition-all duration-200",
                    openFaq === i ? "max-h-96" : "max-h-0",
                  ].join(" ")}
                >
                  <p className="px-4 md:px-5 pb-4 md:pb-5 text-[13px] md:text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                    {item.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          BOTTOM CTA
      ════════════════════════════════════════════════════════════════ */}
      <section className="w-full bg-gradient-to-br from-primary to-green-700 text-white">
        <div className="section-inner py-12 md:py-16">
          <div className="text-center md:max-w-xl md:mx-auto">
            <div className="flex justify-center mb-5">
              <span className="font-bold text-white text-xl">탄소잇</span>
              <span className="text-xs text-white/60 ml-1 self-end mb-0.5">by 후시파트너스</span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold mb-2 leading-tight">
              지금 확인하지 않으면<br />기회를 놓칠 수 있습니다
            </h2>
            <p className="text-sm md:text-base opacity-85 mb-8 leading-relaxed">
              2021~2022년 설비는 신청 마감이 임박했습니다.<br />
              30초 무료 진단으로 지금 바로 확인하세요.
            </p>

            <div className="flex flex-col md:flex-row gap-3 md:justify-center">
              <Link
                href="/diagnosis"
                className="flex items-center justify-center gap-2 h-14 md:h-12 md:px-8 bg-white text-primary rounded-xl font-bold text-[15px] md:text-sm shadow-xl hover:bg-green-50 active:scale-[.98] transition-all"
              >
                무료 수익 계산 시작
                <ChevronRightIcon className="w-5 h-5 md:w-4 md:h-4" />
              </Link>

              {/* 부스 시연용 빠른 체험 버튼 (데스크탑) */}
              <button
                type="button"
                onClick={handleDemoScenario}
                disabled={demoLoading}
                className="hidden md:flex items-center justify-center gap-2 h-12 px-6 bg-white/15 border border-white/30 text-white rounded-xl font-semibold text-sm hover:bg-white/25 transition-all"
              >
                <PlayCircleIcon className="w-4 h-4" />
                시나리오 결과 바로보기
              </button>
            </div>

            <p className="text-[11px] opacity-65 mt-3">선비용 없음 · 개인정보 없이 먼저 확인</p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════════════ */}
      <footer className="w-full bg-white border-t-2 border-[#55b4a5]/30">
        <div className="section-inner pt-8 pb-28 md:pb-10">
          {/* 데스크탑: 좌우 분할 / 모바일: 세로 스택 */}
          <div className="md:flex md:items-start md:justify-between md:gap-12">

            {/* 좌측: 브랜드 + 연락처 */}
            <div className="mb-5 md:mb-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hooxi_logo_dark.svg" alt="HOOXI Partners" width={88} height={38} className="mb-5" />

              <div className="space-y-2">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MailIcon className="w-3.5 h-3.5 flex-shrink-0 text-[#55b4a5]" />
                  <a href="mailto:yulia@hooxipartners.com" className="hover:text-[#55b4a5] transition-colors">
                    yulia@hooxipartners.com
                  </a>
                </p>
                <p className="flex items-start gap-2 text-xs text-muted-foreground">
                  <ClockIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#55b4a5]" />
                  <span>서울특별시 영등포구 의사당대로 83 오투타워 19층</span>
                </p>
              </div>
            </div>

            {/* 우측: 법인 정보 + 링크 */}
            <div className="md:text-right">
              <div className="border-t border-border mb-4 md:hidden" />

              <div className="text-[11px] text-muted-foreground leading-relaxed space-y-1 mb-4">
                <p><span className="text-[#606060] font-medium">주식회사 후시파트너스</span></p>
                <p>공동대표 이행열 · 조성훈</p>
                <p>사업자등록번호 529-81-02298</p>
              </div>

              <div className="flex gap-4 flex-wrap md:justify-end">
                <a
                  href="https://www.hooxipartners.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#55b4a5] font-medium hover:underline transition-colors"
                >
                  hooxipartners.com ↗
                </a>
                <button type="button" className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                  이용약관
                </button>
                <button type="button" className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                  개인정보처리방침
                </button>
              </div>

              <p className="text-[10px] text-muted-foreground/50 mt-3">
                © 2026 주식회사 후시파트너스. All rights reserved.
              </p>
            </div>

          </div>
        </div>
      </footer>

      {/* ════════════════════════════════════════════════════════════════
          STICKY BOTTOM BAR (모바일 전용 — 히어로 영역 벗어난 후 노출)
      ════════════════════════════════════════════════════════════════ */}
      <div
        className={[
          "fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 md:hidden",
          showStickyBar ? "translate-y-0" : "translate-y-full",
        ].join(" ")}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="bg-white border-t border-border shadow-2xl px-4 py-3 max-w-[390px] mx-auto">
          <Link
            href="/diagnosis"
            className="flex items-center justify-center gap-2 w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 active:scale-[.98] transition-all shadow-md"
          >
            무료 수익 계산하기
            <ChevronRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </>
  );
}
