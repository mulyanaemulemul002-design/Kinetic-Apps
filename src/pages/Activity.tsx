import { useState } from 'react'
import { Search, RefreshCw, Activity, Filter } from 'lucide-react'
import { useMiningEvents, useProtocolStats, useCurrentRank } from '../hooks/useMining'
import { useNetworkStatus } from '../hooks/useAdEvents'
import EventRow from '../components/EventRow'
import EmptyState from '../components/EmptyState'
import { formatPoints, RANK_COLOR, RANK_NAME, RANK_1_LIMIT_PTS, RANK_2_LIMIT_PTS, RANK_3_LIMIT_PTS } from '../lib/chain'

export default function ActivityPage() {
  const [search, setSearch] = useState('')
  const { data: events, isLoading, refetch, dataUpdatedAt } = useMiningEvents()
  const { data: protocol } = useProtocolStats()
  const { data: network  } = useNetworkStatus()
  const { data: rankData } = useCurrentRank()

  const filtered = (events ?? []).filter(e =>
    !search ||
    e.user.toLowerCase().includes(search.toLowerCase()) ||
    e.txHash.toLowerCase().includes(search.toLowerCase())
  )

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : null
  const rank    = (rankData?.rank ?? 1) as 1 | 2 | 3
  const rankPct = rankData?.quotaFillPct ?? 0
  const rankColor = RANK_COLOR[rank]
  const rankLimit = rank === 1 ? RANK_1_LIMIT_PTS : rank === 2 ? RANK_2_LIMIT_PTS : RANK_3_LIMIT_PTS
  const rankStart = rank === 1 ? 0n : rank === 2 ? RANK_1_LIMIT_PTS : RANK_2_LIMIT_PTS

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Activity</h1>
          <p className="text-muted text-sm mt-0.5">
            On-chain MiningSessionStarted events · Maculatus Testnet
            {lastUpdated && ` · Updated ${lastUpdated}`}
          </p>
        </div>
        <button onClick={() => refetch()} className="btn-secondary text-sm py-2 px-3.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Rank bar */}
      <div className="card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: rankColor }} />
            <span className="text-white text-sm font-semibold">{RANK_NAME[rank]}</span>
          </div>
          <span className="font-mono text-xs" style={{ color: rankColor }}>{rankPct}% quota filled</span>
        </div>
        <div className="h-1.5 rounded-full bg-[rgba(168,230,255,0.07)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${rankPct}%`, background: rankColor }}
          />
        </div>
        <div className="flex justify-between text-subtle text-xs">
          <span>{formatPoints(rankStart)} pts</span>
          <span>{formatPoints(rankLimit)} pts</span>
        </div>
      </div>

      {/* Stats */}
      {protocol && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { l: 'Total Sessions', v: protocol.totalCycles.toString(),               c: '#A8E6FF' },
            { l: 'Unique Miners',  v: protocol.uniqueMiners.toString(),              c: '#A8E6FF' },
            { l: 'Points Minted',  v: `${formatPoints(protocol.totalPointsMinted)} pts`, c: '#60ffb0' },
          ].map(({ l, v, c }) => (
            <div key={l} className="stat-box text-center">
              <div className="text-xl font-bold tabular-nums" style={{ color: c }}>{v}</div>
              <div className="text-muted text-xs mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text" placeholder="Filter by address or tx hash..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        {search && (
          <button onClick={() => setSearch('')} className="btn-secondary text-sm px-3.5">
            <Filter className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Event list */}
      <div className="card-glow overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(168,230,255,0.06)]">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${network?.isOnline ? 'bg-[#60ffb0] animate-pulse-glacier' : 'bg-[#ff9090]'}`} />
            <span className="text-sm text-muted">
              {network?.isOnline ? `Live · Block #${network.blockNumber.toString()}` : 'Offline'}
            </span>
          </div>
          <span className="text-subtle text-xs">
            {filtered.length} session{filtered.length !== 1 ? 's' : ''}{search ? ' (filtered)' : ''}
          </span>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-14 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Activity}
            title={search ? 'No matching events' : 'No mining sessions yet'}
            description={
              search
                ? 'Try a different address or transaction hash.'
                : 'MiningSessionStarted events from the last 10,000 blocks will appear here.'
            }
          />
        ) : (
          <div className="divide-y divide-[rgba(168,230,255,0.05)]">
            {filtered.map(e => (
              <EventRow
                key={e.txHash}
                user={e.user}
                timestamp={e.timestamp}
                ratePerHour={e.ratePerHour}
                tier={e.tier}
                txHash={e.txHash}
                blockNumber={e.blockNumber}
              />
            ))}
          </div>
        )}
      </div>

      {/* Source note */}
      <div className="card p-5">
        <h3 className="font-semibold text-white text-sm mb-2">Data Source</h3>
        <p className="text-muted text-sm leading-relaxed">
          All events are fetched directly from the KNTC Ecochain (Maculatus Testnet) via public RPC.
          No centralized database — data is sourced from on-chain{' '}
          <code className="font-mono text-xs text-[#A8E6FF] bg-[rgba(168,230,255,0.08)] px-1 py-0.5 rounded">
            MiningSessionStarted
          </code>{' '}
          events. Coverage: last 10,000 blocks, refreshes every 30 seconds.
        </p>
        <p className="text-muted text-sm leading-relaxed mt-2">
          <span className="text-[#ffd060] font-semibold">Blueprint Phase 1 rates:</span>{' '}
          Apes 10K · Basic 50K · Hoki 200K pts/h (Rank 1). Halved at 500B (Rank 2) and 750B (Rank 3) global points.
        </p>
      </div>
    </div>
  )
}
