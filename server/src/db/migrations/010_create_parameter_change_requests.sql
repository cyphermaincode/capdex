CREATE TABLE IF NOT EXISTS parameter_change_requests (
  id SERIAL PRIMARY KEY,
  parameter_id INT NOT NULL REFERENCES evaluation_parameters(id) ON DELETE CASCADE,
  requested_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_text TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
