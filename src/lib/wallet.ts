import { createWalletClient, custom, type WalletClient } from 'viem'
import { maculatusTestnet } from './chain'

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      on: (event: string, handler: (...args: unknown[]) => void) => void
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void
      isMetaMask?: boolean
    }
  }
}

export async function connectWallet(): Promise<`0x${string}`[]> {
  if (!window.ethereum) throw new Error('No Web3 wallet detected. Install MetaMask or a compatible wallet.')
  return window.ethereum.request({ method: 'eth_requestAccounts' }) as Promise<`0x${string}`[]>
}

export async function switchToMaculatus(): Promise<void> {
  if (!window.ethereum) return
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${maculatusTestnet.id.toString(16)}` }],
    })
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${maculatusTestnet.id.toString(16)}`,
          chainName: maculatusTestnet.name,
          nativeCurrency: maculatusTestnet.nativeCurrency,
          rpcUrls: [maculatusTestnet.rpcUrls.default.http[0]],
          blockExplorerUrls: [maculatusTestnet.blockExplorers.default.url],
        }],
      })
    } else throw err
  }
}

export function getWalletClient(): WalletClient | null {
  if (!window.ethereum) return null
  return createWalletClient({ chain: maculatusTestnet, transport: custom(window.ethereum) })
}
