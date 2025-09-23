import { useEffect, useState } from 'react'

export default function HealthBadge(){
  const [ok, setOk] = useState<boolean | null>(null)

  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL + '/api/health')
      .then(r => r.json())
      .then(d => setOk(!!d.status))
      .catch(() => setOk(false))
  }, [])

  const cls = ok === null
    ? 'badge border-zinc-300'
    : ok ? 'badge border-green-300 text-green-700 bg-green-50'
         : 'badge border-red-300 text-red-700 bg-red-50'

  return <span className={cls}>{ok === null ? 'checking…' : ok ? 'healthy' : 'down'}</span>
}
