import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { privateKeyToAccount } from 'viem/accounts'
import { createWalletClient, http } from 'viem'
import { maculatusTestnet } from '../lib/chain'
import { connectWallet, switchToMaculatus, getWalletClient } from '../lib/wallet'

const STORE_KEY = 'kineticdao_pk'
const RPC_URL   = 'https://maculatus-rpc.x1eco.com'

export type WalletType = 'metamask' | 'embedded' | null

export interface WalletCtx {
  address:          `0x${string}` | null
  walletType:       WalletType
  privateKey:       string | null
  isConnecting:     boolean
  isOnCorrectChain: boolean
  error:            string | null
  connectMetaMask:  () => Promise<void>
  generateWallet:   () => void
  importWallet:     (pk: string) => Promise<void>
  disconnect:       () => void
  writeContract:    (args: WriteContractArgs) => Promise<`0x${string}`>
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
  connectMetaMask: async () => {},
  generateWallet: () => {},
  importWallet: async () => {},
  disconnect: () => {},
  writeContract: async () => { throw new Error('No wallet') },
})

function generateRandomPrivateKey(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address,          setAddress]          = useState<`0x${string}` | null>(null)
  const [walletType,       setWalletType]       = useState<WalletType>(null)
  const [privateKey,       setPrivateKey]       = useState<string | null>(null)
  const [isConnecting,     setIsConnecting]     = useState(false)
  const [isOnCorrectChain, setIsOnCorrectChain] = useState(false)
  const [error,            setError]            = useState<string | null>(null)

  // On mount: restore embedded wallet OR check MetaMask
  useEffect(() => {
    const pk = localStorage.getItem(STORE_KEY)
    if (pk) {
      try {
        const account = privateKeyToAccount(pk as `0x${string}`)
        setPrivateKey(pk)
        setAddress(account.address)
        setWalletType('embedded')
        setIsOnCorrectChain(true)
        return
      } catch { localStorage.removeItem(STORE_KEY) }
    }

    // Check if MetaMask is already connected
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accs: unknown) => {
          const a = accs as `0x${string}`[]
          if (a.length > 0) {
            setAddress(a[0])
            setWalletType('metamask')
            window.ethereum!.request({ method: 'eth_chainId' }).then((hex: unknown) => {
              const chainId = parseInt(hex as string, 16)
              setIsOnCorrectChain(chainId === maculatusTestnet.id)
            })
          }
        }).catch(() => {})
    }
  }, [])

  // MetaMask event listeners
  useEffect(() => {
    if (!window.ethereum || walletType !== 'metamask') return
    const onAccounts = (accs: unknown) => {
      const a = accs as `0x${string}`[]
      setAddress(a[0] ?? null)
      if (!a[0]) { setWalletType(null); setIsOnCorrectChain(false) }
    }
    const onChain = (hex: unknown) => {
      setIsOnCorrectChain(parseInt(hex as string, 16) === maculatusTestnet.id)
    }
    window.ethereum.on('accountsChanged', onAccounts)
    window.ethereum.on('chainChanged',    onChain)
    return () => {
      window.ethereum?.removeListener('accountsChanged', onAccounts)
      window.ethereum?.removeListener('chainChanged',    onChain)
    }
  }, [walletType])

  const connectMetaMask = useCallback(async () => {
    setIsConnecting(true); setError(null)
    try {
      const accounts = await connectWallet()
      await switchToMaculatus()
      const chainHex = await window.ethereum!.request({ method: 'eth_chainId' }) as string
      setAddress(accounts[0])
      setWalletType('metamask')
      setIsOnCorrectChain(parseInt(chainHex, 16) === maculatusTestnet.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect')
    } finally { setIsConnecting(false) }
  }, [])

  const generateWallet = useCallback(() => {
    const pk      = generateRandomPrivateKey()
    const account = privateKeyToAccount(pk as `0x${string}`)
    localStorage.setItem(STORE_KEY, pk)
    setPrivateKey(pk)
    setAddress(account.address)
    setWalletType('embedded')
    setIsOnCorrectChain(true)
    setError(null)
  }, [])

  const importWallet = useCallback(async (pk: string) => {
    const clean = (pk.trim().startsWith('0x') ? pk.trim() : `0x${pk.trim()}`) as `0x${string}`
    const account = privateKeyToAccount(clean)
    localStorage.setItem(STORE_KEY, clean)
    setPrivateKey(clean)
    setAddress(account.address)
    setWalletType('embedded')
    setIsOnCorrectChain(true)
    setError(null)
  }, [])

  const disconnect = useCallback(() => {
    localStorage.removeItem(STORE_KEY)
    setAddress(null); setWalletType(null); setPrivateKey(null)
    setIsOnCorrectChain(false); setError(null)
  }, [])

  const writeContract = useCallback(async (args: WriteContractArgs): Promise<`0x${string}`> => {
    if (walletType === 'embedded' && privateKey) {
      const account = privateKeyToAccount(privateKey as `0x${string}`)
      const wc = createWalletClient({ account, chain: maculatusTestnet, transport: http(RPC_URL) })
      return wc.writeContract({ ...args, abi: args.abi as any, account })
    }
    if (walletType === 'metamask') {
      const wc = getWalletClient()
      if (!wc) throw new Error('No wallet client')
      const [account] = await wc.getAddresses()
      return wc.writeContract({ ...args, abi: args.abi as any, account, chain: null })
    }
    throw new Error('No wallet connected')
  }, [walletType, privateKey])

  return (
    <WalletContext.Provider value={{
      address, walletType, privateKey,
      isConnecting, isOnCorrectChain, error,
      connectMetaMask, generateWallet, importWallet, disconnect, writeContract,
    }}>
      {children}
    </WalletContext.Provider>
  )
}

export const useWalletContext = () => useContext(WalletContext)
