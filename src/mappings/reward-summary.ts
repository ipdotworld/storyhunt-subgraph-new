import { BigInt, BigDecimal } from '@graphprotocol/graph-ts'
import { TokenRewardSummary, IpRewardSummary, GlobalRewardSummary } from '../types/schema'

const ZERO = BigInt.fromI32(0)
const ZERO_BD = BigDecimal.fromString('0')

export function getOrCreateTokenSummary(token: string): TokenRewardSummary {
  let s = TokenRewardSummary.load(token)
  if (s === null) {
    s = new TokenRewardSummary(token)
    s.ipaId = null
    s.vestingTotalAmount = ZERO
    s.vestingClaimedAmount = ZERO
    s.vestingClaimedEthAmount = ZERO
    s.harvestCount = ZERO
    s.tokenCollected = ZERO
    s.tokenToIpTreasury = ZERO
    s.tokenToAirdrop = ZERO
    s.wipCollected = ZERO
    s.wipToIpOwner = ZERO
    s.wipToBuyback = ZERO
    s.wipToAirdrop = ZERO
    s.wipToProtocol = ZERO
    s.treasuryFlushedAmount = ZERO
    s.airdropTokenClaimed = ZERO
    s.airdropWipClaimed = ZERO
    s.airdropClaimCount = ZERO
    s.ethDeposited = ZERO
    s.lastUpdatedBlock = ZERO
    s.lastUpdatedTimestamp = ZERO
    // USD fields
    s.vestingTotalAmountUSD = ZERO_BD
    s.vestingClaimedAmountUSD = ZERO_BD
    s.vestingClaimedEthAmountUSD = ZERO_BD
    s.tokenCollectedUSD = ZERO_BD
    s.tokenToIpTreasuryUSD = ZERO_BD
    s.tokenToAirdropUSD = ZERO_BD
    s.wipCollectedUSD = ZERO_BD
    s.wipToIpOwnerUSD = ZERO_BD
    s.wipToBuybackUSD = ZERO_BD
    s.wipToAirdropUSD = ZERO_BD
    s.wipToProtocolUSD = ZERO_BD
    s.treasuryFlushedAmountUSD = ZERO_BD
    s.airdropTokenClaimedUSD = ZERO_BD
    s.airdropWipClaimedUSD = ZERO_BD
    s.ethDepositedUSD = ZERO_BD
    s.totalRewardsUSD = ZERO_BD
    s.ipOwnerRewardsUSD = ZERO_BD
    // Referral placeholders
    s.referralWipAmount = ZERO
    s.referralWipAmountUSD = ZERO_BD
  }
  return s as TokenRewardSummary
}

export function getOrCreateIpSummary(ipaId: string): IpRewardSummary {
  let s = IpRewardSummary.load(ipaId)
  if (s === null) {
    s = new IpRewardSummary(ipaId)
    s.tokenCount = ZERO
    s.vestingTotalAmount = ZERO
    s.vestingClaimedAmount = ZERO
    s.vestingClaimedEthAmount = ZERO
    s.harvestCount = ZERO
    s.tokenCollected = ZERO
    s.tokenToIpTreasury = ZERO
    s.tokenToAirdrop = ZERO
    s.wipCollected = ZERO
    s.wipToIpOwner = ZERO
    s.wipToBuyback = ZERO
    s.wipToAirdrop = ZERO
    s.wipToProtocol = ZERO
    s.treasuryFlushedAmount = ZERO
    s.airdropTokenClaimed = ZERO
    s.airdropWipClaimed = ZERO
    s.airdropClaimCount = ZERO
    s.ethDeposited = ZERO
    s.lastUpdatedBlock = ZERO
    s.lastUpdatedTimestamp = ZERO
    // USD fields
    s.vestingTotalAmountUSD = ZERO_BD
    s.vestingClaimedAmountUSD = ZERO_BD
    s.vestingClaimedEthAmountUSD = ZERO_BD
    s.tokenCollectedUSD = ZERO_BD
    s.tokenToIpTreasuryUSD = ZERO_BD
    s.tokenToAirdropUSD = ZERO_BD
    s.wipCollectedUSD = ZERO_BD
    s.wipToIpOwnerUSD = ZERO_BD
    s.wipToBuybackUSD = ZERO_BD
    s.wipToAirdropUSD = ZERO_BD
    s.wipToProtocolUSD = ZERO_BD
    s.treasuryFlushedAmountUSD = ZERO_BD
    s.airdropTokenClaimedUSD = ZERO_BD
    s.airdropWipClaimedUSD = ZERO_BD
    s.ethDepositedUSD = ZERO_BD
    s.totalRewardsUSD = ZERO_BD
    s.ipOwnerRewardsUSD = ZERO_BD
    // Referral placeholders
    s.referralWipAmount = ZERO
    s.referralWipAmountUSD = ZERO_BD
  }
  return s as IpRewardSummary
}

export function getOrCreateGlobalSummary(): GlobalRewardSummary {
  let s = GlobalRewardSummary.load('global')
  if (s === null) {
    s = new GlobalRewardSummary('global')
    s.vestingTotalAmount = ZERO
    s.vestingClaimedAmount = ZERO
    s.vestingClaimedEthAmount = ZERO
    s.harvestCount = ZERO
    s.tokenCollected = ZERO
    s.tokenToIpTreasury = ZERO
    s.tokenToAirdrop = ZERO
    s.wipCollected = ZERO
    s.wipToIpOwner = ZERO
    s.wipToBuyback = ZERO
    s.wipToAirdrop = ZERO
    s.wipToProtocol = ZERO
    s.treasuryFlushedAmount = ZERO
    s.airdropTokenClaimed = ZERO
    s.airdropWipClaimed = ZERO
    s.airdropClaimCount = ZERO
    s.ethDeposited = ZERO
    s.lastUpdatedBlock = ZERO
    s.lastUpdatedTimestamp = ZERO
    // USD fields
    s.vestingTotalAmountUSD = ZERO_BD
    s.vestingClaimedAmountUSD = ZERO_BD
    s.vestingClaimedEthAmountUSD = ZERO_BD
    s.tokenCollectedUSD = ZERO_BD
    s.tokenToIpTreasuryUSD = ZERO_BD
    s.tokenToAirdropUSD = ZERO_BD
    s.wipCollectedUSD = ZERO_BD
    s.wipToIpOwnerUSD = ZERO_BD
    s.wipToBuybackUSD = ZERO_BD
    s.wipToAirdropUSD = ZERO_BD
    s.wipToProtocolUSD = ZERO_BD
    s.treasuryFlushedAmountUSD = ZERO_BD
    s.airdropTokenClaimedUSD = ZERO_BD
    s.airdropWipClaimedUSD = ZERO_BD
    s.ethDepositedUSD = ZERO_BD
    s.totalRewardsUSD = ZERO_BD
    s.ipOwnerRewardsUSD = ZERO_BD
  }
  return s as GlobalRewardSummary
}

export function recalcTotalRewardsUSD(
  vestingClaimedAmountUSD: BigDecimal,
  vestingClaimedEthAmountUSD: BigDecimal,
  tokenCollectedUSD: BigDecimal,
  tokenToIpTreasuryUSD: BigDecimal,
  tokenToAirdropUSD: BigDecimal,
  wipCollectedUSD: BigDecimal,
  treasuryFlushedAmountUSD: BigDecimal,
  airdropTokenClaimedUSD: BigDecimal,
  airdropWipClaimedUSD: BigDecimal,
  ethDepositedUSD: BigDecimal,
): BigDecimal {
  return vestingClaimedAmountUSD
    .plus(vestingClaimedEthAmountUSD)
    .plus(tokenCollectedUSD)
    .plus(tokenToIpTreasuryUSD)
    .plus(tokenToAirdropUSD)
    .plus(wipCollectedUSD)
    .plus(treasuryFlushedAmountUSD)
    .plus(airdropTokenClaimedUSD)
    .plus(airdropWipClaimedUSD)
    .plus(ethDepositedUSD)
}

export function recalcIpOwnerRewardsUSD(
  vestingClaimedAmountUSD: BigDecimal,
  vestingClaimedEthAmountUSD: BigDecimal,
  wipToIpOwnerUSD: BigDecimal,
  tokenToIpTreasuryUSD: BigDecimal,
): BigDecimal {
  return vestingClaimedAmountUSD
    .plus(vestingClaimedEthAmountUSD)
    .plus(wipToIpOwnerUSD)
    .plus(tokenToIpTreasuryUSD)
}
