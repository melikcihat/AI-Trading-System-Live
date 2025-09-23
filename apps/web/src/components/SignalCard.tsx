import { useState } from 'react'

export default function SignalCard(){
  const [closes, setCloses] = useState<string>('101,102,103,104,102,101,100,99,98,97,98,99,101,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118')
  const [fast, setFast] = useState('9')
  const [slow, setSlow] = useState('21')
  const [rsi, setRsi] = useState('55')
  const [result, setResult] = useState<string>('—')
  const [meta, setMeta] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    setError('')
    try {
      const body = { 
        closes: closes.split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n)),
        params: {
          fast: Number(fast),
          slow: Number(slow),
          rsi: Number(rsi)
        }
      }
      const r = await fetch(import.meta.env.VITE_API_URL + '/api/signal', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'include',
        body: JSON.stringify(body)
      })
      const data = await r.json()
      if (r.ok) {
        setResult(data?.signal?.side ?? 'None')
        setMeta(data?.meta)
      } else {
        setError(data?.error || 'Error')
      }
    } catch(e){
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Signal</h2>
        <button className="btn" onClick={submit} disabled={loading}>
          {loading ? 'Running…' : 'Run'}
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <Input label="Fast" val={fast} setVal={setFast}/>
        <Input label="Slow" val={slow} setVal={setSlow}/>
        <Input label="RSI" val={rsi} setVal={setRsi}/>
      </div>
      
      <textarea
        value={closes}
        onChange={e => setCloses(e.target.value)}
        rows={4}
        className="w-full rounded-xl border p-3"
        placeholder="comma-separated closes"
      />
      
      {error && <div className="text-sm text-red-600">Error: {error}</div>}
      <div className="text-sm text-zinc-600">Result: <b>{result}</b></div>
      
      {meta && (
        <div className="text-sm bg-zinc-50 border rounded-xl p-3">
          <div>Fast EMA: <b>{meta.fastEma?.toFixed(2)}</b></div>
          <div>Slow EMA: <b>{meta.slowEma?.toFixed(2)}</b></div>
          <div>Last RSI: <b>{meta.lastRsi?.toFixed(2)}</b></div>
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
