import { useState, useEffect } from 'react'

export default function ProductionStatus(){
  const [status, setStatus] = useState<any>(null)
  const [preFlight, setPreFlight] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      console.error('Error loading production status:', e)
    }
  }

  const loadPreFlight = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/production/pre-flight')
      const data = await response.json()
      setPreFlight(data)
    } catch (e) {
      console.error('Error loading pre-flight checks:', e)
    }
  }

  const testOrderValidation = async () => {
    setLoading(true)
    setError('')
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
      if (response.ok) {
        alert(`Order validation result: ${data.validation.valid ? 'VALID' : 'INVALID'}\nErrors: ${data.validation.errors.join(', ') || 'None'}`)
      } else {
        setError(data.error || 'Validation failed')
      }
    } catch (e) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50 border-green-300'
      case 'disconnected': return 'text-red-600 bg-red-50 border-red-300'
      case 'ready': return 'text-green-600 bg-green-50 border-green-300'
      case 'not_ready': return 'text-red-600 bg-red-50 border-red-300'
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-300'
    }
  }

  if (!status || !preFlight) {
    return <div className="card">Loading production status...</div>
  }

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium">Production Status</h2>
          <div className="flex gap-2">
            <button 
              className="btn bg-zinc-300 text-zinc-700" 
              onClick={loadStatus}
            >
              Refresh
            </button>
            <button 
              className="btn" 
              onClick={testOrderValidation}
              disabled={loading}
            >
              Test Validation
            </button>
          </div>
        </div>

        {error && <div className="text-sm text-red-600 mb-4">Error: {error}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-50 border rounded-xl p-3 text-center">
            <div className="text-sm text-zinc-600">Environment</div>
            <div className={`text-lg font-bold ${status.environment.isProduction ? 'text-green-600' : 'text-yellow-600'}`}>
              {status.environment.isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}
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
              {status.safety.tradingAllowed ? 'ALLOWED' : 'BLOCKED'}
            </div>
          </div>
          <div className="bg-zinc-50 border rounded-xl p-3 text-center">
            <div className="text-sm text-zinc-600">Testnet</div>
            <div className={`text-lg font-bold ${status.environment.isTestnet ? 'text-yellow-600' : 'text-green-600'}`}>
              {status.environment.isTestnet ? 'TESTNET' : 'MAINNET'}
            </div>
          </div>
        </div>
      </div>

      {/* Pre-Flight Checks */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium">Pre-Flight Checks</h2>
          <div className={`badge ${getStatusColor(preFlight.status)}`}>
            {preFlight.status.toUpperCase()}
          </div>
        </div>

        <div className="space-y-4">
          {/* Environment Checks */}
          <div className="bg-zinc-50 border rounded-xl p-3">
            <div className="font-medium mb-2">Environment</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span>Node Environment:</span>
                <span className={preFlight.checks.environment.isProduction ? 'text-green-600' : 'text-red-600'}>
                  {preFlight.checks.environment.nodeEnv}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Testnet Mode:</span>
                <span className={preFlight.checks.environment.isTestnet ? 'text-yellow-600' : 'text-green-600'}>
                  {preFlight.checks.environment.isTestnet ? 'YES' : 'NO'}
                </span>
              </div>
            </div>
          </div>

          {/* Safety Checks */}
          <div className="bg-zinc-50 border rounded-xl p-3">
            <div className="font-medium mb-2">Safety</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span>Safety Lock:</span>
                <span className={preFlight.checks.safety.safetyLock ? 'text-green-600' : 'text-red-600'}>
                  {preFlight.checks.safety.safetyLock ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Allowed Symbols:</span>
                <span className="text-blue-600">
                  {preFlight.checks.safety.allowedSymbols.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Trading Allowed:</span>
                <span className={preFlight.checks.safety.tradingAllowed ? 'text-green-600' : 'text-red-600'}>
                  {preFlight.checks.safety.tradingAllowed ? 'YES' : 'NO'}
                </span>
              </div>
            </div>
          </div>

          {/* Exchange Checks */}
          <div className="bg-zinc-50 border rounded-xl p-3">
            <div className="font-medium mb-2">Exchange</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span>Type:</span>
                <span>{preFlight.checks.exchange.type}</span>
              </div>
              <div className="flex justify-between">
                <span>Connected:</span>
                <span className={preFlight.checks.exchange.connected ? 'text-green-600' : 'text-red-600'}>
                  {preFlight.checks.exchange.connected ? 'YES' : 'NO'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>API Key:</span>
                <span className={preFlight.checks.exchange.apiKey ? 'text-green-600' : 'text-red-600'}>
                  {preFlight.checks.exchange.apiKey ? 'SET' : 'MISSING'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>API Secret:</span>
                <span className={preFlight.checks.exchange.apiSecret ? 'text-green-600' : 'text-red-600'}>
                  {preFlight.checks.exchange.apiSecret ? 'SET' : 'MISSING'}
                </span>
              </div>
            </div>
          </div>

          {/* Alerts Checks */}
          <div className="bg-zinc-50 border rounded-xl p-3">
            <div className="font-medium mb-2">Alerts</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span>Enabled:</span>
                <span className={preFlight.checks.alerts.enabled ? 'text-green-600' : 'text-red-600'}>
                  {preFlight.checks.alerts.enabled ? 'YES' : 'NO'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Telegram:</span>
                <span className={preFlight.checks.alerts.telegram ? 'text-green-600' : 'text-red-600'}>
                  {preFlight.checks.alerts.telegram ? 'CONFIGURED' : 'MISSING'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Discord:</span>
                <span className={preFlight.checks.alerts.discord ? 'text-green-600' : 'text-red-600'}>
                  {preFlight.checks.alerts.discord ? 'CONFIGURED' : 'MISSING'}
                </span>
              </div>
            </div>
          </div>

          {/* Database Check */}
          <div className="bg-zinc-50 border rounded-xl p-3">
            <div className="font-medium mb-2">Database</div>
            <div className="text-sm">
              <div className="flex justify-between">
                <span>Connection:</span>
                <span className={preFlight.checks.database.url ? 'text-green-600' : 'text-red-600'}>
                  {preFlight.checks.database.url ? 'CONFIGURED' : 'MISSING'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {preFlight.recommendations.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="font-medium text-yellow-800 mb-2">Recommendations:</div>
            <ul className="text-sm text-yellow-700 space-y-1">
              {preFlight.recommendations.map((rec: string, i: number) => (
                <li key={i}>• {rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
