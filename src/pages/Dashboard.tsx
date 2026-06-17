import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet, Pickaxe, Coins, ExternalLink, RefreshCw,
  AlertCircle, Lock, Gift, Zap, Timer,
} from 'lucide-react'
import { useWallet } from '../hooks/useWallet'
import {
  useUserMiningStats, useMiningEvents, useProtocolStats,
  useCurrentRank, useRealTimeMining,
} from '../hooks/useMining'
import {
  formatKNTC, formatPoints, formatRate, formatAddress, formatDuration,
  maculatusTestnet, RANK_COLOR, RANK_NAME,
} from '../lib/chain'
import StatCard from '../components/StatCard'
import EventRow from '../components/EventRow'
import EmptyState from '../components/EmptyState'
import WalletButton from '../components/WalletButton'
import MiningClock from '../components/MiningClock'

// ─── Session time-left countdown ─────────────────────────────────────────────
function useSessionCountdown(sessionTimeLeft: number): number {
  const [remaining, setRemaining] = useState(sessionTimeLeft)
  useEffect(() => {
    setRemaining(sessionTimeLeft)
    if (sessionTimeLeft <= 0) return
    const id = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000)
    return () => clearInterval(id)
  }, [sessionTimeLeft])
  return remaining
}

// ─── Rank quota progress bar ──────────────────────────────────────────────────
function RankBadge({ rank, pct }: { rank: 1 | 2 | 3; pct: number }) {
  const color = RANK_COLOR[rank]
  const name  = RANK_NAME[rank]
  const [limit1, limit2, limit3] = [
    'Rank 1: 0–500B pts',
    'Rank 2: 500B–750B pts (×0.5 rate)',
    'Rank 3: 750B–875B pts (×0.25 rate)',
  ]
  return (
    <div className="card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
          <span className="text-white text-sm font-semibold">{name}</span>
        </div>
        <span className="font-mono text-xs" style={{ color }}>{pct}% filled</span>
      </div>
      <div className="h-1.5 rounded-full bg-[rgba(168,230,255,0.07)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="text-subtle text-xs">{
        rank === 1 ? limit1 : rank === 2 ? limit2 : limit3
      }</div>
    </div>
  )
}

// ─── Live point counter ───────────────────────────────────────────────────────
function LiveCounter({ points }: { points: bigint }) {
  return (
    <div className="tabular-nums font-mono font-bold text-[#60ffb0] text-3xl tracking-tight">
      {formatPoints(points)}
    </div>
  )
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { address, isOnCorrectChain } = useWallet()
  const { data: stats,    isLoading: sLoading,  refetch: refetchStats    } = useUserMiningStats(address ?? undefined)
  const { data: events,   isLoading: eLoading,  refetch: refetchEvents   } = useMiningEvents(address ?? undefined)
  const { data: protocol,                        refetch: refetchProtocol } = useProtocolStats()
  const { data: rankData }                                                  = useCurrentRank()

  if (!address) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <EmptyState icon={Wallet} title="Connect Wallet" description="Connect your wallet to view your personal mining dashboard." action={<WalletButton />} />
      </div>
    )
  }

  if (!isOnCorrectChain) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <EmptyState icon={AlertCircle} title="Wrong Network" description="Switch to Maculatus Testnet (Chain ID: 10778)." action={<WalletButton />} />
      </div>
    )
  }

  const refresh = () => { refetchStats(); refetchEvents(); refetchProtocol() }

  const pendingClaim    = stats?.pendingClaim    ?? 0n
  const totalClaimed    = stats?.totalClaimed    ?? 0n
  const cycleCount      = Number(stats?.cycleCount      ?? 0n)
  const cooldown        = Number(stats?.cooldown        ?? 0n)
  const canMineNow      = stats?.canMine         ?? true
  const lastMineAt      = Number(stats?.lastMineAt      ?? 0n)
  const tgeActive       = stats?.tgeActive       ?? false
  const ratePerHour     = stats?.ratePerHour     ?? 0n
  const sessionTimeLeft = Number(stats?.sessionTimeLeft ?? 0n)
  const estimatedKNTC   = stats?.estimatedKNTC   ?? 0n

  const rank    = rankData?.rank    ?? 1
  const rankPct = rankData?.quotaFillPct ?? 0

  // Real-time live counter — updates every second client-side
  const livePoints = useRealTimeMining(lastMineAt, ratePerHour, pendingClaim)
  const sessionLeft = useSessionCountdown(sessionTimeLeft)
  const { h: sh, m: sm, s: ss } = formatDuration(sessionLeft)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-muted text-sm">Wallet:</span>
            <a href={`${maculatusTestnet.blockExplorers.default.url}/address/${address}`}
              target="_blank" rel="noopener noreferrer"
              className="address-pill flex items-center gap-1 hover:border-[rgba(168,230,255,0.3)] transition-colors">
              {formatAddress(address)}
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
        <button onClick={refresh} className="btn-secondary text-sm py-2 px-3.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Rank badge */}
      <RankBadge rank={rank as 1 | 2 | 3} pct={rankPct} />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pending Credits"
          value={`${formatPoints(livePoints)} pts`}
          icon={Coins}
          color="#60ffb0"
          loading={sLoading}
          sub="Live accumulating"
        />
        <StatCard
          label="Mining Rate"
          value={formatRate(ratePerHour)}
          icon={Zap}
          color="#ffd060"
          loading={sLoading}
          sub={ratePerHour > 0n ? 'Active session' : 'No session'}
        />
        <StatCard
          label="Session Time Left"
          value={ratePerHour > 0n ? `${sh}:${sm}:${ss}` : '—'}
          icon={Timer}
          color="#A8E6FF"
          loading={sLoading}
          sub="24h max per session"
        />
        <StatCard
          label="Cycles Done"
          value={cycleCount.toString()}
          icon={Pickaxe}
          color="#c090ff"
          loading={sLoading}
        />
      </div>

      {/* Pre-TGE claim banner */}
      <div className="p-4 rounded-xl flex items-center justify-between gap-4"
        style={{ background: 'rgba(168,230,255,0.05)', border: '1px solid rgba(168,230,255,0.12)' }}>
        <div className="flex items-start gap-3">
          {tgeActive
            ? <Gift className="w-5 h-5 text-[#60ffb0] mt-0.5 flex-shrink-0" />
            : <Lock className="w-5 h-5 text-[#A8E6FF] mt-0.5 flex-shrink-0" />}
          <div>
            <div className="text-white font-semibold text-sm">
              {tgeActive ? 'TGE Active — Claim your KNTC!' : 'Pre-TGE: Credits locked until launch'}
            </div>
            <div className="text-muted text-xs mt-0.5">
              {tgeActive
                ? `You have ${formatPoints(livePoints)} pts (~${formatKNTC(estimatedKNTC)} KNTC) ready to claim.`
                : `${formatPoints(livePoints)} pts accumulated. Estimated ${formatKNTC(estimatedKNTC)} KNTC at TGE.`}
            </div>
            {totalClaimed > 0n && (
              <div className="text-subtle text-xs mt-0.5">
                Already claimed: {formatKNTC(totalClaimed)} KNTC
              </div>
            )}
          </div>
        </div>
        <Link to="/mine" className="btn-primary text-sm py-2 px-4 whitespace-nowrap flex-shrink-0">
          {tgeActive ? <><Gift className="w-3.5 h-3.5" />Claim</> : <><Pickaxe className="w-3.5 h-3.5" />Mine</>}
        </Link>
      </div>

      {/* Live mining counter block — shown only when session is active */}
      {ratePerHour > 0n && (
        <div className="card-glow p-6 flex flex-col items-center text-center gap-2">
          <div className="text-muted text-xs uppercase tracking-widest mb-1">Live Mining Counter</div>
          <LiveCounter points={livePoints} />
          <div className="text-muted text-sm">points accumulated</div>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted">
            <span>Rate: <span className="text-[#ffd060] font-mono font-semibold">{formatRate(ratePerHour)}</span></span>
            <span className="w-px h-3 bg-[rgba(168,230,255,0.12)]" />
            <span>Session ends in: <span className="text-[#A8E6FF] font-mono font-semibold">{sh}:{sm}:{ss}</span></span>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Mining history */}
        <div className="lg:col-span-2 card-glow overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(168,230,255,0.06)]">
            <h2 className="font-bold text-white">My Mining History</h2>
            <Link to="/activity" className="btn-ghost text-xs py-1.5">All Activity</Link>
          </div>
          {eLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="shimmer h-14 rounded-xl" />
              ))}
            </div>
          ) : !events?.length ? (
            <EmptyState icon={Pickaxe} title="No mining sessions yet"
              description="Your mining history will appear here after your first session."
              action={<Link to="/mine" className="btn-primary text-sm py-2"><Pickaxe className="w-3.5 h-3.5" />Start Mining</Link>}
            />
          ) : (
            <div className="divide-y divide-[rgba(168,230,255,0.05)]">
              {events.slice(0, 10).map(e => (
                <EventRow
                  key={e.txHash}
                  user={e.user}
                  timestamp={e.timestamp}
                  ratePerHour={e.ratePerHour}
                  tier={e.tier}
                  txHash={e.txHash}
                  blockNumber={e.blockNumber}
                  highlight
                />
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Mining clock (cooldown) */}
          <div className="card-glow p-6 flex flex-col items-center">
            <h3 className="font-bold text-white mb-4 self-start">Next Cycle</h3>
            <MiningClock cooldownSeconds={cooldown} canMine={canMineNow} cycleCount={cycleCount} />
            {canMineNow && (
              <Link to="/mine" className="btn-primary w-full justify-center mt-4">
                <Pickaxe className="w-4 h-4" /> Mine Now
              </Link>
            )}
          </div>

          {/* Network info */}
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-white text-sm">Network</h3>
            {[
              { l: 'Network',      v: 'Maculatus Testnet'  },
              { l: 'Chain ID',     v: '10778'              },
              { l: 'Token',        v: 'KNTC (ERC-20)'      },
              { l: 'Session',      v: '24 hours'           },
              { l: 'Conversion',   v: '1,250 pts = 1 KNTC' },
              { l: 'TGE',          v: tgeActive ? 'Active' : 'Pre-Launch' },
              { l: 'Last Mine',    v: lastMineAt > 0 ? new Date(lastMineAt * 1000).toLocaleString() : 'Never' },
            ].map(({ l, v }) => (
              <div key={l} className="flex justify-between">
                <span className="text-muted text-sm">{l}</span>
                <span className="text-white text-sm font-medium font-mono text-right max-w-[160px] truncate">{v}</span>
              </div>
            ))}
          </div>

          {/* Protocol totals */}
          {protocol && (
            <div className="card p-5 space-y-3">
              <h3 className="font-semibold text-white text-sm">Protocol</h3>
              {[
                { l: 'Total Cycles',    v: protocol.totalCycles.toString(),                 c: '#A8E6FF' },
                { l: 'Unique Miners',   v: protocol.uniqueMiners.toString(),                c: '#A8E6FF' },
                { l: 'Points Minted',   v: `${formatPoints(protocol.totalPointsMinted)} pts`, c: '#60ffb0' },
                { l: 'Tokens Claimed',  v: `${formatKNTC(protocol.totalTokensClaimed)} KNTC`, c: '#c090ff' },
              ].map(({ l, v, c }) => (
                <div key={l} className="flex justify-between">
                  <span className="text-muted text-sm">{l}</span>
                  <span className="font-mono text-sm font-bold" style={{ color: c }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
