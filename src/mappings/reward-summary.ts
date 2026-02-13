import { BigInt } from '@graphprotocol/graph-ts'
import { TokenRewardSummary, IpRewardSummary, GlobalRewardSummary } from '../types/schema'

const ZERO = BigInt.fromI32(0)

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
    s.lpFeeWeth = ZERO
    s.lpFeeToken = ZERO
    s.ethDeposited = ZERO
    s.lastUpdatedBlock = ZERO
    s.lastUpdatedTimestamp = ZERO
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
    s.lpFeeWeth = ZERO
    s.lpFeeToken = ZERO
    s.ethDeposited = ZERO
    s.lastUpdatedBlock = ZERO
    s.lastUpdatedTimestamp = ZERO
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
    s.lpFeeWeth = ZERO
    s.lpFeeToken = ZERO
    s.ethDeposited = ZERO
    s.lastUpdatedBlock = ZERO
    s.lastUpdatedTimestamp = ZERO
  }
  return s as GlobalRewardSummary
}
