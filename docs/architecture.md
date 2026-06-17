# KineticDAO Architecture

## Overview

KineticDAO is a fully on-chain Ad-to-Earn protocol on the X1T Ecochain (Maculatus Testnet).
There is no centralized database — all data is sourced from blockchain event logs.

## Smart Contract

**KineticDAO.sol** — The core protocol contract.

- Emits `AdWatched(address indexed user, uint256 timestamp, uint256 reward)` on each impression
- Uses OpenZeppelin `Ownable` and `ReentrancyGuard`
- Owner controls reward rate (`rewardPerView`) and cooldown (`cooldownSeconds`)
- Funded by depositing X1T to the contract address

## Frontend

**Stack:** React 18 + Vite + Tailwind CSS + viem + TanStack Query

**Pages:**
- `/` — Landing page with protocol overview and live stats
- `/dashboard` — Personal wallet dashboard (earnings, history)
- `/activity` — Global on-chain event feed with search/filter

**Data Flow:**
1. `publicClient` (viem) connects to Maculatus Testnet RPC
2. `getLogs()` fetches `AdWatched` events from the last 10,000 blocks
3. TanStack Query caches and refetches on a 30s interval
4. No backend, no database — pure on-chain reads

## Network

| Parameter     | Value                                |
|---------------|--------------------------------------|
| Network Name  | Maculatus Testnet                    |
| RPC URL       | https://maculatus-rpc.x1eco.com      |
| Chain ID      | 10778                                |
| Symbol        | X1T                                  |
| Explorer      | https://explorer.x1eco.com           |

## Deployment

Frontend is deployable to Vercel via `vercel.json` (build output: `dist/`).
Smart contract to be verified on the X1T block explorer after deployment.
