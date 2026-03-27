import { BigInt } from '@graphprotocol/graph-ts'

import { Pool } from '../../types/schema'
import { Burn as BurnEvent } from '../../types/templates/Pool/Pool'

export function handleBurn(event: BurnEvent): void {
  const pool = Pool.load(event.address.toHexString())
  if (pool == null) {
    return
  }

  // Update active liquidity if burned position includes the current tick
  if (
    pool.tick !== null &&
    BigInt.fromI32(event.params.tickLower).le(pool.tick as BigInt) &&
    BigInt.fromI32(event.params.tickUpper).gt(pool.tick as BigInt)
  ) {
    pool.liquidity = pool.liquidity.minus(event.params.amount)
  }

  pool.save()
}
