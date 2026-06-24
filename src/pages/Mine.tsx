import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Wallet, Zap, Key, PlusCircle, ExternalLink, RefreshCw, Lock, Gift, Pickaxe } from 'lucide-react'
import { useWalletContext } from '../context/WalletContext'
import {
  useUserMiningStats, useCurrentRank, useRealTimeKNTC,
  useMiningCountdown, useMiningEvents, useProtocolStats,
} from '../hooks/useMining'
import AdModal from '../components/AdModal'
import MiningResult from '../components/MiningResult'
import EventRow from '../components/EventRow'
import EmptyState from '../components/EmptyState'
import {
  publicClient, MINING_ADDRESS, KINETIC_MINING_ABI,
  RANK_COLOR, RANK_NAME,
  formatDuration, formatKNTC, formatPoints, formatAddress,
  maculatusTestnet,
} from '../lib/chain'

type Phase = 'idle' | 'ad' | 'mining' | 'result'

// ── Session ring constants ────────────────────────────────────────────────────
const RING_SIZE   = 220
const RING_STROKE = 10
const RING_R      = (RING_SIZE - RING_STROKE) / 2
const RING_CIRC   = 2 * Math.PI * RING_R
const SESSION_MAX = 24 * 3600

export default function Mine() {
  const {
    address, writeContract,
    connectMetaMask, connectWalletConnect,
    generateWallet, importWallet, isConnecting,
  } = useWalletContext()
  const queryClient = useQueryClient()

  const [phase,       setPhase]       = useState<Phase>('idle')
  const [txHash,      setTxHash]      = useState<`0x${string}` | null>(null)
  const [mineError,   setMineError]   = useState<string | null>(null)
  const [importMode,  setImportMode]  = useState(false)
  const [pkInput,     setPkInput]     = useState('')
  const [importing,   setImporting]   = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const { data: stats,    isLoading } = useUserMiningStats(address as `0x${string}` | undefined)
  const { data: events,   isLoading: eLoading, refetch } = useMiningEvents(address as `0x${string}` | undefined)
  const { data: protocol }            = useProtocolStats()
  const { data: rankData }            = useCurrentRank()

  const canMine      = stats?.canMine         ?? true
  const cooldownSecs = Number(stats?.cooldown        ?? 0n)
  const lastMineAt   = Number(stats?.lastMineAt      ?? 0n)
  const sessionLeft  = Number(stats?.sessionTimeLeft ?? 0n)
  const cycleCount   = Number(stats?.cycleCount      ?? 0n)
  const pendingClaim = stats?.pendingClaim   ?? 0n
  const estimatedKNTC= stats?.estimatedKNTC  ?? 0n
  const tgeActive    = stats?.tgeActive      ?? false
  const rank         = rankData?.rank        ?? 1
  const rankPct      = rankData?.quotaFillPct ?? 0

  const isSessionActive = lastMineAt > 0 && !canMine
  const liveKNTC = useRealTimeKNTC(lastMineAt, isSessionActive)

  const { remaining: sessionRemain } = useMiningCountdown(sessionLeft)
  const { remaining: cooldownRemain } = useMiningCountdown(cooldownSecs)
  const ds = formatDuration(sessionRemain)
  const dc = formatDuration(cooldownRemain)

  // Ring progress: fraction of session remaining (1 = full, 0 = done)
  const sessionProgress  = sessionRemain > 0 ? sessionRemain / SESSION_MAX : 0
  const ringOffset       = RING_CIRC * (1 - Math.min(sessionProgress, 1))

  async function handleAdComplete() {
    setPhase('mining')
    try {
      const hash = await writeContract({
        address:      MINING_ADDRESS,
        abi:          KINETIC_MINING_ABI,
        functionName: 'mine',
      })
      await publicClient.waitForTransactionReceipt({ hash })
      setTxHash(hash)
      setPhase('result')
      queryClient.invalidateQueries({ queryKey: ['userDashboard', address] })
      queryClient.invalidateQueries({ queryKey: ['miningEvents'] })
      queryClient.invalidateQueries({ queryKey: ['protocolStats'] })
      queryClient.invalidateQueries({ queryKey: ['currentRank'] })
    } catch (e: any) {
      setMineError(e?.shortMessage || e?.reason || e?.message || 'Transaction failed')
      setPhase('idle')
    }
  }

  async function handleImport() {
    if (!pkInput.trim()) return
    setImporting(true); setImportError(null)
    try {
      await importWallet(pkInput.trim())
      setImportMode(false); setPkInput('')
    } catch {
      setImportError('Invalid private key. Enter a valid 64-char hex key.')
    } finally { setImporting(false) }
  }

  // ── Not connected ─────────────────────────────────────────────────────────
  if (!address) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 animate-fade-in">
        <div className="w-full max-w-[360px] flex flex-col items-center gap-7">

          <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#5ac8f0,#A8E6FF)', boxShadow: '0 0 60px rgba(168,230,255,0.28)' }}>
            <Zap className="w-9 h-9 text-[#001020]" />
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-black text-white mb-2">Start Mining</h1>
            <p className="text-muted text-sm leading-relaxed">
              Connect a wallet to earn KNTC by watching ads — every session recorded on-chain.
            </p>
          </div>

          <ul className="w-full space-y-3">
            {[
              'Watch 15–30s ads to trigger 24h mining sessions',
              'Every session recorded on the KNTC blockchain',
              'Fixed rate: 0.045 KNTC/h · 1.08 KNTC per day',
            ].map(text => (
              <li key={text} className="flex items-start gap-3 text-sm text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A8E6FF] mt-[5px] shrink-0" />
                {text}
              </li>
            ))}
          </ul>

          {!importMode ? (
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={connectWalletConnect}
                disabled={isConnecting}
                className="btn-primary w-full justify-center py-3.5 text-[15px]">
                <Wallet className="w-5 h-5" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>

              {typeof window !== 'undefined' && (window as any).ethereum && (
                <button onClick={connectMetaMask} disabled={isConnecting}
                  className="btn-secondary w-full justify-center text-sm">
                  <Zap className="w-4 h-4" />
                  MetaMask Extension
                </button>
              )}

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-[rgba(168,230,255,0.07)]" />
                <span className="text-subtle text-xs">or use embedded wallet</span>
                <div className="flex-1 h-px bg-[rgba(168,230,255,0.07)]" />
              </div>

              <div className="flex gap-2 w-full">
                <button onClick={generateWallet}
                  className="btn-secondary flex-1 justify-center text-sm">
                  <PlusCircle className="w-4 h-4" /> Generate
                </button>
                <button onClick={() => setImportMode(true)}
                  className="btn-ghost flex-1 justify-center text-sm border border-[rgba(168,230,255,0.1)]">
                  <Key className="w-4 h-4" /> Import Key
                </button>
              </div>

              <p className="text-subtle text-[11px] text-center pt-1">
                WalletConnect: Trust Wallet · Rainbow · MetaMask Mobile · 300+ wallets
              </p>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-3">
              <button onClick={() => { setImportMode(false); setImportError(null) }}
                className="btn-ghost self-start text-sm">
                Back
              </button>
              <label className="text-xs font-semibold text-muted">Private Key (0x...)</label>
              <textarea
                className="input font-mono text-xs resize-none"
                rows={3}
                placeholder="0x..."
                value={pkInput}
                onChange={e => setPkInput(e.target.value)}
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              />
              {importError && <p className="text-xs text-[#ff9090]">{importError}</p>}
              <button onClick={handleImport} disabled={importing || !pkInput.trim()}
                className="btn-primary w-full justify-center">
                {importing ? 'Importing...' : 'Import Wallet'}
              </button>
              <p className="text-subtle text-[11px] text-center">
                Testnet only — key stored locally, never leaves your browser.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Connected ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-5 animate-fade-in">

      {phase === 'ad' && <AdModal onComplete={handleAdComplete} />}

      {/* Pre-TGE notice */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs"
        style={{ background: 'rgba(168,230,255,0.04)', border: '1px solid rgba(168,230,255,0.08)' }}>
        <div className="w-1.5 h-1.5 rounded-full bg-[#A8E6FF] shrink-0" />
        <span style={{ color: '#4a6a7a' }}>
          <span className="text-[#A8E6FF] font-bold">Pre-TGE — </span>
          Mining earns KNTC at a fixed rate. Real KNTC claimable after TGE.
        </span>
      </div>

      {/* Rank bar */}
      <div className="card p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: RANK_COLOR[rank as 1|2|3] }} />
          <span className="font-bold text-sm" style={{ color: RANK_COLOR[rank as 1|2|3] }}>
            {RANK_NAME[rank as 1|2|3]}
          </span>
          <span className="ml-auto font-mono text-xs font-bold" style={{ color: RANK_COLOR[rank as 1|2|3] }}>
            {rankPct}%
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${rankPct}%`, background: RANK_COLOR[rank as 1|2|3] }} />
        </div>
        <span className="text-subtle text-[10px]">Global quota · Halving auto-applied</span>
      </div>

      {/* ── Two-column layout: mining card (left) + info sidebar (right) ── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Left: main mining panel */}
        <div className="lg:col-span-2 space-y-5">

          {/* Mining result */}
          {phase === 'result' && txHash ? (
            <MiningResult txHash={txHash} onReset={() => { setTxHash(null); setPhase('idle') }} />
          ) : (
            <div className="card overflow-hidden">
              {/* Status bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(168,230,255,0.06)]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse-glacier"
                    style={{ background: phase === 'mining' ? '#ffd060' : canMine ? '#60ffb0' : '#A8E6FF' }} />
                  <span className="text-sm font-bold" style={{ color: '#b8dcf0' }}>
                    {isLoading    ? 'Loading...' :
                     phase === 'mining' ? 'Broadcasting...' :
                     canMine      ? 'Ready to Mine' : 'Session Active'}
                  </span>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(96,255,176,0.08)', border: '1px solid rgba(96,255,176,0.18)', color: '#60ffb0' }}>
                  0.045 KNTC/h
                </span>
              </div>

              {/* Center — Orb */}
              <div className="flex flex-col items-center gap-6 py-8 px-6">

                {phase === 'mining' ? (
                  /* ── Broadcasting spinner ── */
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>
                      <div className="absolute inset-0 rounded-full animate-pulse"
                        style={{ background: 'radial-gradient(circle at 40% 35%, rgba(90,200,240,0.35) 0%, rgba(168,230,255,0.12) 55%, transparent 75%)', filter: 'blur(18px)' }} />
                      <div className="relative z-10 flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-2 border-[#A8E6FF] border-t-transparent rounded-full animate-spin" />
                        <p className="text-[#A8E6FF] text-sm font-semibold">Signing & broadcasting...</p>
                      </div>
                    </div>
                  </div>

                ) : canMine ? (
                  /* ── INACTIVE: glowing orb — tap to mine ── */
                  <button
                    onClick={() => { setMineError(null); setPhase('ad') }}
                    disabled={phase !== 'idle'}
                    className="relative flex items-center justify-center transition-transform active:scale-95 hover:scale-[1.03] focus:outline-none"
                    style={{ width: 264, height: 264 }}>

                    {/* Outer ambient glow layers */}
                    <div className="absolute inset-0 rounded-full"
                      style={{ background: 'radial-gradient(circle at 38% 32%, rgba(90,200,240,0.22) 0%, rgba(168,230,255,0.08) 60%, transparent 80%)', filter: 'blur(28px)', transform: 'scale(1.15)' }} />
                    <div className="absolute inset-0 rounded-full animate-pulse"
                      style={{ background: 'radial-gradient(circle at 60% 65%, rgba(168,230,255,0.12) 0%, transparent 65%)', filter: 'blur(20px)', animationDuration: '3s' }} />

                    {/* Main orb body */}
                    <div className="absolute inset-4 rounded-full"
                      style={{
                        background: 'radial-gradient(circle at 38% 32%, #7ad8f8 0%, #4ab8e8 25%, #1a6890 60%, #0a2840 100%)',
                        boxShadow: '0 0 60px rgba(90,200,240,0.5), 0 0 120px rgba(168,230,255,0.2), inset 0 8px 32px rgba(255,255,255,0.12), inset 0 -8px 24px rgba(0,16,32,0.6)',
                      }} />

                    {/* Specular highlight */}
                    <div className="absolute rounded-full pointer-events-none"
                      style={{ top: '18%', left: '26%', width: '38%', height: '22%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.28) 0%, transparent 100%)', filter: 'blur(4px)' }} />

                    {/* Center label */}
                    <div className="relative z-10 flex flex-col items-center gap-1.5 select-none">
                      <Zap className="w-8 h-8" style={{ color: '#001020', filter: 'drop-shadow(0 0 6px rgba(168,230,255,0.6))' }} />
                      <span className="font-black text-2xl tracking-widest" style={{ color: '#001020', textShadow: '0 1px 4px rgba(168,230,255,0.5)' }}>MINE</span>
                      <span className="text-[10px] font-semibold opacity-60" style={{ color: '#001020' }}>Watch ad · 24h session</span>
                    </div>
                  </button>

                ) : (
                  /* ── ACTIVE: animated orb with countdown ── */
                  <div className="flex flex-col items-center gap-5">
                    <div className="relative flex items-center justify-center" style={{ width: 264, height: 264 }}>

                      {/* Pulsing outer glow */}
                      <div className="absolute inset-0 rounded-full animate-pulse"
                        style={{ background: 'radial-gradient(circle at 38% 32%, rgba(90,200,240,0.28) 0%, rgba(168,230,255,0.10) 58%, transparent 78%)', filter: 'blur(28px)', transform: 'scale(1.18)', animationDuration: '2.5s' }} />
                      <div className="absolute inset-0 rounded-full animate-pulse"
                        style={{ background: 'radial-gradient(circle at 62% 68%, rgba(96,255,176,0.12) 0%, transparent 60%)', filter: 'blur(20px)', animationDuration: '3.8s' }} />

                      {/* Main orb body */}
                      <div className="absolute inset-4 rounded-full"
                        style={{
                          background: 'radial-gradient(circle at 38% 32%, #7ad8f8 0%, #4ab8e8 25%, #1a6890 60%, #0a2840 100%)',
                          boxShadow: '0 0 60px rgba(90,200,240,0.55), 0 0 120px rgba(168,230,255,0.22), inset 0 8px 32px rgba(255,255,255,0.12), inset 0 -8px 24px rgba(0,16,32,0.6)',
                        }} />

                      {/* Specular highlight */}
                      <div className="absolute rounded-full pointer-events-none"
                        style={{ top: '18%', left: '26%', width: '38%', height: '22%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.26) 0%, transparent 100%)', filter: 'blur(4px)' }} />

                      {/* SVG ring overlay */}
                      <svg className="absolute inset-0" width={264} height={264} style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx={132} cy={132} r={124} fill="none" stroke="rgba(168,230,255,0.08)" strokeWidth={6} />
                        <circle
                          cx={132} cy={132} r={124}
                          fill="none" stroke="url(#orbRingGrad)" strokeWidth={6}
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 124}
                          strokeDashoffset={2 * Math.PI * 124 * (1 - Math.min(sessionProgress, 1))}
                          style={{ transition: 'stroke-dashoffset 1s linear' }}
                        />
                        <defs>
                          <linearGradient id="orbRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#5ac8f0" />
                            <stop offset="100%" stopColor="#A8E6FF" />
                          </linearGradient>
                        </defs>
                      </svg>

                      {/* Center countdown */}
                      <div className="relative z-10 flex flex-col items-center gap-1 select-none">
                        <span className="text-[9px] font-bold tracking-[2.5px] uppercase" style={{ color: 'rgba(0,16,32,0.7)' }}>Next cycle in</span>
                        <span className="font-mono font-black tabular-nums leading-none" style={{ fontSize: 36, color: '#001020', textShadow: '0 1px 6px rgba(168,230,255,0.4)' }}>
                          {ds.h}:{ds.m}:{ds.s}
                        </span>
                        <div className="mt-1 px-3 py-0.5 rounded-full"
                          style={{ background: 'rgba(0,10,20,0.35)', border: '1px solid rgba(168,230,255,0.25)' }}>
                          <span className="font-mono text-xs font-bold" style={{ color: '#001020' }}>
                            Mining active
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Cooldown note */}
                    {cooldownRemain > 0 && (
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <div className="w-1 h-1 rounded-full bg-[rgba(168,230,255,0.3)]" />
                        Cooldown: <span className="font-mono text-[#A8E6FF]">{dc.h}:{dc.m}:{dc.s}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Tokens earned panel (always visible when connected) ── */}
                {!canMine || liveKNTC !== '0.000000' ? (
                  <div className="w-full rounded-2xl px-5 py-4 flex flex-col items-center gap-1"
                    style={{ background: 'rgba(168,230,255,0.04)', border: '1px solid rgba(168,230,255,0.10)' }}>
                    <span className="text-xs font-medium" style={{ color: '#4a6a7a' }}>You have earned</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono font-black tabular-nums" style={{ fontSize: 32, color: '#A8E6FF', textShadow: '0 0 20px rgba(168,230,255,0.4)' }}>
                        {liveKNTC}
                      </span>
                      <span className="font-bold text-lg" style={{ color: '#A8E6FF' }}>KNTC</span>
                    </div>
                    <span className="text-[10px]" style={{ color: '#4a6a7a' }}>this session · accumulating live</span>
                  </div>
                ) : null}

                {/* ── Info cards row ── */}
                <div className="w-full grid grid-cols-2 gap-3">
                  <div className="rounded-2xl px-4 py-3 flex flex-col gap-1"
                    style={{ background: 'rgba(168,230,255,0.04)', border: '1px solid rgba(168,230,255,0.08)' }}>
                    <span className="text-[10px] font-medium" style={{ color: '#4a6a7a' }}>Mining time left</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="#A8E6FF" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <span className="font-mono font-bold text-sm tabular-nums" style={{ color: '#A8E6FF' }}>
                        {canMine ? '--:--:--' : `${ds.h}:${ds.m}:${ds.s}`}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl px-4 py-3 flex flex-col gap-1"
                    style={{ background: 'rgba(168,230,255,0.04)', border: '1px solid rgba(168,230,255,0.08)' }}>
                    <span className="text-[10px] font-medium" style={{ color: '#4a6a7a' }}>Mining rate</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Zap className="w-3.5 h-3.5 shrink-0" style={{ color: '#60ffb0' }} />
                      <span className="font-mono font-bold text-sm" style={{ color: '#60ffb0' }}>0.045 / h</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Error */}
              {mineError && (
                <div className="mx-4 mb-4 px-3 py-2 rounded-xl text-xs text-[#ff9090] flex items-center gap-2"
                  style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)' }}>
                  <span>!</span> {mineError}
                </div>
              )}
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Cycles',  value: cycleCount.toString(), color: '#A8E6FF' },
              { label: 'KNTC/h',  value: '0.045',               color: '#60ffb0' },
              { label: 'Per Day', value: '1.08',                 color: '#ffd060' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card p-4 flex flex-col items-center gap-1">
                <span className="font-black text-xl" style={{ color }}>{value}</span>
                <span className="text-muted text-[10px] font-semibold">{label}</span>
              </div>
            ))}
          </div>

          {/* TGE / pending credits banner */}
          <div className="card p-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              {tgeActive
                ? <Gift className="w-5 h-5 text-[#60ffb0] shrink-0 mt-0.5" />
                : <Lock className="w-5 h-5 text-[#A8E6FF] shrink-0 mt-0.5" />}
              <div>
                <div className="text-white font-semibold text-sm">
                  {tgeActive ? 'TGE Active — Claim your KNTC!' : 'Pre-TGE: Credits locked until launch'}
                </div>
                <div className="text-muted text-xs mt-0.5">
                  {tgeActive
                    ? `${formatPoints(pendingClaim)} pts ≈ ${formatKNTC(estimatedKNTC)} KNTC ready.`
                    : `${formatPoints(pendingClaim)} pts accumulated · Est. ${formatKNTC(estimatedKNTC)} KNTC at TGE.`}
                </div>
              </div>
            </div>
            {tgeActive && (
              <button className="btn-primary text-sm py-2 px-4 whitespace-nowrap shrink-0">
                <Gift className="w-3.5 h-3.5" /> Claim
              </button>
            )}
          </div>

          {/* Mining history */}
          <div className="card-glow overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(168,230,255,0.06)]">
              <h2 className="font-bold text-white text-sm">My Mining History</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => refetch()} className="p-1.5 rounded-lg text-muted hover:text-[#A8E6FF] transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <Link to="/activity" className="btn-ghost text-xs py-1.5">All Activity</Link>
              </div>
            </div>
            {eLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="shimmer h-14 rounded-xl" />)}
              </div>
            ) : !events?.length ? (
              <EmptyState icon={Pickaxe} title="No sessions yet"
                description="Your on-chain mining history will appear here." />
            ) : (
              <div className="divide-y divide-[rgba(168,230,255,0.05)]">
                {events.slice(0, 8).map(e => (
                  <EventRow key={e.txHash} user={e.user} timestamp={e.timestamp}
                    ratePerHour={e.ratePerHour} tier={e.tier} txHash={e.txHash}
                    blockNumber={e.blockNumber} highlight />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">

          {/* Wallet info */}
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-white text-sm">Wallet</h3>
            <a href={`${maculatusTestnet.blockExplorers.default.url}/address/${address}`}
              target="_blank" rel="noopener noreferrer"
              className="address-pill flex items-center gap-1.5 hover:border-[rgba(168,230,255,0.3)] transition-colors w-full justify-between">
              <span className="font-mono text-xs">{formatAddress(address)}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>

          {/* Network info */}
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-white text-sm">Network</h3>
            {[
              { l: 'Network',    v: 'Maculatus Testnet' },
              { l: 'Chain ID',   v: '10778'             },
              { l: 'Session',    v: '24 hours'          },
              { l: 'Rate',       v: '0.045 KNTC/h'      },
              { l: 'Conversion', v: '1,250 pts = 1 KNTC'},
              { l: 'TGE',        v: tgeActive ? 'Active' : 'Pre-Launch' },
            ].map(({ l, v }) => (
              <div key={l} className="flex justify-between gap-2">
                <span className="text-muted text-xs">{l}</span>
                <span className="text-white text-xs font-medium font-mono text-right truncate max-w-[130px]">{v}</span>
              </div>
            ))}
          </div>

          {/* Protocol */}
          {protocol && (
            <div className="card p-5 space-y-3">
              <h3 className="font-semibold text-white text-sm">Protocol</h3>
              {[
                { l: 'Total Cycles',   v: protocol.totalCycles.toString(),                  c: '#A8E6FF' },
                { l: 'Unique Miners',  v: protocol.uniqueMiners.toString(),                 c: '#A8E6FF' },
                { l: 'Points Minted',  v: `${formatPoints(protocol.totalPointsMinted)} pts`, c: '#60ffb0' },
                { l: 'Claimed',        v: `${formatKNTC(protocol.totalTokensClaimed)} KNTC`, c: '#c090ff' },
              ].map(({ l, v, c }) => (
                <div key={l} className="flex justify-between gap-2">
                  <span className="text-muted text-xs">{l}</span>
                  <span className="font-mono text-xs font-bold truncate" style={{ color: c }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Contract link */}
          <a href={`https://maculatus-scan.x1eco.com/address/${MINING_ADDRESS}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-subtle text-xs hover:text-[#A8E6FF] transition-colors py-2">
            <ExternalLink className="w-3 h-3" />
            View contract on explorer
          </a>
        </div>
      </div>
    </div>
  )
}
