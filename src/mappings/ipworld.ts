import { BigInt } from '@graphprotocol/graph-ts'
import { TokenDeployed, Harvest, HarvestDistributed, AirdropClaimed, TreasuryFlushed, Linked, LiquidityCollected } from '../types/IPWorld/IPWorld'
import { TokenDeployment, HarvestEvent, HarvestDistributedEvent, AirdropClaimEvent, TreasuryFlushEvent, IpTokenLink, LiquidityCollectedEvent, PoolTokenMap } from '../types/schema'
import { getOrCreateTokenSummary, getOrCreateIpSummary, getOrCreateGlobalSummary } from './reward-summary'

const ONE = BigInt.fromI32(1)

export function handleTokenDeployed(event: TokenDeployed): void {
  const tokenDeployment = new TokenDeployment(event.transaction.hash.toHexString() + '#' + event.logIndex.toString())

  tokenDeployment.block = event.block.number
  tokenDeployment.blockNumber = event.block.number
  tokenDeployment.timestamp = event.block.timestamp
  tokenDeployment.transactionHash = event.transaction.hash.toHexString()
  tokenDeployment.contractId = event.address.toHexString()
  tokenDeployment.tokenCreator = event.params.tokenCreator.toHexString()
  tokenDeployment.token = event.params.token.toHexString()
  tokenDeployment.pool = event.params.pool.toHexString()

  const startTickList: BigInt[] = []
  for (let i = 0; i < event.params.startTickList.length; i++) {
    startTickList.push(BigInt.fromI32(event.params.startTickList[i]))
  }
  tokenDeployment.startTickList = startTickList

  const allocationList: BigInt[] = []
  for (let i = 0; i < event.params.allocationList.length; i++) {
    allocationList.push(event.params.allocationList[i])
  }
  tokenDeployment.allocationList = allocationList

  tokenDeployment.save()

  // Pool -> token reverse mapping for LiquidityCollected lookups
  const poolMap = new PoolTokenMap(event.params.pool.toHexString())
  poolMap.token = event.params.token.toHexString()
  poolMap.save()
}

export function handleHarvest(event: Harvest): void {
  const harvestEvent = new HarvestEvent(event.transaction.hash.toHexString() + '#' + event.logIndex.toString())

  harvestEvent.token = event.params.token.toHexString()
  harvestEvent.wethCollected = event.params.wethCollected
  harvestEvent.tokensCollected = event.params.tokensCollected
  harvestEvent.tokensBurned = event.params.tokensBurned
  harvestEvent.wethToBuyback = event.params.wethToBuyback
  harvestEvent.wethToIpOwner = event.params.wethToIpOwner
  harvestEvent.blockNumber = event.block.number
  harvestEvent.timestamp = event.block.timestamp
  harvestEvent.transactionHash = event.transaction.hash.toHexString()

  harvestEvent.save()
}

export function handleHarvestDistributed(event: HarvestDistributed): void {
  const id = event.transaction.hash.toHexString() + '#' + event.logIndex.toString()
  const entity = new HarvestDistributedEvent(id)

  entity.token = event.params.token.toHexString()
  entity.tokenCollected = event.params.tokenCollected
  entity.tokenToIpTreasury = event.params.tokenToIpTreasury
  entity.tokenToAirdrop = event.params.tokenToUgc
  entity.wethCollected = event.params.wethCollected
  entity.wethToIpOwner = event.params.wethToIpOwner
  entity.wethToBuyback = event.params.wethToBuyback
  entity.wethToAirdrop = event.params.wethToUgc
  const wethToProtocol = event.params.wethCollected
    .minus(event.params.wethToIpOwner)
    .minus(event.params.wethToBuyback)
    .minus(event.params.wethToUgc)
  entity.wethToProtocol = wethToProtocol
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash.toHexString()

  entity.save()

  // Update summaries
  const token = event.params.token.toHexString()

  const ts = getOrCreateTokenSummary(token)
  ts.harvestCount = ts.harvestCount.plus(ONE)
  ts.tokenCollected = ts.tokenCollected.plus(event.params.tokenCollected)
  ts.tokenToIpTreasury = ts.tokenToIpTreasury.plus(event.params.tokenToIpTreasury)
  ts.tokenToAirdrop = ts.tokenToAirdrop.plus(event.params.tokenToUgc)
  ts.wipCollected = ts.wipCollected.plus(event.params.wethCollected)
  ts.wipToIpOwner = ts.wipToIpOwner.plus(event.params.wethToIpOwner)
  ts.wipToBuyback = ts.wipToBuyback.plus(event.params.wethToBuyback)
  ts.wipToAirdrop = ts.wipToAirdrop.plus(event.params.wethToUgc)
  ts.wipToProtocol = ts.wipToProtocol.plus(wethToProtocol)
  ts.lastUpdatedBlock = event.block.number
  ts.lastUpdatedTimestamp = event.block.timestamp
  ts.save()

  if (ts.ipaId !== null) {
    const is_ = getOrCreateIpSummary(ts.ipaId!)
    is_.harvestCount = is_.harvestCount.plus(ONE)
    is_.tokenCollected = is_.tokenCollected.plus(event.params.tokenCollected)
    is_.tokenToIpTreasury = is_.tokenToIpTreasury.plus(event.params.tokenToIpTreasury)
    is_.tokenToAirdrop = is_.tokenToAirdrop.plus(event.params.tokenToUgc)
    is_.wipCollected = is_.wipCollected.plus(event.params.wethCollected)
    is_.wipToIpOwner = is_.wipToIpOwner.plus(event.params.wethToIpOwner)
    is_.wipToBuyback = is_.wipToBuyback.plus(event.params.wethToBuyback)
    is_.wipToAirdrop = is_.wipToAirdrop.plus(event.params.wethToUgc)
    is_.wipToProtocol = is_.wipToProtocol.plus(wethToProtocol)
    is_.lastUpdatedBlock = event.block.number
    is_.lastUpdatedTimestamp = event.block.timestamp
    is_.save()
  }

  const gs = getOrCreateGlobalSummary()
  gs.harvestCount = gs.harvestCount.plus(ONE)
  gs.tokenCollected = gs.tokenCollected.plus(event.params.tokenCollected)
  gs.tokenToIpTreasury = gs.tokenToIpTreasury.plus(event.params.tokenToIpTreasury)
  gs.tokenToAirdrop = gs.tokenToAirdrop.plus(event.params.tokenToUgc)
  gs.wipCollected = gs.wipCollected.plus(event.params.wethCollected)
  gs.wipToIpOwner = gs.wipToIpOwner.plus(event.params.wethToIpOwner)
  gs.wipToBuyback = gs.wipToBuyback.plus(event.params.wethToBuyback)
  gs.wipToAirdrop = gs.wipToAirdrop.plus(event.params.wethToUgc)
  gs.wipToProtocol = gs.wipToProtocol.plus(wethToProtocol)
  gs.lastUpdatedBlock = event.block.number
  gs.lastUpdatedTimestamp = event.block.timestamp
  gs.save()
}

export function handleAirdropClaimed(event: AirdropClaimed): void {
  const id = event.transaction.hash.toHexString() + '#' + event.logIndex.toString()
  const entity = new AirdropClaimEvent(id)

  entity.token = event.params.token.toHexString()
  entity.recipient = event.params.recipient.toHexString()
  entity.tokenAmount = event.params.tokenAmount
  entity.wethAmount = event.params.wethAmount
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash.toHexString()

  entity.save()

  // Update summaries
  const token = event.params.token.toHexString()

  const ts = getOrCreateTokenSummary(token)
  ts.airdropTokenClaimed = ts.airdropTokenClaimed.plus(event.params.tokenAmount)
  ts.airdropWipClaimed = ts.airdropWipClaimed.plus(event.params.wethAmount)
  ts.airdropClaimCount = ts.airdropClaimCount.plus(ONE)
  ts.lastUpdatedBlock = event.block.number
  ts.lastUpdatedTimestamp = event.block.timestamp
  ts.save()

  if (ts.ipaId !== null) {
    const is_ = getOrCreateIpSummary(ts.ipaId!)
    is_.airdropTokenClaimed = is_.airdropTokenClaimed.plus(event.params.tokenAmount)
    is_.airdropWipClaimed = is_.airdropWipClaimed.plus(event.params.wethAmount)
    is_.airdropClaimCount = is_.airdropClaimCount.plus(ONE)
    is_.lastUpdatedBlock = event.block.number
    is_.lastUpdatedTimestamp = event.block.timestamp
    is_.save()
  }

  const gs = getOrCreateGlobalSummary()
  gs.airdropTokenClaimed = gs.airdropTokenClaimed.plus(event.params.tokenAmount)
  gs.airdropWipClaimed = gs.airdropWipClaimed.plus(event.params.wethAmount)
  gs.airdropClaimCount = gs.airdropClaimCount.plus(ONE)
  gs.lastUpdatedBlock = event.block.number
  gs.lastUpdatedTimestamp = event.block.timestamp
  gs.save()
}

export function handleTreasuryFlushed(event: TreasuryFlushed): void {
  const id = event.transaction.hash.toHexString() + '#' + event.logIndex.toString()
  const entity = new TreasuryFlushEvent(id)

  entity.token = event.params.token.toHexString()
  entity.treasury = event.params.treasury.toHexString()
  entity.amount = event.params.amount
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash.toHexString()

  entity.save()

  // Update summaries
  const token = event.params.token.toHexString()

  const ts = getOrCreateTokenSummary(token)
  ts.treasuryFlushedAmount = ts.treasuryFlushedAmount.plus(event.params.amount)
  ts.lastUpdatedBlock = event.block.number
  ts.lastUpdatedTimestamp = event.block.timestamp
  ts.save()

  if (ts.ipaId !== null) {
    const is_ = getOrCreateIpSummary(ts.ipaId!)
    is_.treasuryFlushedAmount = is_.treasuryFlushedAmount.plus(event.params.amount)
    is_.lastUpdatedBlock = event.block.number
    is_.lastUpdatedTimestamp = event.block.timestamp
    is_.save()
  }

  const gs = getOrCreateGlobalSummary()
  gs.treasuryFlushedAmount = gs.treasuryFlushedAmount.plus(event.params.amount)
  gs.lastUpdatedBlock = event.block.number
  gs.lastUpdatedTimestamp = event.block.timestamp
  gs.save()
}

export function handleLinked(event: Linked): void {
  const id = event.params.ipaId.toHexString() + '-' + event.params.token.toHexString()
  const entity = new IpTokenLink(id)

  entity.ipaId = event.params.ipaId.toHexString()
  entity.token = event.params.token.toHexString()
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash.toHexString()

  entity.save()

  // Link token summary to IPA and migrate any pre-existing values
  const token = event.params.token.toHexString()
  const ipaId = event.params.ipaId.toHexString()

  const ts = getOrCreateTokenSummary(token)
  ts.ipaId = ipaId
  ts.lastUpdatedBlock = event.block.number
  ts.lastUpdatedTimestamp = event.block.timestamp
  ts.save()

  const is_ = getOrCreateIpSummary(ipaId)
  is_.tokenCount = is_.tokenCount.plus(ONE)
  // Migrate any values accumulated before Linked event
  is_.vestingTotalAmount = is_.vestingTotalAmount.plus(ts.vestingTotalAmount)
  is_.vestingClaimedAmount = is_.vestingClaimedAmount.plus(ts.vestingClaimedAmount)
  is_.vestingClaimedEthAmount = is_.vestingClaimedEthAmount.plus(ts.vestingClaimedEthAmount)
  is_.harvestCount = is_.harvestCount.plus(ts.harvestCount)
  is_.tokenCollected = is_.tokenCollected.plus(ts.tokenCollected)
  is_.tokenToIpTreasury = is_.tokenToIpTreasury.plus(ts.tokenToIpTreasury)
  is_.tokenToAirdrop = is_.tokenToAirdrop.plus(ts.tokenToAirdrop)
  is_.wipCollected = is_.wipCollected.plus(ts.wipCollected)
  is_.wipToIpOwner = is_.wipToIpOwner.plus(ts.wipToIpOwner)
  is_.wipToBuyback = is_.wipToBuyback.plus(ts.wipToBuyback)
  is_.wipToAirdrop = is_.wipToAirdrop.plus(ts.wipToAirdrop)
  is_.wipToProtocol = is_.wipToProtocol.plus(ts.wipToProtocol)
  is_.treasuryFlushedAmount = is_.treasuryFlushedAmount.plus(ts.treasuryFlushedAmount)
  is_.airdropTokenClaimed = is_.airdropTokenClaimed.plus(ts.airdropTokenClaimed)
  is_.airdropWipClaimed = is_.airdropWipClaimed.plus(ts.airdropWipClaimed)
  is_.airdropClaimCount = is_.airdropClaimCount.plus(ts.airdropClaimCount)
  is_.lpFeeWeth = is_.lpFeeWeth.plus(ts.lpFeeWeth)
  is_.lpFeeToken = is_.lpFeeToken.plus(ts.lpFeeToken)
  is_.ethDeposited = is_.ethDeposited.plus(ts.ethDeposited)
  is_.lastUpdatedBlock = event.block.number
  is_.lastUpdatedTimestamp = event.block.timestamp
  is_.save()
}

export function handleLiquidityCollected(event: LiquidityCollected): void {
  const id = event.transaction.hash.toHexString() + '#' + event.logIndex.toString()
  const entity = new LiquidityCollectedEvent(id)

  entity.pool = event.params.pool.toHexString()
  entity.tickLower = BigInt.fromI32(event.params.tickLower)
  entity.tickUpper = BigInt.fromI32(event.params.tickUpper)
  entity.wethAmount = event.params.wethAmount
  entity.tokenAmount = event.params.tokenAmount
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash.toHexString()

  entity.save()

  // Look up token from pool mapping
  const poolMap = PoolTokenMap.load(event.params.pool.toHexString())
  if (poolMap !== null) {
    const ts = getOrCreateTokenSummary(poolMap.token)
    ts.lpFeeWeth = ts.lpFeeWeth.plus(event.params.wethAmount)
    ts.lpFeeToken = ts.lpFeeToken.plus(event.params.tokenAmount)
    ts.lastUpdatedBlock = event.block.number
    ts.lastUpdatedTimestamp = event.block.timestamp
    ts.save()

    if (ts.ipaId !== null) {
      const is_ = getOrCreateIpSummary(ts.ipaId!)
      is_.lpFeeWeth = is_.lpFeeWeth.plus(event.params.wethAmount)
      is_.lpFeeToken = is_.lpFeeToken.plus(event.params.tokenAmount)
      is_.lastUpdatedBlock = event.block.number
      is_.lastUpdatedTimestamp = event.block.timestamp
      is_.save()
    }

    const gs = getOrCreateGlobalSummary()
    gs.lpFeeWeth = gs.lpFeeWeth.plus(event.params.wethAmount)
    gs.lpFeeToken = gs.lpFeeToken.plus(event.params.tokenAmount)
    gs.lastUpdatedBlock = event.block.number
    gs.lastUpdatedTimestamp = event.block.timestamp
    gs.save()
  }
}
