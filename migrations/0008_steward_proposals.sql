-- A steward may suggest content about their own ACTIVE grant only; it is never auto-published.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS steward_proposals (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 grant_id INTEGER NOT NULL REFERENCES steward_grants(id),
 listing_id TEXT NOT NULL,
 submitted_by TEXT NOT NULL,
 source_url TEXT NOT NULL CHECK(length(source_url) BETWEEN 12 AND 700),
 note TEXT NOT NULL CHECK(length(trim(note)) BETWEEN 30 AND 1000),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status='pending'),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_steward_proposals_grant ON steward_proposals(grant_id,id DESC);
CREATE TRIGGER IF NOT EXISTS steward_proposal_guard BEFORE INSERT ON steward_proposals WHEN NOT EXISTS (
 SELECT 1 FROM steward_grants g WHERE g.id=NEW.grant_id AND g.listing_id=NEW.listing_id AND g.email=NEW.submitted_by
 AND g.status='active' AND date(g.expires_at)>date('now')
) BEGIN SELECT RAISE(ABORT,'Grant is not current for this listing'); END;
CREATE TRIGGER IF NOT EXISTS steward_proposal_no_update BEFORE UPDATE ON steward_proposals BEGIN SELECT RAISE(ABORT,'Steward proposals are immutable pending reviews'); END;
CREATE TRIGGER IF NOT EXISTS steward_proposal_no_delete BEFORE DELETE ON steward_proposals BEGIN SELECT RAISE(ABORT,'Steward proposal history is retained'); END;
