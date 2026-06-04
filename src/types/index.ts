import type { LeadStatus, CertStage, ContractStatus, LeadTier } from "./supabase";

// ─── 진단 플로우 단계별 입력 데이터 ────────────────────────────────────────
export interface DiagnosisStep1 {
  companyName: string;
  contactName: string;
  contactTitle?: string;
  phone: string;
  email: string;
}

export interface DiagnosisStep2 {
  sectorCode: string;
  equipTypes: EquipType[];
  elecTier: 1 | 2 | 3 | 4 | 5;
  employeeTier: 1 | 2 | 3 | 4 | 5;
  etsAllocated: boolean;
}

export interface DiagnosisStep3 {
  kcuHistory?: number;
  installYear?: number;
}

export interface EquipType {
  code: string;
  label: string;
  installYear?: number;
}

export interface DiagnosisData {
  step1: DiagnosisStep1;
  step2: DiagnosisStep2;
  step3: DiagnosisStep3;
  sessionId: string;
}

// ─── 진단 계산 결과 ──────────────────────────────────────────────────────────
export interface DiagnosisResult {
  estimatedKcuVolume: number;    // 예상 KCU 물량 (tCO₂)
  estimatedGrossValue: number;   // 예상 총 판매 대금 (원)
  estimatedNetValue: number;     // 예상 고객 순수익 (원, 수수료 20% 차감)
  feeAmount: number;             // 후시파트너스 수수료 (원)
  confidenceScore: number;       // 신뢰도 0~1
  breakdown: KcuBreakdown[];
  algoVersion: string;
}

export interface KcuBreakdown {
  equipCode: string;
  alpha: number;
  beta: number;
  kcuVolume: number;
  kcuPriceRef: number;
  grossValue: number;
}

// ─── 리드 스코어 (서버사이드 전용 — 클라이언트 노출 금지) ──────────────────
export interface LeadScoreFactors {
  energyVolume: number;      // 전력 사용량 구간 기반
  employeeSize: number;      // 종업원 규모 구간 기반
  industryPotential: number; // 업종별 KCU 적용 가능성
  equipCount: number;        // 대상 설비 수
  dataCompleteness: number;  // 입력 완성도
}

export interface LeadScore {
  total: number;          // 0~100
  tier: LeadTier;         // A/B/C/D
  factors: LeadScoreFactors;
}

// ─── API 공통 응답 ────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// ─── 포털 뷰 타입 ────────────────────────────────────────────────────────────
export interface PortalLead {
  id: string;
  companyName: string;
  contactName: string;
  status: LeadStatus;
  tier: LeadTier | null;
  estNetValue: number | null;
}

export interface PortalCertification {
  id: string;
  equipCode: string;
  stage: CertStage;
  stageUpdatedAt: string;
  estKcuVolume: number | null;
  actualKcuVolume: number | null;
  netValue: number | null;
  settlementDate: string | null;
}

export interface PortalContract {
  id: string;
  feeRate: number;
  status: ContractStatus;
  signedAt: string | null;
  pdfUrl: string | null;
}

// ─── 어드민 타입 ──────────────────────────────────────────────────────────────
export type AdminRole = "admin" | "super_admin" | "consultant" | "viewer";

export interface LeadListItem {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  status: LeadStatus;
  score: number;
  tier: LeadTier | null;
  estNetValue: number | null;
  createdAt: string;
  consultantId: string | null;
}
