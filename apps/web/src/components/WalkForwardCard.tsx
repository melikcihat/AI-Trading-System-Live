import { useState, useEffect } from 'react'

export default function WalkForwardCard(){
  const [closes, setCloses] = useState('100,101,102,103,102,101,100,99,98,97,98,99,101,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200')
  const [profileId, setProfileId] = useState('')
  const [strategy, setStrategy] = useState('EMA_RSI')
  const [trainBars, setTrainBars] = useState('2000')
  const [testBars, setTestBars] = useState('500')
  const [mode, setMode] = useState('rolling')
  const [profiles, setProfiles] = useState<any[]>([])
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/strategy/profiles')
      const data = await response.json()
      setProfiles(data.profiles || [])
    } catch (e) {
      console.error('Error loading profiles:', e)
    }
  }

  const runWalkForward = async () => {
    setLoading(true)
    setError('')
    try {
      const body = {
        closes: closes.split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n)),
        profileId: profileId ? parseInt(profileId) : undefined,
        strategy: profileId ? undefined : {
          key: strategy,
          ranges: {
            fast: [7, 9, 11],
            slow: [19, 21, 23],
            rsi: [50, 55, 60]
          }
        },
        trainBars: Number(trainBars),
        testBars: Number(testBars),
        mode
      }
      
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/optimize/walkforward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      const data = await response.json()
      if (response.ok) {
        setResult(data)
      } else {
        setError(data?.error || 'Error')
      }
    } catch (e) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const exportResults = () => {
    if (!result?.windows) return
    
    const csv = [
      'Window,Train Start,Train End,Test Start,Test End,Train PnL,Test PnL,Train Win Rate,Test Win Rate,Train Max DD,Test Max DD',
      ...result.windows.map((w: any, i: number) => 
        `${i + 1},${w.trainStart},${w.trainEnd},${w.testStart},${w.testEnd},${w.trainMetrics.pnl.toFixed(2)},${w.testMetrics.pnl.toFixed(2)},${(w.trainMetrics.winRate * 100).toFixed(1)}%,${(w.testMetrics.winRate * 100).toFixed(1)}%,${(w.trainMetrics.maxDD * 100).toFixed(1)}%,${(w.testMetrics.maxDD * 100).toFixed(1)}%`
      )
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'walk_forward_results.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Walk-Forward Optimization</h2>
        <div className="flex gap-2">
          <button 
            className="btn" 
            onClick={runWalkForward}
            disabled={loading}
          >
            {loading ? 'Running...' : 'Run Walk-Forward'}
          </button>
          {result?.windows && (
            <button className="btn" onClick={exportResults}>
              Export CSV
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-zinc-600 text-sm">Price Data (comma-separated)</div>
        <textarea
          value={closes}
          onChange={e => setCloses(e.target.value)}
          rows={3}
          className="w-full rounded-xl border p-2"
          placeholder="100,101,102,103..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="text-zinc-600 text-sm">Use Profile</div>
          <select 
            value={profileId} 
            onChange={e => setProfileId(e.target.value)}
            className="w-full rounded-xl border p-2"
          >
            <option value="">Use Strategy (below)</option>
            {profiles.map(profile => (
              <option key={profile.id} value={profile.id}>
                {profile.name} ({profile.symbol}/{profile.timeframe})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <div className="text-zinc-600 text-sm">Mode</div>
          <select 
            value={mode} 
            onChange={e => setMode(e.target.value)}
            className="w-full rounded-xl border p-2"
          >
            <option value="rolling">Rolling</option>
            <option value="anchored">Anchored</option>
          </select>
        </div>
      </div>

      {!profileId && (
        <div className="space-y-1">
          <div className="text-zinc-600 text-sm">Strategy</div>
          <select 
            value={strategy} 
            onChange={e => setStrategy(e.target.value)}
            className="w-full rounded-xl border p-2"
          >
            <option value="EMA_RSI">EMA/RSI</option>
            <option value="DONCHIAN_BREAKOUT">Donchian Breakout</option>
            <option value="BOLL_MR">Bollinger Mean Reversion</option>
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="text-zinc-600 text-sm">Training Bars</div>
          <input
            type="number"
            value={trainBars}
            onChange={e => setTrainBars(e.target.value)}
            className="w-full rounded-xl border p-2"
            min="100"
            max="10000"
          />
        </div>
        <div className="space-y-1">
          <div className="text-zinc-600 text-sm">Test Bars</div>
          <input
            type="number"
            value={testBars}
            onChange={e => setTestBars(e.target.value)}
            className="w-full rounded-xl border p-2"
            min="50"
            max="5000"
          />
        </div>
      </div>

      {error && <div className="text-sm text-red-600">Error: {error}</div>}

      {result && (
        <div className="space-y-4">
          {/* Aggregate Results */}
          <div className="bg-zinc-50 border rounded-xl p-4">
            <div className="font-medium mb-3">Aggregate Results</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-600">Total PnL:</span>
                <span className={`font-bold ${result.aggregate.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.aggregate.totalPnL.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Avg Win Rate:</span>
                <span className="font-bold">{(result.aggregate.avgWinRate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Max DD:</span>
                <span className="font-bold text-red-600">{(result.aggregate.maxDD * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Avg Sortino:</span>
                <span className="font-bold">{result.aggregate.avgSortino.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Total Trades:</span>
                <span className="font-bold">{result.aggregate.totalTrades}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Windows:</span>
                <span className="font-bold">{result.windows.length}</span>
              </div>
            </div>
          </div>

          {/* Window Results */}
          <div className="space-y-3">
            <div className="font-medium">Window Results</div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {result.windows.map((window: any, i: number) => (
                <div key={i} className="bg-zinc-50 border rounded-xl p-3">
                  <div className="font-medium text-sm mb-2">Window {i + 1}</div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-zinc-600">Train: {window.trainStart}-{window.trainEnd}</div>
                      <div className="text-zinc-600">Test: {window.testStart}-{window.testEnd}</div>
                    </div>
                    <div>
                      <div className="flex justify-between">
                        <span>Train PnL:</span>
                        <span className={window.trainMetrics.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {window.trainMetrics.pnl.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Test PnL:</span>
                        <span className={window.testMetrics.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {window.testMetrics.pnl.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
