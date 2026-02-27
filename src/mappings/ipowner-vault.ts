import { VestedTokensAndEthClaimed, VestingScheduleCreated, ReleasedVested } from '../types/IPOwnerVault/IPOwnerVault'
import { getOrCreateTokenSummary, getOrCreateIpSummary, getOrCreateGlobalSummary, totalRewardsUSD, ipOwnerRewardsUSD } from './reward-summary'
import { wipToUSD, tokenToUSD } from '../utils/usdConversion'

import { BigInt } from '@graphprotocol/graph-ts'

const ONE = BigInt.fromI32(1)

export function handleVestedTokensAndEthClaimed(event: VestedTokensAndEthClaimed): void {
  const token = event.params.token.toHexString()

  const vestingClaimedUSDDelta = tokenToUSD(event.params.tokenAmount, token)

  const ts = getOrCreateTokenSummary(token)
  ts.vestingClaimedAmount = ts.vestingClaimedAmount.plus(event.params.tokenAmount)
  ts.vestingClaimedAmountUSD = ts.vestingClaimedAmountUSD.plus(vestingClaimedUSDDelta)
  ts.totalRewardsUSD = totalRewardsUSD(
    ts.vestingClaimedAmountUSD,
    ts.wipToIpOwnerUSD,
    ts.tokenToAirdropUSD,
    ts.wipToAirdropUSD,
    ts.tokenToIpTreasuryUSD,
    ts.referralWipAmountUSD,
    ts.wipToProtocolUSD,
  )
  ts.ipOwnerRewardsUSD = ipOwnerRewardsUSD(
    ts.vestingClaimedAmountUSD,
    ts.wipToIpOwnerUSD,
  )
  ts.lastUpdatedBlock = event.block.number
  ts.lastUpdatedTimestamp = event.block.timestamp
  ts.save()

  if (ts.ipaId !== null) {
    const is_ = getOrCreateIpSummary(ts.ipaId!)
    is_.vestingClaimedAmount = is_.vestingClaimedAmount.plus(event.params.tokenAmount)
    is_.vestingClaimedAmountUSD = is_.vestingClaimedAmountUSD.plus(vestingClaimedUSDDelta)
    is_.totalRewardsUSD = totalRewardsUSD(
      is_.vestingClaimedAmountUSD,
      is_.wipToIpOwnerUSD,
      is_.tokenToAirdropUSD,
      is_.wipToAirdropUSD,
      is_.tokenToIpTreasuryUSD,
      is_.referralWipAmountUSD,
      is_.wipToProtocolUSD,
    )
    is_.ipOwnerRewardsUSD = ipOwnerRewardsUSD(
      is_.vestingClaimedAmountUSD,
      is_.wipToIpOwnerUSD,
    )
    is_.lastUpdatedBlock = event.block.number
    is_.lastUpdatedTimestamp = event.block.timestamp
    is_.save()
  }

  const gs = getOrCreateGlobalSummary()
  gs.vestingClaimedAmount = gs.vestingClaimedAmount.plus(event.params.tokenAmount)
  gs.vestingClaimedAmountUSD = gs.vestingClaimedAmountUSD.plus(vestingClaimedUSDDelta)
  gs.totalRewardsUSD = totalRewardsUSD(
    gs.vestingClaimedAmountUSD,
    gs.wipToIpOwnerUSD,
    gs.tokenToAirdropUSD,
    gs.wipToAirdropUSD,
    gs.tokenToIpTreasuryUSD,
    gs.referralWipAmountUSD,
    gs.wipToProtocolUSD,
  )
  gs.ipOwnerRewardsUSD = ipOwnerRewardsUSD(
    gs.vestingClaimedAmountUSD,
    gs.wipToIpOwnerUSD,
  )
  gs.lastUpdatedBlock = event.block.number
  gs.lastUpdatedTimestamp = event.block.timestamp
  gs.save()
}

export function handleVestingScheduleCreated(event: VestingScheduleCreated): void {
  const token = event.params.token.toHexString()

  const ts = getOrCreateTokenSummary(token)
  ts.vestingTotalAmount = ts.vestingTotalAmount.plus(event.params.totalAmount)
  ts.vestingStart = event.params.startTime
  ts.vestingEnd = event.params.endTime
  ts.totalRewardsUSD = totalRewardsUSD(
    ts.vestingClaimedAmountUSD,
    ts.wipToIpOwnerUSD,
    ts.tokenToAirdropUSD,
    ts.wipToAirdropUSD,
    ts.tokenToIpTreasuryUSD,
    ts.referralWipAmountUSD,
    ts.wipToProtocolUSD,
  )
  ts.ipOwnerRewardsUSD = ipOwnerRewardsUSD(
    ts.vestingClaimedAmountUSD,
    ts.wipToIpOwnerUSD,
  )
  ts.lastUpdatedBlock = event.block.number
  ts.lastUpdatedTimestamp = event.block.timestamp
  ts.save()

  if (ts.ipaId !== null) {
    const is_ = getOrCreateIpSummary(ts.ipaId!)
    is_.vestingTotalAmount = is_.vestingTotalAmount.plus(event.params.totalAmount)
    is_.vestingStart = event.params.startTime
    is_.vestingEnd = event.params.endTime
    is_.totalRewardsUSD = totalRewardsUSD(
      is_.vestingClaimedAmountUSD,
      is_.wipToIpOwnerUSD,
      is_.tokenToAirdropUSD,
      is_.wipToAirdropUSD,
      is_.tokenToIpTreasuryUSD,
      is_.referralWipAmountUSD,
      is_.wipToProtocolUSD,
    )
    is_.ipOwnerRewardsUSD = ipOwnerRewardsUSD(
      is_.vestingClaimedAmountUSD,
      is_.wipToIpOwnerUSD,
    )
    is_.lastUpdatedBlock = event.block.number
    is_.lastUpdatedTimestamp = event.block.timestamp
    is_.save()
  }

  const gs = getOrCreateGlobalSummary()
  gs.vestingTotalAmount = gs.vestingTotalAmount.plus(event.params.totalAmount)
  gs.totalRewardsUSD = totalRewardsUSD(
    gs.vestingClaimedAmountUSD,
    gs.wipToIpOwnerUSD,
    gs.tokenToAirdropUSD,
    gs.wipToAirdropUSD,
    gs.tokenToIpTreasuryUSD,
    gs.referralWipAmountUSD,
    gs.wipToProtocolUSD,
  )
  gs.ipOwnerRewardsUSD = ipOwnerRewardsUSD(
    gs.vestingClaimedAmountUSD,
    gs.wipToIpOwnerUSD,
  )
  gs.lastUpdatedBlock = event.block.number
  gs.lastUpdatedTimestamp = event.block.timestamp
  gs.save()
}

export function handleReleasedVested(event: ReleasedVested): void {
  const token = event.params.token.toHexString()

  const vestingClaimedUSDDelta = tokenToUSD(event.params.amount, token)

  const ts = getOrCreateTokenSummary(token)
  ts.vestingClaimedAmount = ts.vestingClaimedAmount.plus(event.params.amount)
  ts.vestingClaimedAmountUSD = ts.vestingClaimedAmountUSD.plus(vestingClaimedUSDDelta)
  ts.totalRewardsUSD = totalRewardsUSD(
    ts.vestingClaimedAmountUSD,
    ts.wipToIpOwnerUSD,
    ts.tokenToAirdropUSD,
    ts.wipToAirdropUSD,
    ts.tokenToIpTreasuryUSD,
    ts.referralWipAmountUSD,
    ts.wipToProtocolUSD,
  )
  ts.ipOwnerRewardsUSD = ipOwnerRewardsUSD(
    ts.vestingClaimedAmountUSD,
    ts.wipToIpOwnerUSD,
  )
  ts.lastUpdatedBlock = event.block.number
  ts.lastUpdatedTimestamp = event.block.timestamp
  ts.save()

  if (ts.ipaId !== null) {
    const is_ = getOrCreateIpSummary(ts.ipaId!)
    is_.vestingClaimedAmount = is_.vestingClaimedAmount.plus(event.params.amount)
    is_.vestingClaimedAmountUSD = is_.vestingClaimedAmountUSD.plus(vestingClaimedUSDDelta)
    is_.totalRewardsUSD = totalRewardsUSD(
      is_.vestingClaimedAmountUSD,
      is_.wipToIpOwnerUSD,
      is_.tokenToAirdropUSD,
      is_.wipToAirdropUSD,
      is_.tokenToIpTreasuryUSD,
      is_.referralWipAmountUSD,
      is_.wipToProtocolUSD,
    )
    is_.ipOwnerRewardsUSD = ipOwnerRewardsUSD(
      is_.vestingClaimedAmountUSD,
      is_.wipToIpOwnerUSD,
    )
    is_.lastUpdatedBlock = event.block.number
    is_.lastUpdatedTimestamp = event.block.timestamp
    is_.save()
  }

  const gs = getOrCreateGlobalSummary()
  gs.vestingClaimedAmount = gs.vestingClaimedAmount.plus(event.params.amount)
  gs.vestingClaimedAmountUSD = gs.vestingClaimedAmountUSD.plus(vestingClaimedUSDDelta)
  gs.totalRewardsUSD = totalRewardsUSD(
    gs.vestingClaimedAmountUSD,
    gs.wipToIpOwnerUSD,
    gs.tokenToAirdropUSD,
    gs.wipToAirdropUSD,
    gs.tokenToIpTreasuryUSD,
    gs.referralWipAmountUSD,
    gs.wipToProtocolUSD,
  )
  gs.ipOwnerRewardsUSD = ipOwnerRewardsUSD(
    gs.vestingClaimedAmountUSD,
    gs.wipToIpOwnerUSD,
  )
  gs.lastUpdatedBlock = event.block.number
  gs.lastUpdatedTimestamp = event.block.timestamp
  gs.save()
}
