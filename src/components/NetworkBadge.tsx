import { useNetworkStatus } from '../hooks/useAdEvents'
import { Wifi, WifiOff } from 'lucide-react'

export default function NetworkBadge() {
  const { data } = useNetworkStatus()
  if (!data) return null

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
      data.isOnline
        ? 'bg-[rgba(96,255,176,0.08)] border-[rgba(96,255,176,0.18)] text-[#60ffb0]'
        : 'bg-[rgba(255,80,80,0.08)] border-[rgba(255,80,80,0.18)] text-[#ff9090]'
    }`}>
      {data.isOnline
        ? <Wifi className="w-3 h-3" />
        : <WifiOff className="w-3 h-3" />
      }
      <span>{data.isOnline ? 'Maculatus Testnet' : 'Offline'}</span>
    </div>
  )
}
