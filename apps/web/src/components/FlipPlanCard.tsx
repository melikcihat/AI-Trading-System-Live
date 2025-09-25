import { useState, useEffect } from 'react'

export default function FlipPlanCard(){
  const [step, setStep] = useState(1)
  const [status, setStatus] = useState<any>(null)
  const [performance, setPerformance] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shadowStartTime, setShadowStartTime] = useState<Date | null>(null)
  const [monitoringData, setMonitoringData] = useState<any[]>([])

  useEffect(() => {
    loadStatus()
    loadPerformance()
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

  const loadPerformance = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/performance/summary')
      const data = await response.json()
      setPerformance(data)
    } catch (e) {
      console.error('Error loading performance:', e)
    }
  }

  const startShadowTesting = async () => {
    setLoading(true)
    setError('')
    try {
      // Activate safety lock
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/emergency/controls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ safetyLock: true })
      })
      
      if (response.ok) {
        setShadowStartTime(new Date())
        setStep(2)
        alert('✅ Shadow testing started! Monitor for 15-30 minutes.')
      } else {
        setError('Failed to activate safety lock')
      }
    } catch (e) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const flipToLive = async () => {
    setLoading(true)
    setError('')
    try {
      // Disable safety lock
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/emergency/controls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ safetyLock: false })
      })
      
      if (response.ok) {
        setStep(3)
        alert('🚀 LIVE TRADING ENABLED! Ready for min notional orders.')
      } else {
        setError('Failed to disable safety lock')
      }
    } catch (e) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const testMinNotionalOrder = async () => {
    setLoading(true)
    try {
      // Test order validation
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
        alert('✅ Min notional order validation passed!')
      } else {
        alert(`❌ Order validation failed: ${data.validation.errors.join(', ')}`)
      }
    } catch (e) {
      alert('❌ Order test failed')
    } finally {
      setLoading(false)
    }
  }

  const startMonitoring = () => {
    setStep(4)
    // Start monitoring loop
    const interval = setInterval(() => {
      loadPerformance()
      loadStatus()
      
      // Add to monitoring data
      const newData = {
        timestamp: new Date(),
        pnl: performance?.summary?.totalPnL || 0,
        pf: performance?.summary?.profitFactor || 0,
        maxDD: performance?.summary?.maxDD || 0,
        winRate: performance?.summary?.winRate || 0,
        trades: performance?.summary?.totalTrades || 0
      }
      
      setMonitoringData(prev => [...prev.slice(-19), newData]) // Keep last 20 entries
    }, 30000) // Every 30 seconds
    
    // Stop monitoring after 5 minutes
    setTimeout(() => {
      clearInterval(interval)
      setStep(5)
    }, 300000)
  }

  const generateReport = () => {
    if (!performance?.summary) return
    
    const summary = performance.summary
    const report = {
      timestamp: new Date().toISOString(),
      kpi: {
        pnl: summary.totalPnL,
        profitFactor: summary.profitFactor,
        winRate: summary.winRate,
        maxDD: summary.maxDD,
        bestTrade: summary.bestTrade,
        worstTrade: summary.worstTrade,
        avgTrade: summary.avgTrade,
        totalTrades: summary.totalTrades
      },
      technical: {
        exchangeStatus: status?.exchange?.status,
        tradingAllowed: status?.safety?.tradingAllowed,
        testnetMode: status?.environment?.isTestnet
      },
      risk: {
        level: summary.maxDD > 0.01 ? 'HIGH' : summary.profitFactor < 1.1 ? 'MEDIUM' : 'LOW',
        triggers: []
      }
    }
    
    // Check for risk triggers
    if (summary.maxDD > 0.01) {
      report.risk.triggers.push('Max DD > 1%')
    }
    if (summary.profitFactor < 1.1) {
      report.risk.triggers.push('PF < 1.1')
    }
    if (summary.winRate < 0.4) {
      report.risk.triggers.push('Win Rate < 40%')
    }
    
    console.log('Flip Report:', report)
    alert('📊 Report generated! Check console for details.')
  }

  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < step) return 'completed'
    if (stepNumber === step) return 'current'
    return 'pending'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-300'
      case 'current': return 'text-blue-600 bg-blue-50 border-blue-300'
      case 'pending': return 'text-zinc-600 bg-zinc-50 border-zinc-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* 10-Minute Flip Plan */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">10-Minute Flip Plan</h2>
          <div className="text-sm text-zinc-600">
            Step {step} of 5
          </div>
        </div>

        {error && <div className="text-sm text-red-600">Error: {error}</div>}

        {/* Steps */}
        <div className="space-y-3">
          {/* Step 1: Verify Mode */}
          <div className={`border rounded-xl p-4 ${getStatusColor(getStepStatus(1))}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Step 1: Verify Mode & Limits</div>
                <div className="text-sm opacity-75">
                  BINANCE_TESTNET=false, conservative limits, BTCUSDT/5m active
                </div>
              </div>
              {getStepStatus(1) === 'completed' && <div className="text-green-600">✅</div>}
              {getStepStatus(1) === 'current' && <div className="text-blue-600">🔄</div>}
            </div>
            {step === 1 && (
              <div className="mt-3">
                <button 
                  className="btn" 
                  onClick={loadStatus}
                >
                  Verify Configuration
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Shadow Testing */}
          <div className={`border rounded-xl p-4 ${getStatusColor(getStepStatus(2))}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Step 2: Shadow Testing</div>
                <div className="text-sm opacity-75">
                  SAFETY_LOCK=true, monitor signals & alerts for 15-30 min
                </div>
                {shadowStartTime && (
                  <div className="text-xs mt-1">
                    Started: {shadowStartTime.toLocaleTimeString()}
                  </div>
                )}
              </div>
              {getStepStatus(2) === 'completed' && <div className="text-green-600">✅</div>}
              {getStepStatus(2) === 'current' && <div className="text-blue-600">🔄</div>}
            </div>
            {step === 1 && (
              <div className="mt-3">
                <button 
                  className="btn bg-yellow-600 text-white" 
                  onClick={startShadowTesting}
                  disabled={loading}
                >
                  {loading ? 'Starting...' : 'Start Shadow Testing'}
                </button>
              </div>
            )}
            {step === 2 && (
              <div className="mt-3">
                <button 
                  className="btn bg-green-600 text-white" 
                  onClick={flipToLive}
                  disabled={loading}
                >
                  {loading ? 'Flipping...' : 'Flip to Live'}
                </button>
              </div>
            )}
          </div>

          {/* Step 3: Flip to Live */}
          <div className={`border rounded-xl p-4 ${getStatusColor(getStepStatus(3))}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Step 3: Flip to Live</div>
                <div className="text-sm opacity-75">
                  SAFETY_LOCK=false, test min notional orders
                </div>
              </div>
              {getStepStatus(3) === 'completed' && <div className="text-green-600">✅</div>}
              {getStepStatus(3) === 'current' && <div className="text-blue-600">🔄</div>}
            </div>
            {step === 3 && (
              <div className="mt-3 flex gap-2">
                <button 
                  className="btn" 
                  onClick={testMinNotionalOrder}
                  disabled={loading}
                >
                  Test Min Notional
                </button>
                <button 
                  className="btn bg-blue-600 text-white" 
                  onClick={startMonitoring}
                >
                  Start Monitoring
                </button>
              </div>
            )}
          </div>

          {/* Step 4: Monitor */}
          <div className={`border rounded-xl p-4 ${getStatusColor(getStepStatus(4))}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Step 4: Monitor Key Indicators</div>
                <div className="text-sm opacity-75">
                  Watch PF, MaxDD, errors, WS reconnects, slippage, alerts
                </div>
              </div>
              {getStepStatus(4) === 'completed' && <div className="text-green-600">✅</div>}
              {getStepStatus(4) === 'current' && <div className="text-blue-600">🔄</div>}
            </div>
            {step === 4 && (
              <div className="mt-3">
                <div className="text-sm text-blue-600">
                  Monitoring in progress... (5 minutes)
                </div>
              </div>
            )}
          </div>

          {/* Step 5: Report */}
          <div className={`border rounded-xl p-4 ${getStatusColor(getStepStatus(5))}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Step 5: Generate Report</div>
                <div className="text-sm opacity-75">
                  KPI metrics, technical status, risk assessment
                </div>
              </div>
              {getStepStatus(5) === 'completed' && <div className="text-green-600">✅</div>}
              {getStepStatus(5) === 'current' && <div className="text-blue-600">🔄</div>}
            </div>
            {step === 5 && (
              <div className="mt-3">
                <button 
                  className="btn bg-green-600 text-white" 
                  onClick={generateReport}
                >
                  Generate Report
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Status */}
      {status && (
        <div className="card">
          <h2 className="font-medium mb-4">Current Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-50 border rounded-xl p-3 text-center">
              <div className="text-sm text-zinc-600">Environment</div>
              <div className={`text-lg font-bold ${status.environment.isProduction ? 'text-green-600' : 'text-yellow-600'}`}>
                {status.environment.isProduction ? 'PROD' : 'DEV'}
              </div>
            </div>
            <div className="bg-zinc-50 border rounded-xl p-3 text-center">
              <div className="text-sm text-zinc-600">Exchange</div>
              <div className={`text-lg font-bold ${status.exchange.status === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
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

      {/* Performance Metrics */}
      {performance?.summary && (
        <div className="card">
          <h2 className="font-medium mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-50 border rounded-xl p-3 text-center">
              <div className="text-sm text-zinc-600">Total PnL</div>
              <div className={`text-lg font-bold ${performance.summary.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${performance.summary.totalPnL.toFixed(2)}
              </div>
            </div>
            <div className="bg-zinc-50 border rounded-xl p-3 text-center">
              <div className="text-sm text-zinc-600">Profit Factor</div>
              <div className={`text-lg font-bold ${performance.summary.profitFactor > 1.1 ? 'text-green-600' : 'text-yellow-600'}`}>
                {performance.summary.profitFactor.toFixed(2)}
              </div>
            </div>
            <div className="bg-zinc-50 border rounded-xl p-3 text-center">
              <div className="text-sm text-zinc-600">Max DD</div>
              <div className={`text-lg font-bold ${performance.summary.maxDD < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                {(performance.summary.maxDD * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-zinc-50 border rounded-xl p-3 text-center">
              <div className="text-sm text-zinc-600">Win Rate</div>
              <div className="text-lg font-bold">
                {(performance.summary.winRate * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monitoring Data */}
      {monitoringData.length > 0 && (
        <div className="card">
          <h2 className="font-medium mb-4">Live Monitoring</h2>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 sticky top-0">
                <tr>
                  <th className="p-2 text-left">Time</th>
                  <th className="p-2 text-left">PnL</th>
                  <th className="p-2 text-left">PF</th>
                  <th className="p-2 text-left">MaxDD</th>
                  <th className="p-2 text-left">Trades</th>
                </tr>
              </thead>
              <tbody>
                {monitoringData.map((data, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{data.timestamp.toLocaleTimeString()}</td>
                    <td className={`p-2 font-mono ${data.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${data.pnl.toFixed(2)}
                    </td>
                    <td className={`p-2 font-mono ${data.pf > 1.1 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {data.pf.toFixed(2)}
                    </td>
                    <td className="p-2 font-mono text-red-600">
                      {(data.maxDD * 100).toFixed(1)}%
                    </td>
                    <td className="p-2">{data.trades}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rollback Triggers */}
      <div className="card">
        <h2 className="font-medium mb-4">Rollback Triggers</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Daily loss limit hit → auto lock</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>3 consecutive losses → partial stop</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Binance validation fails → lock until fixed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>PF &lt; 1.1 for 2+ hours → lock</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>MaxDD &ge; 1% → lock</span>
          </div>
        </div>
      </div>
    </div>
  )
}
