import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Wallet, Zap, Key, PlusCircle, ExternalLink, RefreshCw, Lock, Gift, Pickaxe } from 'lucide-react'
import { useWalletContext } from '../context/WalletContext'
import {
  useUserMiningStats, useRealTimeKNTC,
  useMiningCountdown, useMiningEvents, useProtocolStats,
} from '../hooks/useMining'
import AdModal from '../components/AdModal'
import MiningResult from '../components/MiningResult'
import EventRow from '../components/EventRow'
import EmptyState from '../components/EmptyState'
import {
  publicClient, MINING_ADDRESS, KINETIC_MINING_ABI,
  formatDuration, formatKNTC, formatPoints, formatAddress,
  maculatusTestnet,
} from '../lib/chain'

type Phase = 'idle' | 'ad' | 'mining' | 'result'

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
  const canMine      = stats?.canMine         ?? true
  const cooldownSecs = Number(stats?.cooldown        ?? 0n)
  const lastMineAt   = Number(stats?.lastMineAt      ?? 0n)
  const sessionLeft  = Number(stats?.sessionTimeLeft ?? 0n)
  const cycleCount   = Number(stats?.cycleCount      ?? 0n)
  const pendingClaim = stats?.pendingClaim   ?? 0n
  const estimatedKNTC= stats?.estimatedKNTC  ?? 0n
  const tgeActive    = stats?.tgeActive      ?? false
  const isSessionActive = lastMineAt > 0 && !canMine
  const liveKNTC = useRealTimeKNTC(lastMineAt, isSessionActive)

  const { remaining: sessionRemain } = useMiningCountdown(sessionLeft)
  const { remaining: cooldownRemain } = useMiningCountdown(cooldownSecs)
  const ds = formatDuration(sessionRemain)
  const dc = formatDuration(cooldownRemain)

  // Ring progress: fraction of session remaining (1 = full, 0 = done)
  const sessionProgress  = sessionRemain > 0 ? sessionRemain / SESSION_MAX : 0

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

          {/* Mining circle preview — idle state */}
          <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
            <div className="absolute inset-0 rounded-full animate-pulse-glacier" style={{ background: 'radial-gradient(circle, rgba(168,230,255,0.10) 0%, transparent 70%)', filter: 'blur(16px)', transform: 'scale(1.3)' }} />
            <div className="w-44 h-44 rounded-full flex flex-col items-center justify-center gap-2"
              style={{ background: 'linear-gradient(145deg, #0d2d48 0%, #082035 60%, #041428 100%)', border: '2px solid rgba(168,230,255,0.12)', boxShadow: '0 0 40px rgba(168,230,255,0.08), inset 0 1px 0 rgba(168,230,255,0.06)' }}>
              <Pickaxe className="w-14 h-14" style={{ color: '#A8E6FF', filter: 'drop-shadow(0 0 12px rgba(168,230,255,0.5))' }} />
            </div>
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
              'Each session earns exactly 1 KNTC — credited on-chain instantly',
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

      {/* Mining pool progress */}
      {(() => {
        const POOL_TOTAL = 10_000_000_000n * 10n ** 18n
        const minted     = protocol?.totalPointsMinted ?? 0n
        const poolPct    = POOL_TOTAL > 0n
          ? Math.min(100, Number((minted * 10000n) / POOL_TOTAL) / 100)
          : 0
        return (
          <div className="card p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse-glacier" style={{ background: '#A8E6FF' }} />
              <span className="font-bold text-sm" style={{ color: '#A8E6FF' }}>Mining Pool</span>
              <span className="ml-auto font-mono text-xs font-bold text-muted">
                {formatKNTC(minted)} / 10B KNTC
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${poolPct}%`, background: 'linear-gradient(90deg,#5ac8f0,#A8E6FF)' }} />
            </div>
            <span className="text-subtle text-[10px]">1 session = 1 KNTC · Locked until TGE · {poolPct.toFixed(4)}% distributed</span>
          </div>
        )
      })()}

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
                  1 KNTC / session
                </span>
              </div>

              {/* Center — Mining circle */}
              <div className="flex flex-col items-center gap-5 py-8 px-6">

                {phase === 'mining' ? (
                  /* ── Broadcasting ── */
                  <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
                    <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: 'radial-gradient(circle, rgba(168,230,255,0.1) 0%, transparent 70%)', filter: 'blur(16px)', transform: 'scale(1.25)' }} />
                    <div className="w-48 h-48 rounded-full flex flex-col items-center justify-center gap-3"
                      style={{ background: 'linear-gradient(145deg, #0d2d48 0%, #082035 60%, #041428 100%)', border: '2px solid rgba(168,230,255,0.15)', boxShadow: '0 0 40px rgba(168,230,255,0.1)' }}>
                      <div className="w-10 h-10 border-[3px] border-[#A8E6FF] border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] font-bold tracking-[2px] uppercase text-muted">Broadcasting...</span>
                    </div>
                  </div>

                ) : canMine ? (
                  /* ── INACTIVE: circle with pickaxe ── */
                  <button
                    onClick={() => { setMineError(null); setPhase('ad') }}
                    disabled={phase !== 'idle'}
                    className="relative flex items-center justify-center transition-transform active:scale-95 hover:scale-[1.03] focus:outline-none"
                    style={{ width: 220, height: 220 }}>
                    <div className="absolute inset-0 rounded-full animate-pulse-glacier" style={{ background: 'radial-gradient(circle, rgba(168,230,255,0.09) 0%, transparent 70%)', filter: 'blur(18px)', transform: 'scale(1.3)' }} />
                    <div className="w-48 h-48 rounded-full flex flex-col items-center justify-center gap-3 select-none"
                      style={{ background: 'linear-gradient(145deg, #0d2d48 0%, #082035 60%, #041428 100%)', border: '2px solid rgba(168,230,255,0.14)', boxShadow: '0 0 48px rgba(168,230,255,0.1), inset 0 1px 0 rgba(168,230,255,0.07)' }}>
                      <Pickaxe className="w-16 h-16" style={{ color: '#A8E6FF', filter: 'drop-shadow(0 0 14px rgba(168,230,255,0.55))' }} />
                      <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(168,230,255,0.45)' }}>Tap to mine</span>
                    </div>
                  </button>

                ) : (
                  /* ── ACTIVE: progress arc circle + countdown below ── */
                  (() => {
                    const pct  = Math.min(100, Math.max(0, Math.round((1 - sessionProgress) * 100)))
                    const R    = 96
                    const CIRC = 2 * Math.PI * R
                    const filled = CIRC * (pct / 100)
                    return (
                      <div className="flex flex-col items-center gap-4">
                        {/* Circle with arc */}
                        <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
                          {/* Ambient glow */}
                          <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: 'radial-gradient(circle, rgba(168,230,255,0.12) 0%, transparent 65%)', filter: 'blur(20px)', transform: 'scale(1.3)', animationDuration: '2.5s' }} />
                          {/* Progress arc SVG */}
                          <svg width={220} height={220} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
                            <defs>
                              <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#5ac8f0" />
                                <stop offset="100%" stopColor="#60ffb0" />
                              </linearGradient>
                            </defs>
                            {/* Track */}
                            <circle cx={110} cy={110} r={R} fill="none" stroke="rgba(168,230,255,0.08)" strokeWidth={10} />
                            {/* Filled arc */}
                            <circle cx={110} cy={110} r={R} fill="none"
                              stroke="url(#arcGrad)" strokeWidth={10}
                              strokeLinecap="round"
                              strokeDasharray={`${filled} ${CIRC}`}
                              style={{ transition: 'stroke-dasharray 1s linear', filter: 'drop-shadow(0 0 6px rgba(90,200,240,0.7))' }} />
                          </svg>
                          {/* Inner circle */}
                          <div className="absolute rounded-full flex flex-col items-center justify-center gap-1"
                            style={{ width: 188, height: 188, background: 'linear-gradient(145deg, #0d2d48 0%, #082035 60%, #041428 100%)', boxShadow: 'inset 0 1px 0 rgba(168,230,255,0.07)' }}>
                            <span className="font-black tabular-nums leading-none" style={{ fontSize: 52, color: '#A8E6FF', textShadow: '0 0 30px rgba(168,230,255,0.5)', letterSpacing: -1 }}>{pct}%</span>
                            <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(168,230,255,0.35)' }}>cycle</span>
                          </div>
                        </div>

                        {/* Countdown — below the circle */}
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-[10px] font-semibold tracking-[2px] uppercase text-muted">Next cycle in</span>
                          <span className="font-mono font-black tabular-nums" style={{ fontSize: 36, color: '#ffffff', letterSpacing: 2, textShadow: '0 0 20px rgba(168,230,255,0.3)' }}>
                            {ds.h}:{ds.m}:{ds.s}
                          </span>
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full mt-1"
                            style={{ background: 'rgba(96,255,176,0.08)', border: '1px solid rgba(96,255,176,0.2)' }}>
                            <div className="w-1.5 h-1.5 rounded-full animate-pulse-glacier" style={{ background: '#60ffb0' }} />
                            <span className="text-xs font-semibold" style={{ color: '#60ffb0' }}>Mining active</span>
                          </div>
                          {cooldownRemain > 0 && (
                            <div className="flex items-center gap-2 text-xs text-muted mt-1">
                              <div className="w-1 h-1 rounded-full bg-[rgba(168,230,255,0.3)]" />
                              Cooldown: <span className="font-mono text-[#A8E6FF]">{dc.h}:{dc.m}:{dc.s}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()
                )}

                {/* ── Tokens earned (visible when session is active) ── */}
                {!canMine && (
                  <div className="w-full rounded-2xl px-5 py-4 flex flex-col items-center gap-1"
                    style={{ background: 'rgba(168,230,255,0.04)', border: '1px solid rgba(168,230,255,0.10)' }}>
                    <span className="text-xs font-medium" style={{ color: '#4a6a7a' }}>You have earned this session</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono font-black tabular-nums" style={{ fontSize: 30, color: '#A8E6FF', textShadow: '0 0 20px rgba(168,230,255,0.4)' }}>
                        {liveKNTC}
                      </span>
                      <span className="font-bold text-base" style={{ color: '#A8E6FF' }}>KNTC</span>
                    </div>
                    <span className="text-[10px]" style={{ color: '#4a6a7a' }}>credited on-chain · 1 KNTC this session</span>
                  </div>
                )}

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
                      <span className="font-mono font-bold text-sm" style={{ color: '#60ffb0' }}>1 KNTC</span>
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
              { label: 'Sessions', value: cycleCount.toString(), color: '#A8E6FF' },
              { label: 'Per Session', value: '1',              color: '#60ffb0' },
              { label: 'KNTC',    value: cycleCount.toString(), color: '#ffd060' },
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
              { l: 'Rate',       v: '1 KNTC / session'  },
              { l: 'Cooldown',   v: '24 hours'          },
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
