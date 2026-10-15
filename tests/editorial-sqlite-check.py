"""SQLite semantics for immutable audit, independent review and atomic revisions."""
import sqlite3
from pathlib import Path
root=Path(__file__).resolve().parents[1]
db=sqlite3.connect(':memory:')
db.executescript((root/'migrations/0006_editorial_workflow.sql').read_text())
source='https://example.org/community/source'
db.execute('''INSERT INTO editorial_entries(kind,slug,title,summary,body,source_url,parish,event_date,created_by,acted_by,action_note)
  VALUES(?,?,?,?,?,?,?,?,?,?,?)''',('event','jamaica-meetup','Proposed Community Gathering','An example event undergoing review, not published.','This event is a development-only fixture and is not approved for public listing in Jamaica.',source,'Kingston','2026-12-12','author@example.org','author@example.org','Not public'))
row=db.execute('SELECT id,revision,status FROM editorial_entries').fetchone()
assert row==(1,1,'draft')
def update(sql,params=()):
  db.execute(sql,params)
  return db.execute('SELECT status,revision FROM editorial_entries WHERE id=1').fetchone()
def denied(sql,params=()):
  before=db.execute('SELECT count(*) FROM editorial_audit').fetchone()[0]
  try:db.execute(sql,params);raise AssertionError('forbidden SQL succeeded')
  except sqlite3.IntegrityError:pass
  assert db.execute('SELECT count(*) FROM editorial_audit').fetchone()[0]==before
assert update("UPDATE editorial_entries SET status='submitted',revision=2,last_action='submitted',acted_by='author@example.org',action_note='Submitted for independent review' WHERE id=1")==('submitted',2)
denied("UPDATE editorial_entries SET status='approved',revision=3,last_action='approved',acted_by='author@example.org',action_note='Self-approval must always be rejected by DB' WHERE id=1")
denied("UPDATE editorial_entries SET body='Tampered details',revision=3,last_action='approved',status='approved',acted_by='reviewer@example.org',action_note='Independently reviewed and acceptable details' WHERE id=1")
denied("UPDATE editorial_entries SET status='approved',revision=2,last_action='approved',acted_by='reviewer@example.org',action_note='Stale revision should not be accepted by DB' WHERE id=1")
assert update("UPDATE editorial_entries SET status='changes_requested',revision=3,last_action='changes_requested',acted_by='reviewer@example.org',action_note='Check organizer source and location before publication' WHERE id=1")==('changes_requested',3)
assert update("UPDATE editorial_entries SET status='draft',revision=4,last_action='edited',acted_by='author@example.org',body='Updated development-only event summary. This fixture remains private and has no verified organizer.',action_note='Updated draft after request' WHERE id=1")==('draft',4)
assert update("UPDATE editorial_entries SET status='submitted',revision=5,last_action='submitted',acted_by='author@example.org',action_note='Resubmitted for independent review' WHERE id=1")==('submitted',5)
assert update("UPDATE editorial_entries SET status='approved',revision=6,last_action='approved',acted_by='reviewer@example.org',action_note='Reviewed internal sample: subject remains unpublished' WHERE id=1")==('approved',6)
denied("UPDATE editorial_entries SET status='submitted',revision=7,last_action='submitted',acted_by='author@example.org',action_note='Attempting to reopen an approved record' WHERE id=1")
denied('DELETE FROM editorial_entries WHERE id=1')
denied('DELETE FROM editorial_audit WHERE entry_id=1')
denied("UPDATE editorial_audit SET note='bad' WHERE entry_id=1")
audit=db.execute('SELECT revision,action,actor FROM editorial_audit WHERE entry_id=1 ORDER BY id').fetchall()
assert [x[1] for x in audit]==['created','submitted','changes_requested','edited','submitted','approved'],audit
assert [x[0] for x in audit]==list(range(1,7))
print('EDITORIAL SQL PASS — revision chain, guards, independent review, append-only history')
