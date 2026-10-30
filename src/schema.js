// Versioned CREATE IF NOT EXISTS statements keep first deployment usable without a CLI migration.
export const schema=[
`CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, expires INTEGER NOT NULL)`,
`CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL)`,
`CREATE TABLE IF NOT EXISTS settings (provider TEXT PRIMARY KEY, ciphertext TEXT NOT NULL, model TEXT NOT NULL, consent INTEGER NOT NULL DEFAULT 0, tested_at TEXT, state TEXT NOT NULL DEFAULT 'belum dites', revision INTEGER NOT NULL DEFAULT 1)`,
`CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, name TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, hash TEXT NOT NULL, created_at TEXT NOT NULL, extraction TEXT)`,
`CREATE INDEX IF NOT EXISTS document_hash ON documents(hash)`,
`CREATE TABLE IF NOT EXISTS prices (id TEXT PRIMARY KEY, supplier TEXT NOT NULL, product TEXT NOT NULL, condition TEXT NOT NULL, amount INTEGER NOT NULL CHECK(amount>0), unit TEXT NOT NULL, channel TEXT NOT NULL, region TEXT NOT NULL, pack TEXT NOT NULL, basis TEXT NOT NULL, valid_from TEXT NOT NULL, valid_to TEXT NOT NULL, source TEXT NOT NULL, document_id TEXT REFERENCES documents(id), notes TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('draft','published','withdrawn')), revision INTEGER NOT NULL DEFAULT 1, ai_review TEXT, ai_at TEXT, created_at TEXT NOT NULL)`,
`CREATE INDEX IF NOT EXISTS price_lookup ON prices(status,valid_from,valid_to,supplier,product)`,
`CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, session TEXT NOT NULL, action TEXT NOT NULL, entity TEXT NOT NULL, detail TEXT NOT NULL)`,
`CREATE TRIGGER IF NOT EXISTS no_overlap BEFORE UPDATE OF status ON prices WHEN NEW.status='published' BEGIN SELECT CASE WHEN EXISTS (SELECT 1 FROM prices p WHERE p.id<>NEW.id AND p.status='published' AND p.supplier=NEW.supplier AND p.product=NEW.product AND p.condition=NEW.condition AND p.unit=NEW.unit AND p.channel=NEW.channel AND p.region=NEW.region AND p.pack=NEW.pack AND p.basis=NEW.basis AND (NEW.valid_to='' OR p.valid_from<=NEW.valid_to) AND (p.valid_to='' OR NEW.valid_from<=p.valid_to)) THEN RAISE(ABORT,'OVERLAP') END; END`
];
const ready=new WeakMap();
export async function initialize(db){if(!ready.has(db)){const p=db.batch(schema.map(sql=>db.prepare(sql))).catch(e=>{ready.delete(db);throw e;});ready.set(db,p);}await ready.get(db);}
