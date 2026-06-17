import { createWalletClient, createPublicClient, http, defineChain } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const maculatusTestnet = defineChain({
  id: 10778,
  name: 'Maculatus Testnet',
  nativeCurrency: { decimals: 18, name: 'KNTC', symbol: 'KNTC' },
  rpcUrls: { default: { http: ['https://maculatus-rpc.x1eco.com'] } },
  blockExplorers: { default: { name: 'KNTC Explorer', url: 'https://explorer.x1eco.com' } },
  testnet: true,
})

const artifactPath = join(__dirname, '../artifacts/contracts/KineticAllocation.sol/KineticAllocation.json')
const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'))
const { bytecode, abi } = artifact

const privateKey = process.env.DEPLOYER_PRIVATE_KEY
if (!privateKey) { console.error('ERROR: DEPLOYER_PRIVATE_KEY not set'); process.exit(1) }

const pk      = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`
const account = privateKeyToAccount(pk)

const publicClient = createPublicClient({
  chain: maculatusTestnet,
  transport: http('https://maculatus-rpc.x1eco.com'),
})
const walletClient = createWalletClient({
  chain: maculatusTestnet,
  transport: http('https://maculatus-rpc.x1eco.com'),
  account,
})

async function main() {
  console.log('=== KineticAllocation Deployment ===')
  console.log('Network : Maculatus Testnet (Chain ID: 10778)')
  console.log('Deployer:', account.address)

  const balance = await publicClient.getBalance({ address: account.address })
  console.log('Balance :', (Number(balance) / 1e18).toFixed(4), 'KNTC')

  if (balance === 0n) {
    console.error('ERROR: Wallet has 0 KNTC. Fund it first.'); process.exit(1)
  }

  console.log('\nDeploying KineticAllocation...')
  const hash = await walletClient.deployContract({ abi, bytecode, account })

  console.log('Deploy tx  :', hash)
  console.log('Waiting for confirmation...')

  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  const address = receipt.contractAddress

  if (!address) { console.error('ERROR: No contract address in receipt.'); process.exit(1) }

  console.log('\n=== Deployment Successful ===')
  console.log('Contract   :', address)
  console.log('Block      :', receipt.blockNumber.toString())
  console.log('Gas used   :', receipt.gasUsed.toString())
  console.log('Explorer   : https://explorer.x1eco.com/address/' + address)

  // Update .env
  const envPath = join(__dirname, '../.env')
  const envLine = `VITE_ALLOCATION_ADDRESS=${address}`
  if (existsSync(envPath)) {
    let content = readFileSync(envPath, 'utf8')
    if (content.includes('VITE_ALLOCATION_ADDRESS=')) {
      content = content.replace(/VITE_ALLOCATION_ADDRESS=.+/g, envLine)
    } else {
      content += `\n${envLine}\n`
    }
    writeFileSync(envPath, content)
  } else {
    writeFileSync(envPath, `${envLine}\n`)
  }

  console.log('\n.env updated  : VITE_ALLOCATION_ADDRESS =', address)
  console.log('\n--- Add to Vercel Environment Variables ---')
  console.log('Key   : VITE_ALLOCATION_ADDRESS')
  console.log('Value :', address)
  console.log('-------------------------------------------')
  console.log('\nNEXT STEP: Fund this contract with 300,000,000 KNTC')
  console.log('(Investor 100M + Team 25M + Ecosystem 175M)')
}

main().catch(err => {
  console.error('\nDeployment failed:', err.message || err)
  process.exit(1)
})
