import { Wallet, LogOut, Loader2, AlertTriangle } from 'lucide-react'
import { useWallet } from '../hooks/useWallet'
import { formatAddress } from '../lib/chain'

export default function WalletButton() {
  const { address, isConnecting, isOnCorrectChain, connect, disconnect } = useWallet()

  if (address && !isOnCorrectChain) {
    return (
      <button onClick={connect}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold
          bg-[rgba(255,200,80,0.1)] border border-[rgba(255,200,80,0.25)] text-[#ffd060]
          hover:bg-[rgba(255,200,80,0.18)] transition-colors">
        <AlertTriangle className="w-3.5 h-3.5" />
        Wrong Network
      </button>
    )
  }

  if (address) {
    return (
      <div className="flex items-center gap-2">
        <div className="address-pill flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#60ffb0] animate-pulse-glacier" />
          {formatAddress(address)}
        </div>
        <button onClick={disconnect}
          className="p-1.5 rounded-lg text-[rgba(168,230,255,0.3)] hover:text-[#ff9090]
            hover:bg-[rgba(255,80,80,0.1)] transition-colors">
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <button onClick={connect} disabled={isConnecting} className="btn-primary text-[13px] py-2 px-4">
      {isConnecting
        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Connecting...</>
        : <><Wallet className="w-3.5 h-3.5" />Connect Wallet</>
      }
    </button>
  )
}
