import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Zap, Clock, Key, PlusCircle, ExternalLink } from 'lucide-react'
import { useWalletContext } from '../context/WalletContext'
import { useUserMiningStats, useCurrentRank, useRealTimeKNTC, useMiningCountdown } from '../hooks/useMining'
import AdModal from '../components/AdModal'
import MiningResult from '../components/MiningResult'
import {
  publicClient, MINING_ADDRESS, KINETIC_MINING_ABI,
  RANK_COLOR, RANK_NAME,
  formatDuration,
} from '../lib/chain'

type Phase = 'idle' | 'ad' | 'mining' | 'result'

export default function Mine() {
  const { address, writeContract, connectMetaMask, connectWalletConnect, generateWallet, importWallet, isConnecting } = useWalletContext()
  const queryClient = useQueryClient()

  const [phase,       setPhase]       = useState<Phase>('idle')
  const [txHash,      setTxHash]      = useState<`0x${string}` | null>(null)
  const [mineError,   setMineError]   = useState<string | null>(null)
  const [importMode,  setImportMode]  = useState(false)
  const [pkInput,     setPkInput]     = useState('')
  const [importing,   setImporting]   = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const { data: stats, isLoading } = useUserMiningStats(address as `0x${string}` | undefined)
  const { data: rankData }         = useCurrentRank()

  const canMine      = stats?.canMine         ?? true
  const cooldownSecs = Number(stats?.cooldown        ?? 0n)
  const lastMineAt   = Number(stats?.lastMineAt      ?? 0n)
  const sessionLeft  = Number(stats?.sessionTimeLeft ?? 0n)
  const cycleCount   = Number(stats?.cycleCount      ?? 0n)
  const rank         = rankData?.rank         ?? 1
  const rankPct      = rankData?.quotaFillPct ?? 0

  const isSessionActive = lastMineAt > 0 && !canMine
  const liveKNTC = useRealTimeKNTC(lastMineAt, isSessionActive)

  const { remaining: cooldownRemain } = useMiningCountdown(cooldownSecs)
  const { remaining: sessionRemain  } = useMiningCountdown(sessionLeft)

  const d  = formatDuration(cooldownRemain)
  const ds = formatDuration(sessionRemain)

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

  if (!address) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 flex flex-col items-center gap-6 animate-fade-in">

        <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#5ac8f0,#A8E6FF)', boxShadow: '0 0 40px rgba(168,230,255,0.35)' }}>
          <Zap className="w-9 h-9 text-[#001020]" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black text-white mb-2">Connect to Mine</h1>
          <p className="text-muted text-sm leading-relaxed">
            Connect a wallet to start watching ads and earning KNTC on-chain.
          </p>
        </div>

        <div className="w-full flex flex-col gap-3">
          {[
            { text: 'Watch 15–30s ads to trigger mining cycles' },
            { text: 'Every cycle recorded on KNTC blockchain'   },
            { text: 'Earn 0.045 KNTC/h — 1.08 KNTC per day'    },
          ].map(({ text }) => (
            <div key={text} className="card flex items-center gap-3 px-4 py-3">
              <div className="w-2 h-2 rounded-full bg-[#A8E6FF] shrink-0" />
              <span className="text-sm" style={{ color: '#b8dcf0' }}>{text}</span>
            </div>
          ))}
        </div>

        {!importMode ? (
          <div className="w-full flex flex-col gap-3">
            {/* WalletConnect — works with Trust Wallet, Rainbow, MetaMask Mobile, etc. */}
            <button onClick={connectWalletConnect} disabled={isConnecting} className="btn-primary w-full justify-center">
              <Zap className="w-4 h-4" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>

            {/* MetaMask browser extension (desktop) */}
            {typeof window !== 'undefined' && (window as any).ethereum && (
              <button onClick={connectMetaMask} disabled={isConnecting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: 'rgba(168,230,255,0.06)', border: '1px solid rgba(168,230,255,0.14)', color: '#A8E6FF' }}>
                <Zap className="w-4 h-4" />
                MetaMask Extension
              </button>
            )}

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[rgba(168,230,255,0.08)]" />
              <span className="text-subtle text-xs">or use embedded wallet</span>
              <div className="flex-1 h-px bg-[rgba(168,230,255,0.08)]" />
            </div>

            <button onClick={generateWallet} className="btn-secondary w-full justify-center">
              <PlusCircle className="w-4 h-4" />
              Generate New Wallet
            </button>

            <button onClick={() => setImportMode(true)} className="btn-ghost w-full justify-center text-sm">
              <Key className="w-4 h-4" />
              Import Private Key
            </button>

            <p className="text-subtle text-xs text-center leading-relaxed">
              WalletConnect supports Trust Wallet, Rainbow, MetaMask Mobile, and 300+ wallets.
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
            <p className="text-subtle text-xs text-center">For testnet use only. Key never leaves your browser.</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-5 animate-fade-in">

      {phase === 'ad' && <AdModal onComplete={handleAdComplete} />}

      {/* Pre-TGE notice */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-xs"
        style={{ background: 'rgba(168,230,255,0.04)', border: '1px solid rgba(168,230,255,0.1)' }}>
        <div className="w-1.5 h-1.5 rounded-full bg-[#A8E6FF] mt-0.5 shrink-0" />
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

      {/* Result or mining UI */}
      {phase === 'result' && txHash ? (
        <MiningResult
          txHash={txHash}
          onReset={() => { setTxHash(null); setPhase('idle') }}
        />
      ) : (
        <>
          {/* Mine card */}
          <div className="card overflow-hidden">
            {/* Status bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(168,230,255,0.06)]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full"
                  style={{ background: phase === 'mining' ? '#ffd060' : canMine ? '#60ffb0' : '#4a6a7a' }} />
                <span className="text-sm font-bold" style={{ color: '#b8dcf0' }}>
                  {isLoading ? 'Loading...' :
                   phase === 'mining' ? 'Broadcasting...' :
                   canMine ? 'Ready to Mine' : 'Mining Active'}
                </span>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-lg"
                style={{ background: 'rgba(96,255,176,0.08)', border: '1px solid rgba(96,255,176,0.2)', color: '#60ffb0' }}>
                0.045 KNTC/h
              </span>
            </div>

            {/* Center */}
            <div className="flex flex-col items-center justify-center py-10 px-6">
              {phase === 'mining' ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 border-2 border-[#A8E6FF] border-t-transparent rounded-full animate-spin" />
                  <p className="text-muted text-sm">Signing & broadcasting...</p>
                </div>
              ) : canMine ? (
                <button
                  onClick={() => { setMineError(null); setPhase('ad') }}
                  disabled={phase !== 'idle'}
                  className="w-36 h-36 rounded-full flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
                  style={{
                    background:   'linear-gradient(135deg,#5ac8f0,#A8E6FF)',
                    boxShadow:    '0 0 48px rgba(168,230,255,0.4)',
                    color:        '#001020',
                  }}>
                  <Zap className="w-10 h-10" />
                  <span className="font-black text-lg tracking-widest">MINE</span>
                  <span className="text-[9px] opacity-70 text-center leading-tight">Watch ad · 24h session</span>
                </button>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Clock className="w-7 h-7 text-muted" />
                  <span className="text-muted text-sm">Session ends in</span>
                  <span className="font-mono text-4xl font-black text-white">
                    {ds.h}:{ds.m}:{ds.s}
                  </span>
                  <span className="text-subtle text-xs">Next mine available after cooldown</span>
                  <span className="text-subtle text-xs">Cooldown: {d.h}:{d.m}:{d.s}</span>
                </div>
              )}
            </div>

            {mineError && (
              <div className="mx-4 mb-4 px-3 py-2 rounded-xl text-xs text-[#ff9090] flex items-center gap-2"
                style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)' }}>
                <span className="shrink-0">!</span>
                {mineError}
              </div>
            )}
          </div>

          {/* Live KNTC counter */}
          {isSessionActive && (
            <div className="flex flex-col items-center gap-1 py-5 px-4 rounded-2xl"
              style={{ background: 'rgba(96,255,176,0.04)', border: '1px solid rgba(96,255,176,0.15)' }}>
              <span className="text-[9px] font-bold tracking-[2px] text-muted uppercase">Live Mining Counter</span>
              <span className="font-mono text-4xl font-black" style={{ color: '#60ffb0' }}>
                {liveKNTC}
              </span>
              <span className="text-muted text-xs">KNTC accumulated this session</span>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted">
                <span>Rate: <span className="text-[#60ffb0]">0.045 KNTC/h</span></span>
                <span className="opacity-20">|</span>
                <span>Session: <span className="text-[#A8E6FF]">{ds.h}:{ds.m}:{ds.s}</span></span>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Cycles',    value: cycleCount.toString(),  color: '#A8E6FF' },
              { label: 'KNTC/h',   value: '0.045',                color: '#60ffb0' },
              { label: 'Per Day',   value: '1.08',                 color: '#ffd060' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card p-4 flex flex-col items-center gap-1">
                <span className="font-black text-xl" style={{ color }}>{value}</span>
                <span className="text-muted text-[10px] font-semibold">{label}</span>
              </div>
            ))}
          </div>

          {/* Contract link */}
          <a
            href={`https://maculatus-scan.x1eco.com/address/${MINING_ADDRESS}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-subtle text-xs hover:text-[#A8E6FF] transition-colors">
            <ExternalLink className="w-3 h-3" />
            View contract on explorer
          </a>
        </>
      )}
    </div>
  )
}
