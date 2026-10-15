-- Only suggestions; not published without human review and source verification.
-- No contact details, IP address, or Turnstile token are stored.
CREATE TABLE IF NOT EXISTS hub_suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('listing','event','correction')),
  title TEXT NOT NULL,
  source_url TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','approved','rejected')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_hub_suggestions_status_created ON hub_suggestions (review_status, created_at);
