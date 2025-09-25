import { useState, useEffect } from 'react'

export default function LiveTradingCard(){
  const [symbol, setSymbol] = useState('BTCUSDT')
  const [interval, setInterval] = useState('1m')
  const [currentPrice] = useState<number | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [lastSignal, setLastSignal] = useState<any>(null)
  const [riskPreview, setRiskPreview] = useState<any>(null)
  const [orderLoading, setOrderLoading] = useState(false)

  useEffect(() => {
    // Check connection status
    fetch(import.meta.env.VITE_API_URL + '/api/market-data/status')
      .then(r => r.json())
      .then(data => {
        setConnectionStatus(data.connected ? 'connected' : 'disconnected')
      })
      .catch(() => setConnectionStatus('disconnected'))

    // Subscribe to kline data
    fetch(import.meta.env.VITE_API_URL + '/api/market-data/subscribe/kline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, interval })
    })

    // Subscribe to ticker data
    fetch(import.meta.env.VITE_API_URL + '/api/market-data/subscribe/ticker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol })
    })
  }, [symbol, interval])

  const generateSignal = async () => {
    try {
      // This would normally use live market data
      // For now, we'll use sample data
      const sampleCloses = [100, 101, 102, 103, 102, 101, 100, 99, 98, 97, 98, 99, 101, 103, 104, 105]
      
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          closes: sampleCloses,
          params: { fast: 9, slow: 21, rsi: 55 }
        })
      })
      
      const data = await response.json()
      setLastSignal(data)
      
      // Generate risk preview
      if (data.signal?.side) {
        const riskResponse = await fetch(import.meta.env.VITE_API_URL + '/api/risk/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            side: data.signal.side,
            entryPrice: currentPrice || 100,
            equity: 1000,
            riskPct: 0.01,
            stopDistPct: 0.005,
            rr: 2
          })
        })
        
        const riskData = await riskResponse.json()
        setRiskPreview(riskData)
      }
    } catch (error) {
      console.error('Error generating signal:', error)
    }
  }

  const placeOrder = async () => {
    if (!lastSignal?.signal?.side || !riskPreview) return
    
    setOrderLoading(true)
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          side: lastSignal.signal.side === 'LONG' ? 'buy' : 'sell',
          qty: riskPreview.positionSizeBase,
          type: 'market'
        })
      })
      
      const data = await response.json()
      if (data.orderId) {
        alert(`Order placed successfully! Order ID: ${data.orderId}`)
      }
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Error placing order')
    } finally {
      setOrderLoading(false)
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600 bg-green-50 border-green-300'
      case 'connecting': return 'text-yellow-600 bg-yellow-50 border-yellow-300'
      case 'disconnected': return 'text-red-600 bg-red-50 border-red-300'
    }
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Live Trading</h2>
        <div className="flex items-center gap-2">
          <span className={`badge ${getStatusColor()}`}>
            {connectionStatus}
          </span>
          <button className="btn" onClick={generateSignal}>
            Generate Signal
          </button>
        </div>
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
          <div className="text-zinc-600 text-sm">Interval</div>
          <select 
            value={interval} 
            onChange={e => setInterval(e.target.value)}
            className="w-full rounded-xl border p-2"
          >
            <option value="1m">1m</option>
            <option value="5m">5m</option>
            <option value="15m">15m</option>
            <option value="1h">1h</option>
          </select>
        </div>
      </div>

      {currentPrice && (
        <div className="bg-zinc-50 border rounded-xl p-3">
          <div className="text-sm text-zinc-600">Current Price</div>
          <div className="text-2xl font-bold">${currentPrice.toFixed(2)}</div>
        </div>
      )}

      {lastSignal && (
        <div className="bg-zinc-50 border rounded-xl p-3">
          <div className="text-sm text-zinc-600">Last Signal</div>
          <div className={`text-lg font-bold ${
            lastSignal.signal?.side === 'LONG' ? 'text-green-600' : 
            lastSignal.signal?.side === 'SHORT' ? 'text-red-600' : 
            'text-zinc-600'
          }`}>
            {lastSignal.signal?.side || 'None'}
          </div>
          {lastSignal.meta && (
            <div className="text-xs text-zinc-500 mt-1">
              RSI: {lastSignal.meta.lastRsi?.toFixed(1)} | 
              Fast EMA: {lastSignal.meta.fastEma?.toFixed(2)} | 
              Slow EMA: {lastSignal.meta.slowEma?.toFixed(2)}
            </div>
          )}
        </div>
      )}

      {riskPreview && (
        <div className="bg-zinc-50 border rounded-xl p-3">
          <div className="text-sm text-zinc-600">Risk Preview</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Position Size: <b>{riskPreview.positionSizeBase?.toFixed(2)}</b></div>
            <div>Stop Loss: <b>{riskPreview.stopLoss?.toFixed(2)}</b></div>
            <div>Take Profit: <b>{riskPreview.takeProfit?.toFixed(2)}</b></div>
            <div>Risk Amount: <b>{riskPreview.riskAmount?.toFixed(2)}</b></div>
          </div>
        </div>
      )}

      {lastSignal?.signal?.side && riskPreview && (
        <button 
          className="btn w-full" 
          onClick={placeOrder}
          disabled={orderLoading}
        >
          {orderLoading ? 'Placing Order...' : '(DEMO) Place Order'}
        </button>
      )}
    </div>
  )
}
