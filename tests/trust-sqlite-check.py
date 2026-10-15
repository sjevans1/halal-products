"""Real SQLite validation of triggers; no Cloudflare deployment or secrets."""
from pathlib import Path
import sqlite3

ROOT=Path(__file__).resolve().parents[1]
db=sqlite3.connect(':memory:')
db.execute('PRAGMA foreign_keys=ON')
for name in ['0004_trust_register.sql','0005_trust_subjects.sql']:
    db.executescript((ROOT/'migrations'/name).read_text())
assert db.execute('SELECT count(*) FROM trust_subjects').fetchone()[0]==20
assert {x[0] for x in db.execute('SELECT DISTINCT baseline FROM trust_subjects')}=={'unverified','source-listed-only'}

def failure(sql, params=()):
    try: db.execute(sql,params)
    except sqlite3.IntegrityError: return
    raise AssertionError('Expected SQL transaction or trigger to reject '+sql)

# Exact conditions used by the production API: insert creates audit, rejected/self decisions roll back.
args=('one','product:beef-cubes','halal_certificate','Origin certificate evidence reference','https://issuer.example.org/certificate','Issuer under review','One SKU and one facility','2026-01-01','2027-06-01','2027-01-01','editor@example.org')
insert="INSERT INTO trust_cases (case_ref,subject_key,evidence_type,claim,source_url,issuer,scope,valid_from,valid_until,review_due,submitted_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
db.execute(insert,args)
assert db.execute('SELECT count(*) FROM trust_case_audit').fetchone()[0]==1
failure("UPDATE trust_cases SET status='accepted',reviewed_by='editor@example.org',review_note='I inspected the original source evidence',version=2 WHERE case_ref='one'")
assert db.execute('SELECT status FROM trust_cases').fetchone()[0]=='pending'
assert db.execute('SELECT count(*) FROM trust_case_audit').fetchone()[0]==1
valid="UPDATE trust_cases SET status='accepted',reviewed_by='verifier@example.org',review_note='I independently verified the issuing organization source',version=version+1 WHERE case_ref='one' AND status='pending' AND version=1"
db.execute(valid)
assert db.execute('SELECT version FROM trust_cases').fetchone()[0]==2
assert [x[0] for x in db.execute('SELECT action FROM trust_case_audit ORDER BY id')]==['submitted','accepted']
assert db.execute(valid).rowcount==0  # concurrency guard
failure("UPDATE trust_cases SET claim='Modified original claim' WHERE case_ref='one'")
failure("UPDATE trust_case_audit SET note='Altered history' WHERE id=1")
failure("DELETE FROM trust_case_audit WHERE id=1")
failure("UPDATE trust_cases SET status='pending' WHERE case_ref='one'")
db.execute("UPDATE trust_cases SET status='disputed',reviewed_by='editor@example.org',review_note='Credible report of suspension, pending independent confirmation',version=version+1 WHERE case_ref='one' AND version=2")
assert [x[0] for x in db.execute('SELECT action FROM trust_case_audit ORDER BY id')]==['submitted','accepted','disputed']
assert db.execute('SELECT count(*) FROM trust_subjects').fetchone()[0]==20
print('SQLite trust verification: all schema, atomic audit, immutability and concurrency cases PASS')
