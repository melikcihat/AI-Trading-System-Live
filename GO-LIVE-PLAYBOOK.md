# GO-LIVE PLAYBOOK 🚀

## 5 Adım Canlıya Geçiş

### 1. Testnet → Mainnet Kararı
```bash
# İlk gün için testnet'te kal (güvenli)
BINANCE_TESTNET=true

# Mainnet'e geçiş (hazır olduğunda)
BINANCE_TESTNET=false
```

### 2. Konservatif Limitler
```bash
# İlk gün limitleri
MAX_ORDER_NOTIONAL_PCT=0.01    # Sermayenin %1'i
DAILY_LOSS_LIMIT_PCT=0.01      # Günlük %1 zarar limiti
MAX_RISK_PCT=0.005             # İşlem başı %0.5 risk

# Tek enstrüman/tek timeframe
ALLOWED_SYMBOLS=BTCUSDT
STRATEGY_TIMEFRAME=5m
```

### 3. Shadow Testing
```bash
# 15-30 dakika shadow izle
SAFETY_LOCK=true

# Metrikler yeşilse canlıya geç
SAFETY_LOCK=false
```

### 4. İlk 3 Emir Testi
- Çok küçük notional ile dene
- Audit logs kontrol et
- Alerts akışını doğrula
- PnL tracking'i test et

### 5. Risk Merdiveni (3 Gün)

#### Gün 1: Pilot
```bash
MAX_ORDER_NOTIONAL_PCT=0.01    # %1 notional
DAILY_LOSS_LIMIT_PCT=0.01      # %1 günlük zarar
MAX_RISK_PCT=0.005             # %0.5 risk
```

#### Gün 2: (PF>1.1 ve MaxDD<%5 şartı)
```bash
MAX_ORDER_NOTIONAL_PCT=0.02    # %2 notional
DAILY_LOSS_LIMIT_PCT=0.015     # %1.5 günlük zarar
MAX_RISK_PCT=0.005             # %0.5 risk
```

#### Gün 3: (PF>1.2 ve hata bütçesi <0.1% şartı)
```bash
MAX_ORDER_NOTIONAL_PCT=0.03    # %3 notional
DAILY_LOSS_LIMIT_PCT=0.02      # %2 günlük zarar
MAX_RISK_PCT=0.005             # %0.5 risk
```

## Acil Durum Kısayolları

### Panik Durdur (Hemen)
```bash
curl -X POST https://YOUR_DOMAIN/api/emergency/panic-stop \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Belirli Sembolü Durdur
```bash
curl -X POST https://YOUR_DOMAIN/api/emergency/partial-stop \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"symbols":["BTCUSDT"]}'
```

### Safety Lock Toggle
```bash
# .env.production'da değiştir
SAFETY_LOCK=true   # Trading'i durdur
SAFETY_LOCK=false  # Trading'i başlat

# Stack'i yeniden başlat
docker compose -f docker-compose.prod.yml up -d --build api
```

## Canlı Sipariş Öncesi Doğrulama

### Üretim Durumu
```bash
curl https://YOUR_DOMAIN/api/production/status
```

### Order Validation
```bash
curl -X POST https://YOUR_DOMAIN/api/production/validate-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "symbol": "BTCUSDT",
    "side": "buy",
    "price": 65000,
    "qty": 0.001
  }'
```

### Pre-Flight Checks
```bash
curl https://YOUR_DOMAIN/api/production/pre-flight
```

## Operasyon Planı (İlk 24 Saat)

### T+0 Saat: Başlangıç
- [ ] WebSocket status 🟢
- [ ] Alerts test gönder
- [ ] /metrics endpoint açık
- [ ] Dashboard'u aç
- [ ] Emergency controls hazır

### T+0:15: Shadow Testing
- [ ] SAFETY_LOCK=true ile shadow
- [ ] Final sinyal/alarmlar akıyor mu?
- [ ] Performance metrikleri yeşil mi?

### T+0:30: İlk Canlı Emirler
- [ ] SAFETY_LOCK=false
- [ ] Min. notional ile 1 market emir
- [ ] 1 limit emir place/cancel
- [ ] Audit logs kontrol et
- [ ] Alerts geldi mi?

### T+2 Saat: İlk Kontrol
- [ ] Performance panelde equity/PnL
- [ ] Alerts gözden geçir
- [ ] Journal'a not düş
- [ ] Sistem stabil mi?

### Gün Sonu: KPI Raporu
- [ ] Profit Factor (PF)
- [ ] Max Drawdown (MaxDD)
- [ ] Win Rate
- [ ] Total PnL
- [ ] Incident var mı?
- [ ] Journal & backup check

## Flip Checklist (Son 10 Dakika)

### Environment
- [ ] `BINANCE_TESTNET=false` (mainnet için)
- [ ] `.env.production` secrets güncel
- [ ] CORS sadece kendi domain
- [ ] Gereksiz log yok (masking)

### Safety
- [ ] `SAFETY_LOCK=true` (başlangıçta)
- [ ] `ALLOWED_SYMBOLS` doğru
- [ ] `SESSION_WINDOW` ayarlı
- [ ] Emergency contacts güncel

### Monitoring
- [ ] `/metrics` akıyor
- [ ] Uptime ping yeşil
- [ ] Telegram/Discord test alert geldi
- [ ] Backup cron logunda bugün tarihli dump var

### Configuration
- [ ] Tek aktif profil seçili
- [ ] Risk parametreleri konservatif
- [ ] Single instrument focus (BTCUSDT)
- [ ] Single timeframe (5m)

## Hızlı Komutlar

### Sistem Durumu
```bash
# Genel durum
curl https://YOUR_DOMAIN/api/production/status

# Emergency durum
curl https://YOUR_DOMAIN/api/emergency/status

# Health check
curl https://YOUR_DOMAIN/api/health
```

### Test Komutları
```bash
# Alert test
curl -X POST https://YOUR_DOMAIN/api/alerts/test

# Order validation test
curl -X POST https://YOUR_DOMAIN/api/production/validate-order \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","qty":0.001,"price":50000}'
```

### Emergency Komutları
```bash
# Panic stop
curl -X POST https://YOUR_DOMAIN/api/emergency/panic-stop

# Partial stop
curl -X POST https://YOUR_DOMAIN/api/emergency/partial-stop \
  -H "Content-Type: application/json" \
  -d '{"symbols":["BTCUSDT"]}'

# Safety lock toggle
curl -X PUT https://YOUR_DOMAIN/api/emergency/controls \
  -H "Content-Type: application/json" \
  -d '{"safetyLock":true}'
```

## Günlük Rapor Template

### Performance Metrics
- **Total PnL**: $XXX.XX
- **Profit Factor**: X.XX
- **Max Drawdown**: X.XX%
- **Win Rate**: XX.X%
- **Total Trades**: XX

### System Health
- **Uptime**: XXh XXm
- **Error Rate**: X.XX%
- **Response Time p99**: XXXms
- **Alerts Sent**: XX

### Incidents
- [ ] None
- [ ] List any issues

### Lessons Learned
- [ ] What went well
- [ ] What to improve
- [ ] Next day adjustments

## Success Criteria

### Day 1 (Pilot)
- ✅ System stable for 24h
- ✅ All alerts working
- ✅ No critical errors
- ✅ PnL tracking accurate

### Day 2 (Scale Up)
- ✅ PF > 1.1
- ✅ MaxDD < 5%
- ✅ Error rate < 0.1%
- ✅ Ready for 2% notional

### Day 3 (Full Scale)
- ✅ PF > 1.2
- ✅ MaxDD < 5%
- ✅ Error rate < 0.1%
- ✅ Ready for 3% notional

## Emergency Contacts

- **Technical Lead**: [Name] - [Phone] - [Email]
- **Risk Manager**: [Name] - [Phone] - [Email]
- **Operations**: [Name] - [Phone] - [Email]

## Backup Procedures

### Database Backup
```bash
# Daily backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20240101.sql
```

### System Restart
```bash
# Full restart
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build

# API only restart
docker compose -f docker-compose.prod.yml restart api
```

---

**🚨 REMEMBER: Safety first! Start conservative, scale gradually! 🚨**
