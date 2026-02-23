import { VestedTokensAndEthClaimed, VestingScheduleCreated, ReleasedVested, EthDeposited } from '../types/IPOwnerVault/IPOwnerVault'
import { ClaimEvent, VestingSchedule, VestingReleaseEvent, EthDepositEvent } from '../types/schema'
import { getOrCreateTokenSummary, getOrCreateIpSummary, getOrCreateGlobalSummary } from './reward-summary'

import { BigInt } from '@graphprotocol/graph-ts'

const ONE = BigInt.fromI32(1)

export function handleVestedTokensAndEthClaimed(event: VestedTokensAndEthClaimed): void {
  const claimEvent = new ClaimEvent(event.transaction.hash.toHexString() + '#' + event.logIndex.toString())

  claimEvent.token = event.params.token.toHexString()
  claimEvent.recipient = event.params.recipient.toHexString()
  claimEvent.tokenAmount = event.params.tokenAmount
  claimEvent.ethAmount = event.params.ethAmount
  claimEvent.blockNumber = event.block.number
  claimEvent.timestamp = event.block.timestamp
  claimEvent.transactionHash = event.transaction.hash.toHexString()

  claimEvent.save()

  // Update summaries
  const token = event.params.token.toHexString()

  const ts = getOrCreateTokenSummary(token)
  ts.vestingClaimedAmount = ts.vestingClaimedAmount.plus(event.params.tokenAmount)
  ts.vestingClaimedEthAmount = ts.vestingClaimedEthAmount.plus(event.params.ethAmount)
  ts.lastUpdatedBlock = event.block.number
  ts.lastUpdatedTimestamp = event.block.timestamp
  ts.save()

  if (ts.ipaId !== null) {
    const is_ = getOrCreateIpSummary(ts.ipaId!)
    is_.vestingClaimedAmount = is_.vestingClaimedAmount.plus(event.params.tokenAmount)
    is_.vestingClaimedEthAmount = is_.vestingClaimedEthAmount.plus(event.params.ethAmount)
    is_.lastUpdatedBlock = event.block.number
    is_.lastUpdatedTimestamp = event.block.timestamp
    is_.save()
  }

  const gs = getOrCreateGlobalSummary()
  gs.vestingClaimedAmount = gs.vestingClaimedAmount.plus(event.params.tokenAmount)
  gs.vestingClaimedEthAmount = gs.vestingClaimedEthAmount.plus(event.params.ethAmount)
  gs.lastUpdatedBlock = event.block.number
  gs.lastUpdatedTimestamp = event.block.timestamp
  gs.save()
}

export function handleVestingScheduleCreated(event: VestingScheduleCreated): void {
  const vestingSchedule = new VestingSchedule(event.transaction.hash.toHexString() + '#' + event.logIndex.toString())

  vestingSchedule.token = event.params.token.toHexString()
  vestingSchedule.totalAmount = event.params.totalAmount
  vestingSchedule.startTime = event.params.startTime
  vestingSchedule.endTime = event.params.endTime
  vestingSchedule.blockNumber = event.block.number
  vestingSchedule.timestamp = event.block.timestamp
  vestingSchedule.transactionHash = event.transaction.hash.toHexString()

  vestingSchedule.save()

  // Update summaries
  const token = event.params.token.toHexString()

  const ts = getOrCreateTokenSummary(token)
  ts.vestingTotalAmount = ts.vestingTotalAmount.plus(event.params.totalAmount)
  ts.lastUpdatedBlock = event.block.number
  ts.lastUpdatedTimestamp = event.block.timestamp
  ts.save()

  if (ts.ipaId !== null) {
    const is_ = getOrCreateIpSummary(ts.ipaId!)
    is_.vestingTotalAmount = is_.vestingTotalAmount.plus(event.params.totalAmount)
    is_.lastUpdatedBlock = event.block.number
    is_.lastUpdatedTimestamp = event.block.timestamp
    is_.save()
  }

  const gs = getOrCreateGlobalSummary()
  gs.vestingTotalAmount = gs.vestingTotalAmount.plus(event.params.totalAmount)
  gs.lastUpdatedBlock = event.block.number
  gs.lastUpdatedTimestamp = event.block.timestamp
  gs.save()
}

export function handleReleasedVested(event: ReleasedVested): void {
  const id = event.transaction.hash.toHexString() + '#' + event.logIndex.toString()
  const entity = new VestingReleaseEvent(id)

  entity.token = event.params.token.toHexString()
  entity.amount = event.params.amount
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash.toHexString()

  entity.save()

  // Update summaries
  const token = event.params.token.toHexString()

  const ts = getOrCreateTokenSummary(token)
  ts.vestingClaimedAmount = ts.vestingClaimedAmount.plus(event.params.amount)
  ts.lastUpdatedBlock = event.block.number
  ts.lastUpdatedTimestamp = event.block.timestamp
  ts.save()

  if (ts.ipaId !== null) {
    const is_ = getOrCreateIpSummary(ts.ipaId!)
    is_.vestingClaimedAmount = is_.vestingClaimedAmount.plus(event.params.amount)
    is_.lastUpdatedBlock = event.block.number
    is_.lastUpdatedTimestamp = event.block.timestamp
    is_.save()
  }

  const gs = getOrCreateGlobalSummary()
  gs.vestingClaimedAmount = gs.vestingClaimedAmount.plus(event.params.amount)
  gs.lastUpdatedBlock = event.block.number
  gs.lastUpdatedTimestamp = event.block.timestamp
  gs.save()
}

export function handleEthDeposited(event: EthDeposited): void {
  const id = event.transaction.hash.toHexString() + '#' + event.logIndex.toString()
  const entity = new EthDepositEvent(id)

  entity.token = event.params.token.toHexString()
  entity.amount = event.params.amount
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash.toHexString()

  entity.save()

  // Update summaries
  const token = event.params.token.toHexString()

  const ts = getOrCreateTokenSummary(token)
  ts.ethDeposited = ts.ethDeposited.plus(event.params.amount)
  ts.lastUpdatedBlock = event.block.number
  ts.lastUpdatedTimestamp = event.block.timestamp
  ts.save()

  if (ts.ipaId !== null) {
    const is_ = getOrCreateIpSummary(ts.ipaId!)
    is_.ethDeposited = is_.ethDeposited.plus(event.params.amount)
    is_.lastUpdatedBlock = event.block.number
    is_.lastUpdatedTimestamp = event.block.timestamp
    is_.save()
  }

  const gs = getOrCreateGlobalSummary()
  gs.ethDeposited = gs.ethDeposited.plus(event.params.amount)
  gs.lastUpdatedBlock = event.block.number
  gs.lastUpdatedTimestamp = event.block.timestamp
  gs.save()
}
