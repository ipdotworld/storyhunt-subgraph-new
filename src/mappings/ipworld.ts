import { BigInt } from '@graphprotocol/graph-ts'
import { TokenDeployed, Harvest, HarvestDistributed, AirdropClaimed, TreasuryFlushed, Linked, LiquidityCollected } from '../types/IPWorld/IPWorld'
import { TokenDeployment, HarvestEvent, HarvestDistributedEvent, AirdropClaimEvent, TreasuryFlushEvent, IpTokenLink, LiquidityCollectedEvent } from '../types/schema'

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

  // Convert startTickList array
  const startTickList: BigInt[] = []
  for (let i = 0; i < event.params.startTickList.length; i++) {
    startTickList.push(BigInt.fromI32(event.params.startTickList[i]))
  }
  tokenDeployment.startTickList = startTickList

  // Convert allocationList array
  const allocationList: BigInt[] = []
  for (let i = 0; i < event.params.allocationList.length; i++) {
    allocationList.push(event.params.allocationList[i])
  }
  tokenDeployment.allocationList = allocationList

  tokenDeployment.save()
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
  // Computed: protocol treasury = total - ipOwner - buyback - airdrop
  entity.wethToProtocol = event.params.wethCollected
    .minus(event.params.wethToIpOwner)
    .minus(event.params.wethToBuyback)
    .minus(event.params.wethToUgc)
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash.toHexString()

  entity.save()
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
}
