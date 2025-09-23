-- Daily equity tracking
CREATE TABLE IF NOT EXISTS equity_daily (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    date DATE NOT NULL,
    equity NUMERIC(15, 2) NOT NULL,
    realized_pnl NUMERIC(15, 2) NOT NULL DEFAULT 0,
    unrealized_pnl NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Trade executions tracking
CREATE TABLE IF NOT EXISTS trade_executions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    symbol VARCHAR(50) NOT NULL,
    side VARCHAR(10) NOT NULL,
    qty NUMERIC(15, 8) NOT NULL,
    price NUMERIC(15, 2) NOT NULL,
    fee NUMERIC(15, 2) NOT NULL DEFAULT 0,
    ts TIMESTAMP WITH TIME ZONE NOT NULL,
    strategy VARCHAR(100),
    profile_id INTEGER REFERENCES strategy_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trade journal
CREATE TABLE IF NOT EXISTS trade_journal (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    exec_id INTEGER REFERENCES trade_executions(id),
    symbol VARCHAR(50) NOT NULL,
    tags TEXT[] DEFAULT '{}',
    note TEXT,
    screenshot_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_equity_daily_user_date ON equity_daily(user_id, date);
CREATE INDEX IF NOT EXISTS idx_trade_executions_user_ts ON trade_executions(user_id, ts);
CREATE INDEX IF NOT EXISTS idx_trade_executions_symbol ON trade_executions(symbol);
CREATE INDEX IF NOT EXISTS idx_trade_journal_user ON trade_journal(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_journal_exec ON trade_journal(exec_id);
