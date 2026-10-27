CREATE TABLE IF NOT EXISTS ai_feedback (
  id SERIAL PRIMARY KEY,
  evaluation_id INT UNIQUE NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  strengths_text TEXT NOT NULL,
  skill_gaps_text TEXT NOT NULL,
  suggestions_text TEXT NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
