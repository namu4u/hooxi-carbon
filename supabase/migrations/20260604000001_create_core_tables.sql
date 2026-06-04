-- ══════════════════════════════════════════════════════════════════════════════
-- 후시파트너스 "숨은 탄소배출권 찾기" 코어 스키마
-- Migration: 20260604000001_create_core_tables
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ────────────────────────────────────────────────────────────────────
CREATE TYPE lead_status AS ENUM (
  'new',           -- 신규 접수
  'contacted',     -- 초기 연락 완료
  'qualified',     -- 적격 판정
  'contracted',    -- 계약 체결
  'processing',    -- KCU 처리 중
  'completed',     -- 정산 완료
  'disqualified'   -- 부적격 처리
);

CREATE TYPE cert_stage AS ENUM (
  'draft',          -- 초안 작성
  'field_verify',   -- 현장 검증
  'moe_submitted',  -- 환경부 제출
  'moe_approved',   -- 환경부 승인
  'issued',         -- KCU 발급
  'sold',           -- KCU 판매 완료
  'settled'         -- 고객 정산 완료
);

CREATE TYPE contract_status AS ENUM (
  'pending',    -- 서명 대기
  'signed',     -- 서명 완료
  'cancelled'   -- 취소
);

-- ─── 공통 트리거 함수 ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ─── 포털 세션 헬퍼 ──────────────────────────────────────────────────────────
-- 매직링크 검증 후 서버가 set_config('app.current_lead_id', '<uuid>', true) 를 호출.
-- SECURITY DEFINER 로 정의해 RLS 정책 안에서 안전하게 호출.
CREATE OR REPLACE FUNCTION current_lead_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nullif(current_setting('app.current_lead_id', true), '')::uuid;
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. leads
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE leads (
  id                    uuid         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 기업·담당자 정보
  company_name          text         NOT NULL,
  contact_name          text         NOT NULL,
  contact_title         text,
  email                 text         NOT NULL,
  phone                 text         NOT NULL,

  -- 진단 데이터
  sector_code           text,                           -- KSIC 업종 코드
  equip_types           jsonb        DEFAULT '[]'::jsonb NOT NULL,  -- 설비 유형 목록
  elec_tier             int2         CHECK (elec_tier  BETWEEN 1 AND 5),
  employee_tier         int2         CHECK (employee_tier BETWEEN 1 AND 5),
  kcu_history           numeric(14,4),                  -- 기존 KCU 이력(tCO₂)
  ets_allocated         boolean      DEFAULT false NOT NULL,

  -- 스코어링
  score                 int2         DEFAULT 0 NOT NULL
                                     CHECK (score BETWEEN 0 AND 100),
  tier                  text         CHECK (tier IN ('A','B','C','D')),

  -- 영업 관리
  status                lead_status  DEFAULT 'new' NOT NULL,
  est_net_value         int8,                           -- 예상 고객 순수익(원)
  consultant_id         uuid         REFERENCES auth.users(id) ON DELETE SET NULL,
  stibee_subscriber_id  text,                           -- Stibee 구독자 ID

  created_at            timestamptz  DEFAULT NOW() NOT NULL,
  updated_at            timestamptz  DEFAULT NOW() NOT NULL
);

-- 인덱스
CREATE INDEX idx_leads_email     ON leads (email);
CREATE INDEX idx_leads_score     ON leads (score DESC);
CREATE INDEX idx_leads_tier      ON leads (tier);
CREATE INDEX idx_leads_status    ON leads (status);
CREATE INDEX idx_leads_sector    ON leads (sector_code);

-- updated_at 자동 갱신
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. kcu_certifications
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE kcu_certifications (
  id                  uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id             uuid         NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- 설비 정보
  equip_code          text         NOT NULL,            -- 설비 코드 (algo_params 연계)
  install_year        int2,

  -- 단계 추적
  stage               cert_stage   DEFAULT 'draft' NOT NULL,
  stage_updated_at    timestamptz  DEFAULT NOW() NOT NULL,

  -- KCU 물량·정산
  est_kcu_volume      numeric(14,4),                   -- 예상 물량(tCO₂)
  actual_kcu_volume   numeric(14,4),                   -- 실제 물량(tCO₂)
  kcu_price           int4,                            -- 단가(원/tCO₂)
  gross_value         int8,                            -- 총 판매 대금(원)
  fee_rate            numeric(5,4) DEFAULT 0.2000 NOT NULL
                                   CHECK (fee_rate BETWEEN 0 AND 1),
  net_value           int8,                            -- 고객 순수익(원)
  settlement_date     date,                            -- 정산 예정일

  -- 행정 정보
  moe_receipt_no      text,                            -- 환경부 접수 번호
  field_verify_date   date,                            -- 현장 검증일
  note                text,

  created_at          timestamptz  DEFAULT NOW() NOT NULL,
  updated_at          timestamptz  DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_kcu_cert_lead_id ON kcu_certifications (lead_id);
CREATE INDEX idx_kcu_cert_stage   ON kcu_certifications (stage);

CREATE TRIGGER trg_kcu_cert_updated_at
  BEFORE UPDATE ON kcu_certifications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- stage 변경 시 stage_updated_at 자동 갱신
CREATE OR REPLACE FUNCTION sync_cert_stage_ts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.stage <> OLD.stage THEN
    NEW.stage_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_kcu_cert_stage_ts
  BEFORE UPDATE ON kcu_certifications
  FOR EACH ROW EXECUTE FUNCTION sync_cert_stage_ts();

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. algo_params
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE algo_params (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),

  sector_code     text         NOT NULL,
  equip_code      text         NOT NULL,

  -- 알고리즘 파라미터 (하드코딩 금지 — 이 테이블에서만 fetch)
  alpha           numeric(10,6) NOT NULL,   -- 기저선 배출량 보정 계수
  beta            numeric(10,6) NOT NULL,   -- KCU 환산 계수
  kcu_price_ref   int4         NOT NULL,    -- KCU 참조 시장가(원/tCO₂)
  eligible        boolean      DEFAULT true NOT NULL,

  updated_at      timestamptz  DEFAULT NOW() NOT NULL,
  updated_by      uuid         REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT uq_algo_params_sector_equip UNIQUE (sector_code, equip_code)
);

CREATE INDEX idx_algo_params_sector ON algo_params (sector_code);
CREATE INDEX idx_algo_params_equip  ON algo_params (equip_code);

CREATE TRIGGER trg_algo_params_updated_at
  BEFORE UPDATE ON algo_params
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. contracts
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE contracts (
  id              uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         uuid             NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  fee_rate        numeric(5,4)     NOT NULL DEFAULT 0.2000
                                   CHECK (fee_rate BETWEEN 0 AND 1),
  signed_at       timestamptz,
  signature_data  jsonb,           -- 전자 서명 좌표 배열 등
  pdf_url         text,

  status          contract_status  DEFAULT 'pending' NOT NULL,

  created_at      timestamptz      DEFAULT NOW() NOT NULL,
  updated_at      timestamptz      DEFAULT NOW() NOT NULL
);

-- 리드당 pending/signed 계약은 1건만 허용
CREATE UNIQUE INDEX idx_contracts_one_active_per_lead
  ON contracts (lead_id)
  WHERE status IN ('pending', 'signed');

CREATE INDEX idx_contracts_lead_id ON contracts (lead_id);
CREATE INDEX idx_contracts_status  ON contracts (status);

CREATE TRIGGER trg_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. magic_links
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE magic_links (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     uuid         NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  token       text         NOT NULL,
  expires_at  timestamptz  NOT NULL,
  used_at     timestamptz,

  created_at  timestamptz  DEFAULT NOW() NOT NULL,

  -- 만료된 링크 자동 무효화를 위한 CHECK
  CONSTRAINT chk_expires_future
    CHECK (expires_at > created_at)
);

-- 토큰은 전역 고유, 조회 성능 최적화
CREATE UNIQUE INDEX idx_magic_links_token    ON magic_links (token);
CREATE        INDEX idx_magic_links_lead_id  ON magic_links (lead_id);
-- 만료된 토큰 정리 쿼리 최적화
CREATE        INDEX idx_magic_links_expires  ON magic_links (expires_at)
  WHERE used_at IS NULL;

-- ══════════════════════════════════════════════════════════════════════════════
-- RLS 활성화 (service_role 은 자동으로 RLS 우회)
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE leads               ENABLE ROW LEVEL SECURITY;
ALTER TABLE kcu_certifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE algo_params         ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_links         ENABLE ROW LEVEL SECURITY;

-- RLS 활성화 시 기본값: 아무도 접근 불가 → 아래 정책으로 명시적 허용

-- ══════════════════════════════════════════════════════════════════════════════
-- RLS 정책 — leads
-- ══════════════════════════════════════════════════════════════════════════════
-- 매직링크 검증 후 서버가 set_config('app.current_lead_id', id::text, true) 를
-- 실행한 커넥션에서만 해당 lead 행을 읽을 수 있음.
CREATE POLICY "leads_portal_select" ON leads
  FOR SELECT
  USING (id = current_lead_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- RLS 정책 — kcu_certifications
-- ══════════════════════════════════════════════════════════════════════════════
CREATE POLICY "kcu_cert_portal_select" ON kcu_certifications
  FOR SELECT
  USING (lead_id = current_lead_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- RLS 정책 — algo_params
-- ══════════════════════════════════════════════════════════════════════════════
-- authenticated 역할은 전체 읽기 가능 (계산 API 에서 사용)
CREATE POLICY "algo_params_authenticated_select" ON algo_params
  FOR SELECT TO authenticated
  USING (true);

-- anon 역할도 읽기 허용 (서버사이드 렌더링 시 anon key 사용 케이스)
CREATE POLICY "algo_params_anon_select" ON algo_params
  FOR SELECT TO anon
  USING (true);

-- admin/super_admin app_metadata 역할만 INSERT
CREATE POLICY "algo_params_admin_insert" ON algo_params
  FOR INSERT TO authenticated
  WITH CHECK (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('admin', 'super_admin')
  );

-- admin/super_admin app_metadata 역할만 UPDATE
CREATE POLICY "algo_params_admin_update" ON algo_params
  FOR UPDATE TO authenticated
  USING (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('admin', 'super_admin')
  )
  WITH CHECK (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('admin', 'super_admin')
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- RLS 정책 — contracts
-- ══════════════════════════════════════════════════════════════════════════════
CREATE POLICY "contracts_portal_select" ON contracts
  FOR SELECT
  USING (lead_id = current_lead_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- RLS 정책 — magic_links (클라이언트 완전 차단)
-- ══════════════════════════════════════════════════════════════════════════════
-- 서버사이드(service_role)만 접근 → anon·authenticated 는 읽기·쓰기 모두 차단
CREATE POLICY "magic_links_deny_anon" ON magic_links
  FOR ALL TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "magic_links_deny_authenticated" ON magic_links
  FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);
