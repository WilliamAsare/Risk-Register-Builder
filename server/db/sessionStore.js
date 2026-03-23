const session = require('express-session');

const db = () => global.__db;

class SqliteSessionStore extends session.Store {
  constructor(options = {}) {
    super();
    this.checkPeriod = options.checkPeriod || 86400000;
    this._ensureTable();
    this._startCleanup();
  }

  _ensureTable() {
    try {
      db()._db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
          sid TEXT PRIMARY KEY,
          sess TEXT NOT NULL,
          expired INTEGER NOT NULL
        )
      `);
      db()._db.run('CREATE INDEX IF NOT EXISTS idx_sessions_expired ON sessions(expired)');
      db()._save();
    } catch {
      // Table may already exist
    }
  }

  _startCleanup() {
    this._cleanupTimer = setInterval(() => {
      try {
        db().prepare('DELETE FROM sessions WHERE expired < ?').run(Date.now());
      } catch {
        // ignore cleanup errors
      }
    }, this.checkPeriod);
    if (this._cleanupTimer.unref) this._cleanupTimer.unref();
  }

  get(sid, callback) {
    try {
      const row = db().prepare('SELECT sess FROM sessions WHERE sid = ? AND expired > ?').get(sid, Date.now());
      if (!row) return callback(null, null);
      callback(null, JSON.parse(row.sess));
    } catch (err) {
      callback(err);
    }
  }

  set(sid, sess, callback) {
    try {
      const maxAge = sess.cookie?.maxAge || 86400000;
      const expired = Date.now() + maxAge;
      const sessStr = JSON.stringify(sess);
      // Upsert
      const existing = db().prepare('SELECT sid FROM sessions WHERE sid = ?').get(sid);
      if (existing) {
        db().prepare('UPDATE sessions SET sess = ?, expired = ? WHERE sid = ?').run(sessStr, expired, sid);
      } else {
        db().prepare('INSERT INTO sessions (sid, sess, expired) VALUES (?, ?, ?)').run(sid, sessStr, expired);
      }
      callback?.(null);
    } catch (err) {
      callback?.(err);
    }
  }

  destroy(sid, callback) {
    try {
      db().prepare('DELETE FROM sessions WHERE sid = ?').run(sid);
      callback?.(null);
    } catch (err) {
      callback?.(err);
    }
  }

  touch(sid, sess, callback) {
    try {
      const maxAge = sess.cookie?.maxAge || 86400000;
      const expired = Date.now() + maxAge;
      db().prepare('UPDATE sessions SET expired = ? WHERE sid = ?').run(expired, sid);
      callback?.(null);
    } catch (err) {
      callback?.(err);
    }
  }
}

module.exports = { SqliteSessionStore };
