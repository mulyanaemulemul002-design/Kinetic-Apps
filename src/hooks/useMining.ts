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
          totalCycles:         result[0],
          uniqueMiners:        result[1],
          totalPointsMinted:   result[2],
          totalTokensClaimed:  result[3],
          pointsRemaining:     result[4],
          tgeActive:           result[5],
          // legacy aliases
          totalVirtualMined:   result[2],
          totalMined:          result[2],
          poolRemaining:       result[4],
        }
      } catch {
        return null
      }
    },
    refetchInterval: 30_000,
    staleTime:       15_000,
  })
}

// ─── Rank ─────────────────────────────────────────────────────────────────────

export function useCurrentRank() {
  return useQuery({
    queryKey: ['currentRank'],
    queryFn: async () => {
      try {
        const result = await publicClient.readContract({
          address:      MINING_ADDRESS,
          abi:          KINETIC_MINING_ABI,
          functionName: 'getCurrentRank',
        }) as [number, bigint]
        return { rank: Number(result[0]) as 1 | 2 | 3, quotaFillPct: Number(result[1]) }
      } catch {
        return { rank: 1 as const, quotaFillPct: 0 }
      }
    },
    refetchInterval: 60_000,
    staleTime:       30_000,
  })
}

// ─── User dashboard ───────────────────────────────────────────────────────────

export interface UserDashboard {
  pendingClaim:    bigint  // integer points pending
  totalMined:      bigint  // lifetime integer points
  totalClaimed:    bigint  // KNTC wei claimed
  cycleCount:      bigint
  lastMineAt:      bigint
  cooldown:        bigint
  canMine:         boolean
  tgeActive:       boolean
  ratePerHour:     bigint
  sessionTimeLeft: bigint
  estimatedKNTC:   bigint
  // legacy aliases
  totalEarned:     bigint
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
        }) as [bigint, bigint, bigint, bigint, bigint, bigint, boolean, boolean, bigint, bigint, bigint]

        return {
          pendingClaim:    result[0],
          totalMined:      result[1],
          totalClaimed:    result[2],
          cycleCount:      result[3],
          lastMineAt:      result[4],
          cooldown:        result[5],
          canMine:         result[6],
          tgeActive:       result[7],
          ratePerHour:     result[8],
          sessionTimeLeft: result[9],
          estimatedKNTC:   result[10],
          totalEarned:     result[0],
        }
      } catch {
        return {
          pendingClaim:    0n,
          totalMined:      0n,
          totalClaimed:    0n,
          cycleCount:      0n,
          lastMineAt:      0n,
          cooldown:        0n,
          canMine:         true,
          tgeActive:       false,
          ratePerHour:     0n,
          sessionTimeLeft: 0n,
          estimatedKNTC:   0n,
          totalEarned:     0n,
        }
      }
    },
    enabled:         !!address,
    refetchInterval: 15_000,
    staleTime:       5_000,
  })
}

// ─── Real-time live mining counter ────────────────────────────────────────────

export function useRealTimeMining(
  lastMiningTime: number,
  ratePerHour: bigint,
  accumulatedPoints: bigint,
): bigint {
  const [livePoints, setLivePoints] = useState<bigint>(accumulatedPoints)

  useEffect(() => {
    if (ratePerHour === 0n || lastMiningTime === 0) {
      setLivePoints(accumulatedPoints)
      return
    }

    const SESSION_MAX = 24 * 3600

    function calculate() {
      const now     = Math.floor(Date.now() / 1000)
      const elapsed = Math.min(now - lastMiningTime, SESSION_MAX)
      const sessionPts = (BigInt(elapsed) * ratePerHour) / 3600n
      setLivePoints(accumulatedPoints + sessionPts)
    }

    calculate()
    const id = setInterval(calculate, 1000)
    return () => clearInterval(id)
  }, [lastMiningTime, ratePerHour, accumulatedPoints])

  return livePoints
}

// ─── Mining history events ────────────────────────────────────────────────────

export interface MiningEvent {
  user:          `0x${string}`
  cycleId:       bigint
  ratePerHour:   bigint  // pts/h (new field)
  tier:          number
  timestamp:     number
  txHash:        `0x${string}`
  blockNumber:   bigint
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
          { name: 'user',              type: 'address', indexed: true  },
          { name: 'cycleId',           type: 'uint256', indexed: true  },
          { name: 'ratePerHour',       type: 'uint256', indexed: false },
          { name: 'tier',              type: 'uint8',   indexed: false },
          { name: 'timestamp',         type: 'uint256', indexed: false },
          { name: 'totalPointsMinted', type: 'uint256', indexed: false },
        ],
      } as const,
      args:      userAddress ? { user: userAddress } : undefined,
      fromBlock,
      toBlock:   latest,
    })

    return logs.map(l => ({
      user:        l.args.user!,
      cycleId:     l.args.cycleId!,
      ratePerHour: l.args.ratePerHour!,
      tier:        Number(l.args.tier ?? 1),
      timestamp:   Number(l.args.timestamp!),
      txHash:      l.transactionHash,
      blockNumber: l.blockNumber,
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
  const [status,      setStatus]      = useState<MineStatus>('idle')
  const [txHash,      setTxHash]      = useState<`0x${string}` | null>(null)
  const [ratePerHour, setRatePerHour] = useState<bigint | null>(null)
  const [tier,        setTier]        = useState<number | null>(null)
  const [error,       setError]       = useState<string | null>(null)

  const execute = useCallback(async () => {
    if (!address) { setError('Wallet not connected'); return }
    const wc = getWalletClient()
    if (!wc)    { setError('No wallet client'); return }

    setStatus('confirming')
    setError(null)
    setRatePerHour(null)
    setTier(null)
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

      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== MINING_ADDRESS.toLowerCase()) continue
        try {
          const { decodeEventLog } = await import('viem')
          const decoded = decodeEventLog({
            abi:       KINETIC_MINING_ABI,
            eventName: 'MiningSessionStarted',
            data:      log.data,
            topics:    log.topics as [`0x${string}`, ...`0x${string}`[]],
          })
          if (decoded.args && 'ratePerHour' in decoded.args) setRatePerHour(decoded.args.ratePerHour as bigint)
          if (decoded.args && 'tier'        in decoded.args) setTier(Number(decoded.args.tier))
          break
        } catch { /* try next log */ }
      }

      setStatus('success')
      queryClient.invalidateQueries({ queryKey: ['userDashboard', address] })
      queryClient.invalidateQueries({ queryKey: ['miningEvents'] })
      queryClient.invalidateQueries({ queryKey: ['protocolStats'] })
      queryClient.invalidateQueries({ queryKey: ['currentRank'] })
    } catch (err) {
      setStatus('error')
      const msg = err instanceof Error ? err.message : String(err)
      setError(
        msg.includes('cooldown active')  ? 'Mining cooldown active. Wait for next cycle.'   :
        msg.includes('User rejected')    ? 'Transaction rejected.'                           :
        msg.includes('pool depleted')    ? 'Point pool depleted.'                           :
        'Transaction failed. Try again.'
      )
    }
  }, [address, queryClient])

  const reset = useCallback(() => {
    setStatus('idle')
    setTxHash(null)
    setRatePerHour(null)
    setTier(null)
    setError(null)
  }, [])

  return { status, txHash, ratePerHour, tier, error, execute, reset }
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
        msg.includes('TGE not active')   ? 'TGE belum aktif. Claim akan dibuka saat peluncuran.' :
        msg.includes('no points')        ? 'Tidak ada kredit untuk diklaim.' :
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
