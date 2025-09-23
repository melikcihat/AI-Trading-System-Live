-- Strategy profiles table
CREATE TABLE IF NOT EXISTS strategy_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    strategies JSONB NOT NULL,
    aggregate_rule VARCHAR(20) NOT NULL DEFAULT 'PRIORITY',
    priority_order JSONB NOT NULL DEFAULT '[]',
    active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, symbol, timeframe)
);

-- Alert templates table
CREATE TABLE IF NOT EXISTS alert_templates (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    channel VARCHAR(20) NOT NULL,
    template_text TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default alert templates
INSERT INTO alert_templates (key, channel, template_text) VALUES
('signal_default', 'TELEGRAM', '[{{ts}}] {{symbol}} {{timeframe}} → FINAL: {{side}}
EMA_RSI={{ema_rsi}}, BREAKOUT={{breakout}}, MR={{mr}}
RR={{rr}} SL={{sl}} TP={{tp}}'),
('signal_default', 'DISCORD', '**{{symbol}} {{timeframe}}** → **{{side}}**
EMA_RSI: {{ema_rsi}} | BREAKOUT: {{breakout}} | MR: {{mr}}
RR: {{rr}} | SL: {{sl}} | TP: {{tp}}')
ON CONFLICT (key) DO NOTHING;
