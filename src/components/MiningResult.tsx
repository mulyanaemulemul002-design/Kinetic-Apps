import { CheckCircle, ExternalLink, Zap } from 'lucide-react'
import { maculatusTestnet } from '../lib/chain'

interface MiningResultProps {
  txHash:  `0x${string}` | null
  onReset: () => void
}

export default function MiningResult({ txHash, onReset }: MiningResultProps) {
  const explorerUrl = txHash ? `${maculatusTestnet.blockExplorers.default.url}/tx/${txHash}` : null

  return (
    <div className="rounded-2xl p-8 text-center animate-slide-up"
      style={{ background: 'rgba(96,255,176,0.06)', border: '1px solid rgba(96,255,176,0.2)' }}>

      <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
        style={{ background: 'rgba(96,255,176,0.12)', border: '1px solid rgba(96,255,176,0.3)' }}>
        <Zap className="w-8 h-8" style={{ color: '#60ffb0' }} />
      </div>

      <div className="text-muted text-xs uppercase tracking-widest mb-2 font-semibold">
        Mining Session Started
      </div>

      <div className="animate-count-up">
        <div className="text-5xl font-black tabular-nums mb-1" style={{ color: '#60ffb0' }}>
          0.045 KNTC/h
        </div>
        <div className="font-bold text-lg mb-1 text-white">Rate Active</div>
        <div className="text-muted text-xs mb-1">
          1.08 KNTC over 24h — accrues linearly on-chain
        </div>
      </div>

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
