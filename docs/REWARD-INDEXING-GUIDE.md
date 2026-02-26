# Story Aeneid Reward Indexing Guide

## Overview

This document describes how reward data is indexed and queried from the StoryHunt subgraph on Story Aeneid Testnet (Chain ID 1315).

**Contracts:**

| Contract | Address |
|----------|---------|
| IPWorld Proxy | `0x77475A8ca1AfE6a6dc9E82B32210709054937099` |
| IPOwnerVault Proxy | `0x276679F9e03d2E99350d407f964b5b42A3f01c73` |

**Subgraph Endpoint:** `storyhunt-subgraph-new` (Goldsky)

---

## Reward Metrics Overview

### Queryable Metrics

| # | Metric | Dimensions | Source Events | Aggregation Entity |
|---|--------|-----------|---------------|-------------------|
| 1 | IP Owner vesting total amount | by token, by IP, total | `VestingScheduleCreated` | `vestingTotalAmount` |
| 2 | IP Owner claimed vesting amount | by token, by IP, total | `ReleasedVested` + `VestedTokensAndEthClaimed` | `vestingClaimedAmount` |
| 3 | IP Owner token income (excl. vesting) | by token, by IP, total | `HarvestDistributed.tokenCollected` | `tokenCollected` |
| 4 | IP Owner WIP income | by token, by IP, total | `HarvestDistributed.wethToIpOwner` | `wipToIpOwner` |
| 5 | ipTreasury token income (allocated) | by token, by IP, total | `HarvestDistributed.tokenToIpTreasury` | `tokenToIpTreasury` |
| 6 | ipTreasury token income (flushed) | by token, by IP, total | `TreasuryFlushed.amount` | `treasuryFlushedAmount` |
| 7 | Airdrop token distribution | by token, by IP, by address, total | `AirdropClaimed.tokenAmount` | `airdropTokenClaimed` |
| 8 | Airdrop WIP distribution | by token, by IP, by address, total | `AirdropClaimed.wethAmount` | `airdropWipClaimed` |
| 9 | Total token amount per token | by token, by IP, total | Sum of #1 + #5 + #7 | Computed from summary |
| 10 | Total WIP amount per token | by token, by IP, total | `HarvestDistributed.wethCollected` | `wipCollected` |
| 11 | Protocol treasury WIP | by token, by IP, total | Computed: `wethCollected - wethToIpOwner - wethToBuyback - wethToAirdrop` | `wipToProtocol` |
| 12 | Buyback (LP-re-add) WIP | by token, by IP, total | `HarvestDistributed.wethToBuyback` | `wipToBuyback` |
| 13 | LP fee collected | by pool, by token, by IP, total | `LiquidityCollected` | `lpFeeWeth`, `lpFeeToken` |

### Not Queryable (Out of Scope)

| Metric | Reason |
|--------|--------|
| ipTreasury WIP income | No on-chain event exists for ipTreasury WIP distribution |
| Referral WIP distribution | No on-chain event exists for referral WIP distribution |
| IP Owner remaining vesting balance | Real-time data only available via RPC call `IPOwnerVault.remaining(token)` |

---

## How Aggregation Works

The subgraph maintains three pre-computed summary entities that are updated in real-time as events are indexed:

```
Event fires → Handler updates:
  1. Raw event entity (immutable log)
  2. TokenRewardSummary (per token)
  3. IpRewardSummary (per IP, via IpTokenLink mapping)
  4. GlobalRewardSummary (singleton, id = "global")
```

**Token-to-IP mapping:** The `Linked` event creates the `IpTokenLink` entity mapping each token address to its IP Asset (IPA). All per-IP aggregations use this mapping: `token → IpTokenLink → ipaId → IpRewardSummary`.

---

## GraphQL Query Examples

### 1. IP Owner Vesting Total (by token)

Returns the total vesting amount scheduled for a specific token.

```graphql
query IpOwnerVestingByToken($token: ID!) {
  tokenRewardSummary(id: $token) {
    vestingTotalAmount
    vestingClaimedAmount
  }
}
```

### 2. IP Owner Vesting Total (by IP)

Returns the total vesting amount across all tokens for a specific IP Asset.

```graphql
query IpOwnerVestingByIp($ipaId: ID!) {
  ipRewardSummary(id: $ipaId) {
    vestingTotalAmount
    vestingClaimedAmount
    vestingClaimedEthAmount
  }
}
```

### 3. IP Owner Vesting Total (global)

```graphql
query IpOwnerVestingGlobal {
  globalRewardSummary(id: "global") {
    vestingTotalAmount
    vestingClaimedAmount
  }
}
```

### 4. IP Owner Claimed Vesting (by token, with event details)

Returns individual vesting release events for detailed history.

```graphql
query ClaimedVestingDetail($token: String!) {
  vestingReleaseEvents(
    where: { token: $token }
    orderBy: timestamp
    orderDirection: desc
    first: 100
  ) {
    id
    amount
    timestamp
    transactionHash
  }
  claimEvents(
    where: { token: $token }
    first: 100
  ) {
    tokenAmount
    ethAmount
    recipient
    timestamp
  }
}
```

### 5. IP Owner WIP Income (by token)

Returns total WIP earned by the IP Owner from harvest distributions.

```graphql
query IpOwnerWipByToken($token: ID!) {
  tokenRewardSummary(id: $token) {
    wipToIpOwner
    harvestCount
  }
}
```

### 6. IP Owner WIP Income (by IP)

```graphql
query IpOwnerWipByIp($ipaId: ID!) {
  ipRewardSummary(id: $ipaId) {
    wipToIpOwner
    harvestCount
    tokenCount
  }
}
```

### 7. ipTreasury Token Income (by IP)

Returns both the allocated amount (at harvest time) and the actually flushed amount.

```graphql
query TreasuryIncomeByIp($ipaId: ID!) {
  ipRewardSummary(id: $ipaId) {
    tokenToIpTreasury
    treasuryFlushedAmount
  }
}
```

**Note:** `tokenToIpTreasury` is the amount allocated during harvest. `treasuryFlushedAmount` is the amount actually transferred to the treasury address. The difference (`tokenToIpTreasury - treasuryFlushedAmount`) represents tokens pending flush.

### 8. Airdrop Distribution (by token)

```graphql
query AirdropByToken($token: ID!) {
  tokenRewardSummary(id: $token) {
    airdropTokenClaimed
    airdropWipClaimed
    airdropClaimCount
  }
}
```

### 9. Airdrop Distribution (by address)

Returns all airdrop claims for a specific recipient wallet.

```graphql
query AirdropByAddress($recipient: String!) {
  airdropClaimEvents(
    where: { recipient: $recipient }
    orderBy: timestamp
    orderDirection: desc
    first: 100
  ) {
    token
    tokenAmount
    wethAmount
    timestamp
    transactionHash
  }
}
```

### 10. Airdrop Distribution (by token + address)

```graphql
query AirdropByTokenAndAddress($token: String!, $recipient: String!) {
  airdropClaimEvents(
    where: { token: $token, recipient: $recipient }
    orderBy: timestamp
    orderDirection: desc
  ) {
    tokenAmount
    wethAmount
    timestamp
    transactionHash
  }
}
```

### 11. Total WIP Breakdown (by token)

Returns the full WIP distribution breakdown for a specific token.

```graphql
query WipBreakdownByToken($token: ID!) {
  tokenRewardSummary(id: $token) {
    wipCollected
    wipToIpOwner
    wipToBuyback
    wipToAirdrop
    wipToProtocol
    harvestCount
  }
}
```

**Invariant:** `wipCollected = wipToIpOwner + wipToBuyback + wipToAirdrop + wipToProtocol`

### 12. Total Token & WIP Amount (global)

Returns the global totals across all tokens and IPs.

```graphql
query GlobalTotals {
  globalRewardSummary(id: "global") {
    vestingTotalAmount
    vestingClaimedAmount
    tokenCollected
    tokenToIpTreasury
    tokenToAirdrop
    wipCollected
    wipToIpOwner
    wipToBuyback
    wipToAirdrop
    wipToProtocol
    treasuryFlushedAmount
    airdropTokenClaimed
    airdropWipClaimed
    lpFeeWeth
    lpFeeToken
    ethDeposited
    harvestCount
    airdropClaimCount
  }
}
```

### 13. LP Fee Collection (by token)

```graphql
query LpFeesByToken($token: ID!) {
  tokenRewardSummary(id: $token) {
    lpFeeWeth
    lpFeeToken
  }
}
```

### 14. Full IP Dashboard

Returns all reward metrics for a single IP Asset in one query.

```graphql
query IpDashboard($ipaId: ID!) {
  ipRewardSummary(id: $ipaId) {
    tokenCount
    vestingTotalAmount
    vestingClaimedAmount
    vestingClaimedEthAmount
    harvestCount
    tokenCollected
    tokenToIpTreasury
    tokenToAirdrop
    wipCollected
    wipToIpOwner
    wipToBuyback
    wipToAirdrop
    wipToProtocol
    treasuryFlushedAmount
    airdropTokenClaimed
    airdropWipClaimed
    airdropClaimCount
    lpFeeWeth
    lpFeeToken
    ethDeposited
    lastUpdatedBlock
    lastUpdatedTimestamp
  }
}
```

### 15. Token-to-IP Mapping

Returns which tokens belong to a specific IP Asset.

```graphql
query TokensByIp($ipaId: String!) {
  ipTokenLinks(where: { ipaId: $ipaId }) {
    token
    timestamp
    transactionHash
  }
}
```

---

## Entity Reference

### Event Entities (Immutable Logs)

These entities store individual event records. Each event creates a new entity that is never modified.

#### HarvestDistributedEvent

Records the detailed fee distribution when `harvest()` is called on IPWorld.

| Field | Type | Description |
|-------|------|-------------|
| `id` | ID | `{txHash}#{logIndex}` |
| `token` | String | Token address |
| `tokenCollected` | BigInt | Total tokens collected from LP fees |
| `tokenToIpTreasury` | BigInt | Tokens allocated to ipTreasury |
| `tokenToAirdrop` | BigInt | Tokens allocated to airdrop pool (UGC) |
| `wethCollected` | BigInt | Total WETH collected from LP fees |
| `wethToIpOwner` | BigInt | WETH distributed to IP Owner |
| `wethToBuyback` | BigInt | WETH used for Bid Wall / LP re-add |
| `wethToAirdrop` | BigInt | WETH allocated to airdrop pool (UGC) |
| `wethToProtocol` | BigInt | **Computed field.** WETH to protocol treasury = `wethCollected - wethToIpOwner - wethToBuyback - wethToAirdrop` |
| `blockNumber` | BigInt | Block number |
| `timestamp` | BigInt | Block timestamp |
| `transactionHash` | String | Transaction hash |

**Notes:**
- `tokenToAirdrop` and `wethToAirdrop` are mapped from the on-chain `tokenToUgc` and `wethToUgc` parameters.
- For the 1st LP position: `wethToIpOwner = 0`, `wethToBuyback = 0`, `wethToAirdrop = 0`, so `wethToProtocol = wethCollected` (100% goes to protocol).
- Both `HarvestEvent` (legacy) and `HarvestDistributedEvent` (new) may be emitted in the same transaction for backward compatibility.

#### AirdropClaimEvent

Records when a user claims their airdrop allocation.

| Field | Type | Description |
|-------|------|-------------|
| `id` | ID | `{txHash}#{logIndex}` |
| `token` | String | Token address |
| `recipient` | String | Recipient wallet address |
| `tokenAmount` | BigInt | Token amount claimed |
| `wethAmount` | BigInt | WETH amount claimed |
| `blockNumber` | BigInt | Block number |
| `timestamp` | BigInt | Block timestamp |
| `transactionHash` | String | Transaction hash |

**Notes:**
- Multiple recipients can claim in the same transaction; each gets a separate entity.
- Both `token` and `recipient` are indexed on-chain for efficient filtering.

#### TreasuryFlushEvent

Records when accumulated tokens are actually transferred to the ipTreasury address.

| Field | Type | Description |
|-------|------|-------------|
| `id` | ID | `{txHash}#{logIndex}` |
| `token` | String | Token address |
| `treasury` | String | Treasury wallet address |
| `amount` | BigInt | Token amount transferred |
| `blockNumber` | BigInt | Block number |
| `timestamp` | BigInt | Block timestamp |
| `transactionHash` | String | Transaction hash |

**Notes:**
- `HarvestDistributed.tokenToIpTreasury` records the *allocation* at harvest time. `TreasuryFlushed.amount` records the *actual transfer*. The difference is the pending amount.
- If ipTreasury is not set for an IPA, tokens accumulate in `pendingTreasury` and this event does not fire.

#### IpTokenLink

Maps the relationship between an IP Asset (IPA) and its token.

| Field | Type | Description |
|-------|------|-------------|
| `id` | ID | `{ipaId}-{token}` (composite key) |
| `ipaId` | String | IP Asset address |
| `token` | String | Token address |
| `blockNumber` | BigInt | Block number |
| `timestamp` | BigInt | Block timestamp |
| `transactionHash` | String | Transaction hash |

**Notes:**
- The composite key ensures no duplicate mappings. Re-linking overwrites the existing entity.
- This entity is the bridge for all "by IP" aggregations: `token → IpTokenLink → ipaId`.

#### LiquidityCollectedEvent

Records when LP fees are collected from a Uniswap V3 pool.

| Field | Type | Description |
|-------|------|-------------|
| `id` | ID | `{txHash}#{logIndex}` |
| `pool` | String | Pool address |
| `tickLower` | BigInt | Position lower tick (converted from int24) |
| `tickUpper` | BigInt | Position upper tick (converted from int24) |
| `wethAmount` | BigInt | WETH amount collected |
| `tokenAmount` | BigInt | Token amount collected |
| `blockNumber` | BigInt | Block number |
| `timestamp` | BigInt | Block timestamp |
| `transactionHash` | String | Transaction hash |

#### VestingReleaseEvent

Records when vested tokens are released from IPOwnerVault.

| Field | Type | Description |
|-------|------|-------------|
| `id` | ID | `{txHash}#{logIndex}` |
| `token` | String | Token address |
| `amount` | BigInt | Released token amount |
| `blockNumber` | BigInt | Block number |
| `timestamp` | BigInt | Block timestamp |
| `transactionHash` | String | Transaction hash |

**Notes:**
- This is separate from the legacy `VestedTokensAndEthClaimed` event. `ReleasedVested` tracks pure vesting token releases only.

#### EthDepositEvent

Records when ETH (WIP) is deposited into the IPOwnerVault.

| Field | Type | Description |
|-------|------|-------------|
| `id` | ID | `{txHash}#{logIndex}` |
| `token` | String | Associated token address (identifies which token's harvest generated this deposit) |
| `amount` | BigInt | ETH amount deposited |
| `blockNumber` | BigInt | Block number |
| `timestamp` | BigInt | Block timestamp |
| `transactionHash` | String | Transaction hash |

**Notes:**
- Corresponds to `HarvestDistributed.wethToIpOwner` from the IPWorld perspective.

---

### Aggregation Entities (Pre-computed Summaries)

These entities are updated in real-time by every event handler. They provide instant access to aggregated metrics without client-side computation.

#### TokenRewardSummary

Pre-computed reward totals for a single token. **ID = token address.**

| Field | Type | Description |
|-------|------|-------------|
| `id` | ID | Token address |
| `ipaId` | String (nullable) | Linked IP Asset address (set by `Linked` event) |
| `vestingTotalAmount` | BigInt | Total vesting amount from `VestingScheduleCreated` |
| `vestingClaimedAmount` | BigInt | Claimed vesting from `ReleasedVested` + `VestedTokensAndEthClaimed` |
| `vestingClaimedEthAmount` | BigInt | Claimed ETH from `VestedTokensAndEthClaimed` |
| `harvestCount` | BigInt | Number of `HarvestDistributed` events |
| `tokenCollected` | BigInt | Cumulative `HarvestDistributed.tokenCollected` |
| `tokenToIpTreasury` | BigInt | Cumulative `HarvestDistributed.tokenToIpTreasury` |
| `tokenToAirdrop` | BigInt | Cumulative `HarvestDistributed.tokenToUgc` |
| `wipCollected` | BigInt | Cumulative `HarvestDistributed.wethCollected` |
| `wipToIpOwner` | BigInt | Cumulative `HarvestDistributed.wethToIpOwner` |
| `wipToBuyback` | BigInt | Cumulative `HarvestDistributed.wethToBuyback` |
| `wipToAirdrop` | BigInt | Cumulative `HarvestDistributed.wethToUgc` |
| `wipToProtocol` | BigInt | Cumulative computed protocol treasury WIP |
| `treasuryFlushedAmount` | BigInt | Cumulative `TreasuryFlushed.amount` |
| `airdropTokenClaimed` | BigInt | Cumulative `AirdropClaimed.tokenAmount` |
| `airdropWipClaimed` | BigInt | Cumulative `AirdropClaimed.wethAmount` |
| `airdropClaimCount` | BigInt | Number of `AirdropClaimed` events |
| `lpFeeWeth` | BigInt | Cumulative `LiquidityCollected.wethAmount` |
| `lpFeeToken` | BigInt | Cumulative `LiquidityCollected.tokenAmount` |
| `ethDeposited` | BigInt | Cumulative `EthDeposited.amount` |
| `lastUpdatedBlock` | BigInt | Last update block number |
| `lastUpdatedTimestamp` | BigInt | Last update timestamp |

#### IpRewardSummary

Pre-computed reward totals for a single IP Asset, aggregated across all tokens linked to that IP. **ID = ipaId address.**

| Field | Type | Description |
|-------|------|-------------|
| `id` | ID | IP Asset (IPA) address |
| `tokenCount` | BigInt | Number of tokens linked to this IP |
| *(all fields from TokenRewardSummary except ipaId)* | | Same fields, aggregated across all tokens for this IP |

#### GlobalRewardSummary

Pre-computed reward totals across all tokens and IPs. Singleton entity. **ID = "global".**

| Field | Type | Description |
|-------|------|-------------|
| `id` | ID | Always `"global"` |
| *(all fields from TokenRewardSummary except ipaId)* | | Same fields, aggregated across all tokens globally |

---

### Helper Entities

#### PoolTokenMap

Reverse mapping from pool address to token address. Used internally by the `LiquidityCollected` handler to look up which token a pool belongs to.

| Field | Type | Description |
|-------|------|-------------|
| `id` | ID | Pool address |
| `token` | String | Token address |

Created automatically when `TokenDeployed` event is indexed.

---

## Entity Relationship Diagram

```
TokenDeployed ──→ PoolTokenMap (pool → token)
       │
       ↓
    Linked ──→ IpTokenLink (ipaId ↔ token)
       │
       ↓
   ┌──────────────────────────────────────────┐
   │         Event Flow (per token)           │
   │                                          │
   │  HarvestDistributed ──→ wethToIpOwner    │
   │         │                   │            │
   │         ├──→ tokenToIpTreasury           │
   │         │         │                      │
   │         │    TreasuryFlushed (actual)     │
   │         │                                │
   │         ├──→ wethToAirdrop               │
   │         │         │                      │
   │         │    AirdropClaimed (by address)  │
   │         │                                │
   │         ├──→ wethToBuyback               │
   │         └──→ wethToProtocol (computed)   │
   │                                          │
   │  LiquidityCollected ──→ LP fees          │
   │  VestingScheduleCreated ──→ vesting      │
   │  ReleasedVested ──→ claimed vesting      │
   │  EthDeposited ──→ vault WIP deposits     │
   └──────────────────────────────────────────┘
       │
       ↓ (real-time aggregation)
   ┌──────────────────────────────────────────┐
   │  TokenRewardSummary  (id = token)        │
   │  IpRewardSummary     (id = ipaId)        │
   │  GlobalRewardSummary (id = "global")     │
   └──────────────────────────────────────────┘
```

---

## Important Notes

### WIP Invariant

For every `HarvestDistributed` event:

```
wethCollected = wethToIpOwner + wethToBuyback + wethToAirdrop + wethToProtocol
```

This invariant holds at both the individual event level and the summary level.

### 1st LP vs 2nd+ LP Behavior

When only the initial LP position exists (1st LP):
- `wethToIpOwner = 0`
- `wethToBuyback = 0`
- `wethToAirdrop = 0`
- `wethToProtocol = wethCollected` (100% goes to protocol)

After additional LP positions are created (2nd+ LP), fees are distributed proportionally.

### Legacy Compatibility

The original `Harvest` event and `HarvestEvent` entity continue to work alongside the new `HarvestDistributed` / `HarvestDistributedEvent`. Both may be emitted in the same transaction. Frontend should use `HarvestDistributedEvent` for detailed breakdown and `HarvestEvent` for historical data indexed before the contract upgrade.

### All Values in Wei

All `BigInt` amounts are in wei (10^18). Frontend should divide by `10^18` for human-readable display.

### RPC-Only Data

The following data points require direct RPC calls and cannot be obtained from the subgraph:

| Function | Contract | Purpose |
|----------|----------|---------|
| `remaining(token)` | IPOwnerVault | Current locked vesting balance |
| `released(token)` | IPOwnerVault | Total released amount |
| `releasable(token)` | IPOwnerVault | Currently claimable amount |
| `pendingTreasury(token)` | IPWorld | Tokens waiting for treasury flush |
| `referral(ipaId)` | IPWorld | Referral address for an IP |
| `ipTreasury(ipaId)` | IPWorld | Treasury address for an IP |
