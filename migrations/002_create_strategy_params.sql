-- Strategy parameters table
CREATE TABLE IF NOT EXISTS user_strategy_params (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fast INTEGER NOT NULL DEFAULT 9,
    slow INTEGER NOT NULL DEFAULT 21,
    rsi INTEGER NOT NULL DEFAULT 55,
    stop_dist_pct FLOAT NOT NULL DEFAULT 0.005,
    rr FLOAT NOT NULL DEFAULT 2.0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Audit logs table (extended)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    summary TEXT,
    payload JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
