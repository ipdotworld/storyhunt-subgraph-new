import { BigInt } from '@graphprotocol/graph-ts'

import { Pool, Token } from '../../types/schema'
import { Mint as MintEvent } from '../../types/templates/Pool/Pool'
import { convertTokenToDecimal } from '../../utils'
import { getSubgraphConfig, SubgraphConfig } from '../../utils/chains'
import { ONE_BI } from '../../utils/constants'
import { updatePoolDayData } from '../../utils/intervalUpdates'
import { getIPPriceUSD } from '../../utils/usdConversion'

export function handleMint(event: MintEvent): void {
  handleMintHelper(event)
}

export function handleMintHelper(event: MintEvent, subgraphConfig: SubgraphConfig = getSubgraphConfig()): void {
  const poolAddress = event.address.toHexString()
  const pool = Pool.load(poolAddress)!

  const token0 = Token.load(pool.token0)
  const token1 = Token.load(pool.token1)

  if (token0 && token1) {
    const ipPriceUSD = getIPPriceUSD()

    const amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
    const amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)

    // update token0 data
    token0.txCount = token0.txCount.plus(ONE_BI)
    token0.totalValueLocked = token0.totalValueLocked.plus(amount0)
    token0.totalValueLockedUSD = token0.totalValueLocked.times(token0.derivedIP.times(ipPriceUSD))

    // update token1 data
    token1.txCount = token1.txCount.plus(ONE_BI)
    token1.totalValueLocked = token1.totalValueLocked.plus(amount1)
    token1.totalValueLockedUSD = token1.totalValueLocked.times(token1.derivedIP.times(ipPriceUSD))

    // pool data
    pool.txCount = pool.txCount.plus(ONE_BI)

    // Pools liquidity tracks the currently active liquidity given pools current tick.
    // We only want to update it on mint if the new position includes the current tick.
    if (
      pool.tick !== null &&
      BigInt.fromI32(event.params.tickLower).le(pool.tick as BigInt) &&
      BigInt.fromI32(event.params.tickUpper).gt(pool.tick as BigInt)
    ) {
      pool.liquidity = pool.liquidity.plus(event.params.amount)
    }

    pool.totalValueLockedToken0 = pool.totalValueLockedToken0.plus(amount0)
    pool.totalValueLockedToken1 = pool.totalValueLockedToken1.plus(amount1)
    pool.totalValueLockedIP = pool.totalValueLockedToken0
      .times(token0.derivedIP)
      .plus(pool.totalValueLockedToken1.times(token1.derivedIP))
    pool.totalValueLockedUSD = pool.totalValueLockedIP.times(ipPriceUSD)

    updatePoolDayData(event)

    token0.save()
    token1.save()
    pool.save()
  }
}
