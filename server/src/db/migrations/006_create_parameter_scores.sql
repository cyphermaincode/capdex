CREATE TABLE IF NOT EXISTS parameter_scores (
  id SERIAL PRIMARY KEY,
  evaluation_id INT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  parameter_id INT NOT NULL REFERENCES evaluation_parameters(id) ON DELETE CASCADE,
  score NUMERIC(4, 2) NOT NULL CHECK (score >= 0 AND score <= 10),
  reason TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
