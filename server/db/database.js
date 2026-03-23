const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'risk_register.db');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;
let dbReady = null;

// Wrapper that provides a better-sqlite3-compatible API over sql.js
class DatabaseWrapper {
  constructor(sqlDb) {
    this._db = sqlDb;
  }

  prepare(sql) {
    const self = this;
    return {
      run(...params) {
        self._db.run(sql, params);
        const lastId = self._db.exec('SELECT last_insert_rowid() as id')[0];
        const changes = self._db.getRowsModified();
        self._save();
        return {
          lastInsertRowid: lastId ? lastId.values[0][0] : 0,
          changes,
        };
      },
      get(...params) {
        const stmt = self._db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          stmt.free();
          const row = {};
          cols.forEach((c, i) => { row[c] = vals[i]; });
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...params) {
        const stmt = self._db.prepare(sql);
        stmt.bind(params);
        const rows = [];
        const cols = stmt.getColumnNames();
        while (stmt.step()) {
          const vals = stmt.get();
          const row = {};
          cols.forEach((c, i) => { row[c] = vals[i]; });
          rows.push(row);
        }
        stmt.free();
        return rows;
      },
    };
  }

  exec(sql) {
    this._db.run(sql);
    this._save();
  }

  pragma(p) {
    try {
      this._db.run(`PRAGMA ${p}`);
    } catch (e) {
      // Some pragmas may not be supported in sql.js
    }
  }

  _save() {
    const data = this._db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

async function initDb() {
  const SQL = await initSqlJs();
  let sqlDb;
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    sqlDb = new SQL.Database(fileBuffer);
  } else {
    sqlDb = new SQL.Database();
  }
  db = new DatabaseWrapper(sqlDb);
  db.pragma('foreign_keys = ON');

  // Initialize schema
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  // Execute each statement separately
  const statements = schema.split(';').filter(s => s.trim());
  for (const stmt of statements) {
    try {
      db._db.run(stmt + ';');
    } catch (e) {
      // Table may already exist
    }
  }
  db._save();
  return db;
}

dbReady = initDb();

// Synchronous module export - but callers must await getDb()
module.exports = {
  getDb: () => dbReady,
};
