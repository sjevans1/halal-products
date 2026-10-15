CREATE TABLE IF NOT EXISTS waitlist (
  email TEXT PRIMARY KEY NOT NULL,
  consent_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  unsubscribed_at TEXT DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at);
