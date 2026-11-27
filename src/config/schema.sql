-- ARQUIVO: schema.sql
-- FUNÇÃO: Criar todas as tabelas no banco de dados

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_admin      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE games (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  platform     VARCHAR(100),
  cover_url    VARCHAR(255),
  release_year INTEGER,
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE achievements (
  id          SERIAL PRIMARY KEY,
  game_id     INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  tips        TEXT,
  is_missable BOOLEAN DEFAULT FALSE,
  trophy_type VARCHAR(50) NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_progress (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  completed_at   TIMESTAMP DEFAULT NOW()
);

