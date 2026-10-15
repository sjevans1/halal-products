-- HUB-09: Internal moderation only. An approved suggestion does NOT become a public listing.
-- Apply after 0002_hub_suggestions.sql; deploy once per database.
ALTER TABLE hub_suggestions ADD COLUMN reviewed_by TEXT;
ALTER TABLE hub_suggestions ADD COLUMN review_note TEXT;
CREATE TABLE IF NOT EXISTS hub_moderation_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  suggestion_id INTEGER NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('approved','rejected')),
  reviewer TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  FOREIGN KEY (suggestion_id) REFERENCES hub_suggestions(id)
);
CREATE INDEX IF NOT EXISTS idx_hub_moderation_audit_suggestion ON hub_moderation_audit (suggestion_id, id);
