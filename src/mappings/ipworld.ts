import { BigInt } from '@graphprotocol/graph-ts'
import { TokenDeployed, Harvest, HarvestDistributed, AirdropClaimed, TreasuryFlushed, Linked } from '../types/IPWorld/IPWorld'
import { IpTokenLink, TokenDeployment } from '../types/schema'
import { getOrCreateTokenSummary, getOrCreateIpSummary, getOrCreateGlobalSummary, recalcTotalRewardsUSD, recalcIpOwnerRewardsUSD } from './reward-summary'
import { wipToUSD, tokenToUSD } from '../utils/usdConversion'

const ONE = BigInt.fromI32(1)

export function handleTokenDeployed(event: TokenDeployed): void {
  const deployment = new TokenDeployment(event.params.token.toHexString())
  deployment.blockNumber = event.block.number
  deployment.timestamp = event.block.timestamp
  deployment.transactionHash = event.transaction.hash.toHexString()
  deployment.tokenCreator = event.params.tokenCreator.toHexString()
  deployment.token = event.params.token.toHexString()
  deployment.pool = event.params.pool.toHexString()

  const startTickList: BigInt[] = []
  for (let i = 0; i < event.params.startTickList.length; i++) {
    startTickList.push(BigInt.fromI32(event.params.startTickList[i]))
  }
  deployment.startTickList = startTickList

  const allocationList: BigInt[] = []
  for (let i = 0; i < event.params.allocationList.length; i++) {
    allocationList.push(event.params.allocationList[i])
  }
  deployment.allocationList = allocationList

  deployment.save()
}

export function handleHarvest(event: Harvest): void {
  // NOTE: The Harvest event from IPWorld has params: token, wethCollected, tokensCollected, tokensBurned, wethToBuyback, wethToIpOwner
  // This is a legacy event superseded by HarvestDistributed. We still update summaries for backward compatibility.
  const token = event.params.token.toHexString()

  const ts = getOrCreateTokenSummary(token)
  ts.harvestCount = ts.harvestCount.plus(ONE)
  ts.wipCollected = ts.wipCollected.plus(event.params.wethCollected)
  ts.tokenCollected = ts.tokenCollected.plus(event.params.tokensCollected)
  ts.wipToBuyback = ts.wipToBuyback.plus(event.params.wethToBuyback)
  ts.wipToIpOwner = ts.wipToIpOwner.plus(event.params.wethToIpOwner)
  // USD conversions
  ts.wipCollectedUSD = ts.wipCollectedUSD.plus(wipToUSD(event.params.wethCollected))
  ts.tokenCollectedUSD = ts.tokenCollectedUSD.plus(tokenToUSD(event.params.tokensCollected, token))
  ts.wipToBuybackUSD = ts.wipToBuybackUSD.plus(wipToUSD(event.params.wethToBuyback))
  ts.wipToIpOwnerUSD = ts.wipToIpOwnerUSD.plus(wipToUSD(event.params.wethToIpOwner))
  ts.totalRewardsUSD = recalcTotalRewardsUSD(
    ts.vestingClaimedAmountUSD, ts.vestingClaimedEthAmountUSD,
    ts.tokenCollectedUSD, ts.tokenToIpTreasuryUSD, ts.tokenToAirdropUSD,
    ts.wipCollectedUSD, ts.treasuryFlushedAmountUSD,
    ts.airdropTokenClaimedUSD, ts.airdropWipClaimedUSD,
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
    is_.harvestCount = is_.harvestCount.plus(ONE)
    is_.wipCollected = is_.wipCollected.plus(event.params.wethCollected)
    is_.tokenCollected = is_.tokenCollected.plus(event.params.tokensCollected)
    is_.wipToBuyback = is_.wipToBuyback.plus(event.params.wethToBuyback)
    is_.wipToIpOwner = is_.wipToIpOwner.plus(event.params.wethToIpOwner)
    is_.wipCollectedUSD = is_.wipCollectedUSD.plus(wipToUSD(event.params.wethCollected))
    is_.tokenCollectedUSD = is_.tokenCollectedUSD.plus(tokenToUSD(event.params.tokensCollected, token))
    is_.wipToBuybackUSD = is_.wipToBuybackUSD.plus(wipToUSD(event.params.wethToBuyback))
    is_.wipToIpOwnerUSD = is_.wipToIpOwnerUSD.plus(wipToUSD(event.params.wethToIpOwner))
    is_.totalRewardsUSD = recalcTotalRewardsUSD(
      is_.vestingClaimedAmountUSD, is_.vestingClaimedEthAmountUSD,
      is_.tokenCollectedUSD, is_.tokenToIpTreasuryUSD, is_.tokenToAirdropUSD,
      is_.wipCollectedUSD, is_.treasuryFlushedAmountUSD,
      is_.airdropTokenClaimedUSD, is_.airdropWipClaimedUSD,
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
  gs.harvestCount = gs.harvestCount.plus(ONE)
  gs.wipCollected = gs.wipCollected.plus(event.params.wethCollected)
  gs.tokenCollected = gs.tokenCollected.plus(event.params.tokensCollected)
  gs.wipToBuyback = gs.wipToBuyback.plus(event.params.wethToBuyback)
  gs.wipToIpOwner = gs.wipToIpOwner.plus(event.params.wethToIpOwner)
  gs.wipCollectedUSD = gs.wipCollectedUSD.plus(wipToUSD(event.params.wethCollected))
  gs.tokenCollectedUSD = gs.tokenCollectedUSD.plus(tokenToUSD(event.params.tokensCollected, token))
  gs.wipToBuybackUSD = gs.wipToBuybackUSD.plus(wipToUSD(event.params.wethToBuyback))
  gs.wipToIpOwnerUSD = gs.wipToIpOwnerUSD.plus(wipToUSD(event.params.wethToIpOwner))
  gs.totalRewardsUSD = recalcTotalRewardsUSD(
    gs.vestingClaimedAmountUSD, gs.vestingClaimedEthAmountUSD,
    gs.tokenCollectedUSD, gs.tokenToIpTreasuryUSD, gs.tokenToAirdropUSD,
    gs.wipCollectedUSD, gs.treasuryFlushedAmountUSD,
    gs.airdropTokenClaimedUSD, gs.airdropWipClaimedUSD,
  )
  gs.ipOwnerRewardsUSD = recalcIpOwnerRewardsUSD(
    gs.vestingClaimedAmountUSD, gs.vestingClaimedEthAmountUSD,
    gs.wipToIpOwnerUSD, gs.tokenToIpTreasuryUSD,
  )
  gs.lastUpdatedBlock = event.block.number
  gs.lastUpdatedTimestamp = event.block.timestamp
  gs.save()
}

export function handleHarvestDistributed(event: HarvestDistributed): void {
  const token = event.params.token.toHexString()
  const wethToProtocol = event.params.wethCollected
    .minus(event.params.wethToIpOwner)
    .minus(event.params.wethToBuyback)
    .minus(event.params.wethToUgc)

  // USD conversion values
  const tokenCollectedUSDDelta = tokenToUSD(event.params.tokenCollected, token)
  const tokenToIpTreasuryUSDDelta = tokenToUSD(event.params.tokenToIpTreasury, token)
  const tokenToAirdropUSDDelta = tokenToUSD(event.params.tokenToUgc, token)
  const wipCollectedUSDDelta = wipToUSD(event.params.wethCollected)
  const wipToIpOwnerUSDDelta = wipToUSD(event.params.wethToIpOwner)
  const wipToBuybackUSDDelta = wipToUSD(event.params.wethToBuyback)
  const wipToAirdropUSDDelta = wipToUSD(event.params.wethToUgc)
  const wipToProtocolUSDDelta = wipToUSD(wethToProtocol)

  // Update Token Summary
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
  ts.tokenCollectedUSD = ts.tokenCollectedUSD.plus(tokenCollectedUSDDelta)
  ts.tokenToIpTreasuryUSD = ts.tokenToIpTreasuryUSD.plus(tokenToIpTreasuryUSDDelta)
  ts.tokenToAirdropUSD = ts.tokenToAirdropUSD.plus(tokenToAirdropUSDDelta)
  ts.wipCollectedUSD = ts.wipCollectedUSD.plus(wipCollectedUSDDelta)
  ts.wipToIpOwnerUSD = ts.wipToIpOwnerUSD.plus(wipToIpOwnerUSDDelta)
  ts.wipToBuybackUSD = ts.wipToBuybackUSD.plus(wipToBuybackUSDDelta)
  ts.wipToAirdropUSD = ts.wipToAirdropUSD.plus(wipToAirdropUSDDelta)
  ts.wipToProtocolUSD = ts.wipToProtocolUSD.plus(wipToProtocolUSDDelta)
  ts.totalRewardsUSD = recalcTotalRewardsUSD(
    ts.vestingClaimedAmountUSD, ts.vestingClaimedEthAmountUSD,
    ts.tokenCollectedUSD, ts.tokenToIpTreasuryUSD, ts.tokenToAirdropUSD,
    ts.wipCollectedUSD, ts.treasuryFlushedAmountUSD,
    ts.airdropTokenClaimedUSD, ts.airdropWipClaimedUSD,
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
    is_.harvestCount = is_.harvestCount.plus(ONE)
    is_.tokenCollected = is_.tokenCollected.plus(event.params.tokenCollected)
    is_.tokenToIpTreasury = is_.tokenToIpTreasury.plus(event.params.tokenToIpTreasury)
    is_.tokenToAirdrop = is_.tokenToAirdrop.plus(event.params.tokenToUgc)
    is_.wipCollected = is_.wipCollected.plus(event.params.wethCollected)
    is_.wipToIpOwner = is_.wipToIpOwner.plus(event.params.wethToIpOwner)
    is_.wipToBuyback = is_.wipToBuyback.plus(event.params.wethToBuyback)
    is_.wipToAirdrop = is_.wipToAirdrop.plus(event.params.wethToUgc)
    is_.wipToProtocol = is_.wipToProtocol.plus(wethToProtocol)
    is_.tokenCollectedUSD = is_.tokenCollectedUSD.plus(tokenCollectedUSDDelta)
    is_.tokenToIpTreasuryUSD = is_.tokenToIpTreasuryUSD.plus(tokenToIpTreasuryUSDDelta)
    is_.tokenToAirdropUSD = is_.tokenToAirdropUSD.plus(tokenToAirdropUSDDelta)
    is_.wipCollectedUSD = is_.wipCollectedUSD.plus(wipCollectedUSDDelta)
    is_.wipToIpOwnerUSD = is_.wipToIpOwnerUSD.plus(wipToIpOwnerUSDDelta)
    is_.wipToBuybackUSD = is_.wipToBuybackUSD.plus(wipToBuybackUSDDelta)
    is_.wipToAirdropUSD = is_.wipToAirdropUSD.plus(wipToAirdropUSDDelta)
    is_.wipToProtocolUSD = is_.wipToProtocolUSD.plus(wipToProtocolUSDDelta)
    is_.totalRewardsUSD = recalcTotalRewardsUSD(
      is_.vestingClaimedAmountUSD, is_.vestingClaimedEthAmountUSD,
      is_.tokenCollectedUSD, is_.tokenToIpTreasuryUSD, is_.tokenToAirdropUSD,
      is_.wipCollectedUSD, is_.treasuryFlushedAmountUSD,
      is_.airdropTokenClaimedUSD, is_.airdropWipClaimedUSD,
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
  gs.harvestCount = gs.harvestCount.plus(ONE)
  gs.tokenCollected = gs.tokenCollected.plus(event.params.tokenCollected)
  gs.tokenToIpTreasury = gs.tokenToIpTreasury.plus(event.params.tokenToIpTreasury)
  gs.tokenToAirdrop = gs.tokenToAirdrop.plus(event.params.tokenToUgc)
  gs.wipCollected = gs.wipCollected.plus(event.params.wethCollected)
  gs.wipToIpOwner = gs.wipToIpOwner.plus(event.params.wethToIpOwner)
  gs.wipToBuyback = gs.wipToBuyback.plus(event.params.wethToBuyback)
  gs.wipToAirdrop = gs.wipToAirdrop.plus(event.params.wethToUgc)
  gs.wipToProtocol = gs.wipToProtocol.plus(wethToProtocol)
  gs.tokenCollectedUSD = gs.tokenCollectedUSD.plus(tokenCollectedUSDDelta)
  gs.tokenToIpTreasuryUSD = gs.tokenToIpTreasuryUSD.plus(tokenToIpTreasuryUSDDelta)
  gs.tokenToAirdropUSD = gs.tokenToAirdropUSD.plus(tokenToAirdropUSDDelta)
  gs.wipCollectedUSD = gs.wipCollectedUSD.plus(wipCollectedUSDDelta)
  gs.wipToIpOwnerUSD = gs.wipToIpOwnerUSD.plus(wipToIpOwnerUSDDelta)
  gs.wipToBuybackUSD = gs.wipToBuybackUSD.plus(wipToBuybackUSDDelta)
  gs.wipToAirdropUSD = gs.wipToAirdropUSD.plus(wipToAirdropUSDDelta)
  gs.wipToProtocolUSD = gs.wipToProtocolUSD.plus(wipToProtocolUSDDelta)
  gs.totalRewardsUSD = recalcTotalRewardsUSD(
    gs.vestingClaimedAmountUSD, gs.vestingClaimedEthAmountUSD,
    gs.tokenCollectedUSD, gs.tokenToIpTreasuryUSD, gs.tokenToAirdropUSD,
    gs.wipCollectedUSD, gs.treasuryFlushedAmountUSD,
    gs.airdropTokenClaimedUSD, gs.airdropWipClaimedUSD,
  )
  gs.ipOwnerRewardsUSD = recalcIpOwnerRewardsUSD(
    gs.vestingClaimedAmountUSD, gs.vestingClaimedEthAmountUSD,
    gs.wipToIpOwnerUSD, gs.tokenToIpTreasuryUSD,
  )
  gs.lastUpdatedBlock = event.block.number
  gs.lastUpdatedTimestamp = event.block.timestamp
  gs.save()
}

export function handleAirdropClaimed(event: AirdropClaimed): void {
  const token = event.params.token.toHexString()

  const airdropTokenUSDDelta = tokenToUSD(event.params.tokenAmount, token)
  const airdropWipUSDDelta = wipToUSD(event.params.wethAmount)

  const ts = getOrCreateTokenSummary(token)
  ts.airdropTokenClaimed = ts.airdropTokenClaimed.plus(event.params.tokenAmount)
  ts.airdropWipClaimed = ts.airdropWipClaimed.plus(event.params.wethAmount)
  ts.airdropClaimCount = ts.airdropClaimCount.plus(ONE)
  ts.airdropTokenClaimedUSD = ts.airdropTokenClaimedUSD.plus(airdropTokenUSDDelta)
  ts.airdropWipClaimedUSD = ts.airdropWipClaimedUSD.plus(airdropWipUSDDelta)
  ts.totalRewardsUSD = recalcTotalRewardsUSD(
    ts.vestingClaimedAmountUSD, ts.vestingClaimedEthAmountUSD,
    ts.tokenCollectedUSD, ts.tokenToIpTreasuryUSD, ts.tokenToAirdropUSD,
    ts.wipCollectedUSD, ts.treasuryFlushedAmountUSD,
    ts.airdropTokenClaimedUSD, ts.airdropWipClaimedUSD,
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
    is_.airdropTokenClaimed = is_.airdropTokenClaimed.plus(event.params.tokenAmount)
    is_.airdropWipClaimed = is_.airdropWipClaimed.plus(event.params.wethAmount)
    is_.airdropClaimCount = is_.airdropClaimCount.plus(ONE)
    is_.airdropTokenClaimedUSD = is_.airdropTokenClaimedUSD.plus(airdropTokenUSDDelta)
    is_.airdropWipClaimedUSD = is_.airdropWipClaimedUSD.plus(airdropWipUSDDelta)
    is_.totalRewardsUSD = recalcTotalRewardsUSD(
      is_.vestingClaimedAmountUSD, is_.vestingClaimedEthAmountUSD,
      is_.tokenCollectedUSD, is_.tokenToIpTreasuryUSD, is_.tokenToAirdropUSD,
      is_.wipCollectedUSD, is_.treasuryFlushedAmountUSD,
      is_.airdropTokenClaimedUSD, is_.airdropWipClaimedUSD,
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
  gs.airdropTokenClaimed = gs.airdropTokenClaimed.plus(event.params.tokenAmount)
  gs.airdropWipClaimed = gs.airdropWipClaimed.plus(event.params.wethAmount)
  gs.airdropClaimCount = gs.airdropClaimCount.plus(ONE)
  gs.airdropTokenClaimedUSD = gs.airdropTokenClaimedUSD.plus(airdropTokenUSDDelta)
  gs.airdropWipClaimedUSD = gs.airdropWipClaimedUSD.plus(airdropWipUSDDelta)
  gs.totalRewardsUSD = recalcTotalRewardsUSD(
    gs.vestingClaimedAmountUSD, gs.vestingClaimedEthAmountUSD,
    gs.tokenCollectedUSD, gs.tokenToIpTreasuryUSD, gs.tokenToAirdropUSD,
    gs.wipCollectedUSD, gs.treasuryFlushedAmountUSD,
    gs.airdropTokenClaimedUSD, gs.airdropWipClaimedUSD,
  )
  gs.ipOwnerRewardsUSD = recalcIpOwnerRewardsUSD(
    gs.vestingClaimedAmountUSD, gs.vestingClaimedEthAmountUSD,
    gs.wipToIpOwnerUSD, gs.tokenToIpTreasuryUSD,
  )
  gs.lastUpdatedBlock = event.block.number
  gs.lastUpdatedTimestamp = event.block.timestamp
  gs.save()
}

export function handleTreasuryFlushed(event: TreasuryFlushed): void {
  const token = event.params.token.toHexString()

  const treasuryUSDDelta = tokenToUSD(event.params.amount, token)

  const ts = getOrCreateTokenSummary(token)
  ts.treasuryFlushedAmount = ts.treasuryFlushedAmount.plus(event.params.amount)
  ts.treasuryFlushedAmountUSD = ts.treasuryFlushedAmountUSD.plus(treasuryUSDDelta)
  ts.totalRewardsUSD = recalcTotalRewardsUSD(
    ts.vestingClaimedAmountUSD, ts.vestingClaimedEthAmountUSD,
    ts.tokenCollectedUSD, ts.tokenToIpTreasuryUSD, ts.tokenToAirdropUSD,
    ts.wipCollectedUSD, ts.treasuryFlushedAmountUSD,
    ts.airdropTokenClaimedUSD, ts.airdropWipClaimedUSD,
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
    is_.treasuryFlushedAmount = is_.treasuryFlushedAmount.plus(event.params.amount)
    is_.treasuryFlushedAmountUSD = is_.treasuryFlushedAmountUSD.plus(treasuryUSDDelta)
    is_.totalRewardsUSD = recalcTotalRewardsUSD(
      is_.vestingClaimedAmountUSD, is_.vestingClaimedEthAmountUSD,
      is_.tokenCollectedUSD, is_.tokenToIpTreasuryUSD, is_.tokenToAirdropUSD,
      is_.wipCollectedUSD, is_.treasuryFlushedAmountUSD,
      is_.airdropTokenClaimedUSD, is_.airdropWipClaimedUSD,
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
  gs.treasuryFlushedAmount = gs.treasuryFlushedAmount.plus(event.params.amount)
  gs.treasuryFlushedAmountUSD = gs.treasuryFlushedAmountUSD.plus(treasuryUSDDelta)
  gs.totalRewardsUSD = recalcTotalRewardsUSD(
    gs.vestingClaimedAmountUSD, gs.vestingClaimedEthAmountUSD,
    gs.tokenCollectedUSD, gs.tokenToIpTreasuryUSD, gs.tokenToAirdropUSD,
    gs.wipCollectedUSD, gs.treasuryFlushedAmountUSD,
    gs.airdropTokenClaimedUSD, gs.airdropWipClaimedUSD,
  )
  gs.ipOwnerRewardsUSD = recalcIpOwnerRewardsUSD(
    gs.vestingClaimedAmountUSD, gs.vestingClaimedEthAmountUSD,
    gs.wipToIpOwnerUSD, gs.tokenToIpTreasuryUSD,
  )
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
  // Migrate raw values accumulated before Linked event
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
  // Migrate USD values
  is_.vestingTotalAmountUSD = is_.vestingTotalAmountUSD.plus(ts.vestingTotalAmountUSD)
  is_.vestingClaimedAmountUSD = is_.vestingClaimedAmountUSD.plus(ts.vestingClaimedAmountUSD)
  is_.vestingClaimedEthAmountUSD = is_.vestingClaimedEthAmountUSD.plus(ts.vestingClaimedEthAmountUSD)
  is_.tokenCollectedUSD = is_.tokenCollectedUSD.plus(ts.tokenCollectedUSD)
  is_.tokenToIpTreasuryUSD = is_.tokenToIpTreasuryUSD.plus(ts.tokenToIpTreasuryUSD)
  is_.tokenToAirdropUSD = is_.tokenToAirdropUSD.plus(ts.tokenToAirdropUSD)
  is_.wipCollectedUSD = is_.wipCollectedUSD.plus(ts.wipCollectedUSD)
  is_.wipToIpOwnerUSD = is_.wipToIpOwnerUSD.plus(ts.wipToIpOwnerUSD)
  is_.wipToBuybackUSD = is_.wipToBuybackUSD.plus(ts.wipToBuybackUSD)
  is_.wipToAirdropUSD = is_.wipToAirdropUSD.plus(ts.wipToAirdropUSD)
  is_.wipToProtocolUSD = is_.wipToProtocolUSD.plus(ts.wipToProtocolUSD)
  is_.treasuryFlushedAmountUSD = is_.treasuryFlushedAmountUSD.plus(ts.treasuryFlushedAmountUSD)
  is_.airdropTokenClaimedUSD = is_.airdropTokenClaimedUSD.plus(ts.airdropTokenClaimedUSD)
  is_.airdropWipClaimedUSD = is_.airdropWipClaimedUSD.plus(ts.airdropWipClaimedUSD)
  is_.totalRewardsUSD = recalcTotalRewardsUSD(
    is_.vestingClaimedAmountUSD, is_.vestingClaimedEthAmountUSD,
    is_.tokenCollectedUSD, is_.tokenToIpTreasuryUSD, is_.tokenToAirdropUSD,
    is_.wipCollectedUSD, is_.treasuryFlushedAmountUSD,
    is_.airdropTokenClaimedUSD, is_.airdropWipClaimedUSD,
  )
  is_.ipOwnerRewardsUSD = recalcIpOwnerRewardsUSD(
    is_.vestingClaimedAmountUSD, is_.vestingClaimedEthAmountUSD,
    is_.wipToIpOwnerUSD, is_.tokenToIpTreasuryUSD,
  )
  is_.lastUpdatedBlock = event.block.number
  is_.lastUpdatedTimestamp = event.block.timestamp
  is_.save()
}

