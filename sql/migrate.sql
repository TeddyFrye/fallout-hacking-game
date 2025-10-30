-- sql/migrate.sql
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  correct_word TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  won BOOLEAN
);

CREATE INDEX IF NOT EXISTS idx_games_session ON games(session_id);

CREATE TABLE IF NOT EXISTS guesses (
  id SERIAL PRIMARY KEY,
  game_id INT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  guess_text TEXT NOT NULL,
  feedback TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
