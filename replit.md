# KineticDAO

## Overview

KineticDAO is an Ad-to-Earn DAO protocol on the KNTC Ecochain (Maculatus Testnet).
Users watch ads and earn KNTC tokens. Every impression is recorded as an on-chain event
for full transparency — no centralized database.

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Web3:** viem (wallet + public client)
- **Data:** TanStack Query (caching on-chain event logs)
- **Smart Contract:** Solidity (OpenZeppelin Ownable + ReentrancyGuard)
- **Network:** KNTC Ecochain, Maculatus Testnet (Chain ID: 10778)

## Project Structure

```
/contracts     — Solidity smart contracts (KineticDAO.sol)
/src
  /components  — Reusable UI components
  /hooks       — React hooks (wallet, on-chain data)
  /lib         — viem client, chain config, utilities
  /pages       — Page components (Home, Dashboard, Activity)
/docs          — Architecture documentation
/public        — Static assets
```

## Running

```bash
npm install
npm run dev
```

App runs on port 5000.

## Environment Variables

Copy `.env.example` to `.env` and fill in:
- `VITE_CONTRACT_ADDRESS` — deployed KineticDAO contract address

## User Preferences

- No emojis in UI
- Clean code for grant auditors
- No centralized database — blockchain is the only data source
