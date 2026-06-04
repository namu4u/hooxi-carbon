-- KOC 참고가 업데이트: 16,000 → 18,000 (2026년 6월 시장 반영)
update algo_params
set kcu_price_ref = 18000,
    updated_at    = now()
where kcu_price_ref = 16000;
