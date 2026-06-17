/**
 * KineticDAO — Redeploy KineticMining only (Blueprint Phase 1)
 * Rescues tokens from old contract, deploys new KineticMining, transfers pool.
 *
 * Usage: node scripts/redeploy-mining.mjs
 * Env:   DEPLOYER_PRIVATE_KEY must be set
 */

import { createWalletClient, createPublicClient, http, defineChain, parseEther } from 'viem'
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
  blockExplorers: { default: { name: 'Maculatus Scan', url: 'https://maculatus-scan.x1eco.com' } },
  testnet: true,
})

// ─── Existing addresses ───────────────────────────────────────────────────────
const OLD_MINING_ADDRESS = '0xf3b9297d7f99b1f5f8293a397d15da262848aa24'
const TOKEN_ADDRESS      = '0x6d2dda65b4440dcf5595f8cfa23ffc98cc00f9d7'
const MINING_POOL        = 700_000_000n * 10n ** 18n

// ─── Minimal ABIs ─────────────────────────────────────────────────────────────
const RESCUE_ABI = [
  { type: 'function', name: 'rescueTokens', inputs: [{ type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
]
const TOKEN_ABI = [
  { type: 'function', name: 'balanceOf', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'transfer',  inputs: [{ type: 'address' }, { type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable' },
]

function loadArtifact(name) {
  const p = join(__dirname, `../artifacts/contracts/${name}.sol/${name}.json`)
  const { bytecode, abi } = JSON.parse(readFileSync(p, 'utf8'))
  return { bytecode, abi }
}

const pk = process.env.DEPLOYER_PRIVATE_KEY
if (!pk) { console.error('ERROR: DEPLOYER_PRIVATE_KEY not set'); process.exit(1) }

const account      = privateKeyToAccount(pk.startsWith('0x') ? pk : `0x${pk}`)
const publicClient = createPublicClient({ chain: maculatusTestnet, transport: http() })
const walletClient = createWalletClient({ chain: maculatusTestnet, transport: http(), account })

async function main() {
  console.log('============================================================')
  console.log('  KineticDAO — Redeploy KineticMining (Blueprint Phase 1)')
  console.log('  Network  : Maculatus Testnet (Chain ID: 10778)')
  console.log(`  Deployer : ${account.address}`)

  const bal = await publicClient.getBalance({ address: account.address })
  console.log(`  Balance  : ${(Number(bal) / 1e18).toFixed(4)} KNTC (gas)`)
  console.log('============================================================')

  // ── 1. Rescue tokens from old mining contract ─────────────────────────────
  const oldBalance = await publicClient.readContract({
    address: TOKEN_ADDRESS, abi: TOKEN_ABI, functionName: 'balanceOf', args: [OLD_MINING_ADDRESS],
  })
  console.log(`\nOld contract token balance: ${(Number(oldBalance) / 1e18).toFixed(0)} KNTC`)

  if (oldBalance > 0n) {
    console.log('Rescuing tokens from old KineticMining...')
    const rescueHash = await walletClient.writeContract({
      address: OLD_MINING_ADDRESS, abi: RESCUE_ABI, functionName: 'rescueTokens',
      args: [oldBalance], account, chain: null,
    })
    console.log(`  rescue tx: ${rescueHash}`)
    await publicClient.waitForTransactionReceipt({ hash: rescueHash })
    console.log('  Tokens rescued to deployer.')
  }

  const deployerBalance = await publicClient.readContract({
    address: TOKEN_ADDRESS, abi: TOKEN_ABI, functionName: 'balanceOf', args: [account.address],
  })
  console.log(`\nDeployer token balance: ${(Number(deployerBalance) / 1e18).toFixed(0)} KNTC`)

  // ── 2. Deploy new KineticMining ────────────────────────────────────────────
  const { abi, bytecode } = loadArtifact('KineticMining')
  console.log('\nDeploying new KineticMining...')

  const deployHash = await walletClient.deployContract({ abi, bytecode, account, args: [TOKEN_ADDRESS] })
  console.log(`  tx   : ${deployHash}`)
  const receipt = await publicClient.waitForTransactionReceipt({ hash: deployHash })
  const newMiningAddress = receipt.contractAddress
  if (!newMiningAddress) throw new Error('No contract address in receipt')
  console.log(`  addr : ${newMiningAddress}`)

  // ── 3. Fund new contract with 700M KNTC ────────────────────────────────────
  const toTransfer = deployerBalance >= MINING_POOL ? MINING_POOL : deployerBalance
  console.log(`\nTransferring ${(Number(toTransfer) / 1e18).toFixed(0)} KNTC to new KineticMining...`)
  const transferHash = await walletClient.writeContract({
    address: TOKEN_ADDRESS, abi: TOKEN_ABI, functionName: 'transfer',
    args: [newMiningAddress, toTransfer], account, chain: null,
  })
  console.log(`  tx   : ${transferHash}`)
  await publicClient.waitForTransactionReceipt({ hash: transferHash })
  console.log('  Funded.')

  // ── 4. Update .env ─────────────────────────────────────────────────────────
  const envPath = join(__dirname, '../.env')
  let env = existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''
  const upsert = (c, k, v) =>
    c.includes(`${k}=`) ? c.replace(new RegExp(`${k}=.+`), `${k}=${v}`) : c + `\n${k}=${v}`
  env = upsert(env, 'VITE_MINING_ADDRESS', newMiningAddress)
  writeFileSync(envPath, env.trimStart())

  console.log('\n============================================================')
  console.log('  REDEPLOYMENT COMPLETE')
  console.log('============================================================')
  console.log(`  KineticToken   : ${TOKEN_ADDRESS}  (unchanged)`)
  console.log(`  KineticMining  : ${newMiningAddress}  (new)`)
  console.log(`    Explorer: https://maculatus-scan.x1eco.com/address/${newMiningAddress}`)
  console.log('\n  .env updated:')
  console.log(`    VITE_MINING_ADDRESS = ${newMiningAddress}`)
  console.log('\n  *** Update VITE_MINING_ADDRESS in Replit Secrets too! ***')
  console.log('============================================================')
}

main().catch(err => {
  console.error('\nDeployment failed:', err.shortMessage || err.message || err)
  process.exit(1)
})
