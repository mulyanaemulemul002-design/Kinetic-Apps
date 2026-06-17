import { useProtocolStats } from '../hooks/useMining'
import { MINING_POOL_KNTC, INVESTOR_POOL, TEAM_POOL, ECOSYSTEM_POOL, TOTAL_SUPPLY, RANK_3_LIMIT_PTS, formatKNTC, formatPoints } from '../lib/chain'
import { Pickaxe, TrendingUp, Users, Leaf } from 'lucide-react'

const ALLOCATIONS = [
  {
    key: 'mining',
    label: 'Mining Pool',
    icon: Pickaxe,
    amount: MINING_POOL_KNTC,
    pct: 70,
    color: '#A8E6FF',
    description: 'Distributed via 24h sessions — rank-based halving (Blueprint Phase 1)',
  },
  {
    key: 'ecosystem',
    label: 'Ecosystem & Treasury',
    icon: Leaf,
    amount: ECOSYSTEM_POOL,
    pct: 17.5,
    color: '#60ffb0',
    description: 'Grants, partnerships, reserve treasury',
  },
  {
    key: 'investor',
    label: 'Investors',
    icon: TrendingUp,
    amount: INVESTOR_POOL,
    pct: 10,
    color: '#ffd060',
    description: 'Early investors and strategic backers',
  },
  {
    key: 'team',
    label: 'Team / Dev',
    icon: Users,
    amount: TEAM_POOL,
    pct: 2.5,
    color: '#c090ff',
    description: 'Core development team allocation',
  },
]

export default function TokenAllocation() {
  const { data: stats } = useProtocolStats()

  const minedPct = stats && stats.totalPointsMinted > 0n
    ? Number((stats.totalPointsMinted * 100_000n) / RANK_3_LIMIT_PTS) / 1000
    : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-white text-lg">Token Allocation</h3>
        <span className="text-muted text-sm">{formatKNTC(TOTAL_SUPPLY)} KNTC Total</span>
      </div>

      {/* Visual bar */}
      <div className="h-3 rounded-full overflow-hidden flex gap-0.5">
        {ALLOCATIONS.map(a => (
          <div key={a.key}
            style={{ width: `${a.pct}%`, background: a.color, opacity: 0.85 }} />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {ALLOCATIONS.map(a => (
          <span key={a.key} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: a.color }} />
            {a.label} {a.pct}%
          </span>
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-2 mt-2">
        {ALLOCATIONS.map(({ key, label, icon: Icon, amount, pct, color, description }) => {
          const rgb = hexToRgb(color)
          const isMining = key === 'mining'
          return (
            <div key={key} className="stat-box flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.2)` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white text-sm">{label}</span>
                  <span className="font-mono text-sm font-bold" style={{ color }}>
                    {formatKNTC(amount)} KNTC
                  </span>
                </div>
                {isMining && (
                  <div className="progress-track mb-1" style={{ height: '4px' }}>
                    <div style={{
                      height: '100%', borderRadius: '2px',
                      width: `${Math.min(minedPct, 100)}%`,
                      background: `linear-gradient(90deg,${color}80,${color})`,
                      transition: 'width 1s ease',
                      boxShadow: `0 0 6px rgba(${rgb},0.5)`,
                    }} />
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted text-xs">{description}</span>
                  <span className="text-subtle text-xs">{pct}%</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Mining pool live counter */}
      {stats && (
        <div className="card-inner p-3 flex items-center justify-between">
          <span className="text-muted text-xs">Point quota consumed</span>
          <span className="font-mono text-xs text-[#A8E6FF] font-bold">
            {formatPoints(stats.totalPointsMinted ?? 0n)} / 875B pts
            &nbsp;<span className="text-subtle">({minedPct.toFixed(4)}%)</span>
          </span>
        </div>
      )}
    </div>
  )
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}
