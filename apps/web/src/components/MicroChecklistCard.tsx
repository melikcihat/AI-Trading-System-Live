import { useState, useEffect } from 'react'

export default function MicroChecklistCard(){
  const [status, setStatus] = useState<any>(null)
  const [emergency, setEmergency] = useState<any>(null)
  const [health, setHealth] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [allPassed, setAllPassed] = useState(false)

  useEffect(() => {
    runMicroChecklist()
  }, [])

  const runMicroChecklist = async () => {
    setLoading(true)
    try {
      const [statusRes, emergencyRes, healthRes] = await Promise.all([
        fetch(import.meta.env.VITE_API_URL + '/api/production/status'),
        fetch(import.meta.env.VITE_API_URL + '/api/emergency/status'),
        fetch(import.meta.env.VITE_API_URL + '/api/health')
      ])

      const [statusData, emergencyData, healthData] = await Promise.all([
        statusRes.json(),
        emergencyRes.json(),
        healthRes.json()
      ])

      setStatus(statusData)
      setEmergency(emergencyData)
      setHealth(healthData)

      // Check if all conditions pass
      const passed = 
        statusData.environment.isTestnet === false && // or true for shadow
        emergencyData.controls.safetyLock === true &&
        emergencyData.controls.allowedSymbols.includes('BTCUSDT') &&
        statusData.exchange.status === 'connected' &&
        healthData.status === true

      setAllPassed(passed)
    } catch (e) {
      console.error('Error running micro-checklist:', e)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (condition: boolean, expected: boolean = true) => {
    if (condition === expected) {
      return <span className="text-green-600">✅</span>
    } else {
      return <span className="text-red-600">❌</span>
    }
  }

  const getStatusColor = (condition: boolean, expected: boolean = true) => {
    if (condition === expected) {
      return 'text-green-600'
    } else {
      return 'text-red-600'
    }
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">30-Second Micro-Checklist</h2>
        <button 
          className="btn bg-blue-600 text-white" 
          onClick={runMicroChecklist}
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Run Checklist'}
        </button>
      </div>

      {loading && <div className="text-sm text-blue-600">Running micro-checklist...</div>}

      {status && emergency && health && (
        <div className="space-y-3">
          {/* Overall Status */}
          <div className={`border rounded-xl p-4 ${allPassed ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
            <div className="flex items-center justify-between">
              <div className="font-medium">
                {allPassed ? '✅ READY FOR SHADOW TESTING' : '❌ ISSUES DETECTED'}
              </div>
              <div className={`text-sm ${allPassed ? 'text-green-600' : 'text-red-600'}`}>
                {allPassed ? 'PASSED' : 'FAILED'}
              </div>
            </div>
          </div>

          {/* Checklist Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-zinc-50 border rounded-xl">
              <div>
                <div className="font-medium">1. BINANCE_TESTNET</div>
                <div className="text-sm text-zinc-600">
                  {status.environment.isTestnet ? 'true (shadow mode)' : 'false (live mode)'}
                </div>
              </div>
              {getStatusIcon(status.environment.isTestnet, false)}
            </div>

            <div className="flex items-center justify-between p-3 bg-zinc-50 border rounded-xl">
              <div>
                <div className="font-medium">2. SAFETY_LOCK</div>
                <div className="text-sm text-zinc-600">
                  {emergency.controls.safetyLock ? 'true (shadow mode)' : 'false (live mode)'}
                </div>
              </div>
              {getStatusIcon(emergency.controls.safetyLock, true)}
            </div>

            <div className="flex items-center justify-between p-3 bg-zinc-50 border rounded-xl">
              <div>
                <div className="font-medium">3. Symbol Whitelist</div>
                <div className="text-sm text-zinc-600">
                  BTCUSDT {emergency.controls.allowedSymbols.includes('BTCUSDT') ? 'included' : 'missing'}
                </div>
              </div>
              {getStatusIcon(emergency.controls.allowedSymbols.includes('BTCUSDT'), true)}
            </div>

            <div className="flex items-center justify-between p-3 bg-zinc-50 border rounded-xl">
              <div>
                <div className="font-medium">4. Exchange Status</div>
                <div className="text-sm text-zinc-600">
                  {status.exchange.status}
                </div>
              </div>
              {getStatusIcon(status.exchange.status === 'connected', true)}
            </div>

            <div className="flex items-center justify-between p-3 bg-zinc-50 border rounded-xl">
              <div>
                <div className="font-medium">5. Trading Allowed</div>
                <div className="text-sm text-zinc-600">
                  {status.safety.tradingAllowed ? 'yes' : 'no (expected in shadow)'}
                </div>
              </div>
              {status.safety.tradingAllowed ? 
                <span className="text-green-600">✅</span> : 
                <span className="text-yellow-600">⚠️</span>
              }
            </div>

            <div className="flex items-center justify-between p-3 bg-zinc-50 border rounded-xl">
              <div>
                <div className="font-medium">6. Health Status</div>
                <div className="text-sm text-zinc-600">
                  {health.status ? 'healthy' : 'unhealthy'}
                </div>
              </div>
              {getStatusIcon(health.status, true)}
            </div>
          </div>

          {/* Next Steps */}
          {allPassed && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="font-medium text-green-800 mb-2">Next Steps:</div>
              <div className="text-sm text-green-700 space-y-1">
                <div>1. Start shadow testing (5-10 minutes)</div>
                <div>2. Monitor signal/alert/WS flow</div>
                <div>3. Flip to live when ready</div>
                <div>4. Test min notional orders</div>
              </div>
            </div>
          )}

          {!allPassed && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="font-medium text-red-800 mb-2">Issues Detected:</div>
              <div className="text-sm text-red-700 space-y-1">
                <div>• Fix the failed checklist items above</div>
                <div>• Ensure all systems are properly configured</div>
                <div>• Re-run checklist before proceeding</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
