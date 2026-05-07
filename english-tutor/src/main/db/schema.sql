CREATE TABLE IF NOT EXISTS user_profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  goal TEXT NOT NULL,
  level TEXT NOT NULL,
  interests TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS materials (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  script TEXT NOT NULL,
  script_ja TEXT,
  total_appearances INTEGER NOT NULL DEFAULT 0,
  last_appeared_at TEXT,
  mastery_level INTEGER NOT NULL DEFAULT 1,
  started_at TEXT,
  ended_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vocabulary_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_id INTEGER REFERENCES materials(id),
  term TEXT NOT NULL,
  meaning TEXT,
  type TEXT,
  examples TEXT,
  total_appearances INTEGER NOT NULL DEFAULT 0,
  last_appeared_at TEXT,
  mastery_level INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY,
  material_id INTEGER NOT NULL REFERENCES materials(id),
  phase TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at TEXT
);

CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id),
  material_id INTEGER NOT NULL REFERENCES materials(id),
  vocabulary_item_id INTEGER REFERENCES vocabulary_items(id),
  phase TEXT NOT NULL,
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  user_answer TEXT,
  is_correct INTEGER NOT NULL,
  feedback TEXT,
  asked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vocab_due ON vocabulary_items(type, last_appeared_at);
CREATE INDEX IF NOT EXISTS idx_questions_vocab ON questions(vocabulary_item_id, asked_at);
CREATE INDEX IF NOT EXISTS idx_questions_session ON questions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_material ON sessions(material_id, started_at);
