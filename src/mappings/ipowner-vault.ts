import { VestedTokensAndEthClaimed, VestingScheduleCreated, ReleasedVested, EthDeposited } from '../types/IPOwnerVault/IPOwnerVault'
import { getOrCreateTokenSummary, getOrCreateIpSummary, getOrCreateGlobalSummary, recalcTotalRewardsUSD, recalcIpOwnerRewardsUSD } from './reward-summary'
import { wipToUSD, tokenToUSD } from '../utils/usdConversion'

import { BigInt } from '@graphprotocol/graph-ts'

const ONE = BigInt.fromI32(1)

export function handleVestedTokensAndEthClaimed(event: VestedTokensAndEthClaimed): void {
  const token = event.params.token.toHexString()

  const vestingClaimedUSDDelta = tokenToUSD(event.params.tokenAmount, token)
  const vestingClaimedEthUSDDelta = wipToUSD(event.params.ethAmount)

  const ts = getOrCreateTokenSummary(token)
  ts.vestingClaimedAmount = ts.vestingClaimedAmount.plus(event.params.tokenAmount)
  ts.vestingClaimedEthAmount = ts.vestingClaimedEthAmount.plus(event.params.ethAmount)
  ts.vestingClaimedAmountUSD = ts.vestingClaimedAmountUSD.plus(vestingClaimedUSDDelta)
  ts.vestingClaimedEthAmountUSD = ts.vestingClaimedEthAmountUSD.plus(vestingClaimedEthUSDDelta)
  ts.totalRewardsUSD = recalcTotalRewardsUSD(
    ts.vestingClaimedAmountUSD, ts.vestingClaimedEthAmountUSD,
    ts.tokenCollectedUSD, ts.tokenToIpTreasuryUSD, ts.tokenToAirdropUSD,
    ts.wipCollectedUSD, ts.treasuryFlushedAmountUSD,
    ts.airdropTokenClaimedUSD, ts.airdropWipClaimedUSD,
    ts.ethDepositedUSD,
  )
  ts.ipOwnerRewardsUSD = recalcIpOwnerRewardsUSD(
    ts.vestingClaimedAmountUSD, ts.vestingClaimedEthAmountUSD,
    ts.wipToIpOwnerUSD, ts.tokenToIpTreasuryUSD,
  )
  ts.lastUpdatedBlock = event.block.number
  ts.lastUpdatedTimestamp = event.block.timestamp
  ts.save()

  if (ts.ipaId !== null) {
    const is_ = getOrCreateIpSummary(ts.ipaId!)
    is_.vestingClaimedAmount = is_.vestingClaimedAmount.plus(event.params.tokenAmount)
    is_.vestingClaimedEthAmount = is_.vestingClaimedEthAmount.plus(event.params.ethAmount)
    is_.vestingClaimedAmountUSD = is_.vestingClaimedAmountUSD.plus(vestingClaimedUSDDelta)
    is_.vestingClaimedEthAmountUSD = is_.vestingClaimedEthAmountUSD.plus(vestingClaimedEthUSDDelta)
    is_.totalRewardsUSD = recalcTotalRewardsUSD(
      is_.vestingClaimedAmountUSD, is_.vestingClaimedEthAmountUSD,
      is_.tokenCollectedUSD, is_.tokenToIpTreasuryUSD, is_.tokenToAirdropUSD,
      is_.wipCollectedUSD, is_.treasuryFlushedAmountUSD,
      is_.airdropTokenClaimedUSD, is_.airdropWipClaimedUSD,
      is_.ethDepositedUSD,
    )
    is_.ipOwnerRewardsUSD = recalcIpOwnerRewardsUSD(
      is_.vestingClaimedAmountUSD, is_.vestingClaimedEthAmountUSD,
      is_.wipToIpOwnerUSD, is_.tokenToIpTreasuryUSD,
    )
    is_.lastUpdatedBlock = event.block.number
    is_.lastUpdatedTimestamp = event.block.timestamp
    is_.save()
  }

  const gs = getOrCreateGlobalSummary()
  gs.vestingClaimedAmount = gs.vestingClaimedAmount.plus(event.params.tokenAmount)
  gs.vestingClaimedEthAmount = gs.vestingClaimedEthAmount.plus(event.params.ethAmount)
  gs.vestingClaimedAmountUSD = gs.vestingClaimedAmountUSD.plus(vestingClaimedUSDDelta)
  gs.vestingClaimedEthAmountUSD = gs.vestingClaimedEthAmountUSD.plus(vestingClaimedEthUSDDelta)
  gs.totalRewardsUSD = recalcTotalRewardsUSD(
    gs.vestingClaimedAmountUSD, gs.vestingClaimedEthAmountUSD,
    gs.tokenCollectedUSD, gs.tokenToIpTreasuryUSD, gs.tokenToAirdropUSD,
    gs.wipCollectedUSD, gs.treasuryFlushedAmountUSD,
    gs.airdropTokenClaimedUSD, gs.airdropWipClaimedUSD,
    gs.ethDepositedUSD,
  )
  gs.ipOwnerRewardsUSD = recalcIpOwnerRewardsUSD(
    gs.vestingClaimedAmountUSD, gs.vestingClaimedEthAmountUSD,
    gs.wipToIpOwnerUSD, gs.tokenToIpTreasuryUSD,
  )
  gs.lastUpdatedBlock = event.block.number
  gs.lastUpdatedTimestamp = event.block.timestamp
  gs.save()
}

export function handleVestingScheduleCreated(event: VestingScheduleCreated): void {
  const token = event.params.token.toHexString()

  const vestingTotalUSDDelta = tokenToUSD(event.params.totalAmount, token)

  const ts = getOrCreateTokenSummary(token)
  ts.vestingTotalAmount = ts.vestingTotalAmount.plus(event.params.totalAmount)
  ts.vestingTotalAmountUSD = ts.vestingTotalAmountUSD.plus(vestingTotalUSDDelta)
  ts.totalRewardsUSD = recalcTotalRewardsUSD(
    ts.vestingClaimedAmountUSD, ts.vestingClaimedEthAmountUSD,
    ts.tokenCollectedUSD, ts.tokenToIpTreasuryUSD, ts.tokenToAirdropUSD,
    ts.wipCollectedUSD, ts.treasuryFlushedAmountUSD,
    ts.airdropTokenClaimedUSD, ts.airdropWipClaimedUSD,
    ts.ethDepositedUSD,
  )
  ts.ipOwnerRewardsUSD = recalcIpOwnerRewardsUSD(
    ts.vestingClaimedAmountUSD, ts.vestingClaimedEthAmountUSD,
    ts.wipToIpOwnerUSD, ts.tokenToIpTreasuryUSD,
  )
  ts.lastUpdatedBlock = event.block.number
  ts.lastUpdatedTimestamp = event.block.timestamp
  ts.save()

  if (ts.ipaId !== null) {
    const is_ = getOrCreateIpSummary(ts.ipaId!)
    is_.vestingTotalAmount = is_.vestingTotalAmount.plus(event.params.totalAmount)
    is_.vestingTotalAmountUSD = is_.vestingTotalAmountUSD.plus(vestingTotalUSDDelta)
    is_.totalRewardsUSD = recalcTotalRewardsUSD(
      is_.vestingClaimedAmountUSD, is_.vestingClaimedEthAmountUSD,
      is_.tokenCollectedUSD, is_.tokenToIpTreasuryUSD, is_.tokenToAirdropUSD,
      is_.wipCollectedUSD, is_.treasuryFlushedAmountUSD,
      is_.airdropTokenClaimedUSD, is_.airdropWipClaimedUSD,
      is_.ethDepositedUSD,
    )
    is_.ipOwnerRewardsUSD = recalcIpOwnerRewardsUSD(
      is_.vestingClaimedAmountUSD, is_.vestingClaimedEthAmountUSD,
      is_.wipToIpOwnerUSD, is_.tokenToIpTreasuryUSD,
    )
    is_.lastUpdatedBlock = event.block.number
    is_.lastUpdatedTimestamp = event.block.timestamp
    is_.save()
  }

  const gs = getOrCreateGlobalSummary()
  gs.vestingTotalAmount = gs.vestingTotalAmount.plus(event.params.totalAmount)
  gs.vestingTotalAmountUSD = gs.vestingTotalAmountUSD.plus(vestingTotalUSDDelta)
  gs.totalRewardsUSD = recalcTotalRewardsUSD(
    gs.vestingClaimedAmountUSD, gs.vestingClaimedEthAmountUSD,
    gs.tokenCollectedUSD, gs.tokenToIpTreasuryUSD, gs.tokenToAirdropUSD,
    gs.wipCollectedUSD, gs.treasuryFlushedAmountUSD,
    gs.airdropTokenClaimedUSD, gs.airdropWipClaimedUSD,
    gs.ethDepositedUSD,
  )
  gs.ipOwnerRewardsUSD = recalcIpOwnerRewardsUSD(
    gs.vestingClaimedAmountUSD, gs.vestingClaimedEthAmountUSD,
    gs.wipToIpOwnerUSD, gs.tokenToIpTreasuryUSD,
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
  ts.totalRewardsUSD = recalcTotalRewardsUSD(
    ts.vestingClaimedAmountUSD, ts.vestingClaimedEthAmountUSD,
    ts.tokenCollectedUSD, ts.tokenToIpTreasuryUSD, ts.tokenToAirdropUSD,
    ts.wipCollectedUSD, ts.treasuryFlushedAmountUSD,
    ts.airdropTokenClaimedUSD, ts.airdropWipClaimedUSD,
    ts.ethDepositedUSD,
  )
  ts.ipOwnerRewardsUSD = recalcIpOwnerRewardsUSD(
    ts.vestingClaimedAmountUSD, ts.vestingClaimedEthAmountUSD,
    ts.wipToIpOwnerUSD, ts.tokenToIpTreasuryUSD,
  )
  ts.lastUpdatedBlock = event.block.number
  ts.lastUpdatedTimestamp = event.block.timestamp
  ts.save()

  if (ts.ipaId !== null) {
    const is_ = getOrCreateIpSummary(ts.ipaId!)
    is_.vestingClaimedAmount = is_.vestingClaimedAmount.plus(event.params.amount)
    is_.vestingClaimedAmountUSD = is_.vestingClaimedAmountUSD.plus(vestingClaimedUSDDelta)
    is_.totalRewardsUSD = recalcTotalRewardsUSD(
      is_.vestingClaimedAmountUSD, is_.vestingClaimedEthAmountUSD,
      is_.tokenCollectedUSD, is_.tokenToIpTreasuryUSD, is_.tokenToAirdropUSD,
      is_.wipCollectedUSD, is_.treasuryFlushedAmountUSD,
      is_.airdropTokenClaimedUSD, is_.airdropWipClaimedUSD,
      is_.ethDepositedUSD,
    )
    is_.ipOwnerRewardsUSD = recalcIpOwnerRewardsUSD(
      is_.vestingClaimedAmountUSD, is_.vestingClaimedEthAmountUSD,
      is_.wipToIpOwnerUSD, is_.tokenToIpTreasuryUSD,
    )
    is_.lastUpdatedBlock = event.block.number
    is_.lastUpdatedTimestamp = event.block.timestamp
    is_.save()
  }

  const gs = getOrCreateGlobalSummary()
  gs.vestingClaimedAmount = gs.vestingClaimedAmount.plus(event.params.amount)
  gs.vestingClaimedAmountUSD = gs.vestingClaimedAmountUSD.plus(vestingClaimedUSDDelta)
  gs.totalRewardsUSD = recalcTotalRewardsUSD(
    gs.vestingClaimedAmountUSD, gs.vestingClaimedEthAmountUSD,
    gs.tokenCollectedUSD, gs.tokenToIpTreasuryUSD, gs.tokenToAirdropUSD,
    gs.wipCollectedUSD, gs.treasuryFlushedAmountUSD,
    gs.airdropTokenClaimedUSD, gs.airdropWipClaimedUSD,
    gs.ethDepositedUSD,
  )
  gs.ipOwnerRewardsUSD = recalcIpOwnerRewardsUSD(
    gs.vestingClaimedAmountUSD, gs.vestingClaimedEthAmountUSD,
    gs.wipToIpOwnerUSD, gs.tokenToIpTreasuryUSD,
  )
  gs.lastUpdatedBlock = event.block.number
  gs.lastUpdatedTimestamp = event.block.timestamp
  gs.save()
}

export function handleEthDeposited(event: EthDeposited): void {
  const token = event.params.token.toHexString()

  const ethDepositedUSDDelta = wipToUSD(event.params.amount)

  const ts = getOrCreateTokenSummary(token)
  ts.ethDeposited = ts.ethDeposited.plus(event.params.amount)
  ts.ethDepositedUSD = ts.ethDepositedUSD.plus(ethDepositedUSDDelta)
  ts.totalRewardsUSD = recalcTotalRewardsUSD(
    ts.vestingClaimedAmountUSD, ts.vestingClaimedEthAmountUSD,
    ts.tokenCollectedUSD, ts.tokenToIpTreasuryUSD, ts.tokenToAirdropUSD,
    ts.wipCollectedUSD, ts.treasuryFlushedAmountUSD,
    ts.airdropTokenClaimedUSD, ts.airdropWipClaimedUSD,
    ts.ethDepositedUSD,
  )
  ts.ipOwnerRewardsUSD = recalcIpOwnerRewardsUSD(
    ts.vestingClaimedAmountUSD, ts.vestingClaimedEthAmountUSD,
    ts.wipToIpOwnerUSD, ts.tokenToIpTreasuryUSD,
  )
  ts.lastUpdatedBlock = event.block.number
  ts.lastUpdatedTimestamp = event.block.timestamp
  ts.save()

  if (ts.ipaId !== null) {
    const is_ = getOrCreateIpSummary(ts.ipaId!)
    is_.ethDeposited = is_.ethDeposited.plus(event.params.amount)
    is_.ethDepositedUSD = is_.ethDepositedUSD.plus(ethDepositedUSDDelta)
    is_.totalRewardsUSD = recalcTotalRewardsUSD(
      is_.vestingClaimedAmountUSD, is_.vestingClaimedEthAmountUSD,
      is_.tokenCollectedUSD, is_.tokenToIpTreasuryUSD, is_.tokenToAirdropUSD,
      is_.wipCollectedUSD, is_.treasuryFlushedAmountUSD,
      is_.airdropTokenClaimedUSD, is_.airdropWipClaimedUSD,
      is_.ethDepositedUSD,
    )
    is_.ipOwnerRewardsUSD = recalcIpOwnerRewardsUSD(
      is_.vestingClaimedAmountUSD, is_.vestingClaimedEthAmountUSD,
      is_.wipToIpOwnerUSD, is_.tokenToIpTreasuryUSD,
    )
    is_.lastUpdatedBlock = event.block.number
    is_.lastUpdatedTimestamp = event.block.timestamp
    is_.save()
  }

  const gs = getOrCreateGlobalSummary()
  gs.ethDeposited = gs.ethDeposited.plus(event.params.amount)
  gs.ethDepositedUSD = gs.ethDepositedUSD.plus(ethDepositedUSDDelta)
  gs.totalRewardsUSD = recalcTotalRewardsUSD(
    gs.vestingClaimedAmountUSD, gs.vestingClaimedEthAmountUSD,
    gs.tokenCollectedUSD, gs.tokenToIpTreasuryUSD, gs.tokenToAirdropUSD,
    gs.wipCollectedUSD, gs.treasuryFlushedAmountUSD,
    gs.airdropTokenClaimedUSD, gs.airdropWipClaimedUSD,
    gs.ethDepositedUSD,
  )
  gs.ipOwnerRewardsUSD = recalcIpOwnerRewardsUSD(
    gs.vestingClaimedAmountUSD, gs.vestingClaimedEthAmountUSD,
    gs.wipToIpOwnerUSD, gs.tokenToIpTreasuryUSD,
  )
  gs.lastUpdatedBlock = event.block.number
  gs.lastUpdatedTimestamp = event.block.timestamp
  gs.save()
}
