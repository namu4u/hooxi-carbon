-- ══════════════════════════════════════════════════════════════════════════════
-- 어드민 역할 RLS 정책
-- admin·super_admin·consultant·viewer 는 JWT app_metadata.role 로 식별
-- ══════════════════════════════════════════════════════════════════════════════

-- ── leads ──────────────────────────────────────────────────────────────────────
-- 어드민/컨설턴트/뷰어 전체 조회
CREATE POLICY "admin_leads_select" ON leads
  FOR SELECT TO authenticated
  USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'super_admin', 'consultant', 'viewer')
  );

-- 어드민/컨설턴트 UPDATE (status, consultant_id, notes, score, tier)
CREATE POLICY "admin_leads_update" ON leads
  FOR UPDATE TO authenticated
  USING  (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'super_admin', 'consultant'))
  WITH CHECK (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'super_admin', 'consultant'));

-- ── kcu_certifications ─────────────────────────────────────────────────────────
CREATE POLICY "admin_kcu_select" ON kcu_certifications
  FOR SELECT TO authenticated
  USING (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'super_admin', 'consultant', 'viewer'));

CREATE POLICY "admin_kcu_update" ON kcu_certifications
  FOR UPDATE TO authenticated
  USING  (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'super_admin'))
  WITH CHECK (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'super_admin'));

CREATE POLICY "admin_kcu_insert" ON kcu_certifications
  FOR INSERT TO authenticated
  WITH CHECK (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'super_admin'));

-- ── contracts ──────────────────────────────────────────────────────────────────
CREATE POLICY "admin_contracts_select" ON contracts
  FOR SELECT TO authenticated
  USING (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'super_admin', 'consultant', 'viewer'));

CREATE POLICY "admin_contracts_update" ON contracts
  FOR UPDATE TO authenticated
  USING  (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'super_admin'))
  WITH CHECK (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'super_admin'));
