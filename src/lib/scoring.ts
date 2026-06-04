// 리드 스코어링 — 서버사이드 전용
// calculate route / leads route 모두 이 파일을 import

export interface ScoreInput {
  elec_tier:      number;
  employee_tier:  number;
  kcu_history:    string;
  ets_allocated:  boolean;
  net_value:      number;
  eligible_years: number;
}

export interface LeadScore {
  total: number;            // 0~100
  tier:  "A" | "B" | "C" | "D";
  factors: {
    energy:    number;
    headcount: number;
    value:     number;
    longevity: number;
    history:   number;
  };
}

const MAX_ELIGIBLE_YEARS = 5;

export function computeLeadScore(input: ScoreInput): LeadScore {
  const energy    = Math.min((input.elec_tier     / 5) * 30, 30);
  const headcount = Math.min((input.employee_tier / 5) * 20, 20);
  const value     = Math.min(input.net_value / 100_000_000, 1) * 30;
  const longevity = (input.eligible_years / MAX_ELIGIBLE_YEARS) * 10;

  const historyBase = input.kcu_history === "none" ? 10 : input.kcu_history === "partial" ? 5 : 0;
  const history = Math.min(historyBase + (input.ets_allocated ? 0 : 2), 10);

  const total = Math.round(energy + headcount + value + longevity + history);
  const tier  = total >= 80 ? "A" : total >= 60 ? "B" : total >= 40 ? "C" : "D";

  return { total, tier, factors: { energy, headcount, value, longevity, history } };
}
