CREATE TABLE IF NOT EXISTS promotion_readiness (
  id SERIAL PRIMARY KEY,
  employee_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score NUMERIC(5, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'NOT_READY' CHECK (status IN ('ELIGIBLE', 'NOMINATED', 'NEEDS_TRAINING', 'NOT_READY', 'PROMOTED', 'REJECTED')),
  recommendation_text TEXT,
  target_role_name VARCHAR(255),
  nominated_by INT REFERENCES users(id) ON DELETE SET NULL,
  hr_comment TEXT,
  is_acknowledged_by_employee BOOLEAN DEFAULT FALSE,
  promoted_at TIMESTAMP,
  updated_by INT REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
