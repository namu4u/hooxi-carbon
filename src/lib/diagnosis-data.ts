// ── 업종 ────────────────────────────────────────────────────────────────────
export const SECTORS = [
  { code: "C", label: "제조업" },
  { code: "L", label: "건물·부동산" },
  { code: "G", label: "도·소매" },
  { code: "H", label: "운수·창고" },
  { code: "A", label: "농림·어업" },
] as const;

export type SectorCode = (typeof SECTORS)[number]["code"];

// ── 설비 (업종별) ───────────────────────────────────────────────────────────
export interface EquipOption {
  code: string;
  label: string;
  ineligible?: true;          // algo_params eligible=false
  ineligibleReason?: string;
}

export const EQUIP_BY_SECTOR: Record<string, EquipOption[]> = {
  C: [
    { code: "LED_LIGHTING",   label: "LED 조명 교체" },
    { code: "INVERTER_MOTOR", label: "인버터 모터 도입" },
    { code: "HEF_BOILER",     label: "고효율 보일러 교체" },
  ],
  L: [
    { code: "LED_LIGHTING",  label: "LED 조명 교체" },
    { code: "HVAC_UPGRADE",  label: "냉난방 효율화" },
  ],
  G: [
    { code: "LED_LIGHTING",  label: "LED 조명 교체" },
  ],
  H: [
    { code: "EV_FORKLIFT",   label: "전기지게차 전환" },
    { code: "LED_LIGHTING",  label: "LED 조명 교체" },
  ],
  A: [
    {
      code: "SMART_FARM",
      label: "스마트팜",
      ineligible: true,
      ineligibleReason: "방법론 검토 중",
    },
  ],
};

// equip_code → 한국어 레이블 (결과 화면 표시용)
export const EQUIP_LABEL: Record<string, string> = {
  LED_LIGHTING:   "LED 조명 교체",
  INVERTER_MOTOR: "인버터 모터 도입",
  HEF_BOILER:     "고효율 보일러 교체",
  HVAC_UPGRADE:   "냉난방 효율화",
  EV_FORKLIFT:    "전기지게차 전환",
  SMART_FARM:     "스마트팜",
};

// ── 전력 사용량 구간 ─────────────────────────────────────────────────────────
export const ELEC_TIERS = [
  { value: 1, label: "연 12만 kWh 미만 (소규모)" },
  { value: 2, label: "연 12만 ~ 125만 kWh" },
  { value: 3, label: "연 125만 ~ 350만 kWh" },
  { value: 4, label: "연 350만 kWh 이상 (대규모)" },
] as const;

// ── 종업원 수 구간 ────────────────────────────────────────────────────────────
export const EMPLOYEE_TIERS = [
  { value: 1, label: "5인 미만" },
  { value: 2, label: "5 ~ 49인" },
  { value: 3, label: "50 ~ 299인" },
  { value: 4, label: "300 ~ 999인" },
  { value: 5, label: "1,000인 이상" },
] as const;

// ── 설비 도입 연도 ────────────────────────────────────────────────────────────
export const INSTALL_YEARS = [2021, 2022, 2023, 2024, 2025] as const;

// ── 직책 선택지 ───────────────────────────────────────────────────────────────
export const TITLES = [
  "대표이사 / CEO",
  "CFO / 재무담당 임원",
  "경영지원팀장",
  "에너지·환경 담당자",
  "기타",
] as const;
