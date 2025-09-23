import { useState } from 'react'

export default function BacktestCompareCard(){
  const [closes, setCloses] = useState('100,101,102,103,102,101,100,99,98,97,98,99,101,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140')
  const [profileA, setProfileA] = useState('')
  const [profileB, setProfileB] = useState('')
  const [profiles, setProfiles] = useState<any[]>([])
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load profiles on component mount
  useState(() => {
    loadProfiles()
  })

  const loadProfiles = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/strategy/profiles')
      const data = await response.json()
      setProfiles(data.profiles || [])
    } catch (e) {
      console.error('Error loading profiles:', e)
    }
  }

  const runComparison = async () => {
    if (!profileA || !profileB) {
      setError('Please select both profiles')
      return
    }

    setLoading(true)
    setError('')
    try {
      const body = { 
        closes: closes.split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n)),
        profileIds: [parseInt(profileA), parseInt(profileB)]
      }
      
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/backtest/compare', {
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

  const exportComparison = () => {
    if (!result?.results) return
    
    const csv = [
      'Profile,Name,Aggregate Rule,PnL,Win Rate,Max DD,Trades Count',
      ...result.results.map((r: any) => 
        `${r.profileId},${r.profileName},${r.aggregateRule},${r.result?.pnl?.toFixed(2) || 'N/A'},${(r.result?.winRate * 100)?.toFixed(1) || 'N/A'},${(r.result?.maxDD * 100)?.toFixed(1) || 'N/A'},${r.result?.tradesCount || 'N/A'}`
      )
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'backtest_comparison.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Backtest Comparison</h2>
        <div className="flex gap-2">
          <button 
            className="btn" 
            onClick={runComparison}
            disabled={loading || !profileA || !profileB}
          >
            {loading ? 'Comparing...' : 'Compare'}
          </button>
          {result?.results && (
            <button className="btn" onClick={exportComparison}>
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
          <div className="text-zinc-600 text-sm">Profile A</div>
          <select 
            value={profileA} 
            onChange={e => setProfileA(e.target.value)}
            className="w-full rounded-xl border p-2"
          >
            <option value="">Select Profile A</option>
            {profiles.map(profile => (
              <option key={profile.id} value={profile.id}>
                {profile.name} ({profile.symbol}/{profile.timeframe})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <div className="text-zinc-600 text-sm">Profile B</div>
          <select 
            value={profileB} 
            onChange={e => setProfileB(e.target.value)}
            className="w-full rounded-xl border p-2"
          >
            <option value="">Select Profile B</option>
            {profiles.map(profile => (
              <option key={profile.id} value={profile.id}>
                {profile.name} ({profile.symbol}/{profile.timeframe})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">Error: {error}</div>}

      {result?.results && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {result.results.map((profileResult: any, index: number) => (
              <div key={index} className="bg-zinc-50 border rounded-xl p-4">
                <div className="font-medium mb-3">{profileResult.profileName}</div>
                <div className="text-sm text-zinc-600 mb-2">
                  Rule: {profileResult.aggregateRule}
                </div>
                
                {profileResult.error ? (
                  <div className="text-sm text-red-600">{profileResult.error}</div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-600">PnL:</span>
                      <span className={`font-bold ${profileResult.result.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profileResult.result.pnl.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-600">Win Rate:</span>
                      <span className="font-bold">{(profileResult.result.winRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-600">Max DD:</span>
                      <span className="font-bold text-red-600">{(profileResult.result.maxDD * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-600">Trades:</span>
                      <span className="font-bold">{profileResult.result.tradesCount}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Strategy Results */}
          {result.results[0]?.strategyResults && (
            <div className="space-y-3">
              <div className="font-medium">Strategy Breakdown</div>
              {result.results.map((profileResult: any, profileIndex: number) => (
                <div key={profileIndex} className="border rounded-xl p-3">
                  <div className="font-medium text-sm mb-2">{profileResult.profileName}</div>
                  <div className="grid grid-cols-3 gap-2">
                    {profileResult.strategyResults.map((strategyResult: any, strategyIndex: number) => (
                      <div key={strategyIndex} className="bg-zinc-50 border rounded-xl p-2">
                        <div className="text-xs text-zinc-600 mb-1">{strategyResult.strategy}</div>
                        {strategyResult.error ? (
                          <div className="text-xs text-red-600">{strategyResult.error}</div>
                        ) : (
                          <div className="space-y-1">
                            <div className="text-xs">
                              PnL: <span className={strategyResult.result.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {strategyResult.result.pnl.toFixed(2)}
                              </span>
                            </div>
                            <div className="text-xs">
                              WR: {(strategyResult.result.winRate * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs">
                              DD: {(strategyResult.result.maxDD * 100).toFixed(1)}%
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
