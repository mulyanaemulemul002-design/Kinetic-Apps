import { CheckCircle, ExternalLink, Frown, Smile, Star } from 'lucide-react'
import { maculatusTestnet, TIER_LABEL, TIER_COLOR, TIER_RATE, formatRate, type RewardTier } from '../lib/chain'

interface MiningResultProps {
  ratePerHour: bigint | null
  tier?:       number | null
  txHash:      `0x${string}` | null
  onReset:     () => void
}

const TIER_META = {
  0: { icon: Frown, label: 'Apes Session',  sub: 'Better luck next time',     bg: 'rgba(255,80,80,0.08)',   border: 'rgba(255,80,80,0.2)'   },
  1: { icon: Smile, label: 'Basic Session', sub: 'Steady mining, keep going', bg: 'rgba(168,230,255,0.06)', border: 'rgba(168,230,255,0.18)' },
  2: { icon: Star,  label: 'Hoki Session!', sub: 'Lucky roll — jackpot!',     bg: 'rgba(96,255,176,0.08)',  border: 'rgba(96,255,176,0.25)'  },
} as const

export default function MiningResult({ ratePerHour, tier, txHash, onReset }: MiningResultProps) {
  const explorerUrl = txHash ? `${maculatusTestnet.blockExplorers.default.url}/tx/${txHash}` : null
  const safeTier    = (typeof tier === 'number' && tier in TIER_META ? tier : 1) as RewardTier
  const meta        = TIER_META[safeTier]
  const Icon        = meta.icon
  const color       = TIER_COLOR[safeTier]

  return (
    <div className="rounded-2xl p-8 text-center animate-slide-up"
      style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>

      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
        style={{ background: `rgba(${hexToRgb(color)},0.12)`, border: `1px solid rgba(${hexToRgb(color)},0.3)` }}>
        <Icon className="w-8 h-8" style={{ color }} />
      </div>

      {/* Tier badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3"
        style={{ background: `rgba(${hexToRgb(color)},0.1)`, border: `1px solid rgba(${hexToRgb(color)},0.25)`, color }}>
        {TIER_LABEL[safeTier].toUpperCase()} — {TIER_RATE[safeTier]}
      </div>

      <div className="text-muted text-xs uppercase tracking-widest mb-2 font-semibold">
        {meta.label}
      </div>

      {/* Mining rate */}
      <div className="animate-count-up">
        <div className="text-5xl font-black tabular-nums mb-1" style={{ color }}>
          {ratePerHour ? formatRate(ratePerHour) : TIER_RATE[safeTier]}
        </div>
        <div className="font-bold text-lg mb-1 text-white">Mining Rate Active</div>
        <div className="text-muted text-xs mb-1">
          Session runs 24h — points accrue linearly on-chain
        </div>
        <div className="text-subtle text-xs">{meta.sub}</div>
      </div>

      {/* Transaction */}
      {txHash && (
        <div className="mt-6 p-3 rounded-xl bg-[rgba(0,16,32,0.4)] border border-[rgba(168,230,255,0.08)]">
          <div className="text-muted text-xs mb-1">On-chain Transaction</div>
          <a href={explorerUrl!} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-[#A8E6FF] hover:text-white transition-colors">
            <CheckCircle className="w-3 h-3" />
            {txHash.slice(0, 18)}...{txHash.slice(-6)}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      <button onClick={onReset} className="btn-secondary mt-6 mx-auto">
        Back to Mining
      </button>
    </div>
  )
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}
