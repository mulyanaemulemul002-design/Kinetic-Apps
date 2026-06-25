import { useQuery } from '@tanstack/react-query'
import { publicClient } from '../lib/chain'

export interface AdEvent {
  user:        `0x${string}`
  timestamp:   number
  reward:      bigint
  txHash:      `0x${string}`
  blockNumber: bigint
}

// AdWatched event was removed in v2 — ad watching is implicit in mine()
export function useAdEvents(_userAddress?: `0x${string}`) {
  return useQuery({
    queryKey:        ['adEvents', _userAddress],
    queryFn:         async (): Promise<AdEvent[]> => [],
    refetchInterval: 60_000,
    staleTime:       30_000,
  })
}

export function useNetworkStatus() {
  return useQuery({
    queryKey: ['networkStatus'],
    queryFn: async () => {
      try {
        const [blockNumber, chainId] = await Promise.all([
          publicClient.getBlockNumber(),
          publicClient.getChainId(),
        ])
        return { isOnline: true, blockNumber, chainId }
      } catch {
        return { isOnline: false, blockNumber: 0n, chainId: 0 }
      }
    },
    refetchInterval: 15_000,
    staleTime:       10_000,
  })
}
