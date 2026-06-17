import { defineConfig } from 'hardhat/config'
import hardhatEthers from '@nomicfoundation/hardhat-ethers'

export default defineConfig({
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  plugins: [hardhatEthers],
  networks: {
    maculatus: {
      type: 'http',
      url: 'https://maculatus-rpc.x1eco.com',
      chainId: 10778,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
  },
  paths: {
    sources:   './contracts',
    artifacts: './artifacts',
    cache:     './cache',
  },
})
