# StoryHunt Rewards & Fees Integration Guide

**Subgraph**: `storyhunt-subgraph-new/v2.0.3-test`
**Network**: Story Aeneid (story-aeneid)
**Endpoint**:
```
https://api.goldsky.com/api/public/project_cm62xvsdx4gdo01yyhwbw7rsy/subgraphs/storyhunt-subgraph-new/v2.0.3-test/gn
```

---

## Table of Contents

1. [Item Reference](#1-item-reference)
2. [Section A: Reward Totals](#2-section-a-reward-totals)
3. [Section B: Harvest Fees](#3-section-b-harvest-fees)
4. [Section C: Vesting](#4-section-c-vesting)
5. [Section D: UGC Claims](#5-section-d-ugc-claims)
6. [Section E: Relationships](#6-section-e-relationships)
7. [TypeScript Types](#7-typescript-types)
8. [GraphQL Queries](#8-graphql-queries)
9. [Data Parsing with viem](#9-data-parsing-with-viem)
10. [Real Examples](#10-real-examples)

---

## 1. Item Reference

### Quick Map

| Section | ID | Name | Scope | A/B |
|---------|-----|------|-------|:---:|
| **A** | A1 | Total Rewards | Global | O |
| | A2 | Total Rewards | Per Token | O |
| | A3 | Total Rewards | Per IP | O |
| | A4 | IP Owner Rewards | Per Token | O |
| | A5 | IP Owner Rewards | Per IP | O |
| | A6 | Protocol Fees | Global | X |
| | A7 | Protocol Fees | Per Token | X |
| **B** | B1 | IP Owner $IP Fees | Token/IP/Global | X |
| | B2 | UGC Memecoin Fees | Token/IP/Global | X |
| | B3 | UGC $IP Fees | Token/IP/Global | X |
| | B4 | Treasury Memecoin Fees | Token/IP/Global | X |
| | B5 | Referral $IP Fees | Token/IP/Global | X |
| **C** | C1 | Vesting Schedule | Per Token | - |
| | C2 | Vesting Total | Per Token | - |
| | C3 | Vesting Claimed | Per Token | - |
| **D** | D1 | UGC Memecoin Claimed | Per Wallet | X |
| | D2 | UGC $IP Claimed | Per Wallet | X |
| **E** | E1 | Token-IP Link | Per Token | - |

### Formulas

```
A (totalRewardsUSD)   = C3_USD + B1 + B2 + B3 + B4 + B5 + A6 + buyback
A (ipOwnerRewardsUSD) = C3_USD + B1
```

### What is NOT in totalRewardsUSD

| Item | Reason |
|------|--------|
| D1/D2 UGC Claimed | Already counted at pool entry time via B2/B3 |
| C2 Vesting Total | Raw metadata, not USD |
| B variation unrealized | Frontend computes, not stored |

---

## 2. Section A: Reward Totals

### A1. Total Rewards (Global)

**What it is**: Total USD rewards distributed across all tokens and all time.

**Field**: `globalRewardSummary.totalRewardsUSD`

**Includes**:
- C3: Claimed vesting memecoin (claim-time memecoin price)
- B1: IP Owner $IP fees (harvest-time $IP price)
- B2: UGC memecoin fees entering airdrop pool (harvest-time memecoin price)
- B3: UGC $IP fees entering airdrop pool (harvest-time $IP price)
- B4: Treasury memecoin fees (flush/harvest-time memecoin price)
- B5: Referral $IP fees (harvest-time $IP price)
- A6: Protocol $IP fees (harvest-time $IP price)
- Buyback: WIP buyback for bid wall repositioning (harvest-time $IP price)

**Does NOT include**:
- UGC claimed amounts (D1/D2) — already counted when entering pool (B2/B3)
- Unrealized vesting — frontend computes B variation

**Price timing**: Each component uses the price at the time of its respective event.

**A variation** (stored): `totalRewardsUSD` field directly.

**B variation** (frontend computed):
```
B = totalRewardsUSD + sum_all_tokens(unrealizedVestingUSD)
```

**Input example** (GraphQL):
```graphql
{
  globalRewardSummary(id: "global") {
    totalRewardsUSD
  }
}
```

**Output example**:
```json
{
  "data": {
    "globalRewardSummary": {
      "totalRewardsUSD": "16.29934432115743600555052741325543"
    }
  }
}
```

**Parsed result**: `$16.30`

---

### A2. Total Rewards (Per Token)

Same formula as A1 but scoped to a single token.

**Field**: `tokenRewardSummary.totalRewardsUSD`

**Input**:
```graphql
{
  tokenRewardSummary(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") {
    totalRewardsUSD
  }
}
```

**Output**: `"10.12947187083848564596814794371668"` → `$10.13`

---

### A3. Total Rewards (Per IP)

Same formula as A1 but scoped to a single IP. Aggregated from all tokens linked to this IP.

**Field**: `ipRewardSummary.totalRewardsUSD`

**Input**:
```graphql
{
  ipRewardSummary(id: "0x38b9704c8586eb85987d18ce3570d80935c816a9") {
    totalRewardsUSD
  }
}
```

**Output**: `"10.12947187083848564596814794371668"` → `$10.13`

---

### A4/A5. IP Owner Rewards (Per Token / Per IP)

**What it is**: Rewards attributable specifically to the IP owner.

**Field**: `.ipOwnerRewardsUSD`

**Includes**:
- C3: Claimed vesting memecoin USD
- B1: IP Owner $IP fees

**Does NOT include**:
- B4 Treasury fees — treasury is a separate entity, not the IP owner
- B2/B3 UGC fees — community rewards, not IP owner
- B5 Referral — referrer's reward, not IP owner

**Formula**: `ipOwnerRewardsUSD = vestingClaimedAmountUSD + wipToIpOwnerUSD`

**Input**:
```graphql
{
  tokenRewardSummary(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") {
    ipOwnerRewardsUSD
    vestingClaimedAmountUSD
    wipToIpOwnerUSD
  }
}
```

**Output**:
```json
{
  "ipOwnerRewardsUSD": "0.4334108000183488670849191640839498",
  "vestingClaimedAmountUSD": "0.4334108000183488670849191640839498",
  "wipToIpOwnerUSD": "0"
}
```

**Verify**: `0.4334 + 0 = 0.4334` ✓

---

### A6/A7. Protocol Fees (Global / Per Token)

**What it is**: $IP fees going to the protocol treasury.

**Field**: `.wipToProtocolUSD`

**Includes**:
- $IP remaining after IP owner share, buyback, airdrop, and referral deductions

**Does NOT include**:
- Memecoin fees (those go to treasury via B4 or airdrop via B2)
- 1st LP harvest (100% goes directly to protocol treasury, no HarvestDistributed event fields)

**Calculation**: `wipToProtocol = wethCollected - wethToIpOwner - wethToBuyback - wethToUgc - referralAmount`

**Price timing**: Harvest-time $IP price

**When referral exists**: Protocol share is reduced by `referralShare` (2.5%)

**Input**:
```graphql
{
  globalRewardSummary(id: "global") { wipToProtocolUSD }
  tokenRewardSummary(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") { wipToProtocolUSD }
}
```

**Output**:
```json
{
  "global": { "wipToProtocolUSD": "51.081176423648769894" },
  "token": { "wipToProtocolUSD": "33.5549999999999999955" }
}
```

---

## 3. Section B: Harvest Fees

All B items are accumulated from blockchain events. Each has a raw BigInt field and a USD BigDecimal field. All exist at 3 levels: Token, IP, Global.

### B1. IP Owner $IP Fees

**What it is**: Accumulated $IP (WIP) fees sent to IP owner via harvest.

**Source event**: `HarvestDistributed` → `wethToIpOwner` field

**Fields**: `.wipToIpOwner` (raw), `.wipToIpOwnerUSD` (USD)

**Price timing**: Harvest-time $IP price via `wipToUSD()`

**Includes**: $IP distributed to IP owner during LP2+ harvests only

**Does NOT include**:
- 1st LP harvest (100% goes to protocol treasury)
- $IP claimed from vesting (that's C3)

**When it occurs**: Only after bonding curve completes (LP2+)

**Input**:
```graphql
{
  tokenRewardSummary(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") {
    wipToIpOwner
    wipToIpOwnerUSD
  }
}
```

**Output**:
```json
{
  "wipToIpOwner": "0",
  "wipToIpOwnerUSD": "0"
}
```

Note: `0` because this token has only had 1st LP harvests or no $IP distribution to IP owner yet.

---

### B2. UGC Memecoin Fees

**What it is**: Memecoin fees allocated to the UGC/airdrop pool.

**Source event**: `HarvestDistributed` → `tokenToUgc` field

**Fields**: `.tokenToAirdrop` (raw), `.tokenToAirdropUSD` (USD)

**Price timing**: Harvest-time memecoin price via `tokenToUSD()`

**Includes**: Memecoin entering the airdrop pool at each harvest

**Does NOT include**: Actual user withdrawals (that's D1)

**Important**: This tracks fees ENTERING the pool. D1 tracks fees LEAVING the pool to wallets. Using both in totalRewardsUSD would double-count.

**Input**:
```graphql
{
  tokenRewardSummary(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") {
    tokenToAirdrop
    tokenToAirdropUSD
  }
}
```

**Output**:
```json
{
  "tokenToAirdrop": "159340833224614064265625",
  "tokenToAirdropUSD": "1.212007633852517097360399794261873"
}
```

**Parsed**: `159,340.83` tokens → `$1.21`

---

### B3. UGC $IP Fees

**What it is**: $IP fees allocated to the UGC/airdrop pool.

**Source event**: `HarvestDistributed` → `wethToUgc` field

**Fields**: `.wipToAirdrop` (raw), `.wipToAirdropUSD` (USD)

**Price timing**: Harvest-time $IP price

**Same inclusion/exclusion logic as B2** but for $IP instead of memecoin.

**Output**: Currently `"0"` for test token (no $IP airdrop distribution yet).

---

### B4. Treasury Memecoin Fees

**What it is**: Memecoin fees sent to IP-specific treasury.

**Source event**: `TreasuryFlushed` ONLY

**Fields**: `.tokenToIpTreasury` (raw), `.tokenToIpTreasuryUSD` (USD)

**Price timing**: Flush-time memecoin price via `tokenToUSD()`

**Critical behavior**:
- When `ipTreasury` is NOT set: memecoin goes to `pendingTreasury`, `HarvestDistributed` emits `tokenToIpTreasury = 0`
- When `ipTreasury` IS first set: next harvest flushes pending via `TreasuryFlushed` (one-time) + emits current via `HarvestDistributed`
- After flush: `pendingTreasury = 0`, all subsequent harvests emit real values via `HarvestDistributed` only (no more `TreasuryFlushed`)

**Price timing**:
- Pending flush (one-time): flush-time memecoin price via `TreasuryFlushed`
- All subsequent harvests: harvest-time memecoin price via `HarvestDistributed`

**Does NOT include**: Memecoin that's still in `pendingTreasury` (not yet flushed)

**Input**:
```graphql
{
  tokenRewardSummary(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") {
    tokenToIpTreasury
    tokenToIpTreasuryUSD
  }
}
```

**Output**:
```json
{
  "tokenToIpTreasury": "1115385832572298449859379",
  "tokenToIpTreasuryUSD": "8.484053436967619681522828985370859"
}
```

**Parsed**: `1,115,385.83` tokens → `$8.48`

---

### B5. Referral $IP Fees

**What it is**: $IP fees paid to the referrer of an IP.

**Source event**: `ReferralFeePaid`

**Fields**: `.referralWipAmount` (raw), `.referralWipAmountUSD` (USD)

**Price timing**: Harvest-time $IP price

**When it occurs**:
- Only when `referral[ipaId] != address(0)` (referral was set during `claimIp()`)
- Only during LP2+ harvests
- Referral share = 2.5% of total $IP collected

**Does NOT occur**: When no referral is set → `referralAmount = 0`, full amount goes to protocol treasury

**Scope**: Token + IP + Global levels

**Output**: Currently `"0"` for test tokens (no referral set).

---

## 4. Section C: Vesting

### Overview

IP owners receive a 2-3% memecoin allocation that vests linearly over ~6 months. The subgraph stores the vesting metadata and claimed amounts. The frontend computes the current vested/unvested breakdown using Pyth price.

### C1. Vesting Schedule

**Fields**: `.vestingStart` (uint64 timestamp), `.vestingEnd` (uint64 timestamp)

**Source event**: `VestingScheduleCreated`

**When set**: After IP verification (when `createVestingOnTokenDeploy` is called during first harvest after IP claim)

**Input**:
```graphql
{
  tokenRewardSummary(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") {
    vestingStart
    vestingEnd
  }
}
```

**Output**:
```json
{
  "vestingStart": "1772074866",
  "vestingEnd": "1787626866"
}
```

**Parsed**: `2026-02-26 03:01 UTC` → `2026-08-25 03:01 UTC` (180 days)

---

### C2. Vesting Total Allocation

**Field**: `.vestingTotalAmount` (raw BigInt, 18 decimals)

**Source event**: `VestingScheduleCreated` → `totalAmount`

**Input**:
```graphql
{
  tokenRewardSummary(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") {
    vestingTotalAmount
  }
}
```

**Output**: `"30000000000000000000000425"` → `30,000,000.00` tokens

---

### C3. Vesting Claimed

**Fields**:
- `.vestingClaimedAmount` — raw BigInt (token units)
- `.vestingClaimedAmountUSD` — BigDecimal (claim-time price)

**Source events**: `VestedTokensAndEthClaimed` + `ReleasedVested`

**Price timing**: Claim-time memecoin price via `tokenToUSD()`

**Important**: `vestingClaimedAmountUSD` is used in the `totalRewardsUSD` formula. This is the A variation value for vesting.

**Input**:
```graphql
{
  tokenRewardSummary(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") {
    vestingClaimedAmount
    vestingClaimedAmountUSD
  }
}
```

**Output**:
```json
{
  "vestingClaimedAmount": "45023148148148148148148",
  "vestingClaimedAmountUSD": "0.4334108000183488670849191640839498"
}
```

**Parsed**: `45,023.15` tokens claimed → `$0.43`

---

### B Variation Calculation (Frontend)

Using C1 + C2 + C3 + Pyth memecoin price:

```typescript
import { formatUnits } from 'viem'

function computeBVariation(
  totalRewardsUSD: number,       // A value from subgraph
  vestingTotalAmount: bigint,    // C2 raw
  vestingClaimedAmount: bigint,  // C3 raw
  vestingStart: number,          // C1 timestamp
  vestingEnd: number,            // C1 timestamp
  pythMemePrice: number,         // current price from Pyth
): { a: number; b: number; unrealized: number } {
  const now = Math.floor(Date.now() / 1000)

  if (vestingTotalAmount === 0n || vestingStart === 0 || vestingEnd === 0) {
    return { a: totalRewardsUSD, b: totalRewardsUSD, unrealized: 0 }
  }

  // Linear vesting, no cliff
  let vested: bigint
  if (now < vestingStart) vested = 0n
  else if (now >= vestingEnd) vested = vestingTotalAmount
  else vested = vestingTotalAmount * BigInt(now - vestingStart) / BigInt(vestingEnd - vestingStart)

  const unclaimed = vested - vestingClaimedAmount
  const unvested = vestingTotalAmount - vested
  const unrealizedTokens = unclaimed + unvested // total not-yet-realized

  const unrealizedUSD = Number(formatUnits(unrealizedTokens, 18)) * pythMemePrice
  const b = totalRewardsUSD + unrealizedUSD

  return { a: totalRewardsUSD, b, unrealized: unrealizedUSD }
}
```

**Input example** (from real data):
```typescript
computeBVariation(
  10.13,                                    // totalRewardsUSD
  30000000000000000000000425n,              // vestingTotalAmount
  45023148148148148148148n,                 // vestingClaimedAmount
  1772074866,                               // vestingStart
  1787626866,                               // vestingEnd
  0.0000005,                                // pythMemePrice (example)
)
```

**Output example**:
```typescript
{
  a: 10.13,
  b: 25.10,         // depends on current time + price
  unrealized: 14.97
}
```

---

## 5. Section D: UGC Claims

### D1. UGC Memecoin Claimed (Per Wallet)

**What it is**: Total memecoin airdrop claimed by a specific wallet.

**Source event**: `AirdropClaimed` → `tokenAmount`

**Fields**: `.memeTokenClaimed` (raw), `.memeTokenClaimedUSD` (USD)

**Price timing**: Claim-time memecoin price

**Entity**: `WalletUgcSummary` (id = wallet address, lowercase)

**NOT in totalRewardsUSD**: D1 tracks outflow from the airdrop pool. B2 already tracks inflow. Including both would double-count.

---

### D2. UGC $IP Claimed (Per Wallet)

**What it is**: Total $IP airdrop claimed by a specific wallet.

**Source event**: `AirdropClaimed` → `wethAmount`

**Fields**: `.wipClaimed` (raw), `.wipClaimedUSD` (USD)

**Price timing**: Claim-time $IP price

Same entity and logic as D1 but for $IP.

---

### D1+D2 Combined Query

**Input**:
```graphql
{
  walletUgcSummary(id: "0x1234...abcd") {
    memeTokenClaimed
    memeTokenClaimedUSD
    wipClaimed
    wipClaimedUSD
    claimCount
    lastClaimedTimestamp
  }
}
```

**Output** (when no claims exist):
```json
{
  "data": {
    "walletUgcSummary": null
  }
}
```

`null` means this wallet has never claimed. Treat as all zeros.

---

## 6. Section E: Relationships

### E1. Token → IP Link

**Field**: `tokenRewardSummary.ipaId`

- `null` → token is not linked to any IP
- `"0x38b9..."` → linked to this IP

### E2. IP → Token List

**Input**:
```graphql
{
  ipTokenLinks(where: { ipaId: "0x38b9704c8586eb85987d18ce3570d80935c816a9" }) {
    token
    timestamp
  }
}
```

**Output**:
```json
{
  "data": {
    "ipTokenLinks": [
      { "token": "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24", "timestamp": "1772074866" }
    ]
  }
}
```

### E3. IP Token Count

**Field**: `ipRewardSummary.tokenCount`

---

## 7. TypeScript Types

```typescript
// All BigInt fields from subgraph come as string
// All BigDecimal fields from subgraph come as string

interface TokenRewardSummary {
  id: string                     // token address (lowercase)
  ipaId: string | null           // linked IP address or null

  // Section C: Vesting
  vestingTotalAmount: string     // BigInt (18 decimals)
  vestingClaimedAmount: string   // BigInt (18 decimals)
  vestingStart: string           // BigInt (unix timestamp)
  vestingEnd: string             // BigInt (unix timestamp)
  vestingClaimedAmountUSD: string // BigDecimal

  // Section B: Harvest fees
  harvestCount: string           // BigInt
  tokenCollected: string         // BigInt (reference only)
  tokenToIpTreasury: string      // BigInt - B4 raw
  tokenToAirdrop: string         // BigInt - B2 raw
  wipCollected: string           // BigInt (reference only)
  wipToIpOwner: string           // BigInt - B1 raw
  wipToBuyback: string           // BigInt (reference only)
  wipToAirdrop: string           // BigInt - B3 raw
  wipToProtocol: string          // BigInt - A7 raw
  referralWipAmount: string      // BigInt - B5 raw

  // USD values
  tokenCollectedUSD: string      // reference only
  tokenToIpTreasuryUSD: string   // B4
  tokenToAirdropUSD: string      // B2
  wipCollectedUSD: string        // reference only
  wipToIpOwnerUSD: string        // B1
  wipToBuybackUSD: string        // reference only
  wipToAirdropUSD: string        // B3
  wipToProtocolUSD: string       // A7
  referralWipAmountUSD: string   // B5

  // Section A: Aggregates
  totalRewardsUSD: string        // A2
  ipOwnerRewardsUSD: string      // A4

  // Meta
  lastUpdatedBlock: string
  lastUpdatedTimestamp: string
}

interface IpRewardSummary {
  id: string                     // ipaId address (lowercase)
  tokenCount: string             // E3

  // Same fields as TokenRewardSummary
  // (omitted for brevity — identical structure)

  totalRewardsUSD: string        // A3
  ipOwnerRewardsUSD: string      // A5
  referralWipAmountUSD: string   // B5 aggregated = item #14 per IP
}

interface GlobalRewardSummary {
  id: string                     // always "global"
  // Same fields as TokenRewardSummary minus ipaId
  totalRewardsUSD: string        // A1
  wipToProtocolUSD: string       // A6
}

interface WalletUgcSummary {
  id: string                     // wallet address (lowercase)
  memeTokenClaimed: string       // BigInt - D1 raw
  memeTokenClaimedUSD: string    // D1
  wipClaimed: string             // BigInt - D2 raw
  wipClaimedUSD: string          // D2
  claimCount: string
  lastClaimedTimestamp: string
}

interface IpTokenLink {
  id: string                     // "{ipaId}-{token}"
  ipaId: string
  token: string
  blockNumber: string
  timestamp: string
  transactionHash: string
}
```

---

## 8. GraphQL Queries

### Single Entity Queries

```graphql
# Global
{
  globalRewardSummary(id: "global") {
    totalRewardsUSD
    ipOwnerRewardsUSD
    wipToProtocolUSD
    vestingClaimedAmountUSD
    wipToIpOwnerUSD
    tokenToAirdropUSD
    wipToAirdropUSD
    tokenToIpTreasuryUSD
    referralWipAmountUSD
    harvestCount
    lastUpdatedTimestamp
  }
}
```

```graphql
# Token
{
  tokenRewardSummary(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") {
    id
    ipaId
    totalRewardsUSD
    ipOwnerRewardsUSD
    vestingClaimedAmountUSD
    wipToIpOwnerUSD
    tokenToAirdropUSD
    wipToAirdropUSD
    tokenToIpTreasuryUSD
    wipToProtocolUSD
    referralWipAmountUSD
    vestingTotalAmount
    vestingClaimedAmount
    vestingStart
    vestingEnd
    harvestCount
    lastUpdatedTimestamp
  }
}
```

```graphql
# IP
{
  ipRewardSummary(id: "0x38b9704c8586eb85987d18ce3570d80935c816a9") {
    tokenCount
    totalRewardsUSD
    ipOwnerRewardsUSD
    referralWipAmountUSD
    vestingTotalAmount
    vestingClaimedAmount
    vestingStart
    vestingEnd
    harvestCount
  }
}
```

```graphql
# Wallet
{
  walletUgcSummary(id: "0x1234...") {
    memeTokenClaimed
    memeTokenClaimedUSD
    wipClaimed
    wipClaimedUSD
    claimCount
    lastClaimedTimestamp
  }
}
```

### Batch Query (all in one request)

```graphql
{
  global: globalRewardSummary(id: "global") {
    totalRewardsUSD
    ipOwnerRewardsUSD
    wipToProtocolUSD
    harvestCount
    lastUpdatedTimestamp
  }

  token: tokenRewardSummary(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") {
    ipaId
    totalRewardsUSD
    ipOwnerRewardsUSD
    vestingClaimedAmountUSD
    wipToIpOwnerUSD
    tokenToAirdropUSD
    wipToAirdropUSD
    tokenToIpTreasuryUSD
    wipToProtocolUSD
    referralWipAmountUSD
    vestingTotalAmount
    vestingClaimedAmount
    vestingStart
    vestingEnd
    harvestCount
  }

  ip: ipRewardSummary(id: "0x38b9704c8586eb85987d18ce3570d80935c816a9") {
    tokenCount
    totalRewardsUSD
    ipOwnerRewardsUSD
    referralWipAmountUSD
  }

  links: ipTokenLinks(where: { ipaId: "0x38b9704c8586eb85987d18ce3570d80935c816a9" }) {
    token
  }
}
```

### Multiple Tokens in one request

```graphql
{
  token1: tokenRewardSummary(id: "0x8777f2af0c0745ad66f096e67a75e0e8ec9ead71") {
    totalRewardsUSD
    ipOwnerRewardsUSD
    harvestCount
  }

  token2: tokenRewardSummary(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") {
    totalRewardsUSD
    ipOwnerRewardsUSD
    harvestCount
  }
}
```

### List queries

```graphql
# Top tokens by rewards
{
  tokenRewardSummaries(
    first: 20
    orderBy: totalRewardsUSD
    orderDirection: desc
  ) {
    id
    ipaId
    totalRewardsUSD
    ipOwnerRewardsUSD
    harvestCount
  }
}
```

### Apollo Client Setup

```typescript
import { ApolloClient, InMemoryCache, gql } from '@apollo/client'

const client = new ApolloClient({
  uri: 'https://api.goldsky.com/api/public/project_cm62xvsdx4gdo01yyhwbw7rsy/subgraphs/storyhunt-subgraph-new/v2.0.3-test/gn',
  cache: new InMemoryCache(),
})

// React hook example
const REWARDS_QUERY = gql`
  query TokenRewards($token: ID!) {
    tokenRewardSummary(id: $token) {
      totalRewardsUSD
      ipOwnerRewardsUSD
      vestingTotalAmount
      vestingClaimedAmount
      vestingStart
      vestingEnd
    }
  }
`

function useTokenRewards(token: string) {
  return useQuery(REWARDS_QUERY, {
    variables: { token: token.toLowerCase() },
    pollInterval: 30_000, // refresh every 30s
  })
}
```

---

## 9. Data Parsing with viem

```typescript
import { formatUnits, formatEther } from 'viem'

// BigInt string → human-readable token amount (18 decimals)
function parseTokenAmount(raw: string): number {
  return Number(formatUnits(BigInt(raw), 18))
}

// BigDecimal string → number
function parseUSD(raw: string): number {
  return Number(raw)
}

// BigInt string → unix timestamp → Date
function parseTimestamp(raw: string): Date | null {
  const ts = Number(raw)
  return ts === 0 ? null : new Date(ts * 1000)
}

// Format USD for display
function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value)
}

// Usage
const data = queryResult.tokenRewardSummary
const totalRewards = parseUSD(data.totalRewardsUSD)         // 10.129...
const vestingTotal = parseTokenAmount(data.vestingTotalAmount) // 30000000
const vestingStart = parseTimestamp(data.vestingStart)        // Date object
```

---

## 10. Real Examples

All examples use real data from `storyhunt-subgraph-new/v2.0.3-test` on Story Aeneid testnet.

Test addresses used:
- Token (linked, vesting): `0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24`
- Token (unlinked, no vesting): `0x8777f2af0c0745ad66f096e67a75e0e8ec9ead71`
- IP Asset: `0x38b9704c8586eb85987d18ce3570d80935c816a9`

---

### Example 1: Global Total Rewards (A1)

**Query**:
```graphql
{
  globalRewardSummary(id: "global") {
    totalRewardsUSD
  }
}
```

**Response**:
```json
{ "data": { "globalRewardSummary": { "totalRewardsUSD": "16.29934432115743600555052741325543" } } }
```

**Parsed**: `$16.30`

---

### Example 2: Global Full Breakdown (A1 + A6 + components)

**Query**:
```graphql
{
  globalRewardSummary(id: "global") {
    totalRewardsUSD
    ipOwnerRewardsUSD
    wipToProtocolUSD
    vestingClaimedAmountUSD
    wipToIpOwnerUSD
    tokenToAirdropUSD
    wipToAirdropUSD
    tokenToIpTreasuryUSD
    referralWipAmountUSD
    harvestCount
    lastUpdatedTimestamp
  }
}
```

**Response**:
```json
{
  "data": {
    "globalRewardSummary": {
      "totalRewardsUSD": "16.29934432115743600555052741325543",
      "ipOwnerRewardsUSD": "0.4334108000183488670849191640839498",
      "wipToProtocolUSD": "51.081176423648769894",
      "vestingClaimedAmountUSD": "0.4334108000183488670849191640839498",
      "wipToIpOwnerUSD": "0",
      "tokenToAirdropUSD": "1.983241690142385892308197227954216",
      "wipToAirdropUSD": "0",
      "tokenToIpTreasuryUSD": "13.88269183099670124615741102121726",
      "referralWipAmountUSD": "0",
      "harvestCount": "4",
      "lastUpdatedTimestamp": "1772088499"
    }
  }
}
```

**Parsed**:

| Field | Parsed | Item |
|-------|--------|------|
| totalRewardsUSD | $16.30 | A1 |
| ipOwnerRewardsUSD | $0.43 | - |
| wipToProtocolUSD | $51.08 | A6 |
| vestingClaimedAmountUSD | $0.43 | C3 USD |
| wipToIpOwnerUSD | $0.00 | B1 |
| tokenToAirdropUSD | $1.98 | B2 |
| wipToAirdropUSD | $0.00 | B3 |
| tokenToIpTreasuryUSD | $13.88 | B4 |
| referralWipAmountUSD | $0.00 | B5 |
| harvestCount | 4 | - |
| lastUpdatedTimestamp | 2026-02-26 06:48 UTC | - |

**Formula check**: `0.43 + 0 + 1.98 + 0 + 13.88 + 0 = 16.29` ✓

---

### Example 3: Token Rewards — Linked with Vesting (A2 + all B + all C)

**Query**:
```graphql
{
  tokenRewardSummary(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") {
    id
    ipaId
    totalRewardsUSD
    ipOwnerRewardsUSD
    vestingClaimedAmountUSD
    wipToIpOwnerUSD
    tokenToAirdropUSD
    wipToAirdropUSD
    tokenToIpTreasuryUSD
    wipToProtocolUSD
    referralWipAmountUSD
    vestingTotalAmount
    vestingClaimedAmount
    vestingStart
    vestingEnd
    harvestCount
    lastUpdatedTimestamp
  }
}
```

**Response**:
```json
{
  "data": {
    "tokenRewardSummary": {
      "id": "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24",
      "ipaId": "0x38b9704c8586eb85987d18ce3570d80935c816a9",
      "totalRewardsUSD": "10.12947187083848564596814794371668",
      "ipOwnerRewardsUSD": "0.4334108000183488670849191640839498",
      "vestingClaimedAmountUSD": "0.4334108000183488670849191640839498",
      "wipToIpOwnerUSD": "0",
      "tokenToAirdropUSD": "1.212007633852517097360399794261873",
      "wipToAirdropUSD": "0",
      "tokenToIpTreasuryUSD": "8.484053436967619681522828985370859",
      "wipToProtocolUSD": "33.5549999999999999955",
      "referralWipAmountUSD": "0",
      "vestingTotalAmount": "30000000000000000000000425",
      "vestingClaimedAmount": "45023148148148148148148",
      "vestingStart": "1772074866",
      "vestingEnd": "1787626866",
      "harvestCount": "3",
      "lastUpdatedTimestamp": "1772088499"
    }
  }
}
```

**Parsed**:

| Field | Raw | Parsed | Item |
|-------|-----|--------|------|
| ipaId | `"0x38b9..."` | linked | E1 |
| totalRewardsUSD | `"10.129..."` | $10.13 | A2 |
| ipOwnerRewardsUSD | `"0.433..."` | $0.43 | A4 |
| wipToProtocolUSD | `"33.554..."` | $33.55 | A7 |
| vestingClaimedAmountUSD | `"0.433..."` | $0.43 | C3 USD |
| wipToIpOwnerUSD | `"0"` | $0.00 | B1 |
| tokenToAirdropUSD | `"1.212..."` | $1.21 | B2 |
| wipToAirdropUSD | `"0"` | $0.00 | B3 |
| tokenToIpTreasuryUSD | `"8.484..."` | $8.48 | B4 |
| referralWipAmountUSD | `"0"` | $0.00 | B5 |
| vestingTotalAmount | `"30000000000000000000000425"` | 30,000,000 tokens | C2 |
| vestingClaimedAmount | `"45023148148148148148148"` | 45,023 tokens | C3 raw |
| vestingStart | `"1772074866"` | 2026-02-26 03:01 UTC | C1 |
| vestingEnd | `"1787626866"` | 2026-08-25 03:01 UTC | C1 |
| harvestCount | `"3"` | 3 | - |

**Formula check A2**: `0.43 + 0 + 1.21 + 0 + 8.48 + 0 = 10.12` ✓
**Formula check A4**: `0.43 + 0 = 0.43` ✓

---

### Example 4: Token Rewards — Unlinked, No Vesting

**Query**:
```graphql
{
  tokenRewardSummary(id: "0x8777f2af0c0745ad66f096e67a75e0e8ec9ead71") {
    id
    ipaId
    totalRewardsUSD
    ipOwnerRewardsUSD
    vestingClaimedAmountUSD
    wipToIpOwnerUSD
    tokenToAirdropUSD
    wipToAirdropUSD
    tokenToIpTreasuryUSD
    wipToProtocolUSD
    referralWipAmountUSD
    vestingTotalAmount
    vestingClaimedAmount
    vestingStart
    vestingEnd
    harvestCount
  }
}
```

**Response**:
```json
{
  "data": {
    "tokenRewardSummary": {
      "id": "0x8777f2af0c0745ad66f096e67a75e0e8ec9ead71",
      "ipaId": null,
      "totalRewardsUSD": "6.169872450318950359582379469538745",
      "ipOwnerRewardsUSD": "0",
      "vestingClaimedAmountUSD": "0",
      "wipToIpOwnerUSD": "0",
      "tokenToAirdropUSD": "0.7712340562898687949477974336923431",
      "wipToAirdropUSD": "0",
      "tokenToIpTreasuryUSD": "5.398638394029081564634582035846402",
      "wipToProtocolUSD": "17.5261764236487698985",
      "referralWipAmountUSD": "0",
      "vestingTotalAmount": "0",
      "vestingClaimedAmount": "0",
      "vestingStart": "0",
      "vestingEnd": "0",
      "harvestCount": "1"
    }
  }
}
```

**Parsed**: ipaId=null, vesting=(not set), totalRewards=$6.17, protocolFees=$17.53

**Formula check**: `0 + 0 + 0.77 + 0 + 5.40 + 0 = 6.17` ✓

---

### Example 5: Token Raw Harvest Data (all raw fields)

**Query**:
```graphql
{
  tokenRewardSummary(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") {
    tokenCollected
    tokenCollectedUSD
    tokenToIpTreasury
    tokenToIpTreasuryUSD
    tokenToAirdrop
    tokenToAirdropUSD
    wipCollected
    wipCollectedUSD
    wipToIpOwner
    wipToIpOwnerUSD
    wipToBuyback
    wipToBuybackUSD
    wipToAirdrop
    wipToAirdropUSD
    wipToProtocol
    wipToProtocolUSD
    referralWipAmount
    referralWipAmountUSD
  }
}
```

**Response**:
```json
{
  "data": {
    "tokenRewardSummary": {
      "tokenCollected": "1274726665796912514125004",
      "tokenCollectedUSD": "9.696061070820136778883228779632731",
      "tokenToIpTreasury": "1115385832572298449859379",
      "tokenToIpTreasuryUSD": "8.484053436967619681522828985370859",
      "tokenToAirdrop": "159340833224614064265625",
      "tokenToAirdropUSD": "1.212007633852517097360399794261873",
      "wipCollected": "22369999999999999997",
      "wipCollectedUSD": "33.5549999999999999955",
      "wipToIpOwner": "0",
      "wipToIpOwnerUSD": "0",
      "wipToBuyback": "0",
      "wipToBuybackUSD": "0",
      "wipToAirdrop": "0",
      "wipToAirdropUSD": "0",
      "wipToProtocol": "22369999999999999997",
      "wipToProtocolUSD": "33.5549999999999999955",
      "referralWipAmount": "0",
      "referralWipAmountUSD": "0"
    }
  }
}
```

**Parsed raw amounts** (18 decimals):

| Field | Raw | Parsed |
|-------|-----|--------|
| tokenCollected | `1274726665796912514125004` | 1,274,726.67 tokens |
| tokenToIpTreasury | `1115385832572298449859379` | 1,115,385.83 tokens |
| tokenToAirdrop | `159340833224614064265625` | 159,340.83 tokens |
| wipCollected | `22369999999999999997` | 22.37 $IP |
| wipToProtocol | `22369999999999999997` | 22.37 $IP |

**Note**: `tokenCollected = tokenToIpTreasury + tokenToAirdrop` (reference field)
**Note**: `wipCollected = wipToIpOwner + wipToBuyback + wipToAirdrop + wipToProtocol` (reference field)

---

### Example 6: IP Summary

**Query**:
```graphql
{
  ipRewardSummary(id: "0x38b9704c8586eb85987d18ce3570d80935c816a9") {
    tokenCount
    totalRewardsUSD
    ipOwnerRewardsUSD
    referralWipAmountUSD
    vestingTotalAmount
    vestingClaimedAmount
    vestingStart
    vestingEnd
    harvestCount
  }
}
```

**Response**:
```json
{
  "data": {
    "ipRewardSummary": {
      "tokenCount": "1",
      "totalRewardsUSD": "10.12947187083848564596814794371668",
      "ipOwnerRewardsUSD": "0.4334108000183488670849191640839498",
      "referralWipAmountUSD": "0",
      "vestingTotalAmount": "30000000000000000000000425",
      "vestingClaimedAmount": "45023148148148148148148",
      "vestingStart": "1772074866",
      "vestingEnd": "1787626866",
      "harvestCount": "3"
    }
  }
}
```

**Parsed**: 1 token linked, totalRewards=$10.13, ipOwnerRewards=$0.43, referral=$0.00

**Note**: Values match token `0x204c...` because only 1 token is linked.

---

### Example 7: Wallet UGC — No Claims

**Query**:
```graphql
{
  walletUgcSummary(id: "0x0000000000000000000000000000000000000001") {
    memeTokenClaimed
    memeTokenClaimedUSD
    wipClaimed
    wipClaimedUSD
    claimCount
    lastClaimedTimestamp
  }
}
```

**Response**:
```json
{ "data": { "walletUgcSummary": null } }
```

**Parsed**: `null` → wallet has no claims. Frontend should treat all values as `0`.

---

### Example 8: Token → IP Link Check

**Query**:
```graphql
{
  tokenRewardSummary(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") {
    ipaId
  }
}
```

**Response**:
```json
{ "data": { "tokenRewardSummary": { "ipaId": "0x38b9704c8586eb85987d18ce3570d80935c816a9" } } }
```

**Parsed**: Linked to IP `0x38b9...16a9`

---

### Example 9: IP → Token List (E2)

**Query**:
```graphql
{
  ipTokenLinks(where: { ipaId: "0x38b9704c8586eb85987d18ce3570d80935c816a9" }) {
    token
    timestamp
  }
}
```

**Response**:
```json
{
  "data": {
    "ipTokenLinks": [
      {
        "token": "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24",
        "timestamp": "1772062758"
      }
    ]
  }
}
```

**Parsed**: 1 token linked at 2026-02-26 00:39 UTC

---

### Example 10: Token Deployment Info

**Query**:
```graphql
{
  tokenDeployment(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") {
    tokenCreator
    token
    pool
    timestamp
    startTickList
    allocationList
  }
}
```

**Response**:
```json
{
  "data": {
    "tokenDeployment": {
      "tokenCreator": "0xf5d267029c9531ce9331eb6236e9eb3a4cad74e0",
      "token": "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24",
      "pool": "0x...",
      "timestamp": "1772053785",
      "startTickList": [...],
      "allocationList": [...]
    }
  }
}
```

---

### Example 11: Top Tokens by Rewards (list query)

**Query**:
```graphql
{
  tokenRewardSummaries(first: 5, orderBy: totalRewardsUSD, orderDirection: desc) {
    id
    ipaId
    totalRewardsUSD
    ipOwnerRewardsUSD
    harvestCount
  }
}
```

**Response**:
```json
{
  "data": {
    "tokenRewardSummaries": [
      {
        "id": "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24",
        "ipaId": "0x38b9704c8586eb85987d18ce3570d80935c816a9",
        "totalRewardsUSD": "10.12947187083848564596814794371668",
        "ipOwnerRewardsUSD": "0.4334108000183488670849191640839498",
        "harvestCount": "3"
      },
      {
        "id": "0x8777f2af0c0745ad66f096e67a75e0e8ec9ead71",
        "ipaId": null,
        "totalRewardsUSD": "6.169872450318950359582379469538745",
        "ipOwnerRewardsUSD": "0",
        "harvestCount": "1"
      }
    ]
  }
}
```

---

### Example 12: Top IPs by Rewards (list query)

**Query**:
```graphql
{
  ipRewardSummaries(first: 5, orderBy: totalRewardsUSD, orderDirection: desc) {
    id
    tokenCount
    totalRewardsUSD
    ipOwnerRewardsUSD
    referralWipAmountUSD
    harvestCount
  }
}
```

**Response**:
```json
{
  "data": {
    "ipRewardSummaries": [
      {
        "id": "0x38b9704c8586eb85987d18ce3570d80935c816a9",
        "tokenCount": "1",
        "totalRewardsUSD": "10.12947187083848564596814794371668",
        "ipOwnerRewardsUSD": "0.4334108000183488670849191640839498",
        "referralWipAmountUSD": "0",
        "harvestCount": "3"
      }
    ]
  }
}
```

---

### Example 13: Recent Token Deployments (list query)

**Query**:
```graphql
{
  tokenDeployments(first: 3, orderBy: timestamp, orderDirection: desc) {
    id
    tokenCreator
    token
    pool
    timestamp
  }
}
```

**Response**:
```json
{
  "data": {
    "tokenDeployments": [
      {
        "id": "0x362492050505edea10e878f231a81c4a8fc734ee",
        "tokenCreator": "0xf5d267029c9531ce9331eb6236e9eb3a4cad74e0",
        "token": "0x362492050505edea10e878f231a81c4a8fc734ee",
        "pool": "0xcb2aa93edffbf8804921e6ce75464a7f11a4e8ca",
        "timestamp": "1772053785"
      },
      {
        "id": "0x7573191701f5f4435729d6a320a96f446dd2d5e3",
        "tokenCreator": "0xf2717703d32d339632207ebe055f084a53797ec5",
        "token": "0x7573191701f5f4435729d6a320a96f446dd2d5e3",
        "pool": "0x63381ad04dca8305046108c40f9cf12a58e58090",
        "timestamp": "1771991663"
      },
      {
        "id": "0x311ca466bb706c5a4297d552c1793f3422322700",
        "tokenCreator": "0xf2717703d32d339632207ebe055f084a53797ec5",
        "token": "0x311ca466bb706c5a4297d552c1793f3422322700",
        "pool": "0xf027c6ac985d7f217d0559ddc9f7a68d02e8295d",
        "timestamp": "1771991586"
      }
    ]
  }
}
```

---

### Example 14: Batch Query — Global + Token + IP in one request

**Query**:
```graphql
{
  global: globalRewardSummary(id: "global") {
    totalRewardsUSD
    wipToProtocolUSD
    harvestCount
  }

  token: tokenRewardSummary(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") {
    ipaId
    totalRewardsUSD
    ipOwnerRewardsUSD
    vestingTotalAmount
    vestingClaimedAmount
    vestingStart
    vestingEnd
  }

  ip: ipRewardSummary(id: "0x38b9704c8586eb85987d18ce3570d80935c816a9") {
    tokenCount
    totalRewardsUSD
    ipOwnerRewardsUSD
  }
}
```

**Response**:
```json
{
  "data": {
    "global": {
      "totalRewardsUSD": "16.29934432115743600555052741325543",
      "wipToProtocolUSD": "51.081176423648769894",
      "harvestCount": "4"
    },
    "token": {
      "ipaId": "0x38b9704c8586eb85987d18ce3570d80935c816a9",
      "totalRewardsUSD": "10.12947187083848564596814794371668",
      "ipOwnerRewardsUSD": "0.4334108000183488670849191640839498",
      "vestingTotalAmount": "30000000000000000000000425",
      "vestingClaimedAmount": "45023148148148148148148",
      "vestingStart": "1772074866",
      "vestingEnd": "1787626866"
    },
    "ip": {
      "tokenCount": "1",
      "totalRewardsUSD": "10.12947187083848564596814794371668",
      "ipOwnerRewardsUSD": "0.4334108000183488670849191640839498"
    }
  }
}
```

---

### Example 15: Batch Query — Two Tokens comparison

**Query**:
```graphql
{
  linked: tokenRewardSummary(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") {
    ipaId
    totalRewardsUSD
    ipOwnerRewardsUSD
    vestingStart
    vestingEnd
    harvestCount
  }

  unlinked: tokenRewardSummary(id: "0x8777f2af0c0745ad66f096e67a75e0e8ec9ead71") {
    ipaId
    totalRewardsUSD
    ipOwnerRewardsUSD
    vestingStart
    vestingEnd
    harvestCount
  }
}
```

**Response**:
```json
{
  "data": {
    "linked": {
      "ipaId": "0x38b9704c8586eb85987d18ce3570d80935c816a9",
      "totalRewardsUSD": "10.12947187083848564596814794371668",
      "ipOwnerRewardsUSD": "0.4334108000183488670849191640839498",
      "vestingStart": "1772074866",
      "vestingEnd": "1787626866",
      "harvestCount": "3"
    },
    "unlinked": {
      "ipaId": null,
      "totalRewardsUSD": "6.169872450318950359582379469538745",
      "ipOwnerRewardsUSD": "0",
      "vestingStart": "0",
      "vestingEnd": "0",
      "harvestCount": "1"
    }
  }
}
```

**Key difference**: Linked token has vesting + ipOwnerRewards. Unlinked has neither.

---

### Example 16: Batch Query — Full Dashboard (Global + Token + IP + Links)

**Query**:
```graphql
{
  global: globalRewardSummary(id: "global") {
    totalRewardsUSD
    ipOwnerRewardsUSD
    wipToProtocolUSD
    vestingClaimedAmountUSD
    wipToIpOwnerUSD
    tokenToAirdropUSD
    wipToAirdropUSD
    tokenToIpTreasuryUSD
    referralWipAmountUSD
    harvestCount
    lastUpdatedTimestamp
  }

  token: tokenRewardSummary(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") {
    ipaId
    totalRewardsUSD
    ipOwnerRewardsUSD
    vestingClaimedAmountUSD
    wipToIpOwnerUSD
    tokenToAirdropUSD
    wipToAirdropUSD
    tokenToIpTreasuryUSD
    wipToProtocolUSD
    referralWipAmountUSD
    vestingTotalAmount
    vestingClaimedAmount
    vestingStart
    vestingEnd
    harvestCount
    lastUpdatedTimestamp
  }

  ip: ipRewardSummary(id: "0x38b9704c8586eb85987d18ce3570d80935c816a9") {
    tokenCount
    totalRewardsUSD
    ipOwnerRewardsUSD
    referralWipAmountUSD
    harvestCount
  }

  links: ipTokenLinks(where: { ipaId: "0x38b9704c8586eb85987d18ce3570d80935c816a9" }) {
    token
    timestamp
  }
}
```

**Response**: (combines Examples 2, 3, 6, 9 into one request)

---

### Example 17: Vesting B Variation Calculation

**Input** (from Example 3):
```typescript
// Subgraph values
const vestingTotalAmount = 30000000000000000000000425n  // C2
const vestingClaimedAmount = 45023148148148148148148n   // C3
const vestingStart = 1772074866                         // C1
const vestingEnd = 1787626866                           // C1
const totalRewardsUSD = 10.13                           // A2

// External price (Pyth)
const pythMemePrice = 0.0000005 // example
```

**Calculation** (at timestamp 1772160000, ~1 day after start):
```typescript
const now = 1772160000
const elapsed = now - 1772074866                        // = 85134 seconds
const duration = 1787626866 - 1772074866                // = 15552000 seconds (180 days)

const vested = 30000000n * BigInt(85134) / BigInt(15552000)  // ≈ 164,250 tokens
const unclaimed = 164250n - 45023n                           // ≈ 119,227 tokens
const unvested = 30000000n - 164250n                         // ≈ 29,835,750 tokens
const unrealized = (119227 + 29835750) * 0.0000005           // ≈ $14.98
const B = 10.13 + 14.98                                      // ≈ $25.11
```

**Result**: `A = $10.13` → `B = $25.11`

---

### Example 18: Token Not Found

**Query**:
```graphql
{
  tokenRewardSummary(id: "0x0000000000000000000000000000000000000000") {
    totalRewardsUSD
  }
}
```

**Response**:
```json
{ "data": { "tokenRewardSummary": null } }
```

**Parsed**: Token does not exist in subgraph. Frontend should show "No data" or zeros.

---

### Example 19: Filter — Only Linked Tokens

**Query**:
```graphql
{
  tokenRewardSummaries(
    first: 10
    where: { ipaId_not: null }
    orderBy: totalRewardsUSD
    orderDirection: desc
  ) {
    id
    ipaId
    totalRewardsUSD
    ipOwnerRewardsUSD
  }
}
```

**Response**:
```json
{
  "data": {
    "tokenRewardSummaries": [
      {
        "id": "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24",
        "ipaId": "0x38b9704c8586eb85987d18ce3570d80935c816a9",
        "totalRewardsUSD": "10.12947187083848564596814794371668",
        "ipOwnerRewardsUSD": "0.4334108000183488670849191640839498"
      }
    ]
  }
}
```

---

### Example 20: Filter — Tokens with Active Vesting

**Query**:
```graphql
{
  tokenRewardSummaries(
    first: 10
    where: { vestingStart_gt: "0" }
    orderBy: vestingTotalAmount
    orderDirection: desc
  ) {
    id
    vestingTotalAmount
    vestingClaimedAmount
    vestingStart
    vestingEnd
    totalRewardsUSD
  }
}
```

**Response**:
```json
{
  "data": {
    "tokenRewardSummaries": [
      {
        "id": "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24",
        "vestingTotalAmount": "30000000000000000000000425",
        "vestingClaimedAmount": "45023148148148148148148",
        "vestingStart": "1772074866",
        "vestingEnd": "1787626866",
        "totalRewardsUSD": "10.12947187083848564596814794371668"
      }
    ]
  }
}
```

---

### Example 21: Filter — Tokens with Harvests

**Query**:
```graphql
{
  tokenRewardSummaries(
    first: 10
    where: { harvestCount_gt: "0" }
    orderBy: harvestCount
    orderDirection: desc
  ) {
    id
    harvestCount
    totalRewardsUSD
    wipToProtocolUSD
    lastUpdatedTimestamp
  }
}
```

---

### Example 22: Pagination

**Query** (page 1):
```graphql
{
  tokenRewardSummaries(
    first: 10
    skip: 0
    orderBy: totalRewardsUSD
    orderDirection: desc
  ) {
    id
    totalRewardsUSD
  }
}
```

**Query** (page 2):
```graphql
{
  tokenRewardSummaries(
    first: 10
    skip: 10
    orderBy: totalRewardsUSD
    orderDirection: desc
  ) {
    id
    totalRewardsUSD
  }
}
```

---

### Example 23: Apollo Client useQuery Pattern

```typescript
import { gql, useQuery } from '@apollo/client'
import { formatUnits } from 'viem'

const TOKEN_REWARDS = gql`
  query TokenRewards($id: ID!) {
    tokenRewardSummary(id: $id) {
      totalRewardsUSD
      ipOwnerRewardsUSD
      vestingTotalAmount
      vestingClaimedAmount
      vestingStart
      vestingEnd
      vestingClaimedAmountUSD
      wipToIpOwnerUSD
      tokenToAirdropUSD
      wipToAirdropUSD
      tokenToIpTreasuryUSD
      referralWipAmountUSD
      wipToProtocolUSD
      harvestCount
    }
  }
`

function useTokenRewards(tokenAddress: string) {
  const { data, loading, error } = useQuery(TOKEN_REWARDS, {
    variables: { id: tokenAddress.toLowerCase() },
    pollInterval: 30_000,
  })

  if (!data?.tokenRewardSummary) return { loading, error, rewards: null }

  const r = data.tokenRewardSummary
  return {
    loading,
    error,
    rewards: {
      totalRewardsUSD: Number(r.totalRewardsUSD),
      ipOwnerRewardsUSD: Number(r.ipOwnerRewardsUSD),
      protocolFeesUSD: Number(r.wipToProtocolUSD),
      vestingTotal: BigInt(r.vestingTotalAmount),
      vestingClaimed: BigInt(r.vestingClaimedAmount),
      vestingStart: Number(r.vestingStart),
      vestingEnd: Number(r.vestingEnd),
      harvestCount: Number(r.harvestCount),
    },
  }
}
```

---

### Price Timing Summary

| Item | Price Method | Captured When |
|------|-------------|---------------|
| B1 IP Owner $IP | `wipToUSD()` → $IP price | At harvest block |
| B2 UGC Memecoin | `tokenToUSD()` → memecoin price | At harvest block |
| B3 UGC $IP | `wipToUSD()` → $IP price | At harvest block |
| B4 Treasury Memecoin (pending) | `tokenToUSD()` → memecoin price | At flush block (one-time) |
| B4 Treasury Memecoin (after flush) | `tokenToUSD()` → memecoin price | At harvest block |
| B5 Referral | `wipToUSD()` → $IP price | At harvest block |
| C3 Vesting Claimed USD | `tokenToUSD()` → memecoin price | At claim block |
| D1 UGC Meme Claimed | `tokenToUSD()` → memecoin price | At claim block |
| D2 UGC $IP Claimed | `wipToUSD()` → $IP price | At claim block |
| B variation | Pyth oracle | Realtime (frontend) |

---

**Document version**: 1.0.0
**SPEC**: SPEC-REWARDS-001
**Subgraph version**: v2.0.3-test
**Last updated**: 2026-02-27
