import { useState } from 'react'

export default function RiskPreview(){
  const [side, setSide] = useState<'LONG' | 'SHORT'>('LONG')
  const [entryPrice, setEntryPrice] = useState('100')
  const [equity, setEquity] = useState('1000')
  const [riskPct, setRiskPct] = useState('0.01')
  const [stopDistPct, setStopDistPct] = useState('0.005')
  const [rr, setRr] = useState('2')
  const [resp, setResp] = useState<any>(null)
  const [validation, setValidation] = useState<any>(null)
  const [error, setError] = useState<string>('')

  const preview = async () => {
    setError('')
    try {
      const body = {
        side,
        entryPrice: Number(entryPrice),
        equity: Number(equity),
        riskPct: Number(riskPct),
        stopDistPct: Number(stopDistPct),
        rr: Number(rr)
      }
      const r = await fetch(import.meta.env.VITE_API_URL + '/api/risk/preview', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'include',
        body: JSON.stringify(body)
      })
      const data = await r.json()
      if (r.ok) {
        setResp(data)
      } else {
        setError(data?.error || 'Error')
      }
    } catch(e) {
      setError('Network error')
    }
  }

  const validate = async () => {
    setError('')
    try {
      const body = {
        proposed: {
          side,
          entryPrice: Number(entryPrice),
          equity: Number(equity),
          riskPct: Number(riskPct),
          stopDistPct: Number(stopDistPct),
          rr: Number(rr)
        },
        context: {
          openPositionsCount: 0,
          todayRealizedLossPct: 0.0
        }
      }
      const r = await fetch(import.meta.env.VITE_API_URL + '/api/risk/validate', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'include',
        body: JSON.stringify(body)
      })
      const data = await r.json()
      if (r.ok) {
        setValidation(data)
      } else {
        setError(data?.error || 'Error')
      }
    } catch(e) {
      setError('Network error')
    }
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Risk Preview</h2>
        <div className="flex gap-2">
          <button className="btn" onClick={preview}>Calculate</button>
          <button className="btn" onClick={validate}>Validate</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="text-zinc-600 text-sm">Side</div>
          <select value={side} onChange={e => setSide(e.target.value as 'LONG' | 'SHORT')} className="w-full rounded-xl border p-2">
            <option value="LONG">LONG</option>
            <option value="SHORT">SHORT</option>
          </select>
        </div>
        <Input label="Entry" val={entryPrice} setVal={setEntryPrice}/>
        <Input label="Equity" val={equity} setVal={setEquity}/>
        <Input label="Risk %" val={riskPct} setVal={setRiskPct}/>
        <Input label="Stop Dist %" val={stopDistPct} setVal={setStopDistPct}/>
        <Input label="RR" val={rr} setVal={setRr}/>
      </div>

      {error && <div className="text-sm text-red-600">Error: {error}</div>}

      {validation && (
        <div className={`text-sm border rounded-xl p-3 ${validation.ok ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
          <div className="flex items-center gap-2">
            {validation.ok ? '🟢 Uygun' : '🔴 Reddildi'}
          </div>
          {validation.reasons.length > 0 && (
            <div className="mt-2">
              <div className="font-medium">Reasons:</div>
              <ul className="list-disc list-inside">
                {validation.reasons.map((reason: string, i: number) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {resp && (
        <div className="text-sm bg-zinc-50 border rounded-xl p-3">
          <div>Position Size: <b>{resp.positionSizeBase?.toFixed(2)}</b></div>
          <div>Position Notional: <b>{resp.positionNotional?.toFixed(2)}</b></div>
          <div>Stop Loss: <b>{resp.stopLoss?.toFixed(2)}</b></div>
          <div>Take Profit: <b>{resp.takeProfit?.toFixed(2)}</b></div>
          <div>Risk Amount: <b>{resp.riskAmount?.toFixed(2)}</b></div>
          <div>RR Used: <b>{resp.rrUsed}</b></div>
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
