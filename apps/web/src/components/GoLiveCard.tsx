import { useState, useEffect } from 'react'

export default function GoLiveCard(){
  const [status, setStatus] = useState<any>(null)
  const [preFlight, setPreFlight] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('testnet')
  const [day, setDay] = useState('pilot')

  useEffect(() => {
    loadStatus()
    loadPreFlight()
  }, [])

  const loadStatus = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/production/status')
      const data = await response.json()
      setStatus(data)
    } catch (e) {
      console.error('Error loading status:', e)
    }
  }

  const loadPreFlight = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/production/pre-flight')
      const data = await response.json()
      setPreFlight(data)
    } catch (e) {
      console.error('Error loading pre-flight:', e)
    }
  }

  const runGoLiveChecks = async () => {
    setLoading(true)
    setError('')
    try {
      // Test all endpoints
      const checks = await Promise.all([
        fetch(import.meta.env.VITE_API_URL + '/api/health'),
        fetch(import.meta.env.VITE_API_URL + '/api/production/status'),
        fetch(import.meta.env.VITE_API_URL + '/api/production/pre-flight'),
        fetch(import.meta.env.VITE_API_URL + '/api/emergency/status')
      ])

      const results = await Promise.all(checks.map(r => r.json()))
      
      const allPassed = results.every(r => r.status === 'ok' || r.status === 'ready')
      
      if (allPassed) {
        alert('✅ All GO-LIVE checks passed! System is ready for live trading.')
      } else {
        alert('❌ Some checks failed. Review the status before proceeding.')
      }
    } catch (e) {
      setError('Network error during checks')
    } finally {
      setLoading(false)
    }
  }

  const testOrderValidation = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/production/validate-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: 'BTCUSDT',
          qty: 0.001,
          price: 50000
        })
      })
      
      const data = await response.json()
      if (data.validation.valid) {
        alert('✅ Order validation passed!')
      } else {
        alert(`❌ Order validation failed: ${data.validation.errors.join(', ')}`)
      }
    } catch (e) {
      alert('❌ Order validation test failed')
    }
  }

  const testAlerts = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/alerts/test', {
        method: 'POST'
      })
      
      const data = await response.json()
      if (data.success) {
        alert('✅ Alert test sent! Check your Telegram/Discord.')
      } else {
        alert('❌ Alert test failed')
      }
    } catch (e) {
      alert('❌ Alert test failed')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': case 'ready': case 'connected': return 'text-green-600 bg-green-50 border-green-300'
      case 'not_ready': case 'disconnected': return 'text-red-600 bg-red-50 border-red-300'
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-300'
    }
  }

  const getRiskConfig = () => {
    switch (day) {
      case 'pilot':
        return { notional: '1%', dailyLoss: '1%', risk: '0.5%' }
      case 'day2':
        return { notional: '2%', dailyLoss: '1.5%', risk: '0.5%' }
      case 'day3':
        return { notional: '3%', dailyLoss: '2%', risk: '0.5%' }
      default:
        return { notional: '1%', dailyLoss: '1%', risk: '0.5%' }
    }
  }

  const riskConfig = getRiskConfig()

  return (
    <div className="space-y-6">
      {/* GO-LIVE Configuration */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">GO-LIVE Configuration</h2>
          <button 
            className="btn bg-green-600 text-white" 
            onClick={runGoLiveChecks}
            disabled={loading}
          >
            {loading ? 'Running Checks...' : '🚀 Run GO-LIVE Checks'}
          </button>
        </div>

        {error && <div className="text-sm text-red-600">Error: {error}</div>}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-zinc-600 text-sm">Mode</div>
            <select 
              value={mode} 
              onChange={e => setMode(e.target.value)}
              className="w-full rounded-xl border p-2"
            >
              <option value="testnet">Testnet (Safe)</option>
              <option value="mainnet">Mainnet (Live)</option>
            </select>
          </div>
          <div className="space-y-1">
            <div className="text-zinc-600 text-sm">Risk Level</div>
            <select 
              value={day} 
              onChange={e => setDay(e.target.value)}
              className="w-full rounded-xl border p-2"
            >
              <option value="pilot">Pilot (Day 1)</option>
              <option value="day2">Day 2</option>
              <option value="day3">Day 3</option>
            </select>
          </div>
        </div>

        <div className="bg-zinc-50 border rounded-xl p-4">
          <div className="font-medium mb-2">Risk Configuration</div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-zinc-600">Max Notional</div>
              <div className="font-bold">{riskConfig.notional}</div>
            </div>
            <div>
              <div className="text-zinc-600">Daily Loss Limit</div>
              <div className="font-bold">{riskConfig.dailyLoss}</div>
            </div>
            <div>
              <div className="text-zinc-600">Risk Per Trade</div>
              <div className="font-bold">{riskConfig.risk}</div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="font-medium text-blue-800 mb-2">Environment Variables</div>
          <div className="text-sm text-blue-700 space-y-1 font-mono">
            <div>BINANCE_TESTNET={mode === 'testnet' ? 'true' : 'false'}</div>
            <div>MAX_ORDER_NOTIONAL_PCT={day === 'pilot' ? '0.01' : day === 'day2' ? '0.02' : '0.03'}</div>
            <div>DAILY_LOSS_LIMIT_PCT={day === 'pilot' ? '0.01' : day === 'day2' ? '0.015' : '0.02'}</div>
            <div>MAX_RISK_PCT=0.005</div>
            <div>SAFETY_LOCK=true</div>
          </div>
        </div>
      </div>

      {/* System Status */}
      {status && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">System Status</h2>
            <button 
              className="btn bg-zinc-300 text-zinc-700" 
              onClick={loadStatus}
            >
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-50 border rounded-xl p-3 text-center">
              <div className="text-sm text-zinc-600">Environment</div>
              <div className={`text-lg font-bold ${status.environment.isProduction ? 'text-green-600' : 'text-yellow-600'}`}>
                {status.environment.isProduction ? 'PROD' : 'DEV'}
              </div>
            </div>
            <div className="bg-zinc-50 border rounded-xl p-3 text-center">
              <div className="text-sm text-zinc-600">Exchange</div>
              <div className={`text-lg font-bold ${getStatusColor(status.exchange.status)}`}>
                {status.exchange.status.toUpperCase()}
              </div>
            </div>
            <div className="bg-zinc-50 border rounded-xl p-3 text-center">
              <div className="text-sm text-zinc-600">Trading</div>
              <div className={`text-lg font-bold ${status.safety.tradingAllowed ? 'text-green-600' : 'text-red-600'}`}>
                {status.safety.tradingAllowed ? 'ON' : 'OFF'}
              </div>
            </div>
            <div className="bg-zinc-50 border rounded-xl p-3 text-center">
              <div className="text-sm text-zinc-600">Testnet</div>
              <div className={`text-lg font-bold ${status.environment.isTestnet ? 'text-yellow-600' : 'text-green-600'}`}>
                {status.environment.isTestnet ? 'YES' : 'NO'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Flight Checks */}
      {preFlight && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">Pre-Flight Checks</h2>
            <div className={`badge ${getStatusColor(preFlight.status)}`}>
              {preFlight.status.toUpperCase()}
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-50 border rounded-xl p-3">
                <div className="font-medium mb-2">Environment</div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Production:</span>
                    <span className={preFlight.checks.environment.isProduction ? 'text-green-600' : 'text-red-600'}>
                      {preFlight.checks.environment.isProduction ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Testnet:</span>
                    <span className={preFlight.checks.environment.isTestnet ? 'text-yellow-600' : 'text-green-600'}>
                      {preFlight.checks.environment.isTestnet ? 'YES' : 'NO'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-zinc-50 border rounded-xl p-3">
                <div className="font-medium mb-2">Safety</div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Safety Lock:</span>
                    <span className={preFlight.checks.safety.safetyLock ? 'text-green-600' : 'text-red-600'}>
                      {preFlight.checks.safety.safetyLock ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trading:</span>
                    <span className={preFlight.checks.safety.tradingAllowed ? 'text-green-600' : 'text-red-600'}>
                      {preFlight.checks.safety.tradingAllowed ? 'ALLOWED' : 'BLOCKED'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Actions */}
      <div className="card">
        <h2 className="font-medium mb-4">Test Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <button 
            className="btn" 
            onClick={testOrderValidation}
          >
            Test Order Validation
          </button>
          <button 
            className="btn" 
            onClick={testAlerts}
          >
            Test Alerts
          </button>
        </div>
      </div>

      {/* GO-LIVE Steps */}
      <div className="card">
        <h2 className="font-medium mb-4">GO-LIVE Steps</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
            <div>
              <div className="font-medium">Set Environment Variables</div>
              <div className="text-zinc-600">Update .env.production with the values shown above</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
            <div>
              <div className="font-medium">Restart Application</div>
              <div className="text-zinc-600">Restart the API with new environment variables</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
            <div>
              <div className="font-medium">Shadow Testing</div>
              <div className="text-zinc-600">Monitor for 15-30 minutes with SAFETY_LOCK=true</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</div>
            <div>
              <div className="font-medium">Enable Trading</div>
              <div className="text-zinc-600">Set SAFETY_LOCK=false if metrics are green</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">5</div>
            <div>
              <div className="font-medium">Start Small</div>
              <div className="text-zinc-600">Begin with minimum notional orders</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
