"use client";

import {
  useEffect, useState, useCallback, useMemo, useRef,
} from "react";
import {
  PhoneIcon, MailIcon, UserCheckIcon, StickyNoteIcon,
  ChevronDownIcon, ChevronUpIcon, SearchIcon, FlameIcon,
  ThermometerIcon, SnowflakeIcon, ListIcon, ZapIcon,
  CheckCircle2Icon, RefreshCwIcon,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { formatKRW }    from "@/lib/utils";
import { EQUIP_LABEL }  from "@/lib/diagnosis-data";
import type { Database, LeadStatus, LeadTier } from "@/types/supabase";
import type { AdminRole }                      from "@/types";
import type { ConsultantItem }                 from "@/app/api/v1/admin/consultants/route";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

// ── 상수 ──────────────────────────────────────────────────────────────────────
type Filter = "ALL" | "HOT" | "WARM" | "COLD";

const STATUS_LABELS: Record<LeadStatus, string> = {
  new:           "신규",
  contacted:     "연락됨",
  qualified:     "적격",
  contracted:    "계약",
  processing:    "처리중",
  completed:     "완료",
  disqualified:  "부적격",
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  new:          "bg-blue-100 text-blue-700",
  contacted:    "bg-yellow-100 text-yellow-700",
  qualified:    "bg-green-100 text-green-700",
  contracted:   "bg-emerald-100 text-emerald-700",
  processing:   "bg-purple-100 text-purple-700",
  completed:    "bg-gray-200 text-gray-600",
  disqualified: "bg-red-100 text-red-600",
};

const TIER_COLORS: Record<string, string> = {
  A: "bg-red-500 text-white",
  B: "bg-orange-400 text-white",
  C: "bg-yellow-400 text-white",
  D: "bg-slate-300 text-slate-700",
};

function tierLabel(tier: LeadTier | null): string {
  if (!tier) return "─";
  return { A: "HOT", B: "WARM", C: "COOL", D: "COLD" }[tier] ?? tier;
}

function tierFilter(tier: LeadTier | null): Filter {
  if (tier === "A") return "HOT";
  if (tier === "B" || tier === "C") return "WARM";
  return "COLD";
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)   return "방금";
  if (m < 60)  return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function sortLeads(leads: LeadRow[]): LeadRow[] {
  return [...leads].sort((a, b) => {
    // HOT 최상단 고정
    if (a.tier === "A" && b.tier !== "A") return -1;
    if (b.tier === "A" && a.tier !== "A") return 1;
    return (b.score ?? 0) - (a.score ?? 0);
  });
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  initialLeads: LeadRow[];
  role:         AdminRole;
}

// ══════════════════════════════════════════════════════════════════════════════
// 메인 클라이언트 컴포넌트
// ══════════════════════════════════════════════════════════════════════════════
export function LeadsClient({ initialLeads, role }: Props) {
  const [leads,       setLeads]      = useState<LeadRow[]>(sortLeads(initialLeads));
  const [filter,      setFilter]     = useState<Filter>("ALL");
  const [search,      setSearch]     = useState("");
  const [selectedId,  setSelectedId] = useState<string | null>(null);
  const [newIds,      setNewIds]     = useState<Set<string>>(new Set());  // Realtime 플래시
  const [realtimeOk,  setRealtimeOk] = useState(false);
  const flashTimer    = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ── Realtime 구독 ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

    const supabase = createClient();
    const channel  = supabase
      .channel("admin-leads-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" },
        (payload) => {
          const row = payload.new as LeadRow;
          setLeads((prev) => sortLeads([row, ...prev]));
          setNewIds((s) => { const n = new Set(s); n.add(row.id); return n; });
          clearTimeout(flashTimer.current);
          flashTimer.current = setTimeout(
            () => setNewIds((s) => { const n = new Set(s); n.delete(row.id); return n; }),
            4000
          );
        }
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "leads" },
        (payload) => {
          const row = payload.new as LeadRow;
          setLeads((prev) => sortLeads(prev.map((l) => l.id === row.id ? row : l)));
        }
      )
      .subscribe((status) => setRealtimeOk(status === "SUBSCRIBED"));

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── 필터·검색 ────────────────────────────────────────────────────────────
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      const passFilter =
        filter === "ALL" ||
        (filter === "HOT"  && l.tier === "A") ||
        (filter === "WARM" && (l.tier === "B" || l.tier === "C")) ||
        (filter === "COLD" && (l.tier === "D" || !l.tier));

      const passSearch =
        !q ||
        l.company_name.toLowerCase().includes(q) ||
        l.contact_name.toLowerCase().includes(q);

      return passFilter && passSearch;
    });
  }, [leads, filter, search]);

  const counts = useMemo(() => ({
    ALL:  leads.length,
    HOT:  leads.filter((l) => l.tier === "A").length,
    WARM: leads.filter((l) => l.tier === "B" || l.tier === "C").length,
    COLD: leads.filter((l) => l.tier === "D" || !l.tier).length,
  }), [leads]);

  const handleUpdate = useCallback((updated: LeadRow) => {
    setLeads((prev) => sortLeads(prev.map((l) => l.id === updated.id ? updated : l)));
  }, []);

  const isReadOnly = role === "viewer";

  return (
    <div>
      {/* ── 헤더 ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">리드 관리</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            총 {leads.length}건
            {isReadOnly && (
              <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">읽기 전용</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Realtime 상태 */}
          <span className={[
            "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full font-medium",
            realtimeOk ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground",
          ].join(" ")}>
            {realtimeOk
              ? <><ZapIcon className="w-3 h-3" /> 실시간 연결됨</>
              : <><RefreshCwIcon className="w-3 h-3" /> 오프라인</>}
          </span>
        </div>
      </div>

      {/* ── 필터 바 ─────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap mb-4">
        {(["ALL", "HOT", "WARM", "COLD"] as Filter[]).map((f) => (
          <FilterButton
            key={f}
            label={f}
            count={counts[f]}
            active={filter === f}
            onClick={() => setFilter(f)}
          />
        ))}

        {/* 검색 */}
        <div className="ml-auto flex items-center gap-2 bg-white border border-border rounded-lg px-3 h-9 min-w-[200px]">
          <SearchIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            placeholder="회사명·담당자 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* ── 테이블 ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        {visible.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground text-sm">
              {search ? "검색 결과가 없습니다" : "리드가 없습니다"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-border sticky top-0 z-10">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground w-16">등급</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">회사·담당자</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground w-28">스코어</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground w-32">예상 순수익</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground w-24">상태</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground w-24">배정</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground w-20">등록</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {visible.map((lead) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    isSelected={selectedId === lead.id}
                    isNew={newIds.has(lead.id)}
                    isReadOnly={isReadOnly}
                    role={role}
                    onSelect={() =>
                      setSelectedId((prev) => (prev === lead.id ? null : lead.id))
                    }
                    onUpdate={handleUpdate}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 리드 행 + 인라인 상세 패널
// ══════════════════════════════════════════════════════════════════════════════
function LeadRow({
  lead, isSelected, isNew, isReadOnly, role, onSelect, onUpdate,
}: {
  lead:       LeadRow;
  isSelected: boolean;
  isNew:      boolean;
  isReadOnly: boolean;
  role:       AdminRole;
  onSelect:   () => void;
  onUpdate:   (l: LeadRow) => void;
}) {
  const isHot = lead.tier === "A";

  return (
    <>
      {/* 리드 행 */}
      <tr
        onClick={onSelect}
        className={[
          "border-b border-border cursor-pointer transition-colors",
          isHot     ? "border-l-[3px] border-l-red-500" : "border-l-[3px] border-l-transparent",
          isNew     ? "bg-green-50 animate-pulse"  : "hover:bg-slate-50",
          isSelected ? "bg-blue-50"                 : "",
        ].join(" ")}
      >
        {/* 등급 */}
        <td className="px-4 py-3">
          <span className={[
            "inline-flex items-center justify-center w-14 h-6 rounded-full text-[11px] font-bold",
            TIER_COLORS[lead.tier ?? ""] ?? "bg-slate-100 text-slate-500",
          ].join(" ")}>
            {tierLabel(lead.tier)}
          </span>
        </td>

        {/* 회사·담당자 */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {isHot && <FlameIcon className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
            <div>
              <p className="font-semibold text-foreground text-[13px]">{lead.company_name}</p>
              <p className="text-xs text-muted-foreground">
                {lead.contact_name}
                {lead.contact_title && <span className="ml-1 text-muted-foreground/70">· {lead.contact_title}</span>}
              </p>
            </div>
          </div>
        </td>

        {/* 스코어 */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={[
                  "h-full rounded-full",
                  (lead.score ?? 0) >= 80 ? "bg-red-500"    :
                  (lead.score ?? 0) >= 60 ? "bg-orange-400" :
                  (lead.score ?? 0) >= 40 ? "bg-yellow-400" : "bg-slate-300",
                ].join(" ")}
                style={{ width: `${lead.score ?? 0}%` }}
              />
            </div>
            <span className="text-xs font-mono text-muted-foreground w-6 text-right">
              {lead.score ?? 0}
            </span>
          </div>
        </td>

        {/* 예상 순수익 */}
        <td className="px-4 py-3">
          <span className="text-[13px] font-semibold text-primary">
            {lead.est_net_value ? formatKRW(lead.est_net_value) : "─"}
          </span>
        </td>

        {/* 상태 */}
        <td className="px-4 py-3">
          <span className={[
            "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold",
            STATUS_COLORS[lead.status] ?? "bg-muted text-muted-foreground",
          ].join(" ")}>
            {STATUS_LABELS[lead.status] ?? lead.status}
          </span>
        </td>

        {/* 배정 */}
        <td className="px-4 py-3">
          <span className="text-xs text-muted-foreground">
            {lead.consultant_id ? (
              <span className="flex items-center gap-1 text-green-700">
                <CheckCircle2Icon className="w-3 h-3" /> 배정됨
              </span>
            ) : "미배정"}
          </span>
        </td>

        {/* 등록 */}
        <td className="px-4 py-3">
          <span className="text-xs text-muted-foreground">
            {relativeTime(lead.created_at)}
          </span>
        </td>

        {/* 토글 */}
        <td className="px-2 py-3">
          {isSelected
            ? <ChevronUpIcon   className="w-4 h-4 text-muted-foreground" />
            : <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />}
        </td>
      </tr>

      {/* 인라인 상세 패널 */}
      {isSelected && (
        <tr>
          <td colSpan={8} className="p-0 border-b-2 border-primary/20">
            <DetailPanel
              lead={lead}
              isReadOnly={isReadOnly}
              role={role}
              onUpdate={onUpdate}
            />
          </td>
        </tr>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 인라인 상세 패널
// ══════════════════════════════════════════════════════════════════════════════
function DetailPanel({
  lead, isReadOnly, role, onUpdate,
}: {
  lead:       LeadRow;
  isReadOnly: boolean;
  role:       AdminRole;
  onUpdate:   (l: LeadRow) => void;
}) {
  const [notes,        setNotes]        = useState(lead.notes ?? "");
  const [status,       setStatus]       = useState<LeadStatus>(lead.status);
  const [consultantId, setConsultantId] = useState<string | null>(lead.consultant_id);
  const [consultants,  setConsultants]  = useState<ConsultantItem[]>([]);
  const [saving,       setSaving]       = useState<"notes" | "consultant" | "status" | null>(null);
  const [saveMsg,      setSaveMsg]      = useState<string | null>(null);

  const canAssign  = ["admin", "super_admin"].includes(role);
  const canComment = ["admin", "super_admin", "consultant"].includes(role);

  // 컨설턴트 목록 로드
  useEffect(() => {
    if (!canAssign) return;
    fetch("/api/v1/admin/consultants")
      .then((r) => r.json())
      .then((j) => { if (j.success) setConsultants(j.data); })
      .catch(() => {});
  }, [canAssign]);

  const patch = useCallback(async (payload: Record<string, unknown>, type: typeof saving) => {
    setSaving(type);
    setSaveMsg(null);
    try {
      const res  = await fetch(`/api/v1/admin/leads/${lead.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        onUpdate(json.data);
        setSaveMsg("저장됨");
        setTimeout(() => setSaveMsg(null), 2000);
      } else {
        setSaveMsg(json.error ?? "저장 실패");
      }
    } catch {
      setSaveMsg("네트워크 오류");
    }
    setSaving(null);
  }, [lead.id, onUpdate]);

  const equipTypes: string[] = Array.isArray(lead.equip_types)
    ? (lead.equip_types as string[])
    : [];

  return (
    <div className="bg-slate-50 border-t border-border p-5">
      <div className="grid grid-cols-3 gap-6">
        {/* ── 좌: 리드 상세 ──────────────────────────────── */}
        <div className="space-y-4">
          <SectionTitle>리드 정보</SectionTitle>

          <InfoGrid rows={[
            ["스코어",     `${lead.score ?? 0} / 100 (${lead.tier ?? "─"} 등급)`],
            ["직책",       lead.contact_title ?? "─"],
            ["업종",       lead.sector_code ?? "─"],
            ["전력 구간",  lead.elec_tier    ? `Tier ${lead.elec_tier}`  : "─"],
            ["종업원 구간",lead.employee_tier ? `Tier ${lead.employee_tier}` : "─"],
            ["ETS 할당",   lead.ets_allocated ? "해당" : "미해당"],
            ["예상 순수익",lead.est_net_value ? formatKRW(lead.est_net_value) : "─"],
          ]} />

          {/* 대상 설비 태그 */}
          {equipTypes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">대상 설비</p>
              <div className="flex flex-wrap gap-1.5">
                {equipTypes.map((code) => (
                  <span key={code} className="text-[11px] px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full font-medium">
                    {EQUIP_LABEL[code] ?? code}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 연락처 액션 */}
          <div className="flex gap-2 pt-1">
            <a
              href={`tel:${lead.phone}`}
              className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-border bg-white text-sm font-medium hover:bg-muted transition-colors"
            >
              <PhoneIcon className="w-4 h-4 text-primary" />
              전화
            </a>
            <a
              href={`mailto:${lead.email}`}
              className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-border bg-white text-sm font-medium hover:bg-muted transition-colors"
            >
              <MailIcon className="w-4 h-4 text-primary" />
              이메일
            </a>
          </div>
        </div>

        {/* ── 중: 상태·컨설턴트 배정 ─────────────────────── */}
        <div className="space-y-4">
          <SectionTitle>영업 관리</SectionTitle>

          {/* 상태 변경 */}
          <div>
            <label className="label-sm">진행 상태</label>
            <div className="flex gap-2 items-center">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                disabled={isReadOnly || saving !== null}
                className="field-sm flex-1"
              >
                {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              {!isReadOnly && (
                <button
                  type="button"
                  disabled={saving !== null}
                  onClick={() => patch({ status }, "status")}
                  className="px-3 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {saving === "status" ? "…" : "저장"}
                </button>
              )}
            </div>
          </div>

          {/* 컨설턴트 배정 */}
          {canAssign && (
            <div>
              <label className="label-sm">컨설턴트 배정</label>
              <div className="flex gap-2 items-center">
                <select
                  value={consultantId ?? ""}
                  onChange={(e) => setConsultantId(e.target.value || null)}
                  disabled={saving !== null}
                  className="field-sm flex-1"
                >
                  <option value="">─ 미배정 ─</option>
                  {consultants.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={saving !== null}
                  onClick={() => patch({ consultant_id: consultantId }, "consultant")}
                  className="flex items-center gap-1.5 px-3 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  <UserCheckIcon className="w-3.5 h-3.5" />
                  {saving === "consultant" ? "…" : "배정"}
                </button>
              </div>
              {lead.consultant_id && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  ✓ 배정 시 Slack 알림 발송
                </p>
              )}
            </div>
          )}

          {/* 저장 피드백 */}
          {saveMsg && (
            <p className={[
              "text-xs font-medium px-2.5 py-1.5 rounded-lg",
              saveMsg === "저장됨"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-600",
            ].join(" ")}>
              {saveMsg}
            </p>
          )}

          <InfoGrid rows={[
            ["등록일시", new Date(lead.created_at).toLocaleString("ko-KR")],
            ["최종수정", new Date(lead.updated_at).toLocaleString("ko-KR")],
            ["Stibee ID", lead.stibee_subscriber_id ?? "─"],
          ]} />
        </div>

        {/* ── 우: 메모 ─────────────────────────────────── */}
        <div className="space-y-3">
          <SectionTitle>메모</SectionTitle>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={!canComment}
            placeholder={canComment ? "컨설턴트 메모를 입력하세요…" : "읽기 전용"}
            rows={7}
            maxLength={2000}
            className="w-full p-3 border border-border rounded-xl text-sm bg-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none disabled:bg-muted disabled:text-muted-foreground"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              {notes.length} / 2000
            </span>
            {canComment && (
              <button
                type="button"
                disabled={saving !== null}
                onClick={() => patch({ notes }, "notes")}
                className="flex items-center gap-1.5 px-4 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <StickyNoteIcon className="w-3.5 h-3.5" />
                {saving === "notes" ? "저장 중…" : "메모 저장"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────────────────────
function FilterButton({
  label, count, active, onClick,
}: {
  label: Filter; count: number; active: boolean; onClick: () => void;
}) {
  const icons: Record<Filter, React.ReactNode> = {
    ALL:  <ListIcon        className="w-3.5 h-3.5" />,
    HOT:  <FlameIcon       className="w-3.5 h-3.5" />,
    WARM: <ThermometerIcon className="w-3.5 h-3.5" />,
    COLD: <SnowflakeIcon   className="w-3.5 h-3.5" />,
  };
  const hotColors: Record<Filter, string> = {
    ALL:  "bg-foreground text-background",
    HOT:  "bg-red-500   text-white",
    WARM: "bg-orange-400 text-white",
    COLD: "bg-blue-400  text-white",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex items-center gap-1.5 px-3.5 h-9 rounded-lg text-sm font-semibold border transition-colors",
        active
          ? `${hotColors[label]} border-transparent shadow-sm`
          : "bg-white border-border text-foreground hover:bg-muted",
      ].join(" ")}
    >
      {icons[label]}
      {label}
      <span className={[
        "text-[11px] px-1.5 py-0.5 rounded-full font-bold",
        active ? "bg-white/20" : "bg-muted",
      ].join(" ")}>
        {count}
      </span>
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide pb-1 border-b border-border">
      {children}
    </h3>
  );
}

function InfoGrid({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="space-y-1.5">
      {rows.map(([label, value]) => (
        <div key={label} className="flex gap-2 text-xs">
          <dt className="w-20 flex-shrink-0 text-muted-foreground">{label}</dt>
          <dd className="text-foreground font-medium truncate">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

// ── 인라인 CSS 클래스 (Tailwind 클래스 재사용) ────────────────────────────────
const _styles = `
  .label-sm { display:block; font-size:.75rem; font-weight:500; color:var(--color-muted-foreground); margin-bottom:.375rem; }
  .field-sm { height:2.25rem; padding:0 .625rem; border:1px solid var(--color-border); border-radius:.5rem; background:var(--color-background); font-size:.8125rem; outline:none; }
  .field-sm:focus { border-color:var(--color-ring); }
`;

// 스타일 주입 (번들에 포함)
if (typeof window !== "undefined") {
  const el = document.getElementById("leads-styles");
  if (!el) {
    const style = document.createElement("style");
    style.id = "leads-styles";
    style.textContent = _styles;
    document.head.appendChild(style);
  }
}
