-- TRUST-01: internal-only review evidence, NEVER a public certificate registry.
-- Requires migrations 0002 and 0003 and Cloudflare Access editor authorization.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS trust_subjects (
  subject_key TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK(kind IN ('product','community')),
  display_name TEXT NOT NULL,
  baseline TEXT NOT NULL CHECK(baseline IN ('unverified','source-listed-only')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE TABLE IF NOT EXISTS trust_cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_ref TEXT NOT NULL UNIQUE,
  subject_key TEXT NOT NULL REFERENCES trust_subjects(subject_key),
  evidence_type TEXT NOT NULL CHECK(evidence_type IN ('halal_certificate','supplier_origin','ingredient_label','food_safety','listing_accuracy','community_contact')),
  claim TEXT NOT NULL,
  source_url TEXT NOT NULL,
  issuer TEXT NOT NULL DEFAULT '',
  scope TEXT NOT NULL,
  valid_from TEXT,
  valid_until TEXT,
  review_due TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected','disputed')),
  submitted_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  reviewed_by TEXT,
  review_note TEXT,
  reviewed_at TEXT,
  version INTEGER NOT NULL DEFAULT 1 CHECK(version > 0),
  CHECK(valid_from IS NULL OR valid_from GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  CHECK(valid_until IS NULL OR valid_until GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  CHECK(review_due GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  CHECK(evidence_type <> 'halal_certificate' OR (length(issuer)>0 AND valid_from IS NOT NULL AND valid_until IS NOT NULL)),
  CHECK(valid_from IS NULL OR valid_until IS NULL OR valid_from <= valid_until)
);
CREATE INDEX IF NOT EXISTS idx_trust_cases_status_date ON trust_cases(status,id DESC);
CREATE INDEX IF NOT EXISTS idx_trust_cases_subject ON trust_cases(subject_key,id DESC);
CREATE INDEX IF NOT EXISTS idx_trust_cases_review_due ON trust_cases(review_due,status);
CREATE TABLE IF NOT EXISTS trust_case_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL REFERENCES trust_cases(id),
  action TEXT NOT NULL CHECK(action IN ('submitted','accepted','rejected','disputed')),
  actor TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_trust_case_audit_case ON trust_case_audit(case_id,id);
-- Database guarantees that a successful state mutation is always audited in the same statement.
CREATE TRIGGER IF NOT EXISTS trg_trust_case_insert_audit AFTER INSERT ON trust_cases
BEGIN
 INSERT INTO trust_case_audit(case_id,action,actor,note)
 VALUES(NEW.id,'submitted',NEW.submitted_by,'Submitted for independent verification. Not public.');
END;
CREATE TRIGGER IF NOT EXISTS trg_trust_case_transition_guard BEFORE UPDATE OF status ON trust_cases
WHEN NOT ((OLD.status='pending' AND NEW.status IN ('accepted','rejected')) OR (OLD.status='accepted' AND NEW.status='disputed'))
BEGIN
 SELECT RAISE(ABORT,'Forbidden trust case transition');
END;
CREATE TRIGGER IF NOT EXISTS trg_trust_case_review_guard BEFORE UPDATE OF status ON trust_cases
WHEN NEW.reviewed_by IS NULL OR length(trim(NEW.review_note))<20
 OR (NEW.status IN ('accepted','rejected') AND lower(NEW.reviewed_by)=lower(OLD.submitted_by))
 OR (NEW.status='accepted' AND (NEW.review_due<=date('now') OR (NEW.valid_until IS NOT NULL AND NEW.valid_until<=date('now'))))
BEGIN
 SELECT RAISE(ABORT,'Review must be independent, current, and evidenced');
END;
CREATE TRIGGER IF NOT EXISTS trg_trust_case_status_audit AFTER UPDATE OF status ON trust_cases
WHEN OLD.status<>NEW.status
BEGIN
 INSERT INTO trust_case_audit(case_id,action,actor,note)
 VALUES(NEW.id,NEW.status,NEW.reviewed_by,NEW.review_note);
END;
CREATE TRIGGER IF NOT EXISTS trg_trust_case_evidence_immutable BEFORE UPDATE OF subject_key,evidence_type,claim,source_url,issuer,scope,valid_from,valid_until,review_due,submitted_by ON trust_cases
BEGIN
 SELECT RAISE(ABORT,'Evidence is immutable: create a new case');
END;
CREATE TRIGGER IF NOT EXISTS trg_trust_audit_immutable_update BEFORE UPDATE ON trust_case_audit BEGIN SELECT RAISE(ABORT,'Audit is immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_trust_audit_immutable_delete BEFORE DELETE ON trust_case_audit BEGIN SELECT RAISE(ABORT,'Audit is immutable'); END;
