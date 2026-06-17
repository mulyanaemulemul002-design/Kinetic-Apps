import { ExternalLink } from 'lucide-react'
import { formatAddress, formatRate, timeAgo, maculatusTestnet, TIER_LABEL, TIER_COLOR, type RewardTier } from '../lib/chain'

interface EventRowProps {
  user:        `0x${string}`
  timestamp:   number
  ratePerHour: bigint
  tier?:       number
  txHash:      `0x${string}`
  blockNumber: bigint
  highlight?:  boolean
}

export default function EventRow({ user, timestamp, ratePerHour, tier, txHash, blockNumber, highlight }: EventRowProps) {
  const txUrl   = `${maculatusTestnet.blockExplorers.default.url}/tx/${txHash}`
  const addrUrl = `${maculatusTestnet.blockExplorers.default.url}/address/${user}`

  const safeTier = (typeof tier === 'number' && tier in TIER_LABEL ? tier : 1) as RewardTier
  const color    = TIER_COLOR[safeTier]
  const label    = TIER_LABEL[safeTier]

  return (
    <div className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 group hover:bg-[rgba(168,230,255,0.03)] ${
      highlight ? 'bg-[rgba(168,230,255,0.04)]' : ''
    }`}>
      {/* Tier dot */}
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `rgba(${hexToRgb(color)},0.1)`, border: `1px solid rgba(${hexToRgb(color)},0.2)` }}>
        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
      </div>

      {/* Address + time */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <a href={addrUrl} target="_blank" rel="noopener noreferrer"
            className="font-mono text-sm text-[rgba(168,230,255,0.7)] hover:text-[#A8E6FF] transition-colors">
            {formatAddress(user)}
          </a>
          <span className="text-subtle text-xs">started</span>
          <span className="text-xs font-semibold" style={{ color }}>{label}</span>
        </div>
        <div className="text-subtle text-xs mt-0.5">
          {timeAgo(timestamp)} · Block #{blockNumber.toString()}
        </div>
      </div>

      {/* Rate */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="text-right">
          <div className="text-sm font-bold font-mono" style={{ color }}>
            {formatRate(ratePerHour)}
          </div>
          <div className="text-subtle text-[10px]">mining rate</div>
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

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}
