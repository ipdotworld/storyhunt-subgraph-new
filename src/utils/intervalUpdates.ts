import { ethereum } from '@graphprotocol/graph-ts'

import { Pool, PoolDayData } from './../types/schema'
import { ONE_BI, ZERO_BD, ZERO_BI } from './constants'

export function updatePoolDayData(
  event: ethereum.Event,
  pool: Pool | null = null,
  persist: boolean = true,
): PoolDayData {
  const timestamp = event.block.timestamp.toI32()
  const dayID = timestamp / 86400
  const dayStartTimestamp = dayID * 86400
  const dayPoolID = event.address
    .toHexString()
    .concat('-')
    .concat(dayID.toString())
  const currentPool = pool ? pool : Pool.load(event.address.toHexString())!
  let poolDayData = PoolDayData.load(dayPoolID)
  if (poolDayData === null) {
    poolDayData = new PoolDayData(dayPoolID)
    poolDayData.date = dayStartTimestamp
    poolDayData.pool = currentPool.id
    // things that dont get initialized always
    poolDayData.volumeToken0 = ZERO_BD
    poolDayData.volumeToken1 = ZERO_BD
    poolDayData.volumeUSD = ZERO_BD
    poolDayData.feesUSD = ZERO_BD
    poolDayData.txCount = ZERO_BI
    poolDayData.open = currentPool.token0Price
    poolDayData.high = currentPool.token0Price
    poolDayData.low = currentPool.token0Price
    poolDayData.close = currentPool.token0Price
  }

  if (currentPool.token0Price.gt(poolDayData.high)) {
    poolDayData.high = currentPool.token0Price
  }
  if (currentPool.token0Price.lt(poolDayData.low)) {
    poolDayData.low = currentPool.token0Price
  }

  poolDayData.liquidity = currentPool.liquidity
  poolDayData.sqrtPrice = currentPool.sqrtPrice
  poolDayData.token0Price = currentPool.token0Price
  poolDayData.token1Price = currentPool.token1Price
  poolDayData.close = currentPool.token0Price
  poolDayData.tick = currentPool.tick
  poolDayData.tvlUSD = currentPool.totalValueLockedUSD
  poolDayData.txCount = poolDayData.txCount.plus(ONE_BI)
  if (persist) {
    poolDayData.save()
  }

  return poolDayData as PoolDayData
}
