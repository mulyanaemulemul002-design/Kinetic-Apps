---
name: KineticMining v2 contract design
description: New simplified contract — 1 session = 1 KNTC, 10 billion supply, TGE-gated claim. Documents ABI changes and deployment pattern.
---

## Rule
KineticMining v2 is a complete rewrite from the gacha/points system. The ABI, hooks, and UI have all been updated to match.

**Why:** Old contract had complex gacha rates, integer points, rank halving — none of it was reflected correctly in the UI, causing sessions to appear inactive and credits to show 0.

## New contract summary
- `mine()` — no inputs, no outputs. Credits 1 KNTC (1e18 wei) to `users[msg.sender].pendingKNTC`. 24h cooldown enforced.
- `getUserDashboard(address)` returns: `(pendingKNTC, sessionCount, totalClaimed, lastMineAt, sessionActive, sessionTimeLeft, canMine_, tgeActive_)` — all 8 values.
- `getProtocolStats()` returns: `(totalSessions, uniqueMiners, totalPointsMinted, totalTokensClaimed, poolRemaining, tgeActive)`.
- `claimTokens()` — transfers `pendingKNTC` to caller, reverts if TGE not active.
- `setTGEActive(bool)` — owner only.

## KineticToken v2
- `TOTAL_SUPPLY = 10_000_000_000 ether` (10 billion KNTC).
- Entire supply minted to owner, owner transfers all to KineticMining at deploy.

## How to apply
- If `getUserDashboard` ABI or return shape changes, update `src/hooks/useMining.ts` `useUserMiningStats` first.
- The `UserDashboard` interface in `useMining.ts` keeps legacy field aliases (pendingClaim, cycleCount, estimatedKNTC, totalEarned, cooldown, ratePerHour) for backward compat with Mine.tsx and Profile.tsx.
- Deploy: run `DEPLOYER_PRIVATE_KEY=0x... node scripts/deploy-all.mjs` from contracts/ after `npx hardhat compile`. Requires Node 22+ or Remix IDE.
