import { useWalletContext } from '../context/WalletContext'

export function useWallet() {
  const { address, isConnecting, isOnCorrectChain, error, connectMetaMask, disconnect } = useWalletContext()
  return {
    address,
    isConnecting,
    isOnCorrectChain,
    error,
    connect: connectMetaMask,
    disconnect,
  }
}
