import { BigInt } from '@graphprotocol/graph-ts'

import { Pool, Token } from '../../types/schema'
import { Initialize } from '../../types/templates/Pool/Pool'
import { getSubgraphConfig, SubgraphConfig } from '../../utils/chains'
import { updatePoolDayData } from '../../utils/intervalUpdates'
import { currentPoolCanUpdateTokenPricing, findNativePerToken, sqrtPriceX96ToTokenPrices } from '../../utils/pricing'
import { getIPPriceUSD, getIPPriceUSDFromPool, saveIPPriceUSD } from '../../utils/usdConversion'

export function handleInitialize(event: Initialize): void {
  handleInitializeHelper(event)
}

export function handleInitializeHelper(event: Initialize, subgraphConfig: SubgraphConfig = getSubgraphConfig()): void {
  const wrappedNativeAddress = subgraphConfig.wrappedNativeAddress
  const stablecoinAddresses = subgraphConfig.stablecoinAddresses
  const stablecoinWrappedNativePoolAddress = subgraphConfig.stablecoinWrappedNativePoolAddress
  const stablecoinIsToken0 = subgraphConfig.stablecoinIsToken0
  const minimumNativeLocked = subgraphConfig.minimumNativeLocked

  // update pool sqrt price and tick
  const pool = Pool.load(event.address.toHexString())!
  pool.sqrtPrice = event.params.sqrtPriceX96
  pool.tick = BigInt.fromI32(event.params.tick)
  pool.save()

  // update token prices
  const token0 = Token.load(pool.token0)
  const token1 = Token.load(pool.token1)

  if (token0 && token1) {
    const prices = sqrtPriceX96ToTokenPrices(event.params.sqrtPriceX96, token0 as Token, token1 as Token)
    pool.token0Price = prices[0]
    pool.token1Price = prices[1]

    if (pool.id == stablecoinWrappedNativePoolAddress) {
      const ipPriceUSD = getIPPriceUSDFromPool(pool, stablecoinIsToken0)
      saveIPPriceUSD(ipPriceUSD, pool.id, event.block.number, event.block.timestamp)
    }
  }

  updatePoolDayData(event, pool)

  // update token prices
  if (token0 && token1) {
    const ipPriceUSD = getIPPriceUSD()
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
    token0.save()
    token1.save()
  }
}
