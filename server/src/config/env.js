require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'capdex_jwt_secret_key_2026_super_secure_vit_capstone',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  DATABASE_URL: process.env.DATABASE_URL || '',
  USE_MEMORY_DB: process.env.USE_MEMORY_DB === 'true' || !process.env.DATABASE_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173'
};
