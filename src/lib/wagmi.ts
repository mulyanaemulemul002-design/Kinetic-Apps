import { createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { maculatusTestnet } from './chain'

export const wagmiConfig = createConfig({
  chains: [maculatusTestnet],
  transports: {
    [maculatusTestnet.id]: http('https://maculatus-rpc.x1eco.com'),
  },
  connectors: [injected()],
})
