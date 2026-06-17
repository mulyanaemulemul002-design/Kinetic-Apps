import { useQuery } from '@tanstack/react-query'
import { publicClient, MINING_ADDRESS, AD_WATCHED_EVENT } from '../lib/chain'

export interface AdEvent {
  user:        `0x${string}`
  timestamp:   number
  reward:      bigint
  txHash:      `0x${string}`
  blockNumber: bigint
}

async function fetchAdEvents(userAddress?: `0x${string}`): Promise<AdEvent[]> {
  try {
    const latest    = await publicClient.getBlockNumber()
    const fromBlock = latest > 10000n ? latest - 10000n : 0n
    const logs = await publicClient.getLogs({
      address: MINING_ADDRESS,
      event:   AD_WATCHED_EVENT,
      args:    userAddress ? { user: userAddress } : undefined,
      fromBlock,
      toBlock: latest,
    })
    return logs.map(l => ({
      user:        l.args.user!,
      timestamp:   Number(l.args.timestamp!),
      reward:      l.args.reward!,
      txHash:      l.transactionHash,
      blockNumber: l.blockNumber,
    })).reverse()
  } catch {
    return []
  }
}

export function useAdEvents(userAddress?: `0x${string}`) {
  return useQuery({
    queryKey:        ['adEvents', userAddress],
    queryFn:         () => fetchAdEvents(userAddress),
    refetchInterval: 30_000,
    staleTime:       15_000,
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
