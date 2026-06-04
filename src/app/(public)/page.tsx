"use client";

// A-01 랜딩페이지

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
} from "lucide-react";

// ── 데이터 ─────────────────────────────────────────────────────────────────
const STATS = [
  { value: "₩0",    label: "선비용",      sub: "성공 후 수수료" },
  { value: "20%",   label: "성과 수수료", sub: "판매 대금 기준" },
  { value: "최대 5년", label: "소급 적용", sub: "2021년부터" },
  { value: "16,000", label: "KCU 시장가", sub: "원/tCO₂ (25년)" },
] as const;

const STEPS = [
  {
    icon: <ZapIcon className="w-5 h-5" />,
    step: "01",
    tag: "30초 완료",
    title: "무료 진단",
    desc: "업종·설비를 선택하면 예상 KCU 물량과 고객 순수익을 즉시 계산합니다. 개인정보 불필요.",
  },
  {
    icon: <ShieldCheckIcon className="w-5 h-5" />,
    step: "02",
    tag: "전자 서명",
    title: "위임 계약 체결",
    desc: "선비용 없이 전자 서명으로 계약합니다. 진행 중 취소해도 비용이 없습니다.",
  },
  {
    icon: <TrendingUpIcon className="w-5 h-5" />,
    step: "03",
    tag: "판매 대금 80%",
    title: "KCU 발급 및 수익 정산",
    desc: "환경부 심사·승인 후 KCU를 시장에 매각합니다. 판매 대금의 80%를 사업주가 수령합니다.",
  },
] as const;

const EQUIPMENT = [
  { emoji: "💡", label: "LED 조명 교체",    sector: "전 업종" },
  { emoji: "⚙️", label: "인버터 모터",      sector: "제조업" },
  { emoji: "🔥", label: "고효율 보일러",    sector: "제조업" },
  { emoji: "❄️", label: "냉난방 효율화",   sector: "건물·부동산" },
  { emoji: "🚛", label: "전기지게차 전환", sector: "운수·창고" },
  { emoji: "🌿", label: "기타 에너지 절감 설비", sector: "업종별 상이" },
] as const;

const FAQ_ITEMS = [
  {
    q: "KCU(한국형 탄소배출권)가 무엇인가요?",
    a: "KCU(Korean Carbon Unit)는 에너지 효율화 설비를 도입해 온실가스를 줄인 기업에 환경부가 발급하는 탄소배출권입니다. 발급된 KCU는 배출권 거래소에서 매각해 현금 수익을 실현할 수 있습니다.",
  },
  {
    q: "선비용 0원이 어떻게 가능한가요?",
    a: "후시파트너스는 서류 준비·현장 검증·환경부 접수 등 전 과정을 대행하며 선투자합니다. KCU 판매에 성공한 후에만 판매 대금의 20%를 수수료로 수취하므로, 고객의 초기 비용은 0원입니다.",
  },
  {
    q: "어떤 설비가 KCU 발급 대상인가요?",
    a: "2021년 이후 도입한 ▲LED 조명 ▲인버터 모터 ▲고효율 보일러 ▲냉난방 효율화 설비 ▲전기지게차가 주요 대상입니다. 업종별로 적용 가능한 설비가 다르므로 30초 무료 진단으로 먼저 확인하세요.",
  },
  {
    q: "KCU를 받기까지 얼마나 걸리나요?",
    a: "계약 체결 후 현장 검증 → 환경부 제출 → 심사를 거쳐 통상 4~9개월이 소요됩니다. 이 기간 동안 모든 행정 절차는 후시파트너스가 전담합니다.",
  },
  {
    q: "ETS 할당 기업도 신청할 수 있나요?",
    a: "ETS(배출권거래제) 할당 대상 기업은 중복 신청에 제한이 있을 수 있습니다. 30초 진단을 통해 개별 적격 여부를 확인해드립니다.",
  },
] as const;

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [openFaq,      setOpenFaq]      = useState<number | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  // 히어로 영역을 벗어나면 고정 CTA 바 노출
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="-mx-4 bg-gradient-to-br from-primary via-green-600 to-emerald-700 text-white px-4 pt-10 pb-12"
      >
        {/* 브랜드 로고 */}
        <div className="mb-6">
          <span className="font-bold text-white text-xl">탄소잇</span>
          <span className="text-xs text-white/60 ml-1">by 후시파트너스</span>
        </div>

        {/* 헤드라인 */}
        <h1 className="text-[30px] font-extrabold leading-[1.2] mb-4">
          우리 회사에도<br />
          <span className="text-green-200">숨은 탄소배출권</span>이<br />
          있을 수 있습니다
        </h1>

        <p className="text-sm leading-relaxed opacity-90 mb-2">
          2021년 이후 교체한 LED·인버터·보일러…<br />
          이미 투자한 설비로 <strong>KCU 판매 수익</strong>을 받을 수 있습니다.
        </p>

        {/* 뱃지 */}
        <div className="flex gap-2 flex-wrap mb-8">
          {["선비용 0원", "성과 수수료 20%", "영업일 1일 내 연락"].map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/15 rounded-full text-[11px] font-medium"
            >
              <CheckCircle2Icon className="w-3 h-3" /> {t}
            </span>
          ))}
        </div>

        {/* 메인 CTA */}
        <Link
          href="/diagnosis"
          className="flex items-center justify-center gap-2 w-full h-14 bg-white text-primary rounded-xl font-bold text-[15px] shadow-xl hover:bg-green-50 active:scale-[.98] transition-all"
        >
          30초 무료 수익 계산하기
          <ChevronRightIcon className="w-5 h-5" />
        </Link>

        <p className="text-center text-[11px] opacity-70 mt-3">
          개인정보 없이 예상 수익 먼저 확인
        </p>

        {/* 안내 박스 */}
        <div className="mt-6 p-3 bg-white/10 rounded-xl flex items-start gap-2.5">
          <ZapIcon className="w-4 h-4 opacity-80 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] opacity-90 leading-relaxed">
            결과를 먼저 확인한 후 신청 여부를 결정하세요.
            예상 수익 확인에는 개인·사업자 정보가 필요하지 않습니다.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          KEY METRICS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-8">
        <div className="grid grid-cols-2 gap-3">
          {STATS.map(({ value, label, sub }) => (
            <div key={label} className="bg-muted rounded-2xl p-4 text-center">
              <p className="text-2xl font-extrabold text-primary leading-none">{value}</p>
              <p className="text-sm font-semibold text-foreground mt-1">{label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="-mx-4 bg-muted px-4 py-9">
        <h2 className="text-[18px] font-bold text-foreground mb-1">이렇게 진행됩니다</h2>
        <p className="text-sm text-muted-foreground mb-6">복잡한 행정은 후시파트너스가 전담합니다</p>

        <div className="space-y-3.5">
          {STEPS.map(({ icon, step, tag, title, desc }) => (
            <div key={step} className="bg-white rounded-2xl p-4.5 flex gap-4 items-start shadow-sm">
              <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold text-primary">STEP {step}</span>
                  <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-semibold">
                    {tag}
                  </span>
                </div>
                <p className="text-sm font-bold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 연결선 시각화 */}
        <div className="mt-5 flex justify-center">
          <Link
            href="/diagnosis"
            className="flex items-center gap-2 px-6 h-12 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            지금 무료 진단 시작
            <ChevronRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          대상 설비
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-9">
        <h2 className="text-[18px] font-bold text-foreground mb-1">이런 설비가 대상입니다</h2>
        <p className="text-sm text-muted-foreground mb-5">
          2021년 이후 도입한 설비 중 해당 항목 확인
        </p>

        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {EQUIPMENT.map(({ emoji, label, sector }) => (
            <div
              key={label}
              className="border border-border rounded-2xl p-4 bg-white hover:border-primary/40 hover:bg-secondary/50 transition-colors"
            >
              <span className="text-2xl leading-none">{emoji}</span>
              <p className="text-[13px] font-semibold text-foreground mt-2.5 leading-tight">{label}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{sector}</p>
            </div>
          ))}
        </div>

        {/* 긴급 마감 안내 */}
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex gap-3 items-start">
          <TriangleAlertIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">신청 가능 기간을 확인하세요</p>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              KCU는 설치 후 <strong>최대 5년</strong> 이내만 신청 가능합니다.
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
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          TRUST / WHY HOOXI
      ══════════════════════════════════════════════════════════════════ */}
      <section className="-mx-4 bg-primary/5 border-y border-primary/10 px-4 py-9">
        <h2 className="text-[18px] font-bold text-foreground mb-1">후시파트너스가 다른 이유</h2>
        <p className="text-sm text-muted-foreground mb-6">결과가 없으면 수수료도 없습니다</p>

        <div className="space-y-3">
          {[
            {
              icon: <ShieldCheckIcon className="w-5 h-5 text-primary" />,
              title: "완전 성과 보수제",
              desc: "KCU 판매 대금 수령 후 20% 수수료. 발급 실패 시 0원.",
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
              desc: "KCU 시장가를 모니터링해 최적 시점에 매각, 수익 극대화.",
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex gap-3 items-start bg-white rounded-2xl p-4 shadow-sm">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-9">
        <h2 className="text-[18px] font-bold text-foreground mb-5">자주 묻는 질문</h2>

        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="border border-border rounded-2xl overflow-hidden bg-white">
              <button
                type="button"
                aria-expanded={openFaq === i}
                className="w-full flex items-center gap-3 p-4 text-left"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="text-[13px] font-medium text-foreground flex-1 leading-relaxed">
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
                  openFaq === i ? "max-h-64" : "max-h-0",
                ].join(" ")}
              >
                <p className="px-4 pb-4 text-[13px] text-muted-foreground leading-relaxed border-t border-border pt-3">
                  {item.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          BOTTOM CTA
      ══════════════════════════════════════════════════════════════════ */}
      <section className="-mx-4 bg-gradient-to-br from-primary to-green-700 text-white px-4 py-12">
        <div className="text-center">
          {/* 브랜드 로고 */}
          <div className="flex justify-center mb-5">
            <span className="font-bold text-white text-xl">탄소잇</span>
            <span className="text-xs text-white/60 ml-1 self-end mb-0.5">by 후시파트너스</span>
          </div>
          <h2 className="text-xl font-extrabold mb-2 leading-tight">
            지금 확인하지 않으면<br />기회를 놓칠 수 있습니다
          </h2>
          <p className="text-sm opacity-85 mb-6 leading-relaxed">
            2021~2022년 설비는 신청 마감이 임박했습니다.<br />
            30초 무료 진단으로 지금 바로 확인하세요.
          </p>

          <Link
            href="/diagnosis"
            className="flex items-center justify-center gap-2 w-full h-14 bg-white text-primary rounded-xl font-bold text-[15px] shadow-xl hover:bg-green-50 active:scale-[.98] transition-all mb-3"
          >
            무료 수익 계산 시작
            <ChevronRightIcon className="w-5 h-5" />
          </Link>

          <p className="text-[11px] opacity-65">선비용 없음 · 개인정보 없이 먼저 확인</p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════════ */}
      <footer className="-mx-4 px-4 pt-8 pb-28 border-t-2 border-[#55b4a5]/30 bg-white">
        {/* 후시파트너스 로고 */}
        <div className="mb-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hooxi_logo_dark.svg"
            alt="HOOXI Partners"
            width={88}
            height={38}
          />
        </div>

        {/* 연락처 */}
        <div className="space-y-2 mb-5">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <MailIcon className="w-3.5 h-3.5 flex-shrink-0 text-[#55b4a5]" />
            <a
              href="mailto:yulia@hooxipartners.com"
              className="hover:text-[#55b4a5] transition-colors"
            >
              yulia@hooxipartners.com
            </a>
          </p>
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <ClockIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#55b4a5]" />
            <span>서울특별시 영등포구 의사당대로 83 오투타워 19층</span>
          </p>
        </div>

        {/* 구분선 */}
        <div className="border-t border-border mb-4" />

        {/* 법인 정보 */}
        <div className="text-[11px] text-muted-foreground leading-relaxed space-y-1">
          <p><span className="text-[#606060] font-medium">주식회사 후시파트너스</span></p>
          <p>공동대표 이행열 · 조성훈</p>
          <p>사업자등록번호 529-81-02298</p>
        </div>

        {/* 하단 링크 */}
        <div className="flex gap-4 mt-4 flex-wrap">
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
      </footer>

      {/* ══════════════════════════════════════════════════════════════════
          STICKY BOTTOM BAR (히어로 영역 벗어난 후 노출)
      ══════════════════════════════════════════════════════════════════ */}
      <div
        className={[
          "fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300",
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
