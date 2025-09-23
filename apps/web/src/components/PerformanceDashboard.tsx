import { useState, useEffect } from 'react'

export default function PerformanceDashboard(){
  const [summary, setSummary] = useState<any>(null)
  const [equityCurve, setEquityCurve] = useState<any[]>([])
  const [heatmap, setHeatmap] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    loadSummary()
    loadEquityCurve()
    loadHeatmap()
  }, [fromDate, toDate, year])

  const loadSummary = async () => {
    try {
      const params = new URLSearchParams()
      if (fromDate) params.append('from', fromDate)
      if (toDate) params.append('to', toDate)
      
      const response = await fetch(import.meta.env.VITE_API_URL + `/api/performance/summary?${params}`)
      const data = await response.json()
      setSummary(data.summary)
    } catch (e) {
      console.error('Error loading summary:', e)
    }
  }

  const loadEquityCurve = async () => {
    try {
      const params = new URLSearchParams()
      if (fromDate) params.append('from', fromDate)
      if (toDate) params.append('to', toDate)
      
      const response = await fetch(import.meta.env.VITE_API_URL + `/api/performance/curve?${params}`)
      const data = await response.json()
      setEquityCurve(data.curve || [])
    } catch (e) {
      console.error('Error loading equity curve:', e)
    }
  }

  const loadHeatmap = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + `/api/performance/heatmap?year=${year}`)
      const data = await response.json()
      setHeatmap(data)
    } catch (e) {
      console.error('Error loading heatmap:', e)
    }
  }

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months[month]
  }

  const getReturnColor = (returnPct: number) => {
    if (returnPct > 0.05) return 'bg-green-600'
    if (returnPct > 0.02) return 'bg-green-500'
    if (returnPct > 0) return 'bg-green-400'
    if (returnPct > -0.02) return 'bg-red-400'
    if (returnPct > -0.05) return 'bg-red-500'
    return 'bg-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="space-y-1">
            <div className="text-zinc-600 text-sm">From Date</div>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="rounded-xl border p-2"
            />
          </div>
          <div className="space-y-1">
            <div className="text-zinc-600 text-sm">To Date</div>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="rounded-xl border p-2"
            />
          </div>
          <div className="space-y-1">
            <div className="text-zinc-600 text-sm">Heatmap Year</div>
            <input
              type="number"
              value={year}
              onChange={e => setYear(parseInt(e.target.value))}
              className="rounded-xl border p-2 w-20"
              min="2020"
              max="2030"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <div className="text-sm text-zinc-600">Total PnL</div>
            <div className={`text-2xl font-bold ${summary.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.totalPnL.toFixed(2)}
            </div>
          </div>
          <div className="card text-center">
            <div className="text-sm text-zinc-600">Win Rate</div>
            <div className="text-2xl font-bold">{(summary.winRate * 100).toFixed(1)}%</div>
          </div>
          <div className="card text-center">
            <div className="text-sm text-zinc-600">Max Drawdown</div>
            <div className="text-2xl font-bold text-red-600">{(summary.maxDD * 100).toFixed(1)}%</div>
          </div>
          <div className="card text-center">
            <div className="text-sm text-zinc-600">Profit Factor</div>
            <div className="text-2xl font-bold">{summary.profitFactor.toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* Additional Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <div className="text-sm text-zinc-600">Total Trades</div>
            <div className="text-xl font-bold">{summary.totalTrades}</div>
          </div>
          <div className="card text-center">
            <div className="text-sm text-zinc-600">Best Trade</div>
            <div className={`text-xl font-bold ${summary.bestTrade >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.bestTrade.toFixed(2)}
            </div>
          </div>
          <div className="card text-center">
            <div className="text-sm text-zinc-600">Worst Trade</div>
            <div className={`text-xl font-bold ${summary.worstTrade >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.worstTrade.toFixed(2)}
            </div>
          </div>
          <div className="card text-center">
            <div className="text-sm text-zinc-600">Avg Trade</div>
            <div className={`text-xl font-bold ${summary.avgTrade >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.avgTrade.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Equity Curve */}
      {equityCurve.length > 0 && (
        <div className="card">
          <div className="font-medium mb-4">Equity Curve</div>
          <div className="h-64 bg-zinc-50 rounded-xl p-4 flex items-end justify-between">
            {equityCurve.map((point, i) => {
              const maxEquity = Math.max(...equityCurve.map(p => p.equity))
              const minEquity = Math.min(...equityCurve.map(p => p.equity))
              const height = ((point.equity - minEquity) / (maxEquity - minEquity)) * 100
              
              return (
                <div
                  key={i}
                  className="bg-blue-500 rounded-t"
                  style={{ 
                    width: `${100 / equityCurve.length}%`,
                    height: `${height}%`,
                    minHeight: '2px'
                  }}
                  title={`${new Date(point.date).toLocaleDateString()}: ${point.equity.toFixed(2)}`}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Monthly Heatmap */}
      {heatmap && (
        <div className="card">
          <div className="font-medium mb-4">Monthly Returns Heatmap - {heatmap.year}</div>
          <div className="grid grid-cols-12 gap-2">
            {Array.from({ length: 12 }, (_, month) => (
              <div key={month} className="text-center">
                <div className="text-xs text-zinc-600 mb-1">{getMonthName(month)}</div>
                <div 
                  className={`h-8 rounded ${getReturnColor(heatmap.monthlyReturns[month.toString()] || 0)} flex items-center justify-center text-white text-xs font-bold`}
                  title={`${getMonthName(month)}: ${((heatmap.monthlyReturns[month.toString()] || 0) * 100).toFixed(1)}%`}
                >
                  {((heatmap.monthlyReturns[month.toString()] || 0) * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-zinc-500">
            Color scale: Green = positive returns, Red = negative returns
          </div>
        </div>
      )}
    </div>
  )
}
