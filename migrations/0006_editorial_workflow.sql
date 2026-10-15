-- EDIT-01: private, audited and non-publishing editorial proposals.
-- Requires the operator Access/identity workflow; no public consumer reads this table.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS editorial_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('guide','directory','event','recipe')),
  slug TEXT NOT NULL CHECK (length(slug) BETWEEN 3 AND 70),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 5 AND 140),
  summary TEXT NOT NULL CHECK (length(summary) BETWEEN 20 AND 320),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 50 AND 6000),
  source_url TEXT NOT NULL CHECK (length(source_url) BETWEEN 12 AND 700),
  parish TEXT NOT NULL DEFAULT '',
  event_date TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','rejected','changes_requested')),
  created_by TEXT NOT NULL,
  acted_by TEXT NOT NULL,
  action_note TEXT NOT NULL,
  last_action TEXT NOT NULL DEFAULT 'created' CHECK (last_action IN ('created','edited','submitted','approved','rejected','changes_requested')),
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>=1),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  CHECK (kind <> 'directory' OR length(parish)>0),
  CHECK (kind <> 'event' OR (event_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' AND length(parish)>0)),
  CHECK (last_action <> 'created' OR status='draft')
);
CREATE INDEX IF NOT EXISTS idx_editorial_status ON editorial_entries(status,id DESC);
CREATE INDEX IF NOT EXISTS idx_editorial_kind ON editorial_entries(kind,id DESC);
CREATE TABLE IF NOT EXISTS editorial_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL REFERENCES editorial_entries(id),
  revision INTEGER NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('created','edited','submitted','approved','rejected','changes_requested')),
  actor TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_editorial_audit_entry ON editorial_audit(entry_id,id DESC);
CREATE TRIGGER IF NOT EXISTS editorial_insert_audit AFTER INSERT ON editorial_entries BEGIN
 INSERT INTO editorial_audit(entry_id,revision,action,actor,note) VALUES(NEW.id,NEW.revision,'created',NEW.created_by,NEW.action_note);
END;
CREATE TRIGGER IF NOT EXISTS editorial_update_guard BEFORE UPDATE ON editorial_entries
WHEN NOT (
 NEW.revision=OLD.revision+1 AND NEW.created_by=OLD.created_by AND NEW.kind=OLD.kind AND NEW.slug=OLD.slug
 AND NEW.created_at=OLD.created_at AND length(trim(NEW.acted_by))>0
 AND (
  (OLD.status='draft' AND NEW.status='draft' AND NEW.last_action='edited' AND NEW.acted_by=OLD.created_by)
  OR (OLD.status='changes_requested' AND NEW.status='draft' AND NEW.last_action='edited' AND NEW.acted_by=OLD.created_by)
  OR (OLD.status='draft' AND NEW.status='submitted' AND NEW.last_action='submitted' AND NEW.acted_by=OLD.created_by)
  OR (OLD.status='submitted' AND NEW.status IN ('approved','rejected','changes_requested') AND NEW.last_action=NEW.status AND lower(NEW.acted_by)<>lower(OLD.created_by) AND length(trim(NEW.action_note))>=20)
 )
 AND (NEW.last_action='edited' OR (
  NEW.title IS OLD.title AND NEW.summary IS OLD.summary AND NEW.body IS OLD.body AND NEW.source_url IS OLD.source_url AND NEW.parish IS OLD.parish AND NEW.event_date IS OLD.event_date
 ))
) BEGIN SELECT RAISE(ABORT,'Forbidden editorial transition or mutation'); END;
CREATE TRIGGER IF NOT EXISTS editorial_status_audit AFTER UPDATE ON editorial_entries BEGIN
 INSERT INTO editorial_audit(entry_id,revision,action,actor,note)
 VALUES(NEW.id,NEW.revision,NEW.last_action,NEW.acted_by,NEW.action_note);
END;
CREATE TRIGGER IF NOT EXISTS editorial_audit_lock_update BEFORE UPDATE ON editorial_audit BEGIN SELECT RAISE(ABORT,'Editorial audit is append-only'); END;
CREATE TRIGGER IF NOT EXISTS editorial_audit_lock_delete BEFORE DELETE ON editorial_audit BEGIN SELECT RAISE(ABORT,'Editorial audit is append-only'); END;
CREATE TRIGGER IF NOT EXISTS editorial_entry_delete_block BEFORE DELETE ON editorial_entries BEGIN SELECT RAISE(ABORT,'Editorial entries cannot be deleted'); END;
