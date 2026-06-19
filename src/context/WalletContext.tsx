import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect, useWriteContract, useSwitchChain } from 'wagmi'
import { privateKeyToAccount } from 'viem/accounts'
import { createWalletClient, http } from 'viem'
import { maculatusTestnet } from '../lib/chain'
import { injectedConnector, wcConnector } from '../lib/wagmi'

const STORE_KEY = 'kineticdao_pk'
const RPC_URL   = 'https://maculatus-rpc.x1eco.com'

export type WalletType = 'metamask' | 'embedded' | null

export interface WalletCtx {
  address:              `0x${string}` | null
  walletType:           WalletType
  privateKey:           string | null
  isConnecting:         boolean
  isOnCorrectChain:     boolean
  error:                string | null
  connectMetaMask:      () => void
  connectWalletConnect: () => void
  generateWallet:       () => void
  importWallet:         (pk: string) => Promise<void>
  disconnect:           () => void
  writeContract:        (args: WriteContractArgs) => Promise<`0x${string}`>
}

interface WriteContractArgs {
  address:      `0x${string}`
  abi:          readonly unknown[]
  functionName: string
  args?:        readonly unknown[]
}

const WalletContext = createContext<WalletCtx>({
  address: null, walletType: null, privateKey: null,
  isConnecting: false, isOnCorrectChain: false, error: null,
  connectMetaMask:      () => {},
  connectWalletConnect: () => {},
  generateWallet:       () => {},
  importWallet:         async () => {},
  disconnect:           () => {},
  writeContract:        async () => { throw new Error('No wallet') },
})

function generateRandomPrivateKey(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  // ── wagmi (external / injected wallets) ──────────────────────────────────────
  const { address: wagmiAddress, chainId, isConnected } = useAccount()
  const { connect, isPending: isWagmiConnecting } = useConnect()
  const { disconnect: wagmiDisconnect }                 = useDisconnect()
  const { writeContractAsync }                          = useWriteContract()
  const { switchChain }                                 = useSwitchChain()

  // ── Embedded wallet (local private key) ──────────────────────────────────────
  const [embeddedAddress, setEmbeddedAddress] = useState<`0x${string}` | null>(null)
  const [privateKey,      setPrivateKey]      = useState<string | null>(null)
  const [error,           setError]           = useState<string | null>(null)

  // Restore embedded wallet on mount (only if no wagmi wallet connected)
  useEffect(() => {
    if (isConnected) return
    const pk = localStorage.getItem(STORE_KEY)
    if (pk) {
      try {
        const account = privateKeyToAccount(pk as `0x${string}`)
        setPrivateKey(pk)
        setEmbeddedAddress(account.address)
      } catch { localStorage.removeItem(STORE_KEY) }
    }
  }, [isConnected])

  // Auto-switch to Maculatus Testnet after wagmi connects
  useEffect(() => {
    if (wagmiAddress && chainId !== maculatusTestnet.id) {
      switchChain({ chainId: maculatusTestnet.id })
    }
  }, [wagmiAddress, chainId, switchChain])

  // Derived state
  const address:          `0x${string}` | null = wagmiAddress ?? embeddedAddress
  const walletType:       WalletType           = wagmiAddress ? 'metamask' : embeddedAddress ? 'embedded' : null
  const isOnCorrectChain: boolean              = wagmiAddress ? chainId === maculatusTestnet.id : !!embeddedAddress
  const isConnecting:     boolean              = isWagmiConnecting

  const connectMetaMask = useCallback(() => {
    setError(null)
    connect({ connector: injectedConnector })
  }, [connect])

  const connectWalletConnect = useCallback(() => {
    setError(null)
    connect({ connector: wcConnector })
  }, [connect])

  const generateWallet = useCallback(() => {
    const pk      = generateRandomPrivateKey()
    const account = privateKeyToAccount(pk as `0x${string}`)
    localStorage.setItem(STORE_KEY, pk)
    setPrivateKey(pk)
    setEmbeddedAddress(account.address)
    setError(null)
  }, [])

  const importWallet = useCallback(async (pk: string) => {
    const clean = (pk.trim().startsWith('0x') ? pk.trim() : `0x${pk.trim()}`) as `0x${string}`
    const account = privateKeyToAccount(clean)
    localStorage.setItem(STORE_KEY, clean)
    setPrivateKey(clean)
    setEmbeddedAddress(account.address)
    setError(null)
  }, [])

  const disconnect = useCallback(() => {
    if (wagmiAddress) {
      wagmiDisconnect()
    }
    localStorage.removeItem(STORE_KEY)
    setEmbeddedAddress(null)
    setPrivateKey(null)
    setError(null)
  }, [wagmiAddress, wagmiDisconnect])

  const writeContract = useCallback(async (args: WriteContractArgs): Promise<`0x${string}`> => {
    if (walletType === 'metamask') {
      return writeContractAsync({
        address:      args.address,
        abi:          args.abi as any,
        functionName: args.functionName,
        args:         args.args as any,
      })
    }
    if (walletType === 'embedded' && privateKey) {
      const account = privateKeyToAccount(privateKey as `0x${string}`)
      const wc = createWalletClient({ account, chain: maculatusTestnet, transport: http(RPC_URL) })
      return wc.writeContract({ ...args, abi: args.abi as any, account })
    }
    throw new Error('No wallet connected')
  }, [walletType, privateKey, writeContractAsync])

  return (
    <WalletContext.Provider value={{
      address, walletType, privateKey,
      isConnecting, isOnCorrectChain, error,
      connectMetaMask, connectWalletConnect, generateWallet, importWallet, disconnect, writeContract,
    }}>
      {children}
    </WalletContext.Provider>
  )
}

export const useWalletContext = () => useContext(WalletContext)
