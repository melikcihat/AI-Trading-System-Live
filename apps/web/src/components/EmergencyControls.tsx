import { useState, useEffect } from 'react'

export default function EmergencyControls(){
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/emergency/status')
      const data = await response.json()
      setStatus(data)
    } catch (e) {
      console.error('Error loading emergency status:', e)
    }
  }

  const panicStop = async () => {
    if (!window.confirm('Are you sure you want to activate PANIC STOP? This will cancel all open orders immediately!')) {
      return
    }
    
    setLoading(true)
    setError('')
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/emergency/panic-stop', {
        method: 'POST'
      })
      
      if (response.ok) {
        alert('Emergency stop activated! All orders cancelled.')
        loadStatus()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to activate panic stop')
      }
    } catch (e) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const toggleSafetyLock = async () => {
    setLoading(true)
    setError('')
    try {
      const newLockState = !status?.controls?.safetyLock
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/emergency/controls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ safetyLock: newLockState })
      })
      
      if (response.ok) {
        loadStatus()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update safety controls')
      }
    } catch (e) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const partialStop = async () => {
    const symbols = prompt('Enter symbols to stop (comma-separated):', 'BTCUSDT,ETHUSDT')
    if (!symbols) return
    
    setLoading(true)
    setError('')
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/emergency/partial-stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: symbols.split(',').map(s => s.trim()) })
      })
      
      if (response.ok) {
        alert(`Partial stop activated for: ${symbols}`)
        loadStatus()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to activate partial stop')
      }
    } catch (e) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  if (!status) {
    return <div className="card">Loading emergency status...</div>
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Emergency Controls</h2>
        <button 
          className="btn bg-zinc-300 text-zinc-700" 
          onClick={loadStatus}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {error && <div className="text-sm text-red-600">Error: {error}</div>}

      {/* Status Overview */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-50 border rounded-xl p-3">
          <div className="text-sm text-zinc-600">Trading Status</div>
          <div className={`text-lg font-bold ${status.isTradingAllowed ? 'text-green-600' : 'text-red-600'}`}>
            {status.isTradingAllowed ? 'ALLOWED' : 'BLOCKED'}
          </div>
        </div>
        <div className="bg-zinc-50 border rounded-xl p-3">
          <div className="text-sm text-zinc-600">Safety Lock</div>
          <div className={`text-lg font-bold ${status.controls.safetyLock ? 'text-red-600' : 'text-green-600'}`}>
            {status.controls.safetyLock ? 'ACTIVE' : 'INACTIVE'}
          </div>
        </div>
      </div>

      {/* Session Window */}
      {status.controls.sessionWindow && (
        <div className="bg-zinc-50 border rounded-xl p-3">
          <div className="text-sm text-zinc-600">Session Window</div>
          <div className="text-sm">
            {status.controls.sessionWindow.start} - {status.controls.sessionWindow.end}
          </div>
          <div className={`text-sm ${status.controls.inSessionWindow ? 'text-green-600' : 'text-red-600'}`}>
            {status.controls.inSessionWindow ? 'In Session' : 'Outside Session'}
          </div>
        </div>
      )}

      {/* Allowed Symbols */}
      <div className="bg-zinc-50 border rounded-xl p-3">
        <div className="text-sm text-zinc-600">Allowed Symbols</div>
        <div className="text-sm">{status.controls.allowedSymbols.join(', ')}</div>
      </div>

      {/* Emergency Actions */}
      <div className="space-y-3">
        <div className="font-medium">Emergency Actions</div>
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            className={`btn ${status.controls.safetyLock ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
            onClick={toggleSafetyLock}
            disabled={loading}
          >
            {status.controls.safetyLock ? 'Enable Trading' : 'Disable Trading'}
          </button>
          
          <button 
            className="btn bg-yellow-600 text-white"
            onClick={partialStop}
            disabled={loading}
          >
            Partial Stop
          </button>
        </div>
        
        <button 
          className="btn bg-red-600 text-white w-full"
          onClick={panicStop}
          disabled={loading}
        >
          {loading ? 'Processing...' : '🚨 PANIC STOP 🚨'}
        </button>
      </div>

      {/* Last Updated */}
      <div className="text-xs text-zinc-500">
        Last updated: {new Date(status.timestamp).toLocaleString()}
      </div>
    </div>
  )
}
