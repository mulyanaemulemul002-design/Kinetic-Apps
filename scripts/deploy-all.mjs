/**
 * KineticDAO v2 — Full Deployment Script
 *
 * Deploys KineticToken (10B supply), then KineticMining with the token address,
 * then transfers the full 10B mining pool to KineticMining.
 * 1 session = 1 KNTC · Sessions locked until TGE · No claiming before launch.
 *
 * Usage:  node scripts/deploy-all.mjs
 * Env:    DEPLOYER_PRIVATE_KEY  — hex private key of the deployer wallet
 */

import { createWalletClient, createPublicClient, http, defineChain } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ─── Chain ────────────────────────────────────────────────────────────────────
const maculatusTestnet = defineChain({
  id: 10778,
  name: 'Maculatus Testnet',
  nativeCurrency: { decimals: 18, name: 'KNTC', symbol: 'KNTC' },
  rpcUrls: { default: { http: ['https://maculatus-rpc.x1eco.com'] } },
  blockExplorers: { default: { name: 'Maculatus Scan', url: 'https://maculatus-scan.x1eco.com' } },
  testnet: true,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
function loadArtifact(name) {
  const p = join(__dirname, `../artifacts/contracts/${name}.sol/${name}.json`)
  const { bytecode, abi } = JSON.parse(readFileSync(p, 'utf8'))
  return { bytecode, abi }
}

// ─── Setup ────────────────────────────────────────────────────────────────────
const pk = process.env.DEPLOYER_PRIVATE_KEY
if (!pk) { console.error('ERROR: DEPLOYER_PRIVATE_KEY not set'); process.exit(1) }

const account      = privateKeyToAccount(pk.startsWith('0x') ? pk : `0x${pk}`)
const publicClient = createPublicClient({ chain: maculatusTestnet, transport: http() })
const walletClient = createWalletClient({ chain: maculatusTestnet, transport: http(), account })

// ─── Deploy helper ────────────────────────────────────────────────────────────
async function deployContract(name, args = []) {
  const { abi, bytecode } = loadArtifact(name)
  console.log(`\nDeploying ${name}...`)

  const hash = await walletClient.deployContract({ abi, bytecode, account, args })
  console.log(`  tx   : ${hash}`)
  console.log(`  Waiting for confirmation...`)

  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  const address = receipt.contractAddress

  if (!address) throw new Error(`${name}: no contract address in receipt`)
  console.log(`  addr : ${address}`)
  console.log(`  block: ${receipt.blockNumber}  gas: ${receipt.gasUsed}`)
  return { address, abi, receipt }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('============================================================')
  console.log('  KineticDAO v2 — Full Deployment')
  console.log('  Network  : Maculatus Testnet (Chain ID: 10778)')
  console.log(`  Deployer : ${account.address}`)

  const balance = await publicClient.getBalance({ address: account.address })
  console.log(`  Balance  : ${(Number(balance) / 1e18).toFixed(4)} native KNTC (for gas)`)
  console.log('============================================================')

  // ── 1. Deploy KineticToken (10 Billion KNTC) ──────────────────────────────
  const token = await deployContract('KineticToken')

  // ── 2. Deploy KineticMining (pass token address) ──────────────────────────
  const mining = await deployContract('KineticMining', [token.address])

  // ── 3. Transfer entire 10B KNTC pool to KineticMining ────────────────────
  console.log('\nTransferring 10,000,000,000 KNTC to KineticMining...')
  const MINING_POOL = 10_000_000_000n * 10n ** 18n
  const transferHash = await walletClient.writeContract({
    address:      token.address,
    abi:          token.abi,
    functionName: 'transfer',
    args:         [mining.address, MINING_POOL],
    account,
    chain:        null,
  })
  console.log(`  tx   : ${transferHash}`)
  await publicClient.waitForTransactionReceipt({ hash: transferHash })
  console.log(`  10,000,000,000 KNTC transferred to KineticMining`)

  // ── 4. Update .env ────────────────────────────────────────────────────────
  const envPath = join(__dirname, '../.env')
  let envContent = existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''

  function upsertEnv(content, key, value) {
    const line = `${key}=${value}`
    return content.includes(`${key}=`)
      ? content.replace(new RegExp(`${key}=.+`), line)
      : content + `\n${line}`
  }

  envContent = upsertEnv(envContent, 'VITE_TOKEN_ADDRESS',  token.address)
  envContent = upsertEnv(envContent, 'VITE_MINING_ADDRESS', mining.address)
  writeFileSync(envPath, envContent.trimStart())

  // ── 5. Summary ────────────────────────────────────────────────────────────
  console.log('\n============================================================')
  console.log('  DEPLOYMENT COMPLETE')
  console.log('============================================================')
  console.log(`  KineticToken  : ${token.address}`)
  console.log(`    Explorer : https://maculatus-scan.x1eco.com/address/${token.address}`)
  console.log(`  KineticMining : ${mining.address}`)
  console.log(`    Explorer : https://maculatus-scan.x1eco.com/address/${mining.address}`)
  console.log('\n  Mining pool funded: 10,000,000,000 KNTC')
  console.log('\n  .env updated:')
  console.log(`    VITE_TOKEN_ADDRESS  = ${token.address}`)
  console.log(`    VITE_MINING_ADDRESS = ${mining.address}`)
  console.log('\n  --- Add to Vercel Environment Variables ---')
  console.log(`  VITE_TOKEN_ADDRESS  = ${token.address}`)
  console.log(`  VITE_MINING_ADDRESS = ${mining.address}`)
  console.log('============================================================')
}

main().catch(err => {
  console.error('\nDeployment failed:', err.shortMessage || err.message || err)
  process.exit(1)
})
