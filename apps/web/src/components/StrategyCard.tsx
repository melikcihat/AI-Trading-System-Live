import { useState, useEffect } from 'react'

export default function StrategyCard(){
  const [params, setParams] = useState({
    fast: 9,
    slow: 21,
    rsi: 55,
    stopDistPct: 0.005,
    rr: 2.0
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadParams()
  }, [])

  const loadParams = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/strategy/params')
      const data = await response.json()
      if (response.ok) {
        setParams(data)
      }
    } catch (e) {
      console.error('Error loading params:', e)
    }
  }

  const saveParams = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/strategy/params', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
      
      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        const data = await response.json()
        setError(data.error || 'Error saving parameters')
      }
    } catch (e) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: number) => {
    setParams(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Strategy Parameters</h2>
        <button 
          className="btn" 
          onClick={saveParams} 
          disabled={loading}
        >
          {loading ? 'Saving...' : saved ? 'Saved!' : 'Save'}
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-300 rounded-xl p-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm text-zinc-600">Fast EMA</label>
          <input
            type="number"
            value={params.fast}
            onChange={e => handleChange('fast', parseInt(e.target.value) || 0)}
            className="w-full rounded-xl border p-2"
            min="5"
            max="50"
          />
          <div className="text-xs text-zinc-500">5-50</div>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-600">Slow EMA</label>
          <input
            type="number"
            value={params.slow}
            onChange={e => handleChange('slow', parseInt(e.target.value) || 0)}
            className="w-full rounded-xl border p-2"
            min="10"
            max="200"
          />
          <div className="text-xs text-zinc-500">10-200</div>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-600">RSI Threshold</label>
          <input
            type="number"
            value={params.rsi}
            onChange={e => handleChange('rsi', parseInt(e.target.value) || 0)}
            className="w-full rounded-xl border p-2"
            min="40"
            max="60"
          />
          <div className="text-xs text-zinc-500">40-60</div>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-600">Stop Distance %</label>
          <input
            type="number"
            step="0.001"
            value={params.stopDistPct}
            onChange={e => handleChange('stopDistPct', parseFloat(e.target.value) || 0)}
            className="w-full rounded-xl border p-2"
            min="0.003"
            max="0.05"
          />
          <div className="text-xs text-zinc-500">0.003-0.05</div>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-600">Risk/Reward Ratio</label>
          <input
            type="number"
            step="0.1"
            value={params.rr}
            onChange={e => handleChange('rr', parseFloat(e.target.value) || 0)}
            className="w-full rounded-xl border p-2"
            min="1"
            max="5"
          />
          <div className="text-xs text-zinc-500">1-5</div>
        </div>
      </div>

      <div className="bg-zinc-50 border rounded-xl p-3">
        <div className="text-sm text-zinc-600">Current Settings</div>
        <div className="text-xs text-zinc-500 mt-1">
          Fast: {params.fast} | Slow: {params.slow} | RSI: {params.rsi} | 
          Stop: {(params.stopDistPct * 100).toFixed(1)}% | RR: {params.rr}
        </div>
      </div>
    </div>
  )
}
