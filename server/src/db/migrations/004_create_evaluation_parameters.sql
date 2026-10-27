CREATE TABLE IF NOT EXISTS evaluation_parameters (
  id SERIAL PRIMARY KEY,
  job_role_id INT NOT NULL REFERENCES job_roles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  weightage INT NOT NULL CHECK (weightage > 0 AND weightage <= 100),
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
