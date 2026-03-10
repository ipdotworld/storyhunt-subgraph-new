import { BigInt } from '@graphprotocol/graph-ts'
import { TokenDeployed, TokenDeployed1, Harvest, Harvest1, HarvestDistributed, AirdropClaimedUgc, AirdropClaimedHolder, TreasuryFlushed, Linked, ReferralFeePaid } from '../types/IPWorld/IPWorld'
import { IpTokenLink, TokenDeployment, WalletAirdropClaim } from '../types/schema'
import { getOrCreateTokenSummary, getOrCreateIpSummary, getOrCreateGlobalSummary, getOrCreateWalletAirdropSummary, getOrCreateWalletTokenAirdropSummary, getOrCreateTokenAirdropClaimSummary, totalRewardsUSD, ipOwnerRewardsUSD } from './reward-summary'
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

export function handleTokenDeployedV1(event: TokenDeployed1): void {
  const deployment = new TokenDeployment(event.params.token.toHexString())
  deployment.blockNumber = event.block.number
  deployment.timestamp = event.block.timestamp
  deployment.transactionHash = event.transaction.hash.toHexString()
  deployment.tokenCreator = event.params.tokenCreator.toHexString()
  deployment.token = event.params.token.toHexString()
  deployment.pool = event.params.pool.toHexString()

  const startTickList: BigInt[] = []
  startTickList.push(BigInt.fromI32(event.params.startTick))
  deployment.startTickList = startTickList
  deployment.allocationList = []

  deployment.save()
}

export function handleHarvestV1(event: Harvest1): void {
  const token = event.params.token.toHexString()

  const wethAmount = event.params.wethAmount
  const tokenAmount = event.params.tokenAmount
  // burnAmount ignored (not in RewardSummary schema)
  // Old contract: all WETH goes to protocol (no ipOwner/buyback split)
  const wipToProtocol = wethAmount

  const wipCollectedUSD = wipToUSD(wethAmount)
  const wipToProtocolUSD = wipToUSD(wipToProtocol)
  const tokenCollectedUSD = tokenToUSD(tokenAmount, token)

  // Update TokenRewardSummary
  const ts = getOrCreateTokenSummary(token)
  ts.harvestCount = ts.harvestCount.plus(ONE)
  ts.wipCollected = ts.wipCollected.plus(wethAmount)
  ts.tokenCollected = ts.tokenCollected.plus(tokenAmount)
  ts.wipToProtocol = ts.wipToProtocol.plus(wipToProtocol)
  ts.wipCollectedUSD = ts.wipCollectedUSD.plus(wipCollectedUSD)
  ts.tokenCollectedUSD = ts.tokenCollectedUSD.plus(tokenCollectedUSD)
  ts.wipToProtocolUSD = ts.wipToProtocolUSD.plus(wipToProtocolUSD)
  ts.totalRewardsUSD = totalRewardsUSD(
    ts.vestingClaimedAmountUSD,
    ts.wipToIpOwnerUSD,
    ts.tokenToAirdropUSD,
    ts.wipToAirdropUSD,
    ts.tokenToIpTreasuryUSD,
    ts.referralWipAmountUSD,
    ts.wipToProtocolUSD,
    ts.wipToBuybackUSD,
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
    is_.harvestCount = is_.harvestCount.plus(ONE)
    is_.wipCollected = is_.wipCollected.plus(wethAmount)
    is_.tokenCollected = is_.tokenCollected.plus(tokenAmount)
    is_.wipToProtocol = is_.wipToProtocol.plus(wipToProtocol)
    is_.wipCollectedUSD = is_.wipCollectedUSD.plus(wipCollectedUSD)
    is_.tokenCollectedUSD = is_.tokenCollectedUSD.plus(tokenCollectedUSD)
    is_.wipToProtocolUSD = is_.wipToProtocolUSD.plus(wipToProtocolUSD)
    is_.totalRewardsUSD = totalRewardsUSD(
      is_.vestingClaimedAmountUSD,
      is_.wipToIpOwnerUSD,
      is_.tokenToAirdropUSD,
      is_.wipToAirdropUSD,
      is_.tokenToIpTreasuryUSD,
      is_.referralWipAmountUSD,
      is_.wipToProtocolUSD,
      is_.wipToBuybackUSD,
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
  gs.harvestCount = gs.harvestCount.plus(ONE)
  gs.wipCollected = gs.wipCollected.plus(wethAmount)
  gs.tokenCollected = gs.tokenCollected.plus(tokenAmount)
  gs.wipToProtocol = gs.wipToProtocol.plus(wipToProtocol)
  gs.wipCollectedUSD = gs.wipCollectedUSD.plus(wipCollectedUSD)
  gs.tokenCollectedUSD = gs.tokenCollectedUSD.plus(tokenCollectedUSD)
  gs.wipToProtocolUSD = gs.wipToProtocolUSD.plus(wipToProtocolUSD)
  gs.totalRewardsUSD = totalRewardsUSD(
    gs.vestingClaimedAmountUSD,
    gs.wipToIpOwnerUSD,
    gs.tokenToAirdropUSD,
    gs.wipToAirdropUSD,
    gs.tokenToIpTreasuryUSD,
    gs.referralWipAmountUSD,
    gs.wipToProtocolUSD,
    gs.wipToBuybackUSD,
  )
  gs.ipOwnerRewardsUSD = ipOwnerRewardsUSD(
    gs.vestingClaimedAmountUSD,
    gs.wipToIpOwnerUSD,
  )
  gs.lastUpdatedBlock = event.block.number
  gs.lastUpdatedTimestamp = event.block.timestamp
  gs.save()
}

export function handleHarvest(event: Harvest): void {
  const token = event.params.token.toHexString()

  const wethAmount = event.params.wethAmount
  const tokenAmount = event.params.tokenAmount
  const buybackAmount = event.params.buybackAmount
  const ipOwnerAmount = event.params.ipOwnerAmount
  const wethToProtocol = wethAmount.minus(ipOwnerAmount).minus(buybackAmount)

  const wipCollectedUSD = wipToUSD(wethAmount)
  const wipToIpOwnerUSD = wipToUSD(ipOwnerAmount)
  const wipToBuybackUSD = wipToUSD(buybackAmount)
  const wipToProtocolUSD = wipToUSD(wethToProtocol)
  const tokenCollectedUSD = tokenToUSD(tokenAmount, token)

  // Update TokenRewardSummary
  const ts = getOrCreateTokenSummary(token)
  ts.harvestCount = ts.harvestCount.plus(ONE)
  ts.wipCollected = ts.wipCollected.plus(wethAmount)
  ts.tokenCollected = ts.tokenCollected.plus(tokenAmount)
  ts.wipToIpOwner = ts.wipToIpOwner.plus(ipOwnerAmount)
  ts.wipToBuyback = ts.wipToBuyback.plus(buybackAmount)
  ts.wipToProtocol = ts.wipToProtocol.plus(wethToProtocol)
  ts.wipCollectedUSD = ts.wipCollectedUSD.plus(wipCollectedUSD)
  ts.tokenCollectedUSD = ts.tokenCollectedUSD.plus(tokenCollectedUSD)
  ts.wipToIpOwnerUSD = ts.wipToIpOwnerUSD.plus(wipToIpOwnerUSD)
  ts.wipToBuybackUSD = ts.wipToBuybackUSD.plus(wipToBuybackUSD)
  ts.wipToProtocolUSD = ts.wipToProtocolUSD.plus(wipToProtocolUSD)
  ts.totalRewardsUSD = totalRewardsUSD(
    ts.vestingClaimedAmountUSD,
    ts.wipToIpOwnerUSD,
    ts.tokenToAirdropUSD,
    ts.wipToAirdropUSD,
    ts.tokenToIpTreasuryUSD,
    ts.referralWipAmountUSD,
    ts.wipToProtocolUSD,
    ts.wipToBuybackUSD,
  )
  ts.ipOwnerRewardsUSD = ipOwnerRewardsUSD(
    ts.vestingClaimedAmountUSD,
    ts.wipToIpOwnerUSD,
  )
  ts.lastUpdatedBlock = event.block.number
  ts.lastUpdatedTimestamp = event.block.timestamp
  ts.save()

  // Update IpRewardSummary (if token is linked to an IPA)
  if (ts.ipaId !== null) {
    const is_ = getOrCreateIpSummary(ts.ipaId!)
    is_.harvestCount = is_.harvestCount.plus(ONE)
    is_.wipCollected = is_.wipCollected.plus(wethAmount)
    is_.tokenCollected = is_.tokenCollected.plus(tokenAmount)
    is_.wipToIpOwner = is_.wipToIpOwner.plus(ipOwnerAmount)
    is_.wipToBuyback = is_.wipToBuyback.plus(buybackAmount)
    is_.wipToProtocol = is_.wipToProtocol.plus(wethToProtocol)
    is_.wipCollectedUSD = is_.wipCollectedUSD.plus(wipCollectedUSD)
    is_.tokenCollectedUSD = is_.tokenCollectedUSD.plus(tokenCollectedUSD)
    is_.wipToIpOwnerUSD = is_.wipToIpOwnerUSD.plus(wipToIpOwnerUSD)
    is_.wipToBuybackUSD = is_.wipToBuybackUSD.plus(wipToBuybackUSD)
    is_.wipToProtocolUSD = is_.wipToProtocolUSD.plus(wipToProtocolUSD)
    is_.totalRewardsUSD = totalRewardsUSD(
      is_.vestingClaimedAmountUSD,
      is_.wipToIpOwnerUSD,
      is_.tokenToAirdropUSD,
      is_.wipToAirdropUSD,
      is_.tokenToIpTreasuryUSD,
      is_.referralWipAmountUSD,
      is_.wipToProtocolUSD,
      is_.wipToBuybackUSD,
    )
    is_.ipOwnerRewardsUSD = ipOwnerRewardsUSD(
      is_.vestingClaimedAmountUSD,
      is_.wipToIpOwnerUSD,
    )
    is_.lastUpdatedBlock = event.block.number
    is_.lastUpdatedTimestamp = event.block.timestamp
    is_.save()
  }

  // Update GlobalRewardSummary
  const gs = getOrCreateGlobalSummary()
  gs.harvestCount = gs.harvestCount.plus(ONE)
  gs.wipCollected = gs.wipCollected.plus(wethAmount)
  gs.tokenCollected = gs.tokenCollected.plus(tokenAmount)
  gs.wipToIpOwner = gs.wipToIpOwner.plus(ipOwnerAmount)
  gs.wipToBuyback = gs.wipToBuyback.plus(buybackAmount)
  gs.wipToProtocol = gs.wipToProtocol.plus(wethToProtocol)
  gs.wipCollectedUSD = gs.wipCollectedUSD.plus(wipCollectedUSD)
  gs.tokenCollectedUSD = gs.tokenCollectedUSD.plus(tokenCollectedUSD)
  gs.wipToIpOwnerUSD = gs.wipToIpOwnerUSD.plus(wipToIpOwnerUSD)
  gs.wipToBuybackUSD = gs.wipToBuybackUSD.plus(wipToBuybackUSD)
  gs.wipToProtocolUSD = gs.wipToProtocolUSD.plus(wipToProtocolUSD)
  gs.totalRewardsUSD = totalRewardsUSD(
    gs.vestingClaimedAmountUSD,
    gs.wipToIpOwnerUSD,
    gs.tokenToAirdropUSD,
    gs.wipToAirdropUSD,
    gs.tokenToIpTreasuryUSD,
    gs.referralWipAmountUSD,
    gs.wipToProtocolUSD,
    gs.wipToBuybackUSD,
  )
  gs.ipOwnerRewardsUSD = ipOwnerRewardsUSD(
    gs.vestingClaimedAmountUSD,
    gs.wipToIpOwnerUSD,
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
  ts.totalRewardsUSD = totalRewardsUSD(
    ts.vestingClaimedAmountUSD,
    ts.wipToIpOwnerUSD,
    ts.tokenToAirdropUSD,
    ts.wipToAirdropUSD,
    ts.tokenToIpTreasuryUSD,
    ts.referralWipAmountUSD,
    ts.wipToProtocolUSD,
    ts.wipToBuybackUSD,
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
    is_.totalRewardsUSD = totalRewardsUSD(
      is_.vestingClaimedAmountUSD,
      is_.wipToIpOwnerUSD,
      is_.tokenToAirdropUSD,
      is_.wipToAirdropUSD,
      is_.tokenToIpTreasuryUSD,
      is_.referralWipAmountUSD,
      is_.wipToProtocolUSD,
      is_.wipToBuybackUSD,
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
  gs.totalRewardsUSD = totalRewardsUSD(
    gs.vestingClaimedAmountUSD,
    gs.wipToIpOwnerUSD,
    gs.tokenToAirdropUSD,
    gs.wipToAirdropUSD,
    gs.tokenToIpTreasuryUSD,
    gs.referralWipAmountUSD,
    gs.wipToProtocolUSD,
    gs.wipToBuybackUSD,
  )
  gs.ipOwnerRewardsUSD = ipOwnerRewardsUSD(
    gs.vestingClaimedAmountUSD,
    gs.wipToIpOwnerUSD,
  )
  gs.lastUpdatedBlock = event.block.number
  gs.lastUpdatedTimestamp = event.block.timestamp
  gs.save()
}

export function handleAirdropClaimedUgc(event: AirdropClaimedUgc): void {
  const token = event.params.token.toHexString()
  const recipient = event.params.recipient.toHexString()

  const airdropTokenUSDDelta = tokenToUSD(event.params.tokenAmount, token)
  const airdropWipUSDDelta = wipToUSD(event.params.wethAmount)

  // Update wallet-level summary (UGC fields only)
  const ws = getOrCreateWalletAirdropSummary(recipient)
  ws.ugcMemeTokenClaimed = ws.ugcMemeTokenClaimed.plus(event.params.tokenAmount)
  ws.ugcMemeTokenClaimedUSD = ws.ugcMemeTokenClaimedUSD.plus(airdropTokenUSDDelta)
  ws.ugcWipClaimed = ws.ugcWipClaimed.plus(event.params.wethAmount)
  ws.ugcWipClaimedUSD = ws.ugcWipClaimedUSD.plus(airdropWipUSDDelta)
  ws.ugcClaimCount = ws.ugcClaimCount.plus(ONE)
  ws.ugcLastClaimedTimestamp = event.block.timestamp
  ws.save()

  // Update wallet + token level summary (UGC fields only)
  const wts = getOrCreateWalletTokenAirdropSummary(recipient, token)
  wts.ugcMemeTokenClaimed = wts.ugcMemeTokenClaimed.plus(event.params.tokenAmount)
  wts.ugcMemeTokenClaimedUSD = wts.ugcMemeTokenClaimedUSD.plus(airdropTokenUSDDelta)
  wts.ugcWipClaimed = wts.ugcWipClaimed.plus(event.params.wethAmount)
  wts.ugcWipClaimedUSD = wts.ugcWipClaimedUSD.plus(airdropWipUSDDelta)
  wts.ugcClaimCount = wts.ugcClaimCount.plus(ONE)
  wts.ugcLastClaimedTimestamp = event.block.timestamp
  wts.save()

  // Update token-level airdrop claim summary (UGC fields only)
  const tacs = getOrCreateTokenAirdropClaimSummary(token)
  tacs.ugcMemeTokenClaimed = tacs.ugcMemeTokenClaimed.plus(event.params.tokenAmount)
  tacs.ugcMemeTokenClaimedUSD = tacs.ugcMemeTokenClaimedUSD.plus(airdropTokenUSDDelta)
  tacs.ugcWipClaimed = tacs.ugcWipClaimed.plus(event.params.wethAmount)
  tacs.ugcWipClaimedUSD = tacs.ugcWipClaimedUSD.plus(airdropWipUSDDelta)
  tacs.ugcClaimCount = tacs.ugcClaimCount.plus(ONE)
  tacs.ugcLastClaimedTimestamp = event.block.timestamp
  tacs.save()

  // Create individual claim record
  const claimId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
  const claim = new WalletAirdropClaim(claimId)
  claim.wallet = recipient
  claim.token = token
  claim.claimType = 'ugc'
  claim.tokenAmount = event.params.tokenAmount
  claim.wethAmount = event.params.wethAmount
  claim.tokenAmountUSD = airdropTokenUSDDelta
  claim.wethAmountUSD = airdropWipUSDDelta
  claim.blockNumber = event.block.number
  claim.timestamp = event.block.timestamp
  claim.transactionHash = event.transaction.hash.toHexString()
  claim.save()
}

export function handleAirdropClaimedHolder(event: AirdropClaimedHolder): void {
  const token = event.params.token.toHexString()
  const recipient = event.params.recipient.toHexString()

  const airdropTokenUSDDelta = tokenToUSD(event.params.tokenAmount, token)
  const airdropWipUSDDelta = wipToUSD(event.params.wethAmount)

  // Update wallet-level summary (Holder fields only)
  const ws = getOrCreateWalletAirdropSummary(recipient)
  ws.holderMemeTokenClaimed = ws.holderMemeTokenClaimed.plus(event.params.tokenAmount)
  ws.holderMemeTokenClaimedUSD = ws.holderMemeTokenClaimedUSD.plus(airdropTokenUSDDelta)
  ws.holderWipClaimed = ws.holderWipClaimed.plus(event.params.wethAmount)
  ws.holderWipClaimedUSD = ws.holderWipClaimedUSD.plus(airdropWipUSDDelta)
  ws.holderClaimCount = ws.holderClaimCount.plus(ONE)
  ws.holderLastClaimedTimestamp = event.block.timestamp
  ws.save()

  // Update wallet + token level summary (Holder fields only)
  const wts = getOrCreateWalletTokenAirdropSummary(recipient, token)
  wts.holderMemeTokenClaimed = wts.holderMemeTokenClaimed.plus(event.params.tokenAmount)
  wts.holderMemeTokenClaimedUSD = wts.holderMemeTokenClaimedUSD.plus(airdropTokenUSDDelta)
  wts.holderWipClaimed = wts.holderWipClaimed.plus(event.params.wethAmount)
  wts.holderWipClaimedUSD = wts.holderWipClaimedUSD.plus(airdropWipUSDDelta)
  wts.holderClaimCount = wts.holderClaimCount.plus(ONE)
  wts.holderLastClaimedTimestamp = event.block.timestamp
  wts.save()

  // Update token-level airdrop claim summary (Holder fields only)
  const tacs = getOrCreateTokenAirdropClaimSummary(token)
  tacs.holderMemeTokenClaimed = tacs.holderMemeTokenClaimed.plus(event.params.tokenAmount)
  tacs.holderMemeTokenClaimedUSD = tacs.holderMemeTokenClaimedUSD.plus(airdropTokenUSDDelta)
  tacs.holderWipClaimed = tacs.holderWipClaimed.plus(event.params.wethAmount)
  tacs.holderWipClaimedUSD = tacs.holderWipClaimedUSD.plus(airdropWipUSDDelta)
  tacs.holderClaimCount = tacs.holderClaimCount.plus(ONE)
  tacs.holderLastClaimedTimestamp = event.block.timestamp
  tacs.save()

  // Create individual claim record
  const claimId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
  const claim = new WalletAirdropClaim(claimId)
  claim.wallet = recipient
  claim.token = token
  claim.claimType = 'holder'
  claim.tokenAmount = event.params.tokenAmount
  claim.wethAmount = event.params.wethAmount
  claim.tokenAmountUSD = airdropTokenUSDDelta
  claim.wethAmountUSD = airdropWipUSDDelta
  claim.blockNumber = event.block.number
  claim.timestamp = event.block.timestamp
  claim.transactionHash = event.transaction.hash.toHexString()
  claim.save()
}

export function handleTreasuryFlushed(event: TreasuryFlushed): void {
  const token = event.params.token.toHexString()

  const treasuryUSDDelta = tokenToUSD(event.params.amount, token)

  const ts = getOrCreateTokenSummary(token)
  ts.tokenToIpTreasury = ts.tokenToIpTreasury.plus(event.params.amount)
  ts.tokenToIpTreasuryUSD = ts.tokenToIpTreasuryUSD.plus(treasuryUSDDelta)
  ts.totalRewardsUSD = totalRewardsUSD(
    ts.vestingClaimedAmountUSD,
    ts.wipToIpOwnerUSD,
    ts.tokenToAirdropUSD,
    ts.wipToAirdropUSD,
    ts.tokenToIpTreasuryUSD,
    ts.referralWipAmountUSD,
    ts.wipToProtocolUSD,
    ts.wipToBuybackUSD,
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
    is_.tokenToIpTreasury = is_.tokenToIpTreasury.plus(event.params.amount)
    is_.tokenToIpTreasuryUSD = is_.tokenToIpTreasuryUSD.plus(treasuryUSDDelta)
    is_.totalRewardsUSD = totalRewardsUSD(
      is_.vestingClaimedAmountUSD,
      is_.wipToIpOwnerUSD,
      is_.tokenToAirdropUSD,
      is_.wipToAirdropUSD,
      is_.tokenToIpTreasuryUSD,
      is_.referralWipAmountUSD,
      is_.wipToProtocolUSD,
      is_.wipToBuybackUSD,
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
  gs.tokenToIpTreasury = gs.tokenToIpTreasury.plus(event.params.amount)
  gs.tokenToIpTreasuryUSD = gs.tokenToIpTreasuryUSD.plus(treasuryUSDDelta)
  gs.totalRewardsUSD = totalRewardsUSD(
    gs.vestingClaimedAmountUSD,
    gs.wipToIpOwnerUSD,
    gs.tokenToAirdropUSD,
    gs.wipToAirdropUSD,
    gs.tokenToIpTreasuryUSD,
    gs.referralWipAmountUSD,
    gs.wipToProtocolUSD,
    gs.wipToBuybackUSD,
  )
  gs.ipOwnerRewardsUSD = ipOwnerRewardsUSD(
    gs.vestingClaimedAmountUSD,
    gs.wipToIpOwnerUSD,
  )
  gs.lastUpdatedBlock = event.block.number
  gs.lastUpdatedTimestamp = event.block.timestamp
  gs.save()
}

export function handleReferralFeePaid(event: ReferralFeePaid): void {
  const token = event.params.token.toHexString()
  const ipaId = event.params.ipaId.toHexString()

  const referralUSDDelta = wipToUSD(event.params.amount)

  const ts = getOrCreateTokenSummary(token)
  ts.referralWipAmount = ts.referralWipAmount.plus(event.params.amount)
  ts.referralWipAmountUSD = ts.referralWipAmountUSD.plus(referralUSDDelta)
  ts.totalRewardsUSD = totalRewardsUSD(
    ts.vestingClaimedAmountUSD,
    ts.wipToIpOwnerUSD,
    ts.tokenToAirdropUSD,
    ts.wipToAirdropUSD,
    ts.tokenToIpTreasuryUSD,
    ts.referralWipAmountUSD,
    ts.wipToProtocolUSD,
    ts.wipToBuybackUSD,
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
    is_.referralWipAmount = is_.referralWipAmount.plus(event.params.amount)
    is_.referralWipAmountUSD = is_.referralWipAmountUSD.plus(referralUSDDelta)
    is_.totalRewardsUSD = totalRewardsUSD(
      is_.vestingClaimedAmountUSD,
      is_.wipToIpOwnerUSD,
      is_.tokenToAirdropUSD,
      is_.wipToAirdropUSD,
      is_.tokenToIpTreasuryUSD,
      is_.referralWipAmountUSD,
      is_.wipToProtocolUSD,
      is_.wipToBuybackUSD,
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
  gs.referralWipAmount = gs.referralWipAmount.plus(event.params.amount)
  gs.referralWipAmountUSD = gs.referralWipAmountUSD.plus(referralUSDDelta)
  gs.totalRewardsUSD = totalRewardsUSD(
    gs.vestingClaimedAmountUSD,
    gs.wipToIpOwnerUSD,
    gs.tokenToAirdropUSD,
    gs.wipToAirdropUSD,
    gs.tokenToIpTreasuryUSD,
    gs.referralWipAmountUSD,
    gs.wipToProtocolUSD,
    gs.wipToBuybackUSD,
  )
  gs.ipOwnerRewardsUSD = ipOwnerRewardsUSD(
    gs.vestingClaimedAmountUSD,
    gs.wipToIpOwnerUSD,
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
  is_.vestingStart = ts.vestingStart
  is_.vestingEnd = ts.vestingEnd
  is_.harvestCount = is_.harvestCount.plus(ts.harvestCount)
  is_.tokenCollected = is_.tokenCollected.plus(ts.tokenCollected)
  is_.tokenToIpTreasury = is_.tokenToIpTreasury.plus(ts.tokenToIpTreasury)
  is_.tokenToAirdrop = is_.tokenToAirdrop.plus(ts.tokenToAirdrop)
  is_.wipCollected = is_.wipCollected.plus(ts.wipCollected)
  is_.wipToIpOwner = is_.wipToIpOwner.plus(ts.wipToIpOwner)
  is_.wipToBuyback = is_.wipToBuyback.plus(ts.wipToBuyback)
  is_.wipToAirdrop = is_.wipToAirdrop.plus(ts.wipToAirdrop)
  is_.wipToProtocol = is_.wipToProtocol.plus(ts.wipToProtocol)
  is_.referralWipAmount = is_.referralWipAmount.plus(ts.referralWipAmount)
  // Migrate USD values
  is_.vestingClaimedAmountUSD = is_.vestingClaimedAmountUSD.plus(ts.vestingClaimedAmountUSD)
  is_.tokenCollectedUSD = is_.tokenCollectedUSD.plus(ts.tokenCollectedUSD)
  is_.tokenToIpTreasuryUSD = is_.tokenToIpTreasuryUSD.plus(ts.tokenToIpTreasuryUSD)
  is_.tokenToAirdropUSD = is_.tokenToAirdropUSD.plus(ts.tokenToAirdropUSD)
  is_.wipCollectedUSD = is_.wipCollectedUSD.plus(ts.wipCollectedUSD)
  is_.wipToIpOwnerUSD = is_.wipToIpOwnerUSD.plus(ts.wipToIpOwnerUSD)
  is_.wipToBuybackUSD = is_.wipToBuybackUSD.plus(ts.wipToBuybackUSD)
  is_.wipToAirdropUSD = is_.wipToAirdropUSD.plus(ts.wipToAirdropUSD)
  is_.wipToProtocolUSD = is_.wipToProtocolUSD.plus(ts.wipToProtocolUSD)
  is_.referralWipAmountUSD = is_.referralWipAmountUSD.plus(ts.referralWipAmountUSD)
  is_.totalRewardsUSD = totalRewardsUSD(
    is_.vestingClaimedAmountUSD,
    is_.wipToIpOwnerUSD,
    is_.tokenToAirdropUSD,
    is_.wipToAirdropUSD,
    is_.tokenToIpTreasuryUSD,
    is_.referralWipAmountUSD,
    is_.wipToProtocolUSD,
    is_.wipToBuybackUSD,
  )
  is_.ipOwnerRewardsUSD = ipOwnerRewardsUSD(
    is_.vestingClaimedAmountUSD,
    is_.wipToIpOwnerUSD,
  )
  is_.lastUpdatedBlock = event.block.number
  is_.lastUpdatedTimestamp = event.block.timestamp
  is_.save()
}
