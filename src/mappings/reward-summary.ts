import { BigInt, BigDecimal } from '@graphprotocol/graph-ts'
import { TokenRewardSummary, IpRewardSummary, GlobalRewardSummary, WalletUgcSummary, WalletTokenUgcSummary } from '../types/schema'

const ZERO = BigInt.fromI32(0)
const ZERO_BD = BigDecimal.fromString('0')

export function getOrCreateTokenSummary(token: string): TokenRewardSummary {
  let s = TokenRewardSummary.load(token)
  if (s === null) {
    s = new TokenRewardSummary(token)
    s.ipaId = null
    s.vestingTotalAmount = ZERO
    s.vestingClaimedAmount = ZERO
    s.vestingStart = ZERO
    s.vestingEnd = ZERO
    s.harvestCount = ZERO
    s.tokenCollected = ZERO
    s.tokenToIpTreasury = ZERO
    s.tokenToAirdrop = ZERO
    s.wipCollected = ZERO
    s.wipToIpOwner = ZERO
    s.wipToBuyback = ZERO
    s.wipToAirdrop = ZERO
    s.wipToProtocol = ZERO
    s.lastUpdatedBlock = ZERO
    s.lastUpdatedTimestamp = ZERO
    // USD fields
    s.vestingClaimedAmountUSD = ZERO_BD
    s.tokenCollectedUSD = ZERO_BD
    s.tokenToIpTreasuryUSD = ZERO_BD
    s.tokenToAirdropUSD = ZERO_BD
    s.wipCollectedUSD = ZERO_BD
    s.wipToIpOwnerUSD = ZERO_BD
    s.wipToBuybackUSD = ZERO_BD
    s.wipToAirdropUSD = ZERO_BD
    s.wipToProtocolUSD = ZERO_BD
    s.totalRewardsUSD = ZERO_BD
    s.ipOwnerRewardsUSD = ZERO_BD
    // Referral fields
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
    s.vestingStart = ZERO
    s.vestingEnd = ZERO
    s.harvestCount = ZERO
    s.tokenCollected = ZERO
    s.tokenToIpTreasury = ZERO
    s.tokenToAirdrop = ZERO
    s.wipCollected = ZERO
    s.wipToIpOwner = ZERO
    s.wipToBuyback = ZERO
    s.wipToAirdrop = ZERO
    s.wipToProtocol = ZERO
    s.lastUpdatedBlock = ZERO
    s.lastUpdatedTimestamp = ZERO
    // USD fields
    s.vestingClaimedAmountUSD = ZERO_BD
    s.tokenCollectedUSD = ZERO_BD
    s.tokenToIpTreasuryUSD = ZERO_BD
    s.tokenToAirdropUSD = ZERO_BD
    s.wipCollectedUSD = ZERO_BD
    s.wipToIpOwnerUSD = ZERO_BD
    s.wipToBuybackUSD = ZERO_BD
    s.wipToAirdropUSD = ZERO_BD
    s.wipToProtocolUSD = ZERO_BD
    s.totalRewardsUSD = ZERO_BD
    s.ipOwnerRewardsUSD = ZERO_BD
    // Referral fields
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
    s.harvestCount = ZERO
    s.tokenCollected = ZERO
    s.tokenToIpTreasury = ZERO
    s.tokenToAirdrop = ZERO
    s.wipCollected = ZERO
    s.wipToIpOwner = ZERO
    s.wipToBuyback = ZERO
    s.wipToAirdrop = ZERO
    s.wipToProtocol = ZERO
    s.lastUpdatedBlock = ZERO
    s.lastUpdatedTimestamp = ZERO
    // USD fields
    s.vestingClaimedAmountUSD = ZERO_BD
    s.tokenCollectedUSD = ZERO_BD
    s.tokenToIpTreasuryUSD = ZERO_BD
    s.tokenToAirdropUSD = ZERO_BD
    s.wipCollectedUSD = ZERO_BD
    s.wipToIpOwnerUSD = ZERO_BD
    s.wipToBuybackUSD = ZERO_BD
    s.wipToAirdropUSD = ZERO_BD
    s.wipToProtocolUSD = ZERO_BD
    s.totalRewardsUSD = ZERO_BD
    s.ipOwnerRewardsUSD = ZERO_BD
    // Referral fields
    s.referralWipAmount = ZERO
    s.referralWipAmountUSD = ZERO_BD
  }
  return s as GlobalRewardSummary
}

export function getOrCreateWalletUgcSummary(wallet: string): WalletUgcSummary {
  let s = WalletUgcSummary.load(wallet)
  if (s === null) {
    s = new WalletUgcSummary(wallet)
    s.ugcMemeTokenClaimed = ZERO
    s.ugcMemeTokenClaimedUSD = ZERO_BD
    s.ugcWipClaimed = ZERO
    s.ugcWipClaimedUSD = ZERO_BD
    s.claimCount = ZERO
    s.lastClaimedTimestamp = ZERO
  }
  return s as WalletUgcSummary
}

export function getOrCreateWalletTokenUgcSummary(wallet: string, token: string): WalletTokenUgcSummary {
  let id = wallet + '-' + token
  let s = WalletTokenUgcSummary.load(id)
  if (s === null) {
    s = new WalletTokenUgcSummary(id)
    s.wallet = wallet
    s.token = token
    s.ugcMemeTokenClaimed = ZERO
    s.ugcMemeTokenClaimedUSD = ZERO_BD
    s.ugcWipClaimed = ZERO
    s.ugcWipClaimedUSD = ZERO_BD
    s.claimCount = ZERO
    s.lastClaimedTimestamp = ZERO
  }
  return s as WalletTokenUgcSummary
}

export function totalRewardsUSD(
  vestingClaimedAmountUSD: BigDecimal,
  wipToIpOwnerUSD: BigDecimal,
  tokenToAirdropUSD: BigDecimal,
  wipToAirdropUSD: BigDecimal,
  tokenToIpTreasuryUSD: BigDecimal,
  referralWipAmountUSD: BigDecimal,
  wipToProtocolUSD: BigDecimal,
  wipToBuybackUSD: BigDecimal,
): BigDecimal {
  return vestingClaimedAmountUSD
    .plus(wipToIpOwnerUSD)
    .plus(tokenToAirdropUSD)
    .plus(wipToAirdropUSD)
    .plus(tokenToIpTreasuryUSD)
    .plus(referralWipAmountUSD)
    .plus(wipToProtocolUSD)
    .plus(wipToBuybackUSD)
}

export function ipOwnerRewardsUSD(
  vestingClaimedAmountUSD: BigDecimal,
  wipToIpOwnerUSD: BigDecimal,
): BigDecimal {
  return vestingClaimedAmountUSD
    .plus(wipToIpOwnerUSD)
}
