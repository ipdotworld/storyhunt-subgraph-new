import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'

import {
  Bundle,
  Factory,
  Pool,
  PoolDayData,
  Token,
  StoryHuntDayData,
} from './../types/schema'
import { ONE_BI, ZERO_BD, ZERO_BI } from './constants'
import { exponentToBigDecimal, safeDiv } from '.'

/**
 * Tracks global aggregate data over daily windows
 * @param event
 */
export function updateStoryHuntDayData(event: ethereum.Event, factoryAddress: string): StoryHuntDayData {
  const storyhunt = Factory.load(factoryAddress)!
  const timestamp = event.block.timestamp.toI32()
  const dayID = timestamp / 86400 // rounded
  const dayStartTimestamp = dayID * 86400
  let storyhuntDayData = StoryHuntDayData.load(dayID.toString())
  if (storyhuntDayData === null) {
    storyhuntDayData = new StoryHuntDayData(dayID.toString())
    storyhuntDayData.date = dayStartTimestamp
    storyhuntDayData.volumeIP = ZERO_BD
    storyhuntDayData.volumeUSD = ZERO_BD
    storyhuntDayData.volumeUSDUntracked = ZERO_BD
    storyhuntDayData.feesUSD = ZERO_BD
  }
  storyhuntDayData.tvlUSD = storyhunt.totalValueLockedUSD
  storyhuntDayData.txCount = storyhunt.txCount
  storyhuntDayData.save()
  return storyhuntDayData as StoryHuntDayData
}

export function updatePoolDayData(event: ethereum.Event): PoolDayData {
  const timestamp = event.block.timestamp.toI32()
  const dayID = timestamp / 86400
  const dayStartTimestamp = dayID * 86400
  const dayPoolID = event.address.toHexString().concat('-').concat(dayID.toString())
  const pool = Pool.load(event.address.toHexString())!
  let poolDayData = PoolDayData.load(dayPoolID)
  if (poolDayData === null) {
    poolDayData = new PoolDayData(dayPoolID)
    poolDayData.date = dayStartTimestamp
    poolDayData.pool = pool.id
    // things that dont get initialized always
    poolDayData.volumeToken0 = ZERO_BD
    poolDayData.volumeToken1 = ZERO_BD
    poolDayData.volumeUSD = ZERO_BD
    poolDayData.feesUSD = ZERO_BD
    poolDayData.txCount = ZERO_BI
    poolDayData.open = pool.token0Price
    poolDayData.high = pool.token0Price
    poolDayData.low = pool.token0Price
    poolDayData.close = pool.token0Price
  }

  if (pool.token0Price.gt(poolDayData.high)) {
    poolDayData.high = pool.token0Price
  }
  if (pool.token0Price.lt(poolDayData.low)) {
    poolDayData.low = pool.token0Price
  }

  poolDayData.liquidity = pool.liquidity
  poolDayData.sqrtPrice = pool.sqrtPrice
  poolDayData.token0Price = pool.token0Price
  poolDayData.token1Price = pool.token1Price
  poolDayData.close = pool.token0Price
  poolDayData.tick = pool.tick
  poolDayData.tvlUSD = pool.totalValueLockedUSD
  poolDayData.txCount = poolDayData.txCount.plus(ONE_BI)
  poolDayData.save()

  return poolDayData as PoolDayData
}




export function updateTokenMarketCap(token: Token, whitelistTokens: string[], eventTimestamp: BigInt): void {
  // Only update totalSupply from chain if the token is whitelisted and if it hasn't been updated in the last 12 hours.
  // if (whitelistTokens.includes(token.id.toLowerCase())) {
  //   // If lastMarketCapUpdate is null, update immediately.
  //   if (token.lastMarketCapUpdate === null) {
  //     let newTotalSupply = fetchTokenTotalSupply(Address.fromString(token.id))
  //     // Only update if we got a non-zero total supply.
  //     if (newTotalSupply.gt(BigInt.zero())) {
  //       token.totalSupply = newTotalSupply
  //       token.lastMarketCapUpdate = eventTimestamp
  //     }
  //   } else {
  //     // Check if at least 12 hours (43200 seconds) have passed.
  //     if (eventTimestamp.minus(token.lastMarketCapUpdate!) >= BigInt.fromI32(43200)) {
  //       let newTotalSupply = fetchTokenTotalSupply(Address.fromString(token.id))
  //       if (newTotalSupply.gt(BigInt.zero())) {
  //         token.totalSupply = newTotalSupply
  //         token.lastMarketCapUpdate = eventTimestamp
  //       }
  //     }
  //   }
  // }

  // Convert totalSupply (BigInt) to BigDecimal in token units.
  let supply = token.totalSupply.toBigDecimal().div(exponentToBigDecimal(token.decimals));

  // Calculate ratio = totalValueLockedUSD / totalValueLocked using safeDiv.
  let ratio = safeDiv(token.totalValueLockedUSD, token.totalValueLocked);

  // New market cap formula: marketCapToken = supply * (totalValueLockedUSD / totalValueLocked)
  token.marketCap = supply.times(ratio);
  token.save();
}
