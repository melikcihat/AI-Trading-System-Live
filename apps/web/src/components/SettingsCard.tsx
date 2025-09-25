import { useState, useEffect } from 'react'

export default function SettingsCard(){
  const [safetyLock, setSafetyLock] = useState(false)
  const [alertStatus, setAlertStatus] = useState<any>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [auditLogs, setAuditLogs] = useState<any[]>([])

  useEffect(() => {
    loadSettings()
    loadAuditLogs()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/alerts/status')
      const data = await response.json()
      setAlertStatus(data)
      setAlertsEnabled(data.enabled)
    } catch (e) {
      console.error('Error loading settings:', e)
    }
  }

  const loadAuditLogs = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/audit?limit=20')
      const data = await response.json()
      setAuditLogs(data.logs || [])
    } catch (e) {
      console.error('Error loading audit logs:', e)
    }
  }

  const testAlerts = async () => {
    setTestLoading(true)
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/alerts/test', {
        method: 'POST'
      })
      const data = await response.json()
      if (response.ok) {
        alert('Test alerts sent!')
        loadAuditLogs() // Refresh audit logs
      } else {
        alert('Error: ' + data.error)
      }
    } catch (e) {
      alert('Network error')
    } finally {
      setTestLoading(false)
    }
  }

  const toggleSafetyLock = () => {
    // In a real app, this would call an API endpoint
    setSafetyLock(!safetyLock)
    alert(`Safety lock ${!safetyLock ? 'enabled' : 'disabled'}`)
  }

  return (
    <div className="space-y-6">
      {/* Alerts Settings */}
      <div className="card space-y-4">
        <h2 className="font-medium">Notifications</h2>
        
        {alertStatus && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${alertStatus.enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>Alerts: {alertStatus.enabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${alertStatus.telegram ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>Telegram: {alertStatus.telegram ? 'Connected' : 'Not configured'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${alertStatus.discord ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>Discord: {alertStatus.discord ? 'Connected' : 'Not configured'}</span>
            </div>
          </div>
        )}

        <button 
          className="btn" 
          onClick={testAlerts}
          disabled={testLoading}
        >
          {testLoading ? 'Sending...' : 'Test Alerts'}
        </button>
      </div>

      {/* Safety Settings */}
      <div className="card space-y-4">
        <h2 className="font-medium">Safety Controls</h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Emergency Stop</div>
              <div className="text-sm text-zinc-600">Disable all trading operations</div>
            </div>
            <button 
              className={`px-4 py-2 rounded-xl border ${
                safetyLock 
                  ? 'bg-red-100 border-red-300 text-red-700' 
                  : 'bg-green-100 border-green-300 text-green-700'
              }`}
              onClick={toggleSafetyLock}
            >
              {safetyLock ? 'DISABLED' : 'ENABLED'}
            </button>
          </div>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Recent Activity</h2>
          <button className="btn" onClick={loadAuditLogs}>
            Refresh
          </button>
        </div>
        
        <div className="max-h-60 overflow-y-auto space-y-2">
          {auditLogs.length === 0 ? (
            <div className="text-sm text-zinc-500 text-center py-4">No recent activity</div>
          ) : (
            auditLogs.map((log, i) => (
              <div key={i} className="bg-zinc-50 border rounded-xl p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{log.action}</span>
                  <span className="text-zinc-500">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-zinc-600 mt-1">{log.summary}</div>
                {log.userId && (
                  <div className="text-xs text-zinc-500 mt-1">User: {log.userId}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
