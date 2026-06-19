import { createConfig, http } from 'wagmi'
import { injected, walletConnect } from 'wagmi/connectors'
import { maculatusTestnet } from './chain'

const WC_PROJECT_ID =
  (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined) ??
  '5c4a15fc5b8caf515e172ea2750482a9'

export const injectedConnector = injected()

export const wcConnector = walletConnect({
  projectId: WC_PROJECT_ID,
  metadata: {
    name:        'KineticDAO',
    description: 'Watch Ads, Mine KNTC — Decentralized Ad-to-Earn on KNTC Ecochain',
    url:         'https://kineticdao.app',
    icons:       ['https://kineticdao.app/favicon.png'],
  },
  showQrModal: true,
})

export const wagmiConfig = createConfig({
  chains: [maculatusTestnet],
  transports: {
    [maculatusTestnet.id]: http('https://maculatus-rpc.x1eco.com'),
  },
  connectors: [injectedConnector, wcConnector],
})
