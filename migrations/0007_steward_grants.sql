-- Steward grants are scoped to a single source-listed record. Never certification, endorsement or publication.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS steward_grants (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 listing_id TEXT NOT NULL CHECK(length(listing_id) BETWEEN 3 AND 70),
 email TEXT NOT NULL CHECK(length(email) BETWEEN 5 AND 254 AND email=lower(email)),
 source_url TEXT NOT NULL CHECK(length(source_url) BETWEEN 12 AND 700),
 review_note TEXT NOT NULL CHECK(length(trim(review_note)) BETWEEN 40 AND 800),
 issued_by TEXT NOT NULL,
 expires_at TEXT NOT NULL CHECK(expires_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','revoked')),
 revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>0),
 action TEXT NOT NULL DEFAULT 'granted' CHECK(action IN ('granted','revoked')),
 action_note TEXT NOT NULL DEFAULT 'Independent grant recorded after manual verification',
 acted_by TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
 CHECK(email<>lower(issued_by))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_steward_one_active ON steward_grants(listing_id,email) WHERE status='active';
CREATE INDEX IF NOT EXISTS idx_steward_email ON steward_grants(email,status,expires_at);
CREATE TABLE IF NOT EXISTS steward_audit (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 grant_id INTEGER NOT NULL REFERENCES steward_grants(id),
 revision INTEGER NOT NULL,
 action TEXT NOT NULL CHECK(action IN ('granted','revoked')),
 actor TEXT NOT NULL,
 note TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE TRIGGER IF NOT EXISTS steward_grant_audit AFTER INSERT ON steward_grants BEGIN
 INSERT INTO steward_audit(grant_id,revision,action,actor,note) VALUES (NEW.id,1,'granted',NEW.issued_by,NEW.review_note);
END;
CREATE TRIGGER IF NOT EXISTS steward_update_guard BEFORE UPDATE ON steward_grants
WHEN NOT (OLD.status='active' AND NEW.status='revoked' AND NEW.action='revoked' AND NEW.revision=OLD.revision+1
AND NEW.listing_id=OLD.listing_id AND NEW.email=OLD.email AND NEW.source_url=OLD.source_url
AND NEW.review_note=OLD.review_note AND NEW.issued_by=OLD.issued_by AND NEW.expires_at=OLD.expires_at
AND NEW.created_at=OLD.created_at AND length(trim(NEW.action_note)) BETWEEN 20 AND 800 AND length(trim(NEW.acted_by))>0 AND lower(NEW.acted_by)<>OLD.email)
BEGIN SELECT RAISE(ABORT,'Only audited grant revocation is allowed'); END;
CREATE TRIGGER IF NOT EXISTS steward_revoke_audit AFTER UPDATE ON steward_grants BEGIN
 INSERT INTO steward_audit(grant_id,revision,action,actor,note) VALUES(NEW.id,NEW.revision,'revoked',NEW.acted_by,NEW.action_note);
END;
CREATE TRIGGER IF NOT EXISTS steward_grant_no_delete BEFORE DELETE ON steward_grants BEGIN SELECT RAISE(ABORT,'Steward grant history is retained'); END;
CREATE TRIGGER IF NOT EXISTS steward_audit_no_update BEFORE UPDATE ON steward_audit BEGIN SELECT RAISE(ABORT,'Audit is immutable'); END;
CREATE TRIGGER IF NOT EXISTS steward_audit_no_delete BEFORE DELETE ON steward_audit BEGIN SELECT RAISE(ABORT,'Audit is immutable'); END;
