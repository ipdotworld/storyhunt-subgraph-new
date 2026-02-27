# StoryHunt Rewards & Fees 연동 가이드

**Subgraph**: `storyhunt-subgraph-new/v2.0.3-test`
**Network**: Story Aeneid (story-aeneid)
**Endpoint**:
```
https://api.goldsky.com/api/public/project_cm62xvsdx4gdo01yyhwbw7rsy/subgraphs/storyhunt-subgraph-new/v2.0.3-test/gn
```

---

## 목차

1. [항목 참조표](#1-항목-참조표)
2. [섹션 A: 보상 합계](#2-섹션-a-보상-합계)
3. [섹션 B: Harvest 수수료](#3-섹션-b-harvest-수수료)
4. [섹션 C: Vesting (베스팅)](#4-섹션-c-vesting-베스팅)
5. [섹션 D: UGC 클레임](#5-섹션-d-ugc-클레임)
6. [섹션 E: 관계](#6-섹션-e-관계)
7. [TypeScript 타입](#7-typescript-타입)
8. [GraphQL 쿼리](#8-graphql-쿼리)
9. [viem을 사용한 데이터 파싱](#9-viem을-사용한-데이터-파싱)
10. [실제 예시](#10-실제-예시)

---

## 1. 항목 참조표

### 빠른 참조

| 섹션 | ID | 이름 | 범위 | A/B |
|---------|-----|------|-------|:---:|
| **A** | A1 | Total Rewards | 전역 | O |
| | A2 | Total Rewards | 토큰별 | O |
| | A3 | Total Rewards | IP별 | O |
| | A4 | IP Owner Rewards | 토큰별 | O |
| | A5 | IP Owner Rewards | IP별 | O |
| | A6 | Protocol Fees | 전역 | X |
| | A7 | Protocol Fees | 토큰별 | X |
| **B** | B1 | IP Owner $IP Fees | 토큰/IP/전역 | X |
| | B2 | UGC Memecoin Fees | 토큰/IP/전역 | X |
| | B3 | UGC $IP Fees | 토큰/IP/전역 | X |
| | B4 | Treasury Memecoin Fees | 토큰/IP/전역 | X |
| | B5 | Referral $IP Fees | 토큰/IP/전역 | X |
| **C** | C1 | Vesting Schedule | 토큰별 | - |
| | C2 | Vesting Total | 토큰별 | - |
| | C3 | Vesting Claimed | 토큰별 | - |
| **D** | D1 | UGC Memecoin Claimed | 지갑별 | X |
| | D2 | UGC $IP Claimed | 지갑별 | X |
| **E** | E1 | Token-IP Link | 토큰별 | - |

### 수식

```
A (totalRewardsUSD)   = C3_USD + B1 + B2 + B3 + B4 + B5 + A6 + buyback
A (ipOwnerRewardsUSD) = C3_USD + B1
```

### totalRewardsUSD에 포함되지 않는 항목

| 항목 | 사유 |
|------|--------|
| D1/D2 UGC Claimed | 풀 진입 시점에 B2/B3으로 이미 집계됨 |
| C2 Vesting Total | 원시 메타데이터이며, USD가 아님 |
| B variation (미실현분) | 프론트엔드에서 계산하며, 저장되지 않음 |

---

## 2. 섹션 A: 보상 합계

### A1. Total Rewards (전역)

**설명**: 전체 토큰, 전체 기간에 걸쳐 분배된 총 USD 보상.

**필드**: `globalRewardSummary.totalRewardsUSD`

**포함 항목**:
- C3: 클레임된 vesting memecoin (클레임 시점 memecoin 가격)
- B1: IP Owner $IP 수수료 (harvest 시점 $IP 가격)
- B2: UGC memecoin 수수료 - airdrop 풀 진입분 (harvest 시점 memecoin 가격)
- B3: UGC $IP 수수료 - airdrop 풀 진입분 (harvest 시점 $IP 가격)
- B4: Treasury memecoin 수수료 (flush/harvest 시점 memecoin 가격)
- B5: Referral $IP 수수료 (harvest 시점 $IP 가격)
- A6: Protocol $IP 수수료 (harvest 시점 $IP 가격)
- Buyback: WIP buyback - bid wall 재배치용 (harvest 시점 $IP 가격)

**포함하지 않는 항목**:
- UGC 클레임 금액 (D1/D2) — 풀 진입 시 이미 집계됨 (B2/B3)
- 미실현 vesting — 프론트엔드에서 B variation으로 계산

**가격 적용 시점**: 각 구성요소는 해당 이벤트 발생 시점의 가격을 사용합니다.

**A variation** (저장됨): `totalRewardsUSD` 필드에 직접 저장.

**B variation** (프론트엔드 계산):
```
B = totalRewardsUSD + sum_all_tokens(unrealizedVestingUSD)
```

**입력 예시** (GraphQL):
```graphql
{
  globalRewardSummary(id: "global") {
    totalRewardsUSD
  }
}
```

**출력 예시**:
```json
{
  "data": {
    "globalRewardSummary": {
      "totalRewardsUSD": "16.29934432115743600555052741325543"
    }
  }
}
```

**파싱 결과**: `$16.30`

---

### A2. Total Rewards (토큰별)

A1과 동일한 수식이지만 단일 토큰 범위로 한정됩니다.

**필드**: `tokenRewardSummary.totalRewardsUSD`

**입력**:
```graphql
{
  tokenRewardSummary(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") {
    totalRewardsUSD
  }
}
```

**출력**: `"10.12947187083848564596814794371668"` → `$10.13`

---

### A3. Total Rewards (IP별)

A1과 동일한 수식이지만 단일 IP 범위로 한정됩니다. 해당 IP에 연결된 모든 토큰으로부터 집계됩니다.

**필드**: `ipRewardSummary.totalRewardsUSD`

**입력**:
```graphql
{
  ipRewardSummary(id: "0x38b9704c8586eb85987d18ce3570d80935c816a9") {
    totalRewardsUSD
  }
}
```

**출력**: `"10.12947187083848564596814794371668"` → `$10.13`

---

### A4/A5. IP Owner Rewards (토큰별 / IP별)

**설명**: IP 소유자에게 귀속되는 보상.

**필드**: `.ipOwnerRewardsUSD`

**포함 항목**:
- C3: 클레임된 vesting memecoin USD
- B1: IP Owner $IP 수수료

**포함하지 않는 항목**:
- B4 Treasury 수수료 — treasury는 IP 소유자와 별개의 주체
- B2/B3 UGC 수수료 — 커뮤니티 보상이며, IP 소유자 보상이 아님
- B5 Referral — 추천인의 보상이며, IP 소유자 보상이 아님

**수식**: `ipOwnerRewardsUSD = vestingClaimedAmountUSD + wipToIpOwnerUSD`

**입력**:
```graphql
{
  tokenRewardSummary(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") {
    ipOwnerRewardsUSD
    vestingClaimedAmountUSD
    wipToIpOwnerUSD
  }
}
```

**출력**:
```json
{
  "ipOwnerRewardsUSD": "0.4334108000183488670849191640839498",
  "vestingClaimedAmountUSD": "0.4334108000183488670849191640839498",
  "wipToIpOwnerUSD": "0"
}
```

**검증**: `0.4334 + 0 = 0.4334` ✓

---

### A6/A7. Protocol Fees (전역 / 토큰별)

**설명**: 프로토콜 treasury로 전달되는 $IP 수수료.

**필드**: `.wipToProtocolUSD`

**포함 항목**:
- IP 소유자 몫, buyback, airdrop, referral 차감 후 남은 $IP

**포함하지 않는 항목**:
- Memecoin 수수료 (treasury를 통한 B4 또는 airdrop을 통한 B2로 분배됨)
- 1차 LP harvest (100%가 프로토콜 treasury로 직접 전달되며, HarvestDistributed 이벤트 필드 없음)

**계산식**: `wipToProtocol = wethCollected - wethToIpOwner - wethToBuyback - wethToUgc - referralAmount`

**가격 적용 시점**: harvest 시점 $IP 가격

**referral이 존재하는 경우**: 프로토콜 몫이 `referralShare` (2.5%)만큼 감소합니다.

**입력**:
```graphql
{
  globalRewardSummary(id: "global") { wipToProtocolUSD }
  tokenRewardSummary(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") { wipToProtocolUSD }
}
```

**출력**:
```json
{
  "global": { "wipToProtocolUSD": "51.081176423648769894" },
  "token": { "wipToProtocolUSD": "33.5549999999999999955" }
}
```

---

## 3. 섹션 B: Harvest 수수료

모든 B 항목은 블록체인 이벤트로부터 누적됩니다. 각 항목은 원시 BigInt 필드와 USD BigDecimal 필드를 가집니다. 모든 항목은 토큰, IP, 전역의 3가지 수준에 존재합니다.

### B1. IP Owner $IP Fees

**설명**: harvest를 통해 IP 소유자에게 전달된 누적 $IP (WIP) 수수료.

**소스 이벤트**: `HarvestDistributed` → `wethToIpOwner` 필드

**필드**: `.wipToIpOwner` (원시값), `.wipToIpOwnerUSD` (USD)

**가격 적용 시점**: harvest 시점 `wipToUSD()`를 통한 $IP 가격

**포함 항목**: LP2+ harvest에서만 IP 소유자에게 분배된 $IP

**포함하지 않는 항목**:
- 1차 LP harvest (100%가 프로토콜 treasury로 전달됨)
- vesting에서 클레임된 $IP (C3에 해당)

**발생 시점**: 본딩 커브 완료 후에만 발생 (LP2+)

**입력**:
```graphql
{
  tokenRewardSummary(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") {
    wipToIpOwner
    wipToIpOwnerUSD
  }
}
```

**출력**:
```json
{
  "wipToIpOwner": "0",
  "wipToIpOwnerUSD": "0"
}
```

참고: 이 토큰은 1차 LP harvest만 수행했거나 아직 IP 소유자에게 $IP가 분배되지 않았기 때문에 `0`입니다.

---

### B2. UGC Memecoin Fees

**설명**: UGC/airdrop 풀에 할당된 memecoin 수수료.

**소스 이벤트**: `HarvestDistributed` → `tokenToUgc` 필드

**필드**: `.tokenToAirdrop` (원시값), `.tokenToAirdropUSD` (USD)

**가격 적용 시점**: harvest 시점 `tokenToUSD()`를 통한 memecoin 가격

**포함 항목**: 각 harvest 시 airdrop 풀에 진입하는 memecoin

**포함하지 않는 항목**: 실제 사용자 인출분 (D1에 해당)

**중요**: 이 항목은 풀에 들어오는(ENTERING) 수수료를 추적합니다. D1은 풀에서 지갑으로 나가는(LEAVING) 수수료를 추적합니다. 두 항목을 모두 totalRewardsUSD에 사용하면 이중 집계됩니다.

**입력**:
```graphql
{
  tokenRewardSummary(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") {
    tokenToAirdrop
    tokenToAirdropUSD
  }
}
```

**출력**:
```json
{
  "tokenToAirdrop": "159340833224614064265625",
  "tokenToAirdropUSD": "1.212007633852517097360399794261873"
}
```

**파싱 결과**: `159,340.83` 토큰 → `$1.21`

---

### B3. UGC $IP Fees

**설명**: UGC/airdrop 풀에 할당된 $IP 수수료.

**소스 이벤트**: `HarvestDistributed` → `wethToUgc` 필드

**필드**: `.wipToAirdrop` (원시값), `.wipToAirdropUSD` (USD)

**가격 적용 시점**: harvest 시점 $IP 가격

**B2와 동일한 포함/제외 로직**이지만 memecoin 대신 $IP에 적용됩니다.

**출력**: 테스트 토큰에서는 현재 `"0"` (아직 $IP airdrop 분배가 없음).

---

### B4. Treasury Memecoin Fees

**설명**: IP별 treasury로 전달된 memecoin 수수료.

**소스 이벤트**: `TreasuryFlushed`만 해당

**필드**: `.tokenToIpTreasury` (원시값), `.tokenToIpTreasuryUSD` (USD)

**핵심 동작**:
- `ipTreasury`가 설정되지 않은 경우: memecoin이 `pendingTreasury`로 이동하며, `HarvestDistributed`에서 `tokenToIpTreasury = 0`을 발행
- `ipTreasury` 최초 설정 후: 다음 harvest에서 대기분을 `TreasuryFlushed`로 flush (1회) + 현재분은 `HarvestDistributed`로 발행
- flush 이후: `pendingTreasury = 0`, 이후 모든 harvest는 `HarvestDistributed`에서만 실제 값을 발행 (`TreasuryFlushed` 더 이상 발생하지 않음)

**가격 적용 시점**:
- 대기분 flush (1회): flush 시점 memecoin 가격 (`TreasuryFlushed`)
- 이후 모든 harvest: harvest 시점 memecoin 가격 (`HarvestDistributed`)

**포함하지 않는 항목**: 아직 `pendingTreasury`에 있는 (flush되지 않은) memecoin

**입력**:
```graphql
{
  tokenRewardSummary(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") {
    tokenToIpTreasury
    tokenToIpTreasuryUSD
  }
}
```

**출력**:
```json
{
  "tokenToIpTreasury": "1115385832572298449859379",
  "tokenToIpTreasuryUSD": "8.484053436967619681522828985370859"
}
```

**파싱 결과**: `1,115,385.83` 토큰 → `$8.48`

---

### B5. Referral $IP Fees

**설명**: IP의 추천인에게 지급되는 $IP 수수료.

**소스 이벤트**: `ReferralFeePaid`

**필드**: `.referralWipAmount` (원시값), `.referralWipAmountUSD` (USD)

**가격 적용 시점**: harvest 시점 $IP 가격

**발생 조건**:
- `referral[ipaId] != address(0)` 인 경우에만 (referral이 `claimIp()` 시 설정됨)
- LP2+ harvest에서만
- Referral 비율 = 수집된 전체 $IP의 2.5%

**발생하지 않는 경우**: referral이 설정되지 않은 경우 → `referralAmount = 0`이 되고, 전액이 프로토콜 treasury로 전달됨

**범위**: 토큰 + IP + 전역 수준

**출력**: 테스트 토큰에서는 현재 `"0"` (referral 미설정).

---

## 4. 섹션 C: Vesting (베스팅)

### 개요

IP 소유자는 약 6개월에 걸쳐 선형으로 베스팅되는 2-3%의 memecoin 할당을 받습니다. Subgraph는 vesting 메타데이터와 클레임된 금액을 저장합니다. 프론트엔드는 Pyth 가격을 사용하여 현재 시점의 vested/unvested 구분을 계산합니다.

### C1. Vesting Schedule (베스팅 일정)

**필드**: `.vestingStart` (uint64 타임스탬프), `.vestingEnd` (uint64 타임스탬프)

**소스 이벤트**: `VestingScheduleCreated`

**설정 시점**: IP 인증 후 (IP 클레임 이후 첫 harvest 시 `createVestingOnTokenDeploy`가 호출될 때)

**입력**:
```graphql
{
  tokenRewardSummary(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") {
    vestingStart
    vestingEnd
  }
}
```

**출력**:
```json
{
  "vestingStart": "1772074866",
  "vestingEnd": "1787626866"
}
```

**파싱 결과**: `2026-02-26 03:01 UTC` → `2026-08-25 03:01 UTC` (180일)

---

### C2. Vesting Total Allocation (베스팅 총 할당량)

**필드**: `.vestingTotalAmount` (원시 BigInt, 18 소수점)

**소스 이벤트**: `VestingScheduleCreated` → `totalAmount`

**입력**:
```graphql
{
  tokenRewardSummary(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") {
    vestingTotalAmount
  }
}
```

**출력**: `"30000000000000000000000425"` → `30,000,000.00` 토큰

---

### C3. Vesting Claimed (클레임된 베스팅)

**필드**:
- `.vestingClaimedAmount` — 원시 BigInt (토큰 단위)
- `.vestingClaimedAmountUSD` — BigDecimal (클레임 시점 가격)

**소스 이벤트**: `VestedTokensAndEthClaimed` + `ReleasedVested`

**가격 적용 시점**: 클레임 시점 `tokenToUSD()`를 통한 memecoin 가격

**중요**: `vestingClaimedAmountUSD`는 `totalRewardsUSD` 수식에 사용됩니다. 이것이 vesting의 A variation 값입니다.

**입력**:
```graphql
{
  tokenRewardSummary(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") {
    vestingClaimedAmount
    vestingClaimedAmountUSD
  }
}
```

**출력**:
```json
{
  "vestingClaimedAmount": "45023148148148148148148",
  "vestingClaimedAmountUSD": "0.4334108000183488670849191640839498"
}
```

**파싱 결과**: `45,023.15` 토큰 클레임됨 → `$0.43`

---

### B Variation 계산 (프론트엔드)

C1 + C2 + C3 + Pyth memecoin 가격을 사용합니다:

```typescript
import { formatUnits } from 'viem'

function computeBVariation(
  totalRewardsUSD: number,       // subgraph의 A 값
  vestingTotalAmount: bigint,    // C2 원시값
  vestingClaimedAmount: bigint,  // C3 원시값
  vestingStart: number,          // C1 타임스탬프
  vestingEnd: number,            // C1 타임스탬프
  pythMemePrice: number,         // Pyth에서 가져온 현재 가격
): { a: number; b: number; unrealized: number } {
  const now = Math.floor(Date.now() / 1000)

  if (vestingTotalAmount === 0n || vestingStart === 0 || vestingEnd === 0) {
    return { a: totalRewardsUSD, b: totalRewardsUSD, unrealized: 0 }
  }

  // 선형 베스팅, cliff 없음
  let vested: bigint
  if (now < vestingStart) vested = 0n
  else if (now >= vestingEnd) vested = vestingTotalAmount
  else vested = vestingTotalAmount * BigInt(now - vestingStart) / BigInt(vestingEnd - vestingStart)

  const unclaimed = vested - vestingClaimedAmount
  const unvested = vestingTotalAmount - vested
  const unrealizedTokens = unclaimed + unvested // 아직 실현되지 않은 총량

  const unrealizedUSD = Number(formatUnits(unrealizedTokens, 18)) * pythMemePrice
  const b = totalRewardsUSD + unrealizedUSD

  return { a: totalRewardsUSD, b, unrealized: unrealizedUSD }
}
```

**입력 예시** (실제 데이터 기반):
```typescript
computeBVariation(
  10.13,                                    // totalRewardsUSD
  30000000000000000000000425n,              // vestingTotalAmount
  45023148148148148148148n,                 // vestingClaimedAmount
  1772074866,                               // vestingStart
  1787626866,                               // vestingEnd
  0.0000005,                                // pythMemePrice (예시)
)
```

**출력 예시**:
```typescript
{
  a: 10.13,
  b: 25.10,         // 현재 시점 + 가격에 따라 달라짐
  unrealized: 14.97
}
```

---

## 5. 섹션 D: UGC 클레임

### D1. UGC Memecoin Claimed (지갑별)

**설명**: 특정 지갑이 클레임한 총 memecoin airdrop 금액.

**소스 이벤트**: `AirdropClaimed` → `tokenAmount`

**필드**: `.memeTokenClaimed` (원시값), `.memeTokenClaimedUSD` (USD)

**가격 적용 시점**: 클레임 시점 memecoin 가격

**엔티티**: `WalletUgcSummary` (id = 지갑 주소, 소문자)

**totalRewardsUSD에 미포함**: D1은 airdrop 풀로부터의 유출을 추적합니다. B2는 이미 유입을 추적합니다. 둘 다 포함하면 이중 집계됩니다.

---

### D2. UGC $IP Claimed (지갑별)

**설명**: 특정 지갑이 클레임한 총 $IP airdrop 금액.

**소스 이벤트**: `AirdropClaimed` → `wethAmount`

**필드**: `.wipClaimed` (원시값), `.wipClaimedUSD` (USD)

**가격 적용 시점**: 클레임 시점 $IP 가격

D1과 동일한 엔티티 및 로직이지만 $IP에 적용됩니다.

---

### D1+D2 결합 쿼리

**입력**:
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

**출력** (클레임 내역이 없는 경우):
```json
{
  "data": {
    "walletUgcSummary": null
  }
}
```

`null`은 이 지갑이 한 번도 클레임한 적이 없음을 의미합니다. 모든 값을 0으로 처리하세요.

---

## 6. 섹션 E: 관계

### E1. Token → IP 연결

**필드**: `tokenRewardSummary.ipaId`

- `null` → 토큰이 어떤 IP에도 연결되지 않음
- `"0x38b9..."` → 해당 IP에 연결됨

### E2. IP → Token 목록

**입력**:
```graphql
{
  ipTokenLinks(where: { ipaId: "0x38b9704c8586eb85987d18ce3570d80935c816a9" }) {
    token
    timestamp
  }
}
```

**출력**:
```json
{
  "data": {
    "ipTokenLinks": [
      { "token": "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24", "timestamp": "1772074866" }
    ]
  }
}
```

### E3. IP Token 수

**필드**: `ipRewardSummary.tokenCount`

---

## 7. TypeScript 타입

```typescript
// subgraph의 모든 BigInt 필드는 string으로 전달됩니다
// subgraph의 모든 BigDecimal 필드는 string으로 전달됩니다

interface TokenRewardSummary {
  id: string                     // 토큰 주소 (소문자)
  ipaId: string | null           // 연결된 IP 주소 또는 null

  // 섹션 C: Vesting
  vestingTotalAmount: string     // BigInt (18 소수점)
  vestingClaimedAmount: string   // BigInt (18 소수점)
  vestingStart: string           // BigInt (유닉스 타임스탬프)
  vestingEnd: string             // BigInt (유닉스 타임스탬프)
  vestingClaimedAmountUSD: string // BigDecimal

  // 섹션 B: Harvest 수수료
  harvestCount: string           // BigInt
  tokenCollected: string         // BigInt (참조용)
  tokenToIpTreasury: string      // BigInt - B4 원시값
  tokenToAirdrop: string         // BigInt - B2 원시값
  wipCollected: string           // BigInt (참조용)
  wipToIpOwner: string           // BigInt - B1 원시값
  wipToBuyback: string           // BigInt (참조용)
  wipToAirdrop: string           // BigInt - B3 원시값
  wipToProtocol: string          // BigInt - A7 원시값
  referralWipAmount: string      // BigInt - B5 원시값

  // USD 값
  tokenCollectedUSD: string      // 참조용
  tokenToIpTreasuryUSD: string   // B4
  tokenToAirdropUSD: string      // B2
  wipCollectedUSD: string        // 참조용
  wipToIpOwnerUSD: string        // B1
  wipToBuybackUSD: string        // 참조용
  wipToAirdropUSD: string        // B3
  wipToProtocolUSD: string       // A7
  referralWipAmountUSD: string   // B5

  // 섹션 A: 집계값
  totalRewardsUSD: string        // A2
  ipOwnerRewardsUSD: string      // A4

  // 메타
  lastUpdatedBlock: string
  lastUpdatedTimestamp: string
}

interface IpRewardSummary {
  id: string                     // ipaId 주소 (소문자)
  tokenCount: string             // E3

  // TokenRewardSummary와 동일한 필드
  // (간결성을 위해 생략 — 동일한 구조)

  totalRewardsUSD: string        // A3
  ipOwnerRewardsUSD: string      // A5
  referralWipAmountUSD: string   // B5 집계값 = IP별 항목 #14
}

interface GlobalRewardSummary {
  id: string                     // 항상 "global"
  // ipaId를 제외하고 TokenRewardSummary와 동일한 필드
  totalRewardsUSD: string        // A1
  wipToProtocolUSD: string       // A6
}

interface WalletUgcSummary {
  id: string                     // 지갑 주소 (소문자)
  memeTokenClaimed: string       // BigInt - D1 원시값
  memeTokenClaimedUSD: string    // D1
  wipClaimed: string             // BigInt - D2 원시값
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

## 8. GraphQL 쿼리

### 단일 엔티티 쿼리

```graphql
# 전역
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
# 토큰
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
# 지갑
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

### 배치 쿼리 (한 번의 요청으로 전체 조회)

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

### 여러 토큰을 한 번에 조회

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

### 리스트 쿼리

```graphql
# 보상 기준 상위 토큰
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

### Apollo Client 설정

```typescript
import { ApolloClient, InMemoryCache, gql } from '@apollo/client'

const client = new ApolloClient({
  uri: 'https://api.goldsky.com/api/public/project_cm62xvsdx4gdo01yyhwbw7rsy/subgraphs/storyhunt-subgraph-new/v2.0.3-test/gn',
  cache: new InMemoryCache(),
})

// React hook 예시
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
    pollInterval: 30_000, // 30초마다 갱신
  })
}
```

---

## 9. viem을 사용한 데이터 파싱

```typescript
import { formatUnits, formatEther } from 'viem'

// BigInt 문자열 → 사람이 읽을 수 있는 토큰 수량 (18 소수점)
function parseTokenAmount(raw: string): number {
  return Number(formatUnits(BigInt(raw), 18))
}

// BigDecimal 문자열 → number
function parseUSD(raw: string): number {
  return Number(raw)
}

// BigInt 문자열 → 유닉스 타임스탬프 → Date
function parseTimestamp(raw: string): Date | null {
  const ts = Number(raw)
  return ts === 0 ? null : new Date(ts * 1000)
}

// USD 표시 포맷팅
function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value)
}

// 사용법
const data = queryResult.tokenRewardSummary
const totalRewards = parseUSD(data.totalRewardsUSD)         // 10.129...
const vestingTotal = parseTokenAmount(data.vestingTotalAmount) // 30000000
const vestingStart = parseTimestamp(data.vestingStart)        // Date 객체
```

---

## 10. 실제 예시

모든 예시는 Story Aeneid 테스트넷의 `storyhunt-subgraph-new/v2.0.3-test`에서 가져온 실제 데이터를 사용합니다.

사용된 테스트 주소:
- 토큰 (연결됨, vesting 있음): `0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24`
- 토큰 (미연결, vesting 없음): `0x8777f2af0c0745ad66f096e67a75e0e8ec9ead71`
- IP Asset: `0x38b9704c8586eb85987d18ce3570d80935c816a9`

---

### Example 1: 전역 Total Rewards (A1)

**쿼리**:
```graphql
{
  globalRewardSummary(id: "global") {
    totalRewardsUSD
  }
}
```

**응답**:
```json
{ "data": { "globalRewardSummary": { "totalRewardsUSD": "16.29934432115743600555052741325543" } } }
```

**파싱 결과**: `$16.30`

---

### Example 2: 전역 전체 분해 (A1 + A6 + 구성요소)

**쿼리**:
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

**응답**:
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

**파싱 결과**:

| 필드 | 파싱값 | 항목 |
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

**수식 검증**: `0.43 + 0 + 1.98 + 0 + 13.88 + 0 = 16.29` ✓

---

### Example 3: 토큰 보상 — 연결됨, Vesting 있음 (A2 + 모든 B + 모든 C)

**쿼리**:
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

**응답**:
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

**파싱 결과**:

| 필드 | 원시값 | 파싱값 | 항목 |
|-------|-----|--------|------|
| ipaId | `"0x38b9..."` | 연결됨 | E1 |
| totalRewardsUSD | `"10.129..."` | $10.13 | A2 |
| ipOwnerRewardsUSD | `"0.433..."` | $0.43 | A4 |
| wipToProtocolUSD | `"33.554..."` | $33.55 | A7 |
| vestingClaimedAmountUSD | `"0.433..."` | $0.43 | C3 USD |
| wipToIpOwnerUSD | `"0"` | $0.00 | B1 |
| tokenToAirdropUSD | `"1.212..."` | $1.21 | B2 |
| wipToAirdropUSD | `"0"` | $0.00 | B3 |
| tokenToIpTreasuryUSD | `"8.484..."` | $8.48 | B4 |
| referralWipAmountUSD | `"0"` | $0.00 | B5 |
| vestingTotalAmount | `"30000000000000000000000425"` | 30,000,000 토큰 | C2 |
| vestingClaimedAmount | `"45023148148148148148148"` | 45,023 토큰 | C3 원시값 |
| vestingStart | `"1772074866"` | 2026-02-26 03:01 UTC | C1 |
| vestingEnd | `"1787626866"` | 2026-08-25 03:01 UTC | C1 |
| harvestCount | `"3"` | 3 | - |

**수식 검증 A2**: `0.43 + 0 + 1.21 + 0 + 8.48 + 0 = 10.12` ✓
**수식 검증 A4**: `0.43 + 0 = 0.43` ✓

---

### Example 4: 토큰 보상 — 미연결, Vesting 없음

**쿼리**:
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

**응답**:
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

**파싱 결과**: ipaId=null, vesting=(미설정), totalRewards=$6.17, protocolFees=$17.53

**수식 검증**: `0 + 0 + 0.77 + 0 + 5.40 + 0 = 6.17` ✓

---

### Example 5: 토큰 원시 Harvest 데이터 (모든 원시 필드)

**쿼리**:
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

**응답**:
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

**원시값 파싱** (18 소수점):

| 필드 | 원시값 | 파싱값 |
|-------|-----|--------|
| tokenCollected | `1274726665796912514125004` | 1,274,726.67 토큰 |
| tokenToIpTreasury | `1115385832572298449859379` | 1,115,385.83 토큰 |
| tokenToAirdrop | `159340833224614064265625` | 159,340.83 토큰 |
| wipCollected | `22369999999999999997` | 22.37 $IP |
| wipToProtocol | `22369999999999999997` | 22.37 $IP |

**참고**: `tokenCollected = tokenToIpTreasury + tokenToAirdrop` (참조 필드)
**참고**: `wipCollected = wipToIpOwner + wipToBuyback + wipToAirdrop + wipToProtocol` (참조 필드)

---

### Example 6: IP 요약

**쿼리**:
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

**응답**:
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

**파싱 결과**: 연결된 토큰 1개, totalRewards=$10.13, ipOwnerRewards=$0.43, referral=$0.00

**참고**: 연결된 토큰이 1개뿐이므로 토큰 `0x204c...`의 값과 일치합니다.

---

### Example 7: 지갑 UGC — 클레임 없음

**쿼리**:
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

**응답**:
```json
{ "data": { "walletUgcSummary": null } }
```

**파싱 결과**: `null` → 지갑에 클레임 내역이 없습니다. 프론트엔드에서 모든 값을 `0`으로 처리해야 합니다.

---

### Example 8: Token → IP 연결 확인

**쿼리**:
```graphql
{
  tokenRewardSummary(id: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24") {
    ipaId
  }
}
```

**응답**:
```json
{ "data": { "tokenRewardSummary": { "ipaId": "0x38b9704c8586eb85987d18ce3570d80935c816a9" } } }
```

**파싱 결과**: IP `0x38b9...16a9`에 연결됨

---

### Example 9: IP → Token 목록 (E2)

**쿼리**:
```graphql
{
  ipTokenLinks(where: { ipaId: "0x38b9704c8586eb85987d18ce3570d80935c816a9" }) {
    token
    timestamp
  }
}
```

**응답**:
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

**파싱 결과**: 2026-02-26 00:39 UTC에 연결된 토큰 1개

---

### Example 10: 토큰 배포 정보

**쿼리**:
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

**응답**:
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

### Example 11: 보상 기준 상위 토큰 (리스트 쿼리)

**쿼리**:
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

**응답**:
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

### Example 12: 보상 기준 상위 IP (리스트 쿼리)

**쿼리**:
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

**응답**:
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

### Example 13: 최근 토큰 배포 (리스트 쿼리)

**쿼리**:
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

**응답**:
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

### Example 14: 배치 쿼리 — 전역 + 토큰 + IP를 한 번에 조회

**쿼리**:
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

**응답**:
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

### Example 15: 배치 쿼리 — 두 토큰 비교

**쿼리**:
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

**응답**:
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

**핵심 차이점**: 연결된 토큰은 vesting + ipOwnerRewards가 있습니다. 미연결 토큰은 둘 다 없습니다.

---

### Example 16: 배치 쿼리 — 전체 대시보드 (전역 + 토큰 + IP + 연결 관계)

**쿼리**:
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

**응답**: (Example 2, 3, 6, 9를 하나의 요청으로 결합)

---

### Example 17: Vesting B Variation 계산

**입력** (Example 3 데이터 기반):
```typescript
// Subgraph 값
const vestingTotalAmount = 30000000000000000000000425n  // C2
const vestingClaimedAmount = 45023148148148148148148n   // C3
const vestingStart = 1772074866                         // C1
const vestingEnd = 1787626866                           // C1
const totalRewardsUSD = 10.13                           // A2

// 외부 가격 (Pyth)
const pythMemePrice = 0.0000005 // 예시
```

**계산** (타임스탬프 1772160000 기준, 시작 후 약 1일):
```typescript
const now = 1772160000
const elapsed = now - 1772074866                        // = 85134 초
const duration = 1787626866 - 1772074866                // = 15552000 초 (180일)

const vested = 30000000n * BigInt(85134) / BigInt(15552000)  // ≈ 164,250 토큰
const unclaimed = 164250n - 45023n                           // ≈ 119,227 토큰
const unvested = 30000000n - 164250n                         // ≈ 29,835,750 토큰
const unrealized = (119227 + 29835750) * 0.0000005           // ≈ $14.98
const B = 10.13 + 14.98                                      // ≈ $25.11
```

**결과**: `A = $10.13` → `B = $25.11`

---

### Example 18: 토큰을 찾을 수 없음

**쿼리**:
```graphql
{
  tokenRewardSummary(id: "0x0000000000000000000000000000000000000000") {
    totalRewardsUSD
  }
}
```

**응답**:
```json
{ "data": { "tokenRewardSummary": null } }
```

**파싱 결과**: 토큰이 subgraph에 존재하지 않습니다. 프론트엔드에서 "데이터 없음" 또는 0으로 표시해야 합니다.

---

### Example 19: 필터 — 연결된 토큰만 조회

**쿼리**:
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

**응답**:
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

### Example 20: 필터 — 활성 Vesting이 있는 토큰

**쿼리**:
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

**응답**:
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

### Example 21: 필터 — Harvest가 있는 토큰

**쿼리**:
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

### Example 22: 페이지네이션

**쿼리** (1페이지):
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

**쿼리** (2페이지):
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

### Example 23: Apollo Client useQuery 패턴

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

### 가격 적용 시점 요약

| 항목 | 가격 산출 방법 | 적용 시점 |
|------|-------------|---------------|
| B1 IP Owner $IP | `wipToUSD()` → $IP 가격 | harvest 블록 시점 |
| B2 UGC Memecoin | `tokenToUSD()` → memecoin 가격 | harvest 블록 시점 |
| B3 UGC $IP | `wipToUSD()` → $IP 가격 | harvest 블록 시점 |
| B4 Treasury Memecoin (대기분) | `tokenToUSD()` → memecoin 가격 | flush 블록 시점 (1회) |
| B4 Treasury Memecoin (flush 이후) | `tokenToUSD()` → memecoin 가격 | harvest 블록 시점 |
| B5 Referral | `wipToUSD()` → $IP 가격 | harvest 블록 시점 |
| C3 Vesting Claimed USD | `tokenToUSD()` → memecoin 가격 | 클레임 블록 시점 |
| D1 UGC Meme Claimed | `tokenToUSD()` → memecoin 가격 | 클레임 블록 시점 |
| D2 UGC $IP Claimed | `wipToUSD()` → $IP 가격 | 클레임 블록 시점 |
| B variation | Pyth oracle | 실시간 (프론트엔드) |

---

**문서 버전**: 1.0.0
**SPEC**: SPEC-REWARDS-001
**Subgraph 버전**: v2.0.3-test
**최종 업데이트**: 2026-02-27
