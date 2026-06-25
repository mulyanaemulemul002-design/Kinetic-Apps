import { useState } from 'react'
import { Copy, Check, ExternalLink, LogOut, Gift, Lock, Zap } from 'lucide-react'
import { useWalletContext } from '../context/WalletContext'
import { useUserMiningStats, useProtocolStats, useClaimAction } from '../hooks/useMining'
import {
  formatKNTC, formatPoints,
  maculatusTestnet,
} from '../lib/chain'

export default function Profile() {
  const { address, walletType, disconnect } = useWalletContext()
  const [copied,   setCopied]   = useState(false)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)

  const { data: stats,    refetch: rStats  } = useUserMiningStats(address as `0x${string}` | undefined)
  const { data: protocol, refetch: rProto  } = useProtocolStats()
  const claim = useClaimAction(address as `0x${string}` | undefined)

  const pendingClaim = stats?.pendingClaim    ?? 0n
  const totalMined   = stats?.totalEarned     ?? 0n
  const totalClaimed = stats?.totalClaimed    ?? 0n
  const cycleCount   = Number(stats?.cycleCount ?? 0n)
  const tgeActive    = stats?.tgeActive        ?? false

  function handleCopy() {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleClaim() {
    await claim.execute()
    rStats()
    rProto()
  }

  if (!address) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 flex flex-col items-center gap-4 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(168,230,255,0.08)', border: '1px solid rgba(168,230,255,0.12)' }}>
          <Zap className="w-7 h-7 text-[#A8E6FF]" />
        </div>
        <p className="text-muted text-sm text-center">Connect a wallet on the Mine page to view your profile.</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-5 animate-fade-in">

      {/* Wallet card */}
      <div className="card p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(168,230,255,0.08)', border: '1px solid rgba(168,230,255,0.1)' }}>
            <Zap className="w-5 h-5 text-[#A8E6FF]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Wallet Address</div>
            <div className="font-mono text-xs truncate" style={{ color: '#b8dcf0' }}>{address}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: 'rgba(168,230,255,0.06)', border: '1px solid rgba(168,230,255,0.1)', color: copied ? '#60ffb0' : '#4a6a7a' }}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <a
            href={`${maculatusTestnet.blockExplorers.default.url}/address/${address}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: 'rgba(168,230,255,0.06)', border: '1px solid rgba(168,230,255,0.1)', color: '#4a6a7a' }}>
            <ExternalLink className="w-3.5 h-3.5" />
            Explorer
          </a>
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold"
            style={{ background: 'rgba(96,255,176,0.06)', border: '1px solid rgba(96,255,176,0.2)', color: '#60ffb0' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-[#60ffb0]" />
            {walletType === 'embedded' ? 'Embedded Wallet' : 'Maculatus Testnet'}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Mining Cycles',  value: cycleCount.toString(),          color: '#A8E6FF' },
          { label: 'Total Credits',  value: formatPoints(totalMined),       color: '#A8E6FF' },
          { label: 'Unclaimed',      value: formatKNTC(pendingClaim) + ' KNTC', color: '#60ffb0' },
          { label: 'Claimed',        value: formatKNTC(totalClaimed) + ' KNTC', color: '#ffd060' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 flex flex-col items-center gap-1">
            <span className="font-black text-2xl" style={{ color }}>{value}</span>
            <span className="text-muted text-[10px] font-semibold">{label}</span>
          </div>
        ))}
      </div>

      {/* Claim card */}
      <div className="card p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-white text-sm">Claim KNTC</h3>
            <p className="text-muted text-xs mt-1">
              {tgeActive ? 'TGE is active — claim your tokens now.' : 'Claim unlocks automatically at TGE.'}
            </p>
          </div>
          <Gift className="w-5 h-5 shrink-0" style={{ color: tgeActive ? '#60ffb0' : '#4a6a7a' }} />
        </div>

        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(0,16,32,0.5)', border: '1px solid rgba(168,230,255,0.06)' }}>
          <span className="text-muted text-xs">Unclaimed Credits</span>
          <span className="font-mono font-bold text-sm" style={{ color: '#60ffb0' }}>
            {formatKNTC(pendingClaim)} KNTC
          </span>
        </div>

        {claim.status === 'success' && (
          <div className="px-3 py-2 rounded-xl text-xs text-[#60ffb0] text-center"
            style={{ background: 'rgba(96,255,176,0.06)', border: '1px solid rgba(96,255,176,0.2)' }}>
            KNTC tokens sent to your wallet.
          </div>
        )}
        {claim.status === 'error' && claim.error && (
          <div className="px-3 py-2 rounded-xl text-xs text-[#ff9090]"
            style={{ background: 'rgba(255,80,80,0.06)', border: '1px solid rgba(255,80,80,0.2)' }}>
            {claim.error}
          </div>
        )}

        <button
          onClick={handleClaim}
          disabled={!tgeActive || pendingClaim === 0n || claim.status === 'confirming' || claim.status === 'claiming'}
          className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all"
          style={{
            background:   tgeActive && pendingClaim > 0n ? 'linear-gradient(135deg,#5ac8f0,#A8E6FF)' : 'rgba(168,230,255,0.06)',
            color:        tgeActive && pendingClaim > 0n ? '#001020' : '#4a6a7a',
            border:       tgeActive && pendingClaim > 0n ? 'none' : '1px solid rgba(168,230,255,0.1)',
            cursor:       tgeActive && pendingClaim > 0n ? 'pointer' : 'not-allowed',
          }}>
          {claim.status === 'confirming' || claim.status === 'claiming' ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Claiming...
            </>
          ) : !tgeActive ? (
            <><Lock className="w-4 h-4" />Locked until TGE</>
          ) : (
            <><Gift className="w-4 h-4" />Claim to Wallet</>
          )}
        </button>
      </div>

      {/* Protocol stats */}
      {protocol && (
        <div className="card p-5 flex flex-col gap-3">
          <h3 className="font-bold text-white text-sm">Protocol Stats</h3>
          {[
            { label: 'Total Cycles',   value: protocol.totalCycles.toString(),                             color: '#A8E6FF' },
            { label: 'Unique Miners',  value: protocol.uniqueMiners.toString(),                            color: '#A8E6FF' },
            { label: 'Pool Remaining', value: `${formatKNTC(protocol.pointsRemaining)} KNTC`,             color: '#60ffb0' },
            { label: 'TGE Status',     value: protocol.tgeActive ? 'Active' : 'Pre-Launch',               color: protocol.tgeActive ? '#60ffb0' : '#ffd060' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-muted text-xs">{label}</span>
              <span className="font-mono font-bold text-xs" style={{ color }}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Disconnect */}
      {!showDisconnectConfirm ? (
        <button onClick={() => setShowDisconnectConfirm(true)}
          className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all"
          style={{ background: 'rgba(255,80,80,0.06)', border: '1px solid rgba(255,80,80,0.2)', color: '#ff9090' }}>
          <LogOut className="w-4 h-4" />
          Disconnect Wallet
        </button>
      ) : (
        <div className="card p-4 flex flex-col gap-3">
          <p className="text-sm text-white font-semibold">Disconnect wallet?</p>
          <p className="text-xs text-muted">
            {walletType === 'embedded'
              ? 'This will remove your private key from this browser. Make sure you have a backup.'
              : 'You can reconnect anytime.'}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setShowDisconnectConfirm(false)} className="btn-secondary flex-1 justify-center text-sm py-2">
              Cancel
            </button>
            <button onClick={disconnect}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-sm"
              style={{ background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff9090' }}>
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
