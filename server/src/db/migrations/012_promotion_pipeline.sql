ALTER TABLE promotion_readiness ADD COLUMN IF NOT EXISTS target_role_name VARCHAR(255);
ALTER TABLE promotion_readiness ADD COLUMN IF NOT EXISTS nominated_by INT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE promotion_readiness ADD COLUMN IF NOT EXISTS hr_comment TEXT;
ALTER TABLE promotion_readiness ADD COLUMN IF NOT EXISTS is_acknowledged_by_employee BOOLEAN DEFAULT FALSE;
ALTER TABLE promotion_readiness ADD COLUMN IF NOT EXISTS promoted_at TIMESTAMP;

ALTER TABLE users ADD COLUMN IF NOT EXISTS title VARCHAR(255);
