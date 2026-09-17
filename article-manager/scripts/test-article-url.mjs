import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

// In-memory regression check: never touches the site's stored records.
const db = new DatabaseSync(':memory:');
const migrations = readdirSync(new URL('../drizzle/', import.meta.url)).filter(n => n.endsWith('.sql')).sort();
const apply = name => db.exec(readFileSync(new URL(`../drizzle/${name}`, import.meta.url), 'utf8'));
for (const migration of migrations.slice(0, 2)) apply(migration);
const insert = db.prepare('INSERT INTO articles (title,url,category,updated_at,memo) VALUES (?,?,?,?,?)');
insert.run('Existing draft', '', 'test', '2026-09-12', 'Keep this memo');
insert.run('Published', 'https://note.com/test/n/n123', 'test', '2026-09-12', '');
assert.throws(() => insert.run('Second draft', '', 'test', '2026-09-12', ''), /UNIQUE/);
const before = db.prepare('SELECT * FROM articles ORDER BY id').all();
apply(migrations[2]);
assert.deepEqual(db.prepare('SELECT * FROM articles ORDER BY id').all(), before);
insert.run('Second draft', '', 'test', '2026-09-12', '');
insert.run('Third draft', '', 'test', '2026-09-12', '');
assert.throws(() => insert.run('Duplicate', 'https://note.com/test/n/n123', 'test', '2026-09-12', ''), /UNIQUE/);
const update = db.prepare('UPDATE articles SET url=? WHERE id=?');
update.run('https://note.com/test/n/n456', 3);
update.run('https://note.com/test/n/n456', 3);
assert.throws(() => update.run('https://note.com/test/n/n123', 3), /UNIQUE/);
update.run('', 3);
assert.equal(db.prepare("SELECT COUNT(*) AS count FROM articles WHERE url='' ").get().count, 3);
assert.equal(db.prepare('SELECT memo FROM articles WHERE id=1').get().memo, 'Keep this memo');
db.exec('PRAGMA optimize');
db.close();
console.log('PASS: existing records preserved; multiple blank URLs accepted; duplicate URLs rejected; ID-based edits supported.');
