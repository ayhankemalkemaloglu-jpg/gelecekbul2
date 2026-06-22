-- D1 schema for gelecekbul2 (users + Atlas daily usage)
-- Apply: wrangler d1 execute gelecekbul2-db --remote --file=./schema.sql
CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  name       TEXT,
  pass_hash  TEXT NOT NULL,
  pass_salt  TEXT NOT NULL,
  plan       TEXT NOT NULL DEFAULT 'free',   -- free | pro | promax
  role       TEXT NOT NULL DEFAULT 'student', -- student | veli | kurumsal
  created_at INTEGER NOT NULL,
  last_login INTEGER
);

CREATE TABLE IF NOT EXISTS atlas_usage (
  user_id TEXT NOT NULL,
  day     TEXT NOT NULL,            -- YYYY-MM-DD (UTC)
  count   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
