import { ExternalLink } from 'lucide-react'
import { formatAddress, formatKNTC, timeAgo, maculatusTestnet } from '../lib/chain'

interface EventRowProps {
  user:        `0x${string}`
  timestamp:   number
  ratePerHour: bigint   // kntcEarned in v2 (always 1 KNTC = 1e18)
  tier?:       number   // unused in v2, kept for API compat
  txHash:      `0x${string}`
  blockNumber: bigint
  highlight?:  boolean
}

export default function EventRow({ user, timestamp, ratePerHour, txHash, blockNumber, highlight }: EventRowProps) {
  const txUrl   = `${maculatusTestnet.blockExplorers.default.url}/tx/${txHash}`
  const addrUrl = `${maculatusTestnet.blockExplorers.default.url}/address/${user}`

  return (
    <div className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 group hover:bg-[rgba(168,230,255,0.03)] ${
      highlight ? 'bg-[rgba(168,230,255,0.04)]' : ''
    }`}>
      {/* Session dot */}
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(168,230,255,0.08)', border: '1px solid rgba(168,230,255,0.15)' }}>
        <div className="w-2 h-2 rounded-full" style={{ background: '#A8E6FF' }} />
      </div>

      {/* Address + time */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <a href={addrUrl} target="_blank" rel="noopener noreferrer"
            className="font-mono text-sm text-[rgba(168,230,255,0.7)] hover:text-[#A8E6FF] transition-colors">
            {formatAddress(user)}
          </a>
          <span className="text-subtle text-xs">started session</span>
        </div>
        <div className="text-subtle text-xs mt-0.5">
          {timeAgo(timestamp)} · Block #{blockNumber.toString()}
        </div>
      </div>

      {/* Earned */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="text-right">
          <div className="text-sm font-bold font-mono" style={{ color: '#60ffb0' }}>
            +{formatKNTC(ratePerHour)} KNTC
          </div>
          <div className="text-subtle text-[10px]">earned</div>
        </div>
        <a href={txUrl} target="_blank" rel="noopener noreferrer"
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted hover:text-[#A8E6FF]
            hover:bg-[rgba(168,230,255,0.08)] transition-all">
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )
}
