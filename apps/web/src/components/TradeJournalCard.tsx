import { useState, useEffect } from 'react'

export default function TradeJournalCard(){
  const [journal, setJournal] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [editingEntry, setEditingEntry] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [symbol, setSymbol] = useState('')
  const [tags, setTags] = useState('')
  const [note, setNote] = useState('')
  const [screenshotUrl, setScreenshotUrl] = useState('')

  useEffect(() => {
    loadJournal()
  }, [])

  const loadJournal = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/journal?limit=50')
      const data = await response.json()
      setJournal(data.journal || [])
    } catch (e) {
      console.error('Error loading journal:', e)
    }
  }

  const saveEntry = async () => {
    setLoading(true)
    setError('')
    try {
      const body = {
        symbol,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        note,
        screenshotUrl: screenshotUrl || undefined
      }
      
      const url = editingEntry 
        ? `/api/journal/${editingEntry.id}`
        : '/api/journal'
      
      const method = editingEntry ? 'PUT' : 'POST'
      
      const response = await fetch(import.meta.env.VITE_API_URL + url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (response.ok) {
        setShowCreate(false)
        setEditingEntry(null)
        resetForm()
        loadJournal()
      } else {
        const data = await response.json()
        setError(data.error || 'Error saving entry')
      }
    } catch (e) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const editEntry = (entry: any) => {
    setSymbol(entry.symbol)
    setTags(entry.tags.join(', '))
    setNote(entry.note || '')
    setScreenshotUrl(entry.screenshotUrl || '')
    setEditingEntry(entry)
    setShowCreate(true)
  }

  const resetForm = () => {
    setSymbol('')
    setTags('')
    setNote('')
    setScreenshotUrl('')
  }

  const getTagColor = (tag: string) => {
    const colors = {
      'news': 'bg-blue-100 text-blue-700',
      'overtraded': 'bg-red-100 text-red-700',
      'late-entry': 'bg-yellow-100 text-yellow-700',
      'good-setup': 'bg-green-100 text-green-700',
      'fomo': 'bg-purple-100 text-purple-700',
      'patience': 'bg-indigo-100 text-indigo-700'
    }
    return colors[tag as keyof typeof colors] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Trade Journal</h2>
        <button 
          className="btn" 
          onClick={() => {
            resetForm()
            setEditingEntry(null)
            setShowCreate(true)
          }}
        >
          Add Entry
        </button>
      </div>

      {showCreate && (
        <div className="border rounded-xl p-4 space-y-4">
          <h3 className="font-medium">{editingEntry ? 'Edit Entry' : 'New Entry'}</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-zinc-600 text-sm">Symbol</div>
              <input
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
                className="w-full rounded-xl border p-2"
                placeholder="BTCUSDT"
              />
            </div>
            <div className="space-y-1">
              <div className="text-zinc-600 text-sm">Tags (comma-separated)</div>
              <input
                value={tags}
                onChange={e => setTags(e.target.value)}
                className="w-full rounded-xl border p-2"
                placeholder="news, good-setup, patience"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-zinc-600 text-sm">Note</div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-xl border p-2"
              placeholder="Trade analysis, lessons learned, market conditions..."
            />
          </div>

          <div className="space-y-1">
            <div className="text-zinc-600 text-sm">Screenshot URL (optional)</div>
            <input
              value={screenshotUrl}
              onChange={e => setScreenshotUrl(e.target.value)}
              className="w-full rounded-xl border p-2"
              placeholder="https://..."
            />
          </div>

          {error && <div className="text-sm text-red-600">Error: {error}</div>}

          <div className="flex gap-2">
            <button 
              className="btn" 
              onClick={saveEntry}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button 
              className="btn bg-zinc-300 text-zinc-700" 
              onClick={() => {
                setShowCreate(false)
                setEditingEntry(null)
                resetForm()
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {journal.length === 0 ? (
          <div className="text-sm text-zinc-500 text-center py-8">No journal entries yet</div>
        ) : (
          journal.map((entry) => (
            <div key={entry.id} className="bg-zinc-50 border rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium">{entry.symbol}</div>
                  <div className="text-sm text-zinc-500">
                    {new Date(entry.createdAt).toLocaleString()}
                  </div>
                </div>
                <button 
                  className="btn text-sm px-2 py-1 bg-zinc-300 text-zinc-700"
                  onClick={() => editEntry(entry)}
                >
                  Edit
                </button>
              </div>
              
              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {entry.tags.map((tag: string, i: number) => (
                    <span 
                      key={i} 
                      className={`px-2 py-1 rounded-full text-xs ${getTagColor(tag)}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              {entry.note && (
                <div className="text-sm text-zinc-700 mb-2">
                  {entry.note}
                </div>
              )}
              
              {entry.screenshotUrl && (
                <div className="text-sm">
                  <a 
                    href={entry.screenshotUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Screenshot
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
