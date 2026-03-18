import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'

import { Pool, Swap, Token } from '../../types/schema'
import { Swap as SwapEvent } from '../../types/templates/Pool/Pool'
import { convertTokenToDecimal, safeDiv } from '../../utils'
import { getSubgraphConfig, SubgraphConfig } from '../../utils/chains'
import { ONE_BI, ZERO_BD } from '../../utils/constants'
import { updatePoolDayData } from '../../utils/intervalUpdates'
import {
  currentPoolCanUpdateTokenPricing,
  findNativePerToken,
  getTrackedAmountUSD,
  sqrtPriceX96ToTokenPrices,
} from '../../utils/pricing'
import { getIPPriceUSD, getIPPriceUSDFromPool, saveIPPriceUSD } from '../../utils/usdConversion'

const NEGATIVE_ONE_BD = BigDecimal.fromString('-1')
const TWO_BD = BigDecimal.fromString('2')
const ONE_MILLION_BD = BigDecimal.fromString('1000000')
const ONE_DAY_BD = BigDecimal.fromString('86400')
const DAYS_PER_YEAR_BD = BigDecimal.fromString('365')
const HUNDRED_BD = BigDecimal.fromString('100')

// Helper function to compute the absolute value of a BigDecimal
function bdAbs(x: BigDecimal): BigDecimal {
  return x.lt(ZERO_BD) ? x.times(NEGATIVE_ONE_BD) : x
}

export function handleSwap(event: SwapEvent): void {
  handleSwapHelper(event)
}

export function handleSwapHelper(event: SwapEvent, subgraphConfig: SubgraphConfig = getSubgraphConfig()): void {
  const wrappedNativeAddress = subgraphConfig.wrappedNativeAddress
  const stablecoinAddresses = subgraphConfig.stablecoinAddresses
  const stablecoinWrappedNativePoolAddress = subgraphConfig.stablecoinWrappedNativePoolAddress
  const stablecoinIsToken0 = subgraphConfig.stablecoinIsToken0
  const minimumNativeLocked = subgraphConfig.minimumNativeLocked
  const whitelistTokens = subgraphConfig.whitelistTokens

  const pool = Pool.load(event.address.toHexString())!

  const token0 = Token.load(pool.token0)
  const token1 = Token.load(pool.token1)

  if (token0 && token1) {
    const prices = sqrtPriceX96ToTokenPrices(event.params.sqrtPriceX96, token0 as Token, token1 as Token)
    let ipPriceUSD = ZERO_BD

    if (pool.id == stablecoinWrappedNativePoolAddress) {
      pool.token0Price = prices[0]
      pool.token1Price = prices[1]
      ipPriceUSD = getIPPriceUSDFromPool(pool, stablecoinIsToken0)
      saveIPPriceUSD(ipPriceUSD, pool.id, event.block.number, event.block.timestamp)
    } else {
      ipPriceUSD = getIPPriceUSD()
    }

    // amounts - 0/1 are token deltas: can be positive or negative
    const amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
    const amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)

    // need absolute amounts for volume
    const amount0Abs = bdAbs(amount0)
    const amount1Abs = bdAbs(amount1)

    const amount0IP = amount0Abs.times(token0.derivedIP)
    const amount1IP = amount1Abs.times(token1.derivedIP)
    const amount0USD = amount0IP.times(ipPriceUSD)
    const amount1USD = amount1IP.times(ipPriceUSD)

    // get amount that should be tracked only - div 2 because cant count both input and output as volume
    const amountTotalUSDTracked = getTrackedAmountUSD(
      amount0Abs,
      token0 as Token,
      amount1Abs,
      token1 as Token,
      whitelistTokens,
      ipPriceUSD,
    ).div(TWO_BD)
    const amountTotalIPTracked = safeDiv(amountTotalUSDTracked, ipPriceUSD)
    const amountTotalUSDUntracked = amount0USD.plus(amount1USD).div(TWO_BD)

    const feesIP = amountTotalIPTracked.times(pool.feeTier.toBigDecimal()).div(ONE_MILLION_BD)
    const feesUSD = amountTotalUSDTracked.times(pool.feeTier.toBigDecimal()).div(ONE_MILLION_BD)

    // pool volume
    pool.volumeToken0 = pool.volumeToken0.plus(amount0Abs)
    pool.volumeToken1 = pool.volumeToken1.plus(amount1Abs)
    pool.volumeUSD = pool.volumeUSD.plus(amountTotalUSDTracked)
    pool.untrackedVolumeUSD = pool.untrackedVolumeUSD.plus(amountTotalUSDUntracked)
    pool.feesIP = pool.feesIP.plus(feesIP)
    pool.feesUSD = pool.feesUSD.plus(feesUSD)
    pool.txCount = pool.txCount.plus(ONE_BI)

    // Update the pool with the new active liquidity, price, and tick.
    pool.liquidity = event.params.liquidity
    pool.tick = BigInt.fromI32(event.params.tick)
    pool.sqrtPrice = event.params.sqrtPriceX96
    pool.totalValueLockedToken0 = pool.totalValueLockedToken0.plus(amount0)
    pool.totalValueLockedToken1 = pool.totalValueLockedToken1.plus(amount1)

    // update token0 data
    token0.volume = token0.volume.plus(amount0Abs)
    token0.totalValueLocked = token0.totalValueLocked.plus(amount0)
    token0.volumeUSD = token0.volumeUSD.plus(amountTotalUSDTracked)
    token0.untrackedVolumeUSD = token0.untrackedVolumeUSD.plus(amountTotalUSDUntracked)
    token0.feesUSD = token0.feesUSD.plus(feesUSD)
    token0.txCount = token0.txCount.plus(ONE_BI)

    // update token1 data
    token1.volume = token1.volume.plus(amount1Abs)
    token1.totalValueLocked = token1.totalValueLocked.plus(amount1)
    token1.volumeUSD = token1.volumeUSD.plus(amountTotalUSDTracked)
    token1.untrackedVolumeUSD = token1.untrackedVolumeUSD.plus(amountTotalUSDUntracked)
    token1.feesUSD = token1.feesUSD.plus(feesUSD)
    token1.txCount = token1.txCount.plus(ONE_BI)

    // updated pool ratess
    pool.token0Price = prices[0]
    pool.token1Price = prices[1]

    // update USD pricing
    if (currentPoolCanUpdateTokenPricing(token0 as Token, pool.id, wrappedNativeAddress, stablecoinAddresses)) {
      token0.derivedIP = findNativePerToken(
        token0 as Token,
        wrappedNativeAddress,
        stablecoinAddresses,
        minimumNativeLocked,
        ipPriceUSD,
        pool.id,
        pool,
        token0 as Token,
        token1 as Token,
      )
    }
    if (currentPoolCanUpdateTokenPricing(token1 as Token, pool.id, wrappedNativeAddress, stablecoinAddresses)) {
      token1.derivedIP = findNativePerToken(
        token1 as Token,
        wrappedNativeAddress,
        stablecoinAddresses,
        minimumNativeLocked,
        ipPriceUSD,
        pool.id,
        pool,
        token0 as Token,
        token1 as Token,
      )
    }

    /**
     * Things afffected by new USD rates
     */
    pool.totalValueLockedIP = pool.totalValueLockedToken0
      .times(token0.derivedIP)
      .plus(pool.totalValueLockedToken1.times(token1.derivedIP))
    pool.totalValueLockedUSD = pool.totalValueLockedIP.times(ipPriceUSD)

    const timeElapsed = event.block.timestamp.minus(pool.createdAtTimestamp)
    calculateFeeAPR(pool, feesIP, feesUSD, timeElapsed)

    token0.totalValueLockedUSD = token0.totalValueLocked.times(token0.derivedIP).times(ipPriceUSD)
    token1.totalValueLockedUSD = token1.totalValueLocked.times(token1.derivedIP).times(ipPriceUSD)

    // create Swap event
    const txHash = event.transaction.hash.toHexString()
    const swap = new Swap(txHash + '-' + event.logIndex.toString())
    swap.txHash = txHash
    swap.timestamp = event.block.timestamp
    swap.pool = pool.id
    swap.token0 = pool.token0
    swap.token1 = pool.token1
    swap.sender = event.params.sender
    swap.origin = event.transaction.from
    swap.recipient = event.params.recipient
    swap.amount0 = amount0
    swap.amount1 = amount1
    swap.amountUSD = amountTotalUSDTracked
    swap.tick = BigInt.fromI32(event.params.tick)
    swap.sqrtPriceX96 = event.params.sqrtPriceX96
    swap.logIndex = event.logIndex

    // interval data
    const poolDayData = updatePoolDayData(event, pool, false)

    poolDayData.volumeUSD = poolDayData.volumeUSD.plus(amountTotalUSDTracked)
    poolDayData.volumeToken0 = poolDayData.volumeToken0.plus(amount0Abs)
    poolDayData.volumeToken1 = poolDayData.volumeToken1.plus(amount1Abs)
    poolDayData.feesUSD = poolDayData.feesUSD.plus(feesUSD)

    swap.save()
    poolDayData.save()
    pool.save()
    token0.save()
    token1.save()
  }
}

function calculateFeeAPR(pool: Pool, feesIP: BigDecimal, feesUSD: BigDecimal, timeElapsed: BigInt): void {
  const timeElapsedBD = timeElapsed.toBigDecimal()

  // Smooth fees by averaging over a day (or another chosen window)
  const dailyFeesIP = safeDiv(feesIP.times(ONE_DAY_BD), timeElapsedBD)
  const dailyFeesUSD = safeDiv(feesUSD.times(ONE_DAY_BD), timeElapsedBD)

  // Calculate annualized fees based on daily fees
  const annualizedFeesIP = dailyFeesIP.times(DAYS_PER_YEAR_BD)
  const annualizedFeesUSD = dailyFeesUSD.times(DAYS_PER_YEAR_BD)

  // Use average liquidity to normalize APR
  const avgLiquidityIP = safeDiv(pool.totalValueLockedIP, TWO_BD)
  const avgLiquidityUSD = safeDiv(pool.totalValueLockedUSD, TWO_BD)

  pool.feeAPRIP = safeDiv(annualizedFeesIP, avgLiquidityIP).times(HUNDRED_BD)
  pool.feeAPRUSD = safeDiv(annualizedFeesUSD, avgLiquidityUSD).times(HUNDRED_BD)
}
