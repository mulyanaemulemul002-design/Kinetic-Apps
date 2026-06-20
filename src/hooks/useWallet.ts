import { useWalletContext } from '../context/WalletContext'

export function useWallet() {
  const ctx = useWalletContext()
  return {
    address:          ctx.address,
    isConnecting:     ctx.isConnecting,
    isOnCorrectChain: ctx.isOnCorrectChain,
    error:            ctx.error,
    connect:          ctx.connectWalletConnect,
    disconnect:       ctx.disconnect,
  }
}
