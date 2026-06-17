/// <reference types="vite/client" />
import { createPublicClient, http, defineChain, parseAbiItem } from 'viem'

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

// ─── KineticMining ABI — Blueprint Phase 1 ───────────────────────────────────
export const KINETIC_MINING_ABI = [
  // ── Protocol stats ──────────────────────────────────────────────────────────
  {
    type: 'function', name: 'getProtocolStats',
    inputs: [],
    outputs: [
      { name: '_totalCycles',        type: 'uint256' },
      { name: '_uniqueMiners',       type: 'uint256' },
      { name: '_totalPointsMinted',  type: 'uint256' },
      { name: '_totalTokensClaimed', type: 'uint256' },
      { name: '_pointsRemaining',    type: 'uint256' },
      { name: '_tgeActive',          type: 'bool'    },
    ],
    stateMutability: 'view',
  },
  // ── Rank ─────────────────────────────────────────────────────────────────────
  {
    type: 'function', name: 'getCurrentRank',
    inputs: [],
    outputs: [
      { name: 'rank',         type: 'uint8'   },
      { name: 'quotaFillPct', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  // ── User dashboard ───────────────────────────────────────────────────────────
  {
    type: 'function', name: 'getUserDashboard',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [
      { name: 'pendingClaim',    type: 'uint256' },
      { name: 'totalMined',      type: 'uint256' },
      { name: 'totalClaimed',    type: 'uint256' },
      { name: 'cycleCount',      type: 'uint256' },
      { name: 'lastMineAt',      type: 'uint256' },
      { name: 'cooldown',        type: 'uint256' },
      { name: 'canMine',         type: 'bool'    },
      { name: 'tgeActive',       type: 'bool'    },
      { name: 'ratePerHour',     type: 'uint256' },
      { name: 'sessionTimeLeft', type: 'uint256' },
      { name: 'estimatedKNTC',   type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  // ── Helper views ─────────────────────────────────────────────────────────────
  {
    type: 'function', name: 'pendingPoints',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
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
  { type: 'function', name: 'totalMiningCycles',  inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'uniqueMiners',        inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'totalPointsMinted',   inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'totalTokensClaimed',  inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'RANK_1_LIMIT',        inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'RANK_2_LIMIT',        inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'RANK_3_LIMIT',        inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'POINTS_PER_KNTC',     inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  // ── Write — mining ──────────────────────────────────────────────────────────
  {
    type: 'function', name: 'mine',
    inputs: [],
    outputs: [
      { name: 'ratePerHour', type: 'uint256' },
      { name: 'tier',        type: 'uint8'   },
    ],
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
      { name: 'user',             type: 'address', indexed: true  },
      { name: 'cycleId',          type: 'uint256', indexed: true  },
      { name: 'ratePerHour',      type: 'uint256', indexed: false },
      { name: 'tier',             type: 'uint8',   indexed: false },
      { name: 'timestamp',        type: 'uint256', indexed: false },
      { name: 'totalPointsMinted',type: 'uint256', indexed: false },
    ],
  },
  // Kept for backward-compat with off-chain listeners
  {
    type: 'event', name: 'MiningCycleCompleted',
    inputs: [
      { name: 'user',          type: 'address', indexed: true  },
      { name: 'cycleId',       type: 'uint256', indexed: true  },
      { name: 'reward',        type: 'uint256', indexed: false },
      { name: 'tier',          type: 'uint8',   indexed: false },
      { name: 'timestamp',     type: 'uint256', indexed: false },
      { name: 'poolRemaining', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event', name: 'TokensClaimed',
    inputs: [
      { name: 'user',            type: 'address', indexed: true  },
      { name: 'kntcAmount',      type: 'uint256', indexed: false },
      { name: 'pointsConverted', type: 'uint256', indexed: false },
      { name: 'timestamp',       type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event', name: 'InactivityBurn',
    inputs: [
      { name: 'user',         type: 'address', indexed: true  },
      { name: 'burnedPoints', type: 'uint256', indexed: false },
      { name: 'timestamp',    type: 'uint256', indexed: false },
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

// ─── Parsed event signatures ─────────────────────────────────────────────────
export const MINING_SESSION_EVENT = parseAbiItem(
  'event MiningSessionStarted(address indexed user, uint256 indexed cycleId, uint256 ratePerHour, uint8 tier, uint256 timestamp, uint256 totalPointsMinted)'
)

export const MINING_COMPLETED_EVENT = parseAbiItem(
  'event MiningCycleCompleted(address indexed user, uint256 indexed cycleId, uint256 reward, uint8 tier, uint256 timestamp, uint256 poolRemaining)'
)

export const AD_WATCHED_EVENT = parseAbiItem(
  'event AdWatched(address indexed user, uint256 reward, uint256 timestamp)'
)

// ─── Protocol constants ───────────────────────────────────────────────────────
export const TOTAL_SUPPLY     = 1_000_000_000n * 10n ** 18n
export const MINING_POOL_KNTC =   700_000_000n * 10n ** 18n
export const ECOSYSTEM_POOL   =   175_000_000n * 10n ** 18n
export const INVESTOR_POOL    =   100_000_000n * 10n ** 18n
export const TEAM_POOL        =    25_000_000n * 10n ** 18n

// Rank limits (integer points, no 18-decimal)
export const RANK_1_LIMIT_PTS = 500_000_000_000n
export const RANK_2_LIMIT_PTS = 750_000_000_000n
export const RANK_3_LIMIT_PTS = 875_000_000_000n

export const POINTS_PER_KNTC = 1_250n
export const MINING_CYCLE_S  = 24 * 3600  // 24 hours in seconds

// ─── Tier display — shows base rates (Rank 1, before halving) ────────────────
export type RewardTier = 0 | 1 | 2

export const TIER_LABEL: Record<RewardTier, string> = {
  0: 'Apes',
  1: 'Basic',
  2: 'Hoki',
}

export const TIER_RATE: Record<RewardTier, string> = {
  0: '10,000 pts/h',
  1: '50,000 pts/h',
  2: '200,000 pts/h',
}

export const TIER_RANGE: Record<RewardTier, string> = {
  0: '10K pts/h base',
  1: '50K pts/h base',
  2: '200K pts/h base',
}

export const TIER_CHANCE: Record<RewardTier, string> = {
  0: '20%',
  1: '70%',
  2: '10%',
}

export const TIER_COLOR: Record<RewardTier, string> = {
  0: '#ff9090',
  1: '#A8E6FF',
  2: '#60ffb0',
}

export const RANK_COLOR: Record<1 | 2 | 3, string> = {
  1: '#60ffb0',
  2: '#ffd060',
  3: '#ff9090',
}

export const RANK_NAME: Record<1 | 2 | 3, string> = {
  1: 'Rank 1 — Full Rate',
  2: 'Rank 2 — Halving ×0.5',
  3: 'Rank 3 — Halving ×0.25',
}

// ─── Utilities ────────────────────────────────────────────────────────────────
export function formatAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

/// Format KNTC wei (18-decimal bigint) — used for claimed KNTC amounts
export function formatKNTC(wei: bigint, decimals = 3): string {
  const x = Number(wei) / 1e18
  if (x === 0) return '0'
  if (x < 0.001) return '< 0.001'
  if (x >= 1_000_000) return `${(x / 1_000_000).toFixed(2)}M`
  if (x >= 1_000)     return `${(x / 1_000).toFixed(2)}K`
  return x.toFixed(decimals)
}

/// Format integer points (no decimals) — used for accumulated credits
export function formatPoints(pts: bigint | number): string {
  const n = typeof pts === 'bigint' ? Number(pts) : pts
  if (n === 0) return '0'
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)         return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(0)
}

/// Format a pts/h rate for display, e.g. "50,000 pts/h"
export function formatRate(ratePerHour: bigint | number): string {
  const n = typeof ratePerHour === 'bigint' ? Number(ratePerHour) : ratePerHour
  if (n === 0) return '—'
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K pts/h`
  return `${n} pts/h`
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
