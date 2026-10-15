"""Real SQLite migration acceptance; do not rely only on mocked D1 test APIs."""
from pathlib import Path
import sqlite3
p=Path(__file__).resolve().parent.parent
con=sqlite3.connect(':memory:')
con.execute('PRAGMA foreign_keys=ON')
for migration in ('0007_steward_grants.sql','0008_steward_proposals.sql'):
    con.executescript((p/'migrations'/migration).read_text())
base=('central-masjid','member@example.org','https://example.org/official-record','Independent contact verified with organization administrators via their public page.','reviewer@example.org','reviewer@example.org','2027-04-15')
con.execute('INSERT INTO steward_grants(listing_id,email,source_url,review_note,issued_by,acted_by,expires_at) VALUES(?,?,?,?,?,?,?)',base)
id=con.execute('SELECT id FROM steward_grants').fetchone()[0]
assert con.execute('SELECT count(*) FROM steward_audit').fetchone()[0]==1
def blocked(sql,params=()):
    try:con.execute(sql,params)
    except sqlite3.IntegrityError:return
    raise AssertionError('Forbidden steward operation succeeded: '+sql)
blocked('INSERT INTO steward_grants(listing_id,email,source_url,review_note,issued_by,acted_by,expires_at) VALUES(?,?,?,?,?,?,?)',base)
blocked('UPDATE steward_grants SET source_url=? WHERE id=?',('https://tampered.example',id))
blocked('UPDATE steward_grants SET status=? WHERE id=?',('revoked',id))
blocked('UPDATE steward_audit SET note=? WHERE grant_id=?',('erase evidence',id))
con.execute('INSERT INTO steward_proposals(grant_id,listing_id,submitted_by,source_url,note) VALUES(?,?,?,?,?)',(id,'central-masjid','member@example.org','https://example.org/new-schedule','An official source gives corrected information about the community centre.'))
blocked('INSERT INTO steward_proposals(grant_id,listing_id,submitted_by,source_url,note) VALUES(?,?,?,?,?)',(id,'other-masjid','member@example.org','https://example.org','Attempt to update some other organization information.'))
blocked('INSERT INTO steward_proposals(grant_id,listing_id,submitted_by,source_url,note) VALUES(?,?,?,?,?)',(id,'central-masjid','wrong@example.org','https://example.org','Try to impersonate assigned community representative.'))
blocked('UPDATE steward_proposals SET note=? WHERE id=1',('other',))
con.execute("UPDATE steward_grants SET status='revoked',action='revoked',acted_by='reviewer@example.org',action_note='Organization withdrew authority in writing.',revision=revision+1 WHERE id=?",(id,))
assert con.execute('SELECT count(*) FROM steward_audit').fetchone()[0]==2
blocked('INSERT INTO steward_proposals(grant_id,listing_id,submitted_by,source_url,note) VALUES(?,?,?,?,?)',(id,'central-masjid','member@example.org','https://example.org','This should not be accepted after the grant was revoked.'))
blocked('DELETE FROM steward_grants WHERE id=?',(id,))
blocked('DELETE FROM steward_audit WHERE grant_id=?',(id,))
print('STEWARD SQLITE PASS — scope, no self-claim, append-only audit, revocation, pending-only proposals')
