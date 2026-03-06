-- KMND Complete Schema — run with:
-- npx wrangler d1 execute kmnd-db --remote --file=worker/schema.sql

CREATE TABLE IF NOT EXISTS wallets (
  user_id TEXT PRIMARY KEY,
  balance REAL DEFAULT 0,
  total_earned REAL DEFAULT 0,
  display_name TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS savings_accounts (
  user_id TEXT PRIMARY KEY,
  balance REAL DEFAULT 0,
  total_deposited REAL DEFAULT 0,
  interest_earned REAL DEFAULT 0,
  rate_pct REAL DEFAULT 8.5,
  updated_at TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fixed_deposits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  principal REAL NOT NULL,
  rate_pct REAL NOT NULL,
  days INTEGER NOT NULL,
  interest_earned REAL NOT NULL,
  maturity_amount REAL NOT NULL,
  maturity_date TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tx_user ON transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_time ON price_history(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_fds_user ON fixed_deposits(user_id, status);
