CREATE TABLE IF NOT EXISTS wallets (
  user_id TEXT PRIMARY KEY,
  balance REAL DEFAULT 100,
  total_earned REAL DEFAULT 100,
  display_name TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn','send','receive','spend')),
  amount REAL NOT NULL,
  description TEXT DEFAULT '',
  source TEXT DEFAULT '',
  to_user_id TEXT DEFAULT '',
  from_user_id TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS price_history (
  id TEXT PRIMARY KEY,
  price REAL NOT NULL,
  supply REAL DEFAULT 0,
  recorded_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tx_user ON transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_time ON price_history(recorded_at DESC);
