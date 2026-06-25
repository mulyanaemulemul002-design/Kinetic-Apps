/// <reference types="vite/client" />
import { createPublicClient, http, defineChain } from 'viem'

// ─── Chain ────────────────────────────────────────────────────────────────────
export const maculatusTestnet = defineChain({
  id: 10778,
  name: 'Maculatus Testnet',
  nativeCurrency: { decimals: 18, name: 'KNTC', symbol: 'KNTC' },
  rpcUrls: {
    default: { http: ['https://maculatus-rpc.x1eco.com'] },
  },
  blockExplorers: {
    default: { name: 'Maculatus Scan', url: 'https://maculatus-scan.x1eco.com' },
  },
  testnet: true,
})

export const publicClient = createPublicClient({
  chain: maculatusTestnet,
  transport: http('https://maculatus-rpc.x1eco.com'),
})

// ─── Contract Addresses ───────────────────────────────────────────────────────
const ZERO = '0x0000000000000000000000000000000000000000' as `0x${string}`

export const MINING_ADDRESS = (
  import.meta.env.VITE_MINING_ADDRESS || ZERO
) as `0x${string}`

export const TOKEN_ADDRESS = (
  import.meta.env.VITE_TOKEN_ADDRESS || ZERO
) as `0x${string}`

export const CONTRACT_ADDRESS = MINING_ADDRESS

// ─── KineticMining v2 ABI — 1 session = 1 KNTC ───────────────────────────────
export const KINETIC_MINING_ABI = [
  // ── Protocol stats ──────────────────────────────────────────────────────────
  {
    type: 'function', name: 'getProtocolStats',
    inputs: [],
    outputs: [
      { name: '_totalSessions',      type: 'uint256' },
      { name: '_uniqueMiners',       type: 'uint256' },
      { name: '_totalPointsMinted',  type: 'uint256' },
      { name: '_totalTokensClaimed', type: 'uint256' },
      { name: '_poolRemaining',      type: 'uint256' },
      { name: '_tgeActive',          type: 'bool'    },
    ],
    stateMutability: 'view',
  },
  // ── User dashboard ───────────────────────────────────────────────────────────
  {
    type: 'function', name: 'getUserDashboard',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [
      { name: 'pendingKNTC',    type: 'uint256' },
      { name: 'sessionCount',   type: 'uint256' },
      { name: 'totalClaimed',   type: 'uint256' },
      { name: 'lastMineAt',     type: 'uint256' },
      { name: 'sessionActive',  type: 'bool'    },
      { name: 'sessionTimeLeft',type: 'uint256' },
      { name: 'canMine_',       type: 'bool'    },
      { name: 'tgeActive_',     type: 'bool'    },
    ],
    stateMutability: 'view',
  },
  // ── Helper views ─────────────────────────────────────────────────────────────
  {
    type: 'function', name: 'canMine',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'cooldownRemaining',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'isTGEActive',
    inputs: [],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
  },
  // ── State reads ─────────────────────────────────────────────────────────────
  { type: 'function', name: 'totalSessions',      inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'uniqueMiners',        inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'totalPointsMinted',   inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'totalTokensClaimed',  inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'KNTC_PER_SESSION',    inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'TOTAL_MINING_POOL',   inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  // ── Write — mine ────────────────────────────────────────────────────────────
  {
    type: 'function', name: 'mine',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  // ── Write — claim (post-TGE) ─────────────────────────────────────────────────
  {
    type: 'function', name: 'claimTokens',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  // ── Admin ────────────────────────────────────────────────────────────────────
  {
    type: 'function', name: 'setTGEActive',
    inputs: [{ name: '_status', type: 'bool' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  // ── Events ───────────────────────────────────────────────────────────────────
  {
    type: 'event', name: 'MiningSessionStarted',
    inputs: [
      { name: 'user',       type: 'address', indexed: true  },
      { name: 'sessionId',  type: 'uint256', indexed: true  },
      { name: 'kntcEarned', type: 'uint256', indexed: false },
      { name: 'timestamp',  type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event', name: 'TokensClaimed',
    inputs: [
      { name: 'user',       type: 'address', indexed: true  },
      { name: 'kntcAmount', type: 'uint256', indexed: false },
      { name: 'timestamp',  type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event', name: 'TGEStatusChanged',
    inputs: [
      { name: 'active',    type: 'bool',    indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
] as const

export const KINETIC_ABI = KINETIC_MINING_ABI

// ─── KineticToken ABI (minimal ERC-20) ───────────────────────────────────────
export const KINETIC_TOKEN_ABI = [
  {
    type: 'function', name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'transfer',
    inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'totalSupply',
    inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'name',
    inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'symbol',
    inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view',
  },
] as const

// ─── Protocol constants ───────────────────────────────────────────────────────
export const TOTAL_SUPPLY     = 10_000_000_000n * 10n ** 18n  // 10 Billion KNTC
export const TOTAL_MINING_POOL = TOTAL_SUPPLY                  // entire supply in mining contract
export const KNTC_PER_SESSION = 1n * 10n ** 18n               // 1 KNTC per session
export const MINING_CYCLE_S   = 24 * 3600                     // 24 hours in seconds

// ─── Utilities ────────────────────────────────────────────────────────────────
export function formatAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

/// Format KNTC wei (18-decimal bigint)
export function formatKNTC(wei: bigint, decimals = 3): string {
  const x = Number(wei) / 1e18
  if (x === 0) return '0'
  if (x < 0.001) return '< 0.001'
  if (x >= 1_000_000_000) return `${(x / 1_000_000_000).toFixed(2)}B`
  if (x >= 1_000_000)     return `${(x / 1_000_000).toFixed(2)}M`
  if (x >= 1_000)         return `${(x / 1_000).toFixed(2)}K`
  return x.toFixed(decimals)
}

/// Format integer points (kept for backward compat with UI that displays session counts)
export function formatPoints(pts: bigint | number): string {
  const n = typeof pts === 'bigint' ? Number(pts) : pts
  if (n === 0) return '0'
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)         return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(0)
}

export function formatDuration(seconds: number): { h: string; m: string; s: string } {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return {
    h: h.toString().padStart(2, '0'),
    m: m.toString().padStart(2, '0'),
    s: s.toString().padStart(2, '0'),
  }
}

export function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
