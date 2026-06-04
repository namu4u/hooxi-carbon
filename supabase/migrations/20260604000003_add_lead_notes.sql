-- leads 테이블에 notes 컬럼 추가 (어드민 메모용)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes text;
