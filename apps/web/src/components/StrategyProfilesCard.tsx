import { useState, useEffect } from 'react'

export default function StrategyProfilesCard(){
  const [profiles, setProfiles] = useState<any[]>([])
  const [strategies, setStrategies] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [editingProfile, setEditingProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    symbol: 'BTCUSDT',
    timeframe: '1m',
    aggregateRule: 'PRIORITY',
    priorityOrder: [0, 1, 2],
    strategies: [
      { key: 'EMA_RSI', params: { fast: 9, slow: 21, rsi: 55 } },
      { key: 'DONCHIAN_BREAKOUT', params: { period: 20, confirmBars: 1 } },
      { key: 'BOLL_MR', params: { ma: 20, sd: 2, zEntry: 2, zExit: 0.5 } }
    ]
  })

  useEffect(() => {
    loadProfiles()
    loadStrategies()
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

  const loadStrategies = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/strategy/strategies')
      const data = await response.json()
      setStrategies(data.strategies || [])
    } catch (e) {
      console.error('Error loading strategies:', e)
    }
  }

  const saveProfile = async () => {
    setLoading(true)
    setError('')
    try {
      const url = editingProfile 
        ? `/api/strategy/profiles/${editingProfile.id}`
        : '/api/strategy/profiles'
      
      const method = editingProfile ? 'PUT' : 'POST'
      
      const response = await fetch(import.meta.env.VITE_API_URL + url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        setShowCreate(false)
        setEditingProfile(null)
        resetForm()
        loadProfiles()
      } else {
        const data = await response.json()
        setError(data.error || 'Error saving profile')
      }
    } catch (e) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const activateProfile = async (id: number) => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + `/api/strategy/profiles/${id}/activate`, {
        method: 'POST'
      })
      
      if (response.ok) {
        loadProfiles()
      }
    } catch (e) {
      console.error('Error activating profile:', e)
    }
  }

  const deleteProfile = async (id: number) => {
    if (!confirm('Are you sure you want to delete this profile?')) return
    
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + `/api/strategy/profiles/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        loadProfiles()
      }
    } catch (e) {
      console.error('Error deleting profile:', e)
    }
  }

  const editProfile = (profile: any) => {
    setFormData({
      name: profile.name,
      symbol: profile.symbol,
      timeframe: profile.timeframe,
      aggregateRule: profile.aggregate_rule,
      priorityOrder: profile.priority_order,
      strategies: profile.strategies
    })
    setEditingProfile(profile)
    setShowCreate(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      symbol: 'BTCUSDT',
      timeframe: '1m',
      aggregateRule: 'PRIORITY',
      priorityOrder: [0, 1, 2],
      strategies: [
        { key: 'EMA_RSI', params: { fast: 9, slow: 21, rsi: 55 } },
        { key: 'DONCHIAN_BREAKOUT', params: { period: 20, confirmBars: 1 } },
        { key: 'BOLL_MR', params: { ma: 20, sd: 2, zEntry: 2, zExit: 0.5 } }
      ]
    })
  }

  const updateStrategyParam = (strategyIndex: number, param: string, value: number) => {
    const newStrategies = [...formData.strategies]
    newStrategies[strategyIndex].params[param] = value
    setFormData({ ...formData, strategies: newStrategies })
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Strategy Profiles</h2>
        <button 
          className="btn" 
          onClick={() => {
            resetForm()
            setEditingProfile(null)
            setShowCreate(true)
          }}
        >
          Create Profile
        </button>
      </div>

      {showCreate && (
        <div className="border rounded-xl p-4 space-y-4">
          <h3 className="font-medium">{editingProfile ? 'Edit Profile' : 'Create Profile'}</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <Input label="Name" val={formData.name} setVal={(v) => setFormData({...formData, name: v})}/>
            <Input label="Symbol" val={formData.symbol} setVal={(v) => setFormData({...formData, symbol: v})}/>
            <Input label="Timeframe" val={formData.timeframe} setVal={(v) => setFormData({...formData, timeframe: v})}/>
            <div className="space-y-1">
              <div className="text-zinc-600 text-sm">Aggregate Rule</div>
              <select 
                value={formData.aggregateRule} 
                onChange={e => setFormData({...formData, aggregateRule: e.target.value})}
                className="w-full rounded-xl border p-2"
              >
                <option value="PRIORITY">Priority</option>
                <option value="MAJORITY">Majority</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="font-medium">Strategies</div>
            {formData.strategies.map((strategy, index) => (
              <div key={index} className="border rounded-xl p-3">
                <div className="font-medium text-sm mb-2">{strategy.key}</div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(strategy.params).map(([param, value]) => (
                    <div key={param} className="space-y-1">
                      <div className="text-xs text-zinc-600">{param}</div>
                      <input
                        type="number"
                        step="0.001"
                        value={value as number}
                        onChange={e => updateStrategyParam(index, param, parseFloat(e.target.value) || 0)}
                        className="w-full rounded border p-1 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {error && <div className="text-sm text-red-600">Error: {error}</div>}

          <div className="flex gap-2">
            <button 
              className="btn" 
              onClick={saveProfile}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button 
              className="btn bg-zinc-300 text-zinc-700" 
              onClick={() => {
                setShowCreate(false)
                setEditingProfile(null)
                resetForm()
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {profiles.length === 0 ? (
          <div className="text-sm text-zinc-500 text-center py-4">No profiles created yet</div>
        ) : (
          profiles.map((profile) => (
            <div key={profile.id} className="bg-zinc-50 border rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{profile.name}</div>
                  <div className="text-sm text-zinc-600">
                    {profile.symbol} / {profile.timeframe} • {profile.aggregate_rule}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {profile.strategies.map((s: any) => s.key).join(', ')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {profile.active && (
                    <span className="badge border-green-300 text-green-700 bg-green-50">
                      Active
                    </span>
                  )}
                  <button 
                    className="btn text-sm px-2 py-1"
                    onClick={() => activateProfile(profile.id)}
                    disabled={profile.active}
                  >
                    {profile.active ? 'Active' : 'Activate'}
                  </button>
                  <button 
                    className="btn text-sm px-2 py-1 bg-zinc-300 text-zinc-700"
                    onClick={() => editProfile(profile)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn text-sm px-2 py-1 bg-red-100 text-red-700 border-red-300"
                    onClick={() => deleteProfile(profile.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
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
