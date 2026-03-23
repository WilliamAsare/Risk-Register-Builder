CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  organization TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS registers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  framework TEXT DEFAULT 'general',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  register_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  owner TEXT,
  criticality TEXT DEFAULT 'medium',
  description TEXT,
  FOREIGN KEY (register_id) REFERENCES registers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS threats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  register_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  source TEXT,
  description TEXT,
  FOREIGN KEY (register_id) REFERENCES registers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS controls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  register_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT,
  effectiveness TEXT DEFAULT 'moderate',
  owner TEXT,
  description TEXT,
  FOREIGN KEY (register_id) REFERENCES registers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS risks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  register_id INTEGER NOT NULL,
  risk_id_label TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  asset_id INTEGER,
  threat_id INTEGER,
  risk_category TEXT NOT NULL,
  inherent_likelihood INTEGER NOT NULL CHECK(inherent_likelihood BETWEEN 1 AND 5),
  inherent_impact INTEGER NOT NULL CHECK(inherent_impact BETWEEN 1 AND 5),
  inherent_risk_score INTEGER,
  residual_likelihood INTEGER NOT NULL CHECK(residual_likelihood BETWEEN 1 AND 5),
  residual_impact INTEGER NOT NULL CHECK(residual_impact BETWEEN 1 AND 5),
  residual_risk_score INTEGER,
  treatment TEXT DEFAULT 'mitigate',
  treatment_plan TEXT,
  risk_owner TEXT,
  due_date DATE,
  status TEXT DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (register_id) REFERENCES registers(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  FOREIGN KEY (threat_id) REFERENCES threats(id)
);

CREATE TABLE IF NOT EXISTS risk_controls (
  risk_id INTEGER NOT NULL,
  control_id INTEGER NOT NULL,
  PRIMARY KEY (risk_id, control_id),
  FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE,
  FOREIGN KEY (control_id) REFERENCES controls(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS risk_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL,
  register_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE,
  FOREIGN KEY (register_id) REFERENCES registers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS risk_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS register_collaborators (
  register_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT DEFAULT 'viewer',
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (register_id, user_id),
  FOREIGN KEY (register_id) REFERENCES registers(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_registers_user_id ON registers(user_id);
CREATE INDEX IF NOT EXISTS idx_register_collaborators_user_id ON register_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_register_id ON assets(register_id);
CREATE INDEX IF NOT EXISTS idx_threats_register_id ON threats(register_id);
CREATE INDEX IF NOT EXISTS idx_controls_register_id ON controls(register_id);
CREATE INDEX IF NOT EXISTS idx_risks_register_id ON risks(register_id);
CREATE INDEX IF NOT EXISTS idx_risks_asset_id ON risks(asset_id);
CREATE INDEX IF NOT EXISTS idx_risks_threat_id ON risks(threat_id);
CREATE INDEX IF NOT EXISTS idx_risk_history_risk_id ON risk_history(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_history_register_id ON risk_history(register_id);
CREATE INDEX IF NOT EXISTS idx_risk_comments_risk_id ON risk_comments(risk_id);
