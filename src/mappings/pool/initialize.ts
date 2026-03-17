import { BigInt } from '@graphprotocol/graph-ts'

import { Pool, Token } from '../../types/schema'
import { Initialize } from '../../types/templates/Pool/Pool'
import { getSubgraphConfig, SubgraphConfig } from '../../utils/chains'
import { updatePoolDayData } from '../../utils/intervalUpdates'
import { findNativePerToken } from '../../utils/pricing'
import { getIPPriceUSD } from '../../utils/usdConversion'

export function handleInitialize(event: Initialize): void {
  handleInitializeHelper(event)
}

export function handleInitializeHelper(event: Initialize, subgraphConfig: SubgraphConfig = getSubgraphConfig()): void {
  const wrappedNativeAddress = subgraphConfig.wrappedNativeAddress
  const stablecoinAddresses = subgraphConfig.stablecoinAddresses
  const minimumNativeLocked = subgraphConfig.minimumNativeLocked

  // update pool sqrt price and tick
  const pool = Pool.load(event.address.toHexString())!
  pool.sqrtPrice = event.params.sqrtPriceX96
  pool.tick = BigInt.fromI32(event.params.tick)
  pool.save()

  // update token prices
  const token0 = Token.load(pool.token0)
  const token1 = Token.load(pool.token1)

  updatePoolDayData(event)

  // update token prices
  if (token0 && token1) {
    const ipPriceUSD = getIPPriceUSD()
    token0.derivedIP = findNativePerToken(
      token0 as Token,
      wrappedNativeAddress,
      stablecoinAddresses,
      minimumNativeLocked,
      ipPriceUSD,
    )
    token1.derivedIP = findNativePerToken(
      token1 as Token,
      wrappedNativeAddress,
      stablecoinAddresses,
      minimumNativeLocked,
      ipPriceUSD,
    )
    token0.save()
    token1.save()
  }
}
