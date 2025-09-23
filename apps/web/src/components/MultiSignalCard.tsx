import { useState } from 'react'

export default function MultiSignalCard(){
  const [closes, setCloses] = useState('100,101,102,103,102,101,100,99,98,97,98,99,101,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130')
  const [symbol, setSymbol] = useState('BTCUSDT')
  const [timeframe, setTimeframe] = useState('1m')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generateSignal = async () => {
    setLoading(true)
    setError('')
    try {
      const body = { 
        closes: closes.split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n)),
        symbol,
        timeframe
      }
      
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/strategy/multi-signal', {
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

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Multi-Strategy Signal</h2>
        <button 
          className="btn" 
          onClick={generateSignal}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Signal'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="text-zinc-600 text-sm">Symbol</div>
          <select 
            value={symbol} 
            onChange={e => setSymbol(e.target.value)}
            className="w-full rounded-xl border p-2"
          >
            <option value="BTCUSDT">BTC/USDT</option>
            <option value="ETHUSDT">ETH/USDT</option>
            <option value="ADAUSDT">ADA/USDT</option>
          </select>
        </div>
        <div className="space-y-1">
          <div className="text-zinc-600 text-sm">Timeframe</div>
          <select 
            value={timeframe} 
            onChange={e => setTimeframe(e.target.value)}
            className="w-full rounded-xl border p-2"
          >
            <option value="1m">1m</option>
            <option value="5m">5m</option>
            <option value="15m">15m</option>
            <option value="1h">1h</option>
          </select>
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

      {error && <div className="text-sm text-red-600">Error: {error}</div>}

      {result && (
        <div className="space-y-4">
          {/* Final Signal */}
          <div className="bg-zinc-50 border rounded-xl p-3">
            <div className="text-sm text-zinc-600">Final Signal</div>
            <div className={`text-2xl font-bold ${
              result.signal?.side === 'LONG' ? 'text-green-600' : 
              result.signal?.side === 'SHORT' ? 'text-red-600' : 
              'text-zinc-600'
            }`}>
              {result.signal?.side || 'None'}
            </div>
            {result.profile && (
              <div className="text-xs text-zinc-500 mt-1">
                Profile: {result.profile.name} • Rule: {result.profile.aggregateRule}
              </div>
            )}
          </div>

          {/* Strategy Votes */}
          {result.strategyVotes && (
            <div className="space-y-2">
              <div className="font-medium text-sm">Strategy Signals</div>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(result.strategyVotes).map(([key, vote]: [string, any]) => (
                  <div key={key} className="bg-zinc-50 border rounded-xl p-2 text-center">
                    <div className="text-xs text-zinc-600">{key.replace('strategy_', '')}</div>
                    <div className={`font-bold ${
                      vote.side === 'LONG' ? 'text-green-600' : 
                      vote.side === 'SHORT' ? 'text-red-600' : 
                      'text-zinc-600'
                    }`}>
                      {vote.side || 'None'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meta Information */}
          {result.meta && (
            <div className="bg-zinc-50 border rounded-xl p-3">
              <div className="text-sm text-zinc-600">Meta Information</div>
              <div className="text-xs text-zinc-500 mt-1">
                {result.meta.rule && `Rule: ${result.meta.rule}`}
                {result.meta.votes && ` • Votes: ${result.meta.votes}`}
                {result.meta.total && ` • Total: ${result.meta.total}`}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
