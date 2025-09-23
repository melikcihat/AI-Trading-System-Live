import { useState } from 'react'

export default function BacktestCard(){
  const [closes, setCloses] = useState('100,101,102,103,102,101,100,99,98,97,98,99,101,103,104,105,106,107,108,109,110,109,108,107,106,105,104,103,102,101')
  const [fast, setFast] = useState('9')
  const [slow, setSlow] = useState('21')
  const [rsi, setRsi] = useState('55')
  const [stopDistPct, setStopDistPct] = useState('0.005')
  const [rr, setRr] = useState('2')
  const [feesBps, setFeesBps] = useState('8')
  const [slippageBps, setSlippageBps] = useState('5')
  const [initialEquity, setInitialEquity] = useState('1000')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const runBacktest = async () => {
    setLoading(true)
    setError('')
    try {
      const body = {
        closes: closes.split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n)),
        params: {
          fast: Number(fast),
          slow: Number(slow),
          rsi: Number(rsi),
          stopDistPct: Number(stopDistPct),
          rr: Number(rr)
        },
        feesBps: Number(feesBps),
        slippageBps: Number(slippageBps),
        initialEquity: Number(initialEquity)
      }
      
      const r = await fetch(import.meta.env.VITE_API_URL + '/api/backtest/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      })
      
      const data = await r.json()
      if (r.ok) {
        setResult(data)
      } else {
        setError(data?.error || 'Error')
      }
    } catch(e) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    if (!result?.trades) return
    
    const csv = [
      'Side,Entry Index,Exit Index,Entry Price,Exit Price,PnL,Reason',
      ...result.trades.map((t: any) => 
        `${t.side},${t.entryIdx},${t.exitIdx},${t.entry.toFixed(2)},${t.exit.toFixed(2)},${t.pnl.toFixed(4)},${t.reason}`
      )
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'backtest_trades.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Backtest</h2>
        <div className="flex gap-2">
          <button className="btn" onClick={runBacktest} disabled={loading}>
            {loading ? 'Running...' : 'Run'}
          </button>
          {result?.trades && (
            <button className="btn" onClick={exportCSV}>
              Export CSV
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-sm space-y-1">
            <div className="text-zinc-600">Closes (comma-separated)</div>
            <textarea
              value={closes}
              onChange={e => setCloses(e.target.value)}
              rows={3}
              className="w-full rounded-xl border p-2"
              placeholder="100,101,102,103..."
            />
          </label>
        </div>
        <Input label="Fast EMA" val={fast} setVal={setFast}/>
        <Input label="Slow EMA" val={slow} setVal={setSlow}/>
        <Input label="RSI Threshold" val={rsi} setVal={setRsi}/>
        <Input label="Stop Dist %" val={stopDistPct} setVal={setStopDistPct}/>
        <Input label="Risk/Reward" val={rr} setVal={setRr}/>
        <Input label="Fees (bps)" val={feesBps} setVal={setFeesBps}/>
        <Input label="Slippage (bps)" val={slippageBps} setVal={setSlippageBps}/>
        <Input label="Initial Equity" val={initialEquity} setVal={setInitialEquity}/>
      </div>

      {error && <div className="text-sm text-red-600">Error: {error}</div>}

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-50 border rounded-xl p-3 text-center">
              <div className="text-sm text-zinc-600">Total PnL</div>
              <div className={`font-bold ${result.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {result.pnl.toFixed(2)}
              </div>
            </div>
            <div className="bg-zinc-50 border rounded-xl p-3 text-center">
              <div className="text-sm text-zinc-600">Win Rate</div>
              <div className="font-bold">{(result.winRate * 100).toFixed(1)}%</div>
            </div>
            <div className="bg-zinc-50 border rounded-xl p-3 text-center">
              <div className="text-sm text-zinc-600">Max DD</div>
              <div className="font-bold text-red-600">{(result.maxDD * 100).toFixed(1)}%</div>
            </div>
          </div>

          {result.trades.length > 0 && (
            <div className="space-y-2">
              <div className="font-medium">Trades ({result.trades.length})</div>
              <div className="max-h-40 overflow-y-auto border rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 sticky top-0">
                    <tr>
                      <th className="p-2 text-left">Side</th>
                      <th className="p-2 text-left">Entry</th>
                      <th className="p-2 text-left">Exit</th>
                      <th className="p-2 text-left">PnL</th>
                      <th className="p-2 text-left">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.map((trade: any, i: number) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{trade.side}</td>
                        <td className="p-2">{trade.entry.toFixed(2)}</td>
                        <td className="p-2">{trade.exit.toFixed(2)}</td>
                        <td className={`p-2 ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {trade.pnl.toFixed(4)}
                        </td>
                        <td className="p-2">{trade.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Input({label, val, setVal}:{label:string; val:string; setVal:(v:string)=>void}){
  return (
    <label className="text-sm space-y-1">
      <div className="text-zinc-600">{label}</div>
      <input value={val} onChange={e=>setVal(e.target.value)} className="w-full rounded-xl border p-2"/>
    </label>
  )
}
