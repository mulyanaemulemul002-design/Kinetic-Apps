import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { publicClient, MINING_ADDRESS, KINETIC_MINING_ABI, MINING_CYCLE_S } from '../lib/chain'
import { getWalletClient } from '../lib/wallet'

// ─── Protocol stats ───────────────────────────────────────────────────────────

export function useProtocolStats() {
  return useQuery({
    queryKey: ['protocolStats'],
    queryFn: async () => {
      try {
        const result = await publicClient.readContract({
          address:      MINING_ADDRESS,
          abi:          KINETIC_MINING_ABI,
          functionName: 'getProtocolStats',
        }) as [bigint, bigint, bigint, bigint, bigint, boolean]

        return {
          totalCycles:        result[0],   // totalSessions
          uniqueMiners:       result[1],
          totalPointsMinted:  result[2],   // KNTC wei credited so far
          totalTokensClaimed: result[3],   // KNTC wei claimed
          pointsRemaining:    result[4],   // pool remaining in KNTC wei
          tgeActive:          result[5],
          // legacy aliases
          totalVirtualMined:  result[2],
          totalMined:         result[2],
          poolRemaining:      result[4],
        }
      } catch {
        return null
      }
    },
    refetchInterval: 30_000,
    staleTime:       15_000,
  })
}

// ─── User dashboard ───────────────────────────────────────────────────────────

export interface UserDashboard {
  // v2 fields
  pendingKNTC:     bigint   // KNTC wei earned but not yet claimed
  sessionCount:    bigint   // total sessions this wallet has completed
  totalClaimed:    bigint   // KNTC wei claimed lifetime
  lastMineAt:      bigint   // timestamp of last mine()
  sessionActive:   boolean  // true if 24h window is still running
  sessionTimeLeft: bigint   // seconds until cooldown expires (= session window)
  canMine:         boolean
  tgeActive:       boolean
  // legacy aliases (so Mine.tsx/Dashboard.tsx don't need changes)
  pendingClaim:    bigint   // = pendingKNTC
  cycleCount:      bigint   // = sessionCount
  estimatedKNTC:   bigint   // = pendingKNTC (1 session = 1 KNTC exactly)
  totalEarned:     bigint   // = pendingKNTC + totalClaimed
  cooldown:        bigint   // = seconds until canMine becomes true
  ratePerHour:     bigint   // stub — 1 KNTC per session, not per hour
}

export function useUserMiningStats(address?: `0x${string}`) {
  return useQuery({
    queryKey: ['userDashboard', address],
    queryFn: async (): Promise<UserDashboard | null> => {
      if (!address) return null
      try {
        const result = await publicClient.readContract({
          address:      MINING_ADDRESS,
          abi:          KINETIC_MINING_ABI,
          functionName: 'getUserDashboard',
          args:         [address],
        }) as [bigint, bigint, bigint, bigint, boolean, bigint, boolean, boolean]

        const pendingKNTC    = result[0]
        const sessionCount   = result[1]
        const totalClaimed   = result[2]
        const lastMineAt     = result[3]
        const sessionActive  = result[4]
        const sessionTimeLeft = result[5]
        const canMine_       = result[6]
        const tgeActive_     = result[7]

        return {
          pendingKNTC,
          sessionCount,
          totalClaimed,
          lastMineAt,
          sessionActive,
          sessionTimeLeft,
          canMine:       canMine_,
          tgeActive:     tgeActive_,
          // legacy aliases
          pendingClaim:  pendingKNTC,
          cycleCount:    sessionCount,
          estimatedKNTC: pendingKNTC,
          totalEarned:   pendingKNTC + totalClaimed,
          cooldown:      sessionActive ? sessionTimeLeft : 0n,
          ratePerHour:   1n,
        }
      } catch {
        return {
          pendingKNTC:     0n,
          sessionCount:    0n,
          totalClaimed:    0n,
          lastMineAt:      0n,
          sessionActive:   false,
          sessionTimeLeft: 0n,
          canMine:         true,
          tgeActive:       false,
          pendingClaim:    0n,
          cycleCount:      0n,
          estimatedKNTC:   0n,
          totalEarned:     0n,
          cooldown:        0n,
          ratePerHour:     0n,
        }
      }
    },
    enabled:         !!address,
    refetchInterval: 15_000,
    staleTime:       5_000,
  })
}

// ─── Real-time KNTC display ───────────────────────────────────────────────────
// In v2 the full 1 KNTC is credited at the moment mine() succeeds — there is no
// per-second accumulation. This hook simply returns "1.000000" while a session is
// active so the UI has something to display.

export function useRealTimeKNTC(lastMiningTime: number, isActive: boolean): string {
  if (!isActive || lastMiningTime === 0) return '0.000000'
  return '1.000000'
}

// ─── Mining history events ────────────────────────────────────────────────────

export interface MiningEvent {
  user:        `0x${string}`
  sessionId:   bigint
  kntcEarned:  bigint
  timestamp:   number
  txHash:      `0x${string}`
  blockNumber: bigint
  // legacy alias
  cycleId:     bigint
  ratePerHour: bigint
  tier:        number
}

async function fetchMiningEvents(userAddress?: `0x${string}`): Promise<MiningEvent[]> {
  try {
    const latest    = await publicClient.getBlockNumber()
    const fromBlock = latest > 10000n ? latest - 10000n : 0n

    const logs = await publicClient.getLogs({
      address: MINING_ADDRESS,
      event: {
        type: 'event',
        name: 'MiningSessionStarted',
        inputs: [
          { name: 'user',       type: 'address', indexed: true  },
          { name: 'sessionId',  type: 'uint256', indexed: true  },
          { name: 'kntcEarned', type: 'uint256', indexed: false },
          { name: 'timestamp',  type: 'uint256', indexed: false },
        ],
      } as const,
      args:      userAddress ? { user: userAddress } : undefined,
      fromBlock,
      toBlock:   latest,
    })

    return logs.map(l => ({
      user:        l.args.user!,
      sessionId:   l.args.sessionId!,
      kntcEarned:  l.args.kntcEarned!,
      timestamp:   Number(l.args.timestamp!),
      txHash:      l.transactionHash,
      blockNumber: l.blockNumber,
      // legacy aliases
      cycleId:     l.args.sessionId!,
      ratePerHour: l.args.kntcEarned!,
      tier:        1,
    })).reverse()
  } catch {
    return []
  }
}

export function useMiningEvents(userAddress?: `0x${string}`) {
  return useQuery({
    queryKey:        ['miningEvents', userAddress],
    queryFn:         () => fetchMiningEvents(userAddress),
    refetchInterval: 30_000,
    staleTime:       15_000,
  })
}

// ─── Mine action ──────────────────────────────────────────────────────────────

export type MineStatus = 'idle' | 'watching' | 'confirming' | 'mining' | 'success' | 'error'

export function useMineAction(address?: `0x${string}`) {
  const queryClient = useQueryClient()
  const [status,  setStatus]  = useState<MineStatus>('idle')
  const [txHash,  setTxHash]  = useState<`0x${string}` | null>(null)
  const [error,   setError]   = useState<string | null>(null)

  const execute = useCallback(async () => {
    if (!address) { setError('Wallet not connected'); return }
    const wc = getWalletClient()
    if (!wc)    { setError('No wallet client'); return }

    setStatus('confirming')
    setError(null)
    setTxHash(null)

    try {
      const [account] = await wc.getAddresses()

      setStatus('mining')
      const hash = await wc.writeContract({
        address:      MINING_ADDRESS,
        abi:          KINETIC_MINING_ABI,
        functionName: 'mine',
        account,
        chain:        null,
      })
      setTxHash(hash)

      await publicClient.waitForTransactionReceipt({ hash })

      setStatus('success')
      queryClient.invalidateQueries({ queryKey: ['userDashboard', address] })
      queryClient.invalidateQueries({ queryKey: ['miningEvents'] })
      queryClient.invalidateQueries({ queryKey: ['protocolStats'] })
    } catch (err) {
      setStatus('error')
      const msg = err instanceof Error ? err.message : String(err)
      setError(
        msg.includes('cooldown active')  ? 'Cooldown aktif — tunggu 24 jam antar sesi.' :
        msg.includes('User rejected')    ? 'Transaksi dibatalkan.' :
        msg.includes('pool depleted')    ? 'Mining pool habis.' :
        'Transaksi gagal. Coba lagi.'
      )
    }
  }, [address, queryClient])

  const reset = useCallback(() => {
    setStatus('idle')
    setTxHash(null)
    setError(null)
  }, [])

  // Legacy aliases returned for backward compat with Mine.tsx
  return { status, txHash, ratePerHour: null as bigint | null, tier: null as number | null, error, execute, reset }
}

// ─── Claim action (post-TGE) ──────────────────────────────────────────────────

export type ClaimStatus = 'idle' | 'confirming' | 'claiming' | 'success' | 'error'

export function useClaimAction(address?: `0x${string}`) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<ClaimStatus>('idle')
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)
  const [error,  setError]  = useState<string | null>(null)

  const execute = useCallback(async () => {
    if (!address) { setError('Wallet not connected'); return }
    const wc = getWalletClient()
    if (!wc)    { setError('No wallet client'); return }

    setStatus('confirming')
    setError(null)
    setTxHash(null)

    try {
      const [account] = await wc.getAddresses()

      setStatus('claiming')
      const hash = await wc.writeContract({
        address:      MINING_ADDRESS,
        abi:          KINETIC_MINING_ABI,
        functionName: 'claimTokens',
        account,
        chain:        null,
      })
      setTxHash(hash)
      await publicClient.waitForTransactionReceipt({ hash })

      setStatus('success')
      queryClient.invalidateQueries({ queryKey: ['userDashboard', address] })
      queryClient.invalidateQueries({ queryKey: ['protocolStats'] })
    } catch (err) {
      setStatus('error')
      const msg = err instanceof Error ? err.message : String(err)
      setError(
        msg.includes('TGE not active')   ? 'TGE belum aktif. Claim dibuka saat peluncuran.' :
        msg.includes('no KNTC')          ? 'Tidak ada KNTC untuk diklaim.' :
        msg.includes('User rejected')    ? 'Transaksi dibatalkan.' :
        'Claim gagal. Coba lagi.'
      )
    }
  }, [address, queryClient])

  const reset = useCallback(() => {
    setStatus('idle')
    setTxHash(null)
    setError(null)
  }, [])

  return { status, txHash, error, execute, reset }
}

// ─── Cooldown countdown ───────────────────────────────────────────────────────

export function useMiningCountdown(cooldownSeconds: number) {
  const [remaining, setRemaining] = useState(cooldownSeconds)

  useEffect(() => {
    setRemaining(cooldownSeconds)
    if (cooldownSeconds <= 0) return
    const id = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(id); return 0 }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [cooldownSeconds])

  const progress = MINING_CYCLE_S > 0
    ? Math.max(0, Math.min(1, 1 - remaining / MINING_CYCLE_S))
    : 1

  return { remaining, progress }
}

// ─── Legacy stubs — kept so existing callers don't break ─────────────────────

export function useCurrentRank() {
  return { data: { rank: 1 as const, quotaFillPct: 0 }, isLoading: false }
}

export function useRealTimeMining(
  _lastMiningTime: number,
  _ratePerHour: bigint,
  accumulatedPoints: bigint,
): bigint {
  return accumulatedPoints
}
