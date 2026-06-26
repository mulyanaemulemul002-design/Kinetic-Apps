---
name: Deployed contract addresses
description: KineticToken and KineticMining v2 live addresses on Maculatus Testnet (Chain ID 10778).
---

## Rule
These are the live deployed v2 contract addresses. Always use these when updating .env or Vercel env vars.

**Why:** Deployed 2026-06-25 via `node scripts/deploy-all.mjs` after compiling with `node scripts/compile.cjs` (bypasses Hardhat ESM issues on Node 20).

## Addresses — Maculatus Testnet (Chain ID 10778)

| Contract      | Address                                      |
|---------------|----------------------------------------------|
| KineticToken  | `0x00246d22283b3eac6d4ae13b5b0a3f5305207f99` |
| KineticMining | `0xa7b1dbda68da708226ecdd578e0688d44f69bd0e` |

- Explorer: https://maculatus-scan.x1eco.com
- Deployer: 0x7Da2Eec63Fce4e027edF38d864A5d294309CD522
- Pool funded: 10,000,000,000 KNTC transferred to KineticMining at deploy

## How to apply
- `.env` already updated automatically by deploy script
- Replit env vars set via `setEnvVars` (shared environment)
- For Vercel: add `VITE_TOKEN_ADDRESS` and `VITE_MINING_ADDRESS` manually in dashboard

## Compile workflow (Node 20 compatible)
```bash
node scripts/compile.cjs          # compiles KineticToken + KineticMining → artifacts/
node scripts/deploy-all.mjs       # deploys to Maculatus Testnet, updates .env
```
Hardhat is installed in contracts/ but DO NOT use `npx hardhat compile` — it fails with HH19 (ESM conflict with root package.json). Use compile.cjs instead.
