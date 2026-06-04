"use client";

import { useState, useEffect, useCallback } from "react";

// ── 타입 ─────────────────────────────────────────────────────────────────────
export interface Step1Data {
  sectorCode:  string;
  equipCodes:  string[];
  elecTier:    number;
  installYear: number;
}

export interface Step2Data {
  employeeTier: number;
  kcuHistory:   "none" | "partial" | "all";
  etsAllocated: boolean;
}

export interface CalcResult {
  eligible:        boolean;
  reason?:         string;
  est_kcu_volume?: number;
  eligible_years?: number;
  est_gross_value?:number;
  fee_amount?:     number;
  est_net_value?:  number;
  fee_rate?:       number;
  kcu_price_ref?:  number;
  gamma?:          number;
  is_multi_equip?: boolean;
  breakdown?:      { equip_code: string; est_kcu_vol: number }[];
}

interface StoredState {
  step1:  Step1Data | null;
  step2:  Step2Data | null;
  result: CalcResult | null;
  ts:     number;
}

// ── 상수 ─────────────────────────────────────────────────────────────────────
const KEY    = "hooxi_dx_v1";
const TTL_MS = 24 * 60 * 60 * 1000; // 24h

const EMPTY: StoredState = { step1: null, step2: null, result: null, ts: 0 };

// ── 훅 ───────────────────────────────────────────────────────────────────────
export function useDiagnosis() {
  const [state,     setState]   = useState<StoredState>(EMPTY);
  const [hydrated,  setHydrated] = useState(false);

  // SSR 후 localStorage 복원
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed: StoredState = JSON.parse(raw);
        if (Date.now() - parsed.ts < TTL_MS) {
          setState(parsed);
        } else {
          localStorage.removeItem(KEY);
        }
      }
    } catch { /* ignore parse/access errors */ }
    setHydrated(true);
  }, []);

  const persist = (next: StoredState) => {
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* quota/private */ }
  };

  const save = useCallback((patch: Partial<StoredState>) => {
    setState(prev => {
      const next = { ...prev, ...patch, ts: Date.now() };
      persist(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    setState(EMPTY);
  }, []);

  return { ...state, save, reset, hydrated };
}
