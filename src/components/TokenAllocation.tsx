import { useProtocolStats } from '../hooks/useMining'
import { TOTAL_SUPPLY, TOTAL_MINING_POOL, formatKNTC } from '../lib/chain'
import { Pickaxe } from 'lucide-react'

export default function TokenAllocation() {
  const { data: stats } = useProtocolStats()

  const totalPool    = TOTAL_MINING_POOL   // 10B KNTC
  const minted       = stats?.totalPointsMinted ?? 0n
  const claimed      = stats?.totalTokensClaimed ?? 0n
  const remaining    = stats?.poolRemaining ?? totalPool

  // % of pool distributed so far
  const mintedPct   = totalPool > 0n ? Number((minted * 10000n) / totalPool) / 100 : 0
  const claimedPct  = totalPool > 0n ? Number((claimed * 10000n) / totalPool) / 100 : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-white text-lg">Mining Pool</h3>
        <span className="text-muted text-sm">{formatKNTC(TOTAL_SUPPLY)} KNTC Total</span>
      </div>

      {/* Visual bar — credited vs pool */}
      <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(168,230,255,0.06)' }}>
        <div style={{
          height: '100%',
          width: `${Math.min(mintedPct, 100)}%`,
          background: 'linear-gradient(90deg,#5ac8f0,#A8E6FF)',
          transition: 'width 1s ease',
          borderRadius: '9999px',
        }} />
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#A8E6FF' }} />
          Mining Pool — 100%
        </span>
      </div>

      {/* Main row */}
      <div className="stat-box flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(168,230,255,0.1)', border: '1px solid rgba(168,230,255,0.2)' }}>
          <Pickaxe className="w-4 h-4" style={{ color: '#A8E6FF' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-white text-sm">Mining Pool</span>
            <span className="font-mono text-sm font-bold" style={{ color: '#A8E6FF' }}>
              {formatKNTC(TOTAL_MINING_POOL)} KNTC
            </span>
          </div>
          <div className="progress-track mb-1" style={{ height: '4px' }}>
            <div style={{
              height: '100%', borderRadius: '2px',
              width: `${Math.min(mintedPct, 100)}%`,
              background: 'linear-gradient(90deg,rgba(168,230,255,0.5),#A8E6FF)',
              transition: 'width 1s ease',
              boxShadow: '0 0 6px rgba(168,230,255,0.4)',
            }} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted text-xs">1 session = 1 KNTC · Claimable at TGE</span>
            <span className="text-subtle text-xs">100%</span>
          </div>
        </div>
      </div>

      {/* Live counters */}
      {stats && (
        <div className="space-y-2">
          <div className="card-inner p-3 flex items-center justify-between">
            <span className="text-muted text-xs">Pool credited</span>
            <span className="font-mono text-xs text-[#A8E6FF] font-bold">
              {formatKNTC(minted)} / {formatKNTC(totalPool)} KNTC
              <span className="text-subtle ml-1">({mintedPct.toFixed(4)}%)</span>
            </span>
          </div>
          <div className="card-inner p-3 flex items-center justify-between">
            <span className="text-muted text-xs">Pool remaining</span>
            <span className="font-mono text-xs text-[#60ffb0] font-bold">
              {formatKNTC(remaining)} KNTC
            </span>
          </div>
          {claimedPct > 0 && (
            <div className="card-inner p-3 flex items-center justify-between">
              <span className="text-muted text-xs">Claimed (post-TGE)</span>
              <span className="font-mono text-xs text-[#ffd060] font-bold">
                {formatKNTC(claimed)} KNTC
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
