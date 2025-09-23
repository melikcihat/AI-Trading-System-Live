import { useState } from 'react'

export default function GridSearchCard(){
  const [closes, setCloses] = useState('100,101,102,103,102,101,100,99,98,97,98,99,101,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140')
  const [target, setTarget] = useState('custom')
  const [strategy, setStrategy] = useState('EMA_RSI')
  const [fastRange, setFastRange] = useState('7,9,11')
  const [slowRange, setSlowRange] = useState('19,21,23')
  const [rsiRange, setRsiRange] = useState('50,55,60')
  const [maxCombos, setMaxCombos] = useState('2000')
  const [topN, setTopN] = useState('20')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const runGridSearch = async () => {
    setLoading(true)
    setError('')
    try {
      const body = {
        closes: closes.split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n)),
        target,
        strategy: {
          key: strategy,
          ranges: {
            fast: fastRange.split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n)),
            slow: slowRange.split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n)),
            rsi: rsiRange.split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n))
          }
        },
        maxCombos: Number(maxCombos),
        topN: Number(topN)
      }
      
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/optimize/grid', {
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
    if (!result?.results) return
    
    const csv = [
      'Rank,Score,PnL,Win Rate,Max DD,Sortino,Fast,Slow,RSI',
      ...result.results.map((r: any, i: number) => 
        `${i + 1},${r.score.toFixed(4)},${r.metrics.pnl.toFixed(2)},${(r.metrics.winRate * 100).toFixed(1)}%,${(r.metrics.maxDD * 100).toFixed(1)}%,${r.metrics.sortino?.toFixed(2) || 'N/A'},${r.params.fast},${r.params.slow},${r.params.rsi}`
      )
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'grid_search_results.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Grid Search Optimization</h2>
        <div className="flex gap-2">
          <button 
            className="btn" 
            onClick={runGridSearch}
            disabled={loading}
          >
            {loading ? 'Optimizing...' : 'Run Grid Search'}
          </button>
          {result?.results && (
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
          <div className="text-zinc-600 text-sm">Target Metric</div>
          <select 
            value={target} 
            onChange={e => setTarget(e.target.value)}
            className="w-full rounded-xl border p-2"
          >
            <option value="custom">Custom (PnL with DD penalty)</option>
            <option value="pnl">PnL</option>
            <option value="sharpe">Sharpe Ratio</option>
            <option value="sortino">Sortino Ratio</option>
          </select>
        </div>
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
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <div className="text-zinc-600 text-sm">Fast EMA Range</div>
          <input
            value={fastRange}
            onChange={e => setFastRange(e.target.value)}
            className="w-full rounded-xl border p-2"
            placeholder="7,9,11"
          />
        </div>
        <div className="space-y-1">
          <div className="text-zinc-600 text-sm">Slow EMA Range</div>
          <input
            value={slowRange}
            onChange={e => setSlowRange(e.target.value)}
            className="w-full rounded-xl border p-2"
            placeholder="19,21,23"
          />
        </div>
        <div className="space-y-1">
          <div className="text-zinc-600 text-sm">RSI Range</div>
          <input
            value={rsiRange}
            onChange={e => setRsiRange(e.target.value)}
            className="w-full rounded-xl border p-2"
            placeholder="50,55,60"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="text-zinc-600 text-sm">Max Combinations</div>
          <input
            type="number"
            value={maxCombos}
            onChange={e => setMaxCombos(e.target.value)}
            className="w-full rounded-xl border p-2"
            min="100"
            max="10000"
          />
        </div>
        <div className="space-y-1">
          <div className="text-zinc-600 text-sm">Top N Results</div>
          <input
            type="number"
            value={topN}
            onChange={e => setTopN(e.target.value)}
            className="w-full rounded-xl border p-2"
            min="1"
            max="100"
          />
        </div>
      </div>

      {error && <div className="text-sm text-red-600">Error: {error}</div>}

      {result?.results && (
        <div className="space-y-4">
          <div className="text-sm text-zinc-600">
            Found {result.results.length} results
          </div>
          
          <div className="max-h-96 overflow-y-auto border rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 sticky top-0">
                <tr>
                  <th className="p-2 text-left">Rank</th>
                  <th className="p-2 text-left">Score</th>
                  <th className="p-2 text-left">PnL</th>
                  <th className="p-2 text-left">Win Rate</th>
                  <th className="p-2 text-left">Max DD</th>
                  <th className="p-2 text-left">Fast</th>
                  <th className="p-2 text-left">Slow</th>
                  <th className="p-2 text-left">RSI</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((r: any, i: number) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{i + 1}</td>
                    <td className="p-2 font-mono">{r.score.toFixed(4)}</td>
                    <td className={`p-2 font-mono ${r.metrics.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {r.metrics.pnl.toFixed(2)}
                    </td>
                    <td className="p-2">{(r.metrics.winRate * 100).toFixed(1)}%</td>
                    <td className="p-2 text-red-600">{(r.metrics.maxDD * 100).toFixed(1)}%</td>
                    <td className="p-2">{r.params.fast}</td>
                    <td className="p-2">{r.params.slow}</td>
                    <td className="p-2">{r.params.rsi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
