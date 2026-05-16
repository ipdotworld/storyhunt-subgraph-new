import { Address, BigInt, log } from '@graphprotocol/graph-ts'
import { TokenDeployed, TokenDeployed1, Harvest, Harvest1, HarvestDistributed, AirdropClaimedUgc, AirdropClaimedHolder, TreasuryFlushed, Linked, ReferralFeePaid, Migrated } from '../types/IPWorld/IPWorld'
import { ERC20 } from '../types/IPWorld/ERC20'
import { Pool as PoolContract } from '../types/templates/Pool/Pool'
import { IpTokenLink, Pool, Token, TokenDeployment, WalletAirdropClaim } from '../types/schema'
import { Pool as PoolTemplate } from '../types/templates'
import { getOrCreateTokenSummary, getOrCreateIpSummary, getOrCreateGlobalSummary, getOrCreateWalletAirdropSummary, getOrCreateWalletTokenAirdropSummary, getOrCreateTokenAirdropClaimSummary, totalRewardsUSD, ipOwnerRewardsUSD } from './reward-summary'
import { wipToUSD, tokenToUSD, getIPPriceUSD } from '../utils/usdConversion'
import { getSubgraphConfig } from '../utils/chains'
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol, fetchTokenTotalSupply } from '../utils/token'
import { findNativePerToken, sqrtPriceX96ToTokenPrices } from '../utils/pricing'
import { convertTokenToDecimal } from '../utils'
import { ZERO_BD, ZERO_BI, ONE_BI } from '../utils/constants'

const ONE = BigInt.fromI32(1)

function createPoolAndTokens(poolAddress: Address, eventBlockTimestamp: BigInt, eventBlockNumber: BigInt, txFrom: Address): void {
  const config = getSubgraphConfig()
  const whitelistTokens = config.whitelistTokens
  const tokenOverrides = config.tokenOverrides

  // Bind pool contract and fetch token addresses via eth_call
  const poolContract = PoolContract.bind(poolAddress)

  const token0Result = poolContract.try_token0()
  const token1Result = poolContract.try_token1()
  const feeResult = poolContract.try_fee()

  if (token0Result.reverted || token1Result.reverted || feeResult.reverted) {
    log.warning('Pool contract calls reverted for pool {}', [poolAddress.toHexString()])
    return
  }

  const token0Address = token0Result.value
  const token1Address = token1Result.value
  const fee = feeResult.value

  // Create Token entities if they don't exist
  let token0 = Token.load(token0Address.toHexString())
  if (token0 === null) {
    token0 = new Token(token0Address.toHexString())
    token0.symbol = fetchTokenSymbol(token0Address, tokenOverrides)
    token0.name = fetchTokenName(token0Address, tokenOverrides)
    token0.totalSupply = fetchTokenTotalSupply(token0Address)
    const decimals = fetchTokenDecimals(token0Address, tokenOverrides)
    if (decimals === null) {
      log.debug('decimal on token 0 was null', [])
      return
    }
    token0.decimals = decimals
    token0.derivedIP = ZERO_BD
    token0.volume = ZERO_BD
    token0.volumeUSD = ZERO_BD
    token0.feesUSD = ZERO_BD
    token0.untrackedVolumeUSD = ZERO_BD
    token0.totalValueLocked = ZERO_BD
    token0.totalValueLockedUSD = ZERO_BD
    token0.totalValueLockedUSDUntracked = ZERO_BD
    token0.txCount = ZERO_BI
    token0.poolCount = ZERO_BI
    token0.whitelistPools = []
    token0.neighbour = []
  }

  let token1 = Token.load(token1Address.toHexString())
  if (token1 === null) {
    token1 = new Token(token1Address.toHexString())
    token1.symbol = fetchTokenSymbol(token1Address, tokenOverrides)
    token1.name = fetchTokenName(token1Address, tokenOverrides)
    token1.totalSupply = fetchTokenTotalSupply(token1Address)
    const decimals = fetchTokenDecimals(token1Address, tokenOverrides)
    if (decimals === null) {
      log.debug('decimal on token 1 was null', [])
      return
    }
    token1.decimals = decimals
    token1.derivedIP = ZERO_BD
    token1.volume = ZERO_BD
    token1.volumeUSD = ZERO_BD
    token1.feesUSD = ZERO_BD
    token1.untrackedVolumeUSD = ZERO_BD
    token1.totalValueLocked = ZERO_BD
    token1.totalValueLockedUSD = ZERO_BD
    token1.totalValueLockedUSDUntracked = ZERO_BD
    token1.txCount = ZERO_BI
    token1.poolCount = ZERO_BI
    token1.whitelistPools = []
    token1.neighbour = []
  }

  // Update whitelistPools
  if (whitelistTokens.includes(token0.id)) {
    const newPools = token1.whitelistPools
    newPools.push(poolAddress.toHexString())
    token1.whitelistPools = newPools
  }
  if (whitelistTokens.includes(token1.id)) {
    const newPools = token0.whitelistPools
    newPools.push(poolAddress.toHexString())
    token0.whitelistPools = newPools
  }

  // Create Pool entity
  const pool = new Pool(poolAddress.toHexString())
  pool.token0 = token0.id
  pool.token1 = token1.id
  pool.feeTier = BigInt.fromI32(fee)
  pool.createdAtTimestamp = eventBlockTimestamp
  pool.createdAtBlockNumber = eventBlockNumber
  pool.liquidityProviderCount = ZERO_BI
  pool.txCount = ZERO_BI
  pool.liquidity = ZERO_BI
  pool.sqrtPrice = ZERO_BI
  pool.token0Price = ZERO_BD
  pool.token1Price = ZERO_BD
  pool.observationIndex = ZERO_BI
  pool.totalValueLockedToken0 = ZERO_BD
  pool.totalValueLockedToken1 = ZERO_BD
  pool.totalValueLockedUSD = ZERO_BD
  pool.totalValueLockedIP = ZERO_BD
  pool.totalValueLockedUSDUntracked = ZERO_BD
  pool.volumeToken0 = ZERO_BD
  pool.volumeToken1 = ZERO_BD
  pool.volumeUSD = ZERO_BD
  pool.feesIP = ZERO_BD
  pool.feesUSD = ZERO_BD
  pool.untrackedVolumeUSD = ZERO_BD
  pool.collectedFeesToken0 = ZERO_BD
  pool.collectedFeesToken1 = ZERO_BD
  pool.collectedFeesUSD = ZERO_BD
  pool.feeAPRIP = ZERO_BD
  pool.feeAPRUSD = ZERO_BD
  pool.from = txFrom.toHexString()

  pool.save()
  token0.poolCount = token0.poolCount.plus(ONE_BI)
  token1.poolCount = token1.poolCount.plus(ONE_BI)
  token0.neighbour = token0.neighbour.includes(token1.id) ? token0.neighbour : token0.neighbour.concat([token1.id])
  token1.neighbour = token1.neighbour.includes(token0.id) ? token1.neighbour : token1.neighbour.concat([token0.id])
  token0.save()
  token1.save()
}

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

  // Calculate vestingPendingAmount from vault balance
  const config = getSubgraphConfig()
  const vaultAddress = Address.fromString(config.ipOwnerVaultAddress)
  const tokenContract = ERC20.bind(event.params.token)
  const vaultBalanceResult = tokenContract.try_balanceOf(vaultAddress)

  let vestingPending = BigInt.fromI32(0)
  if (!vaultBalanceResult.reverted && vaultBalanceResult.value.gt(BigInt.fromI32(0))) {
    vestingPending = vaultBalanceResult.value
  } else {
    const totalSupplyResult = tokenContract.try_totalSupply()
    if (!totalSupplyResult.reverted) {
      const VESTING_PPM = BigInt.fromI32(30000)
      const PRECISION = BigInt.fromI32(1000000)
      vestingPending = totalSupplyResult.value.times(VESTING_PPM).div(PRECISION)
    }
  }

  if (vestingPending.gt(BigInt.fromI32(0))) {
    const ts = getOrCreateTokenSummary(event.params.token.toHexString())
    ts.vestingPendingAmount = vestingPending
    ts.lastUpdatedBlock = event.block.number
    ts.lastUpdatedTimestamp = event.block.timestamp
    ts.save()

    const gs = getOrCreateGlobalSummary()
    gs.vestingPendingAmount = gs.vestingPendingAmount.plus(vestingPending)
    gs.lastUpdatedBlock = event.block.number
    gs.lastUpdatedTimestamp = event.block.timestamp
    gs.save()
  }

  createPoolAndTokens(event.params.pool, event.block.timestamp, event.block.number, event.transaction.from)
  PoolTemplate.create(event.params.pool)
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

  // Calculate vestingPendingAmount from vault balance
  const config = getSubgraphConfig()
  const vaultAddress = Address.fromString(config.ipOwnerVaultAddress)
  const tokenContract = ERC20.bind(event.params.token)
  const vaultBalanceResult = tokenContract.try_balanceOf(vaultAddress)

  let vestingPending = BigInt.fromI32(0)
  if (!vaultBalanceResult.reverted && vaultBalanceResult.value.gt(BigInt.fromI32(0))) {
    vestingPending = vaultBalanceResult.value
  } else {
    const totalSupplyResult = tokenContract.try_totalSupply()
    if (!totalSupplyResult.reverted) {
      const VESTING_PPM = BigInt.fromI32(30000)
      const PRECISION = BigInt.fromI32(1000000)
      vestingPending = totalSupplyResult.value.times(VESTING_PPM).div(PRECISION)
    }
  }

  if (vestingPending.gt(BigInt.fromI32(0))) {
    const ts = getOrCreateTokenSummary(event.params.token.toHexString())
    ts.vestingPendingAmount = vestingPending
    ts.lastUpdatedBlock = event.block.number
    ts.lastUpdatedTimestamp = event.block.timestamp
    ts.save()

    const gs = getOrCreateGlobalSummary()
    gs.vestingPendingAmount = gs.vestingPendingAmount.plus(vestingPending)
    gs.lastUpdatedBlock = event.block.number
    gs.lastUpdatedTimestamp = event.block.timestamp
    gs.save()
  }

  createPoolAndTokens(event.params.pool, event.block.timestamp, event.block.number, event.transaction.from)
  PoolTemplate.create(event.params.pool)
}

export function handleHarvestV1(event: Harvest1): void {
  const token = event.params.token.toHexString()

  // V1 event: Harvest(token, tokenAmount, wethAmount, protocolFeeAmount)
  const tokenAmount = event.params.tokenAmount
  const wethAmount = event.params.wethAmount
  // V1 distribution: protocolFee -> treasury, rest -> stakingVault
  const wipToProtocol = event.params.protocolFeeAmount

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
  is_.vestingPendingAmount = is_.vestingPendingAmount.plus(ts.vestingPendingAmount)
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

export function handleMigrated(event: Migrated): void {
  const oldPoolAddress = event.params.oldPool.toHexString()
  const newPoolAddress = event.params.newPool.toHexString()

  // Skip if new pool entity already exists (LP2/LP3 Migrated events — their Mints are caught by PoolTemplate)
  const existingPool = Pool.load(newPoolAddress)
  if (existingPool !== null) {
    return
  }

  // Step 1: Create Pool + Token entities via eth_call (pool.token0, token1, fee)
  createPoolAndTokens(event.params.newPool, event.block.timestamp, event.block.number, event.transaction.from)

  const newPool = Pool.load(newPoolAddress)
  if (newPool === null) {
    return
  }

  const token0 = Token.load(newPool.token0)
  const token1 = Token.load(newPool.token1)
  if (token0 === null || token1 === null) {
    return
  }

  // Step 2: Compensate missed Initialize — read on-chain state via slot0() and liquidity()
  const poolContract = PoolContract.bind(event.params.newPool)
  const slot0Result = poolContract.try_slot0()
  if (!slot0Result.reverted) {
    newPool.sqrtPrice = slot0Result.value.getSqrtPriceX96()
    newPool.tick = BigInt.fromI32(slot0Result.value.getTick())

    const prices = sqrtPriceX96ToTokenPrices(newPool.sqrtPrice, token0 as Token, token1 as Token)
    newPool.token0Price = prices[0]
    newPool.token1Price = prices[1]
  }
  const liquidityResult = poolContract.try_liquidity()
  if (!liquidityResult.reverted) {
    newPool.liquidity = liquidityResult.value
  }

  // Step 3: Compensate missed LP1 Mint — add TVL from Migrated event amounts
  // Determine which side is WIP vs memetoken by checking pool.token0
  const config = getSubgraphConfig()
  const wrappedNativeAddress = config.wrappedNativeAddress

  if (newPool.token0 == wrappedNativeAddress) {
    // token0 = WIP, token1 = memetoken
    const wethDecimal = convertTokenToDecimal(event.params.wethAmount, token0.decimals)
    const tokenDecimal = convertTokenToDecimal(event.params.tokenAmount, token1.decimals)
    newPool.totalValueLockedToken0 = newPool.totalValueLockedToken0.plus(wethDecimal)
    newPool.totalValueLockedToken1 = newPool.totalValueLockedToken1.plus(tokenDecimal)
    token0.totalValueLocked = token0.totalValueLocked.plus(wethDecimal)
    token1.totalValueLocked = token1.totalValueLocked.plus(tokenDecimal)
  } else {
    // token0 = memetoken, token1 = WIP
    const tokenDecimal = convertTokenToDecimal(event.params.tokenAmount, token0.decimals)
    const wethDecimal = convertTokenToDecimal(event.params.wethAmount, token1.decimals)
    newPool.totalValueLockedToken0 = newPool.totalValueLockedToken0.plus(tokenDecimal)
    newPool.totalValueLockedToken1 = newPool.totalValueLockedToken1.plus(wethDecimal)
    token0.totalValueLocked = token0.totalValueLocked.plus(tokenDecimal)
    token1.totalValueLocked = token1.totalValueLocked.plus(wethDecimal)
  }

  // Recalculate Pool TVL in IP/USD
  const ipPriceUSD = getIPPriceUSD()
  newPool.totalValueLockedIP = newPool.totalValueLockedToken0
    .times(token0.derivedIP)
    .plus(newPool.totalValueLockedToken1.times(token1.derivedIP))
  newPool.totalValueLockedUSD = newPool.totalValueLockedIP.times(ipPriceUSD)

  newPool.save()

  // Step 4: Register PoolTemplate — LP2/LP3 Mints (later in same TX) will be caught
  PoolTemplate.create(event.params.newPool)

  // Step 5: Update whitelistPools — remove old 0.3% pool, add new 1% pool
  const whitelistTokens = config.whitelistTokens

  if (whitelistTokens.includes(token1.id)) {
    const pools = token0.whitelistPools
    const filtered: string[] = []
    for (let i = 0; i < pools.length; i++) {
      if (pools[i] != oldPoolAddress) {
        filtered.push(pools[i])
      }
    }
    if (!filtered.includes(newPoolAddress)) {
      filtered.push(newPoolAddress)
    }
    token0.whitelistPools = filtered
  }

  if (whitelistTokens.includes(token0.id)) {
    const pools = token1.whitelistPools
    const filtered: string[] = []
    for (let i = 0; i < pools.length; i++) {
      if (pools[i] != oldPoolAddress) {
        filtered.push(pools[i])
      }
    }
    if (!filtered.includes(newPoolAddress)) {
      filtered.push(newPoolAddress)
    }
    token1.whitelistPools = filtered
  }

  // Step 6: Recalculate derivedIP (now pool has sqrtPrice, liquidity, TVL data)
  token0.derivedIP = findNativePerToken(
    token0 as Token,
    config.wrappedNativeAddress,
    config.stablecoinAddresses,
    config.minimumNativeLocked,
    ipPriceUSD,
  )
  token1.derivedIP = findNativePerToken(
    token1 as Token,
    config.wrappedNativeAddress,
    config.stablecoinAddresses,
    config.minimumNativeLocked,
    ipPriceUSD,
  )

  // Step 7: Update Token TVL USD with new derivedIP
  token0.totalValueLockedUSD = token0.totalValueLocked.times(token0.derivedIP).times(ipPriceUSD)
  token1.totalValueLockedUSD = token1.totalValueLocked.times(token1.derivedIP).times(ipPriceUSD)

  token0.save()
  token1.save()
}
