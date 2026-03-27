import { Pool, Token } from '../../types/schema'
import { Collect as CollectEvent } from '../../types/templates/Pool/Pool'
import { convertTokenToDecimal } from '../../utils'
import { getSubgraphConfig, SubgraphConfig } from '../../utils/chains'
import { getIPPriceUSD } from '../../utils/usdConversion'
import { getTrackedAmountUSD } from '../../utils/pricing'
import { updatePoolDayData } from '../../utils/intervalUpdates'

export function handleCollect(event: CollectEvent): void {
  handleCollectHelper(event)
}

export function handleCollectHelper(event: CollectEvent, subgraphConfig: SubgraphConfig = getSubgraphConfig()): void {
  const whitelistTokens = subgraphConfig.whitelistTokens

  const pool = Pool.load(event.address.toHexString())
  if (pool == null) {
    return
  }

  const token0 = Token.load(pool.token0)
  const token1 = Token.load(pool.token1)
  if (token0 == null || token1 == null) {
    return
  }

  const ipPriceUSD = getIPPriceUSD()

  const collectedAmountToken0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  const collectedAmountToken1 = convertTokenToDecimal(event.params.amount1, token1.decimals)
  const trackedCollectedAmountUSD = getTrackedAmountUSD(
    collectedAmountToken0,
    token0 as Token,
    collectedAmountToken1,
    token1 as Token,
    whitelistTokens,
    ipPriceUSD,
  )

  // Update token TVL
  token0.totalValueLocked = token0.totalValueLocked.minus(collectedAmountToken0)
  token0.totalValueLockedUSD = token0.totalValueLocked.times(token0.derivedIP.times(ipPriceUSD))

  token1.totalValueLocked = token1.totalValueLocked.minus(collectedAmountToken1)
  token1.totalValueLockedUSD = token1.totalValueLocked.times(token1.derivedIP.times(ipPriceUSD))

  // Update pool TVL
  pool.totalValueLockedToken0 = pool.totalValueLockedToken0.minus(collectedAmountToken0)
  pool.totalValueLockedToken1 = pool.totalValueLockedToken1.minus(collectedAmountToken1)
  pool.totalValueLockedIP = pool.totalValueLockedToken0
    .times(token0.derivedIP)
    .plus(pool.totalValueLockedToken1.times(token1.derivedIP))
  pool.totalValueLockedUSD = pool.totalValueLockedIP.times(ipPriceUSD)

  // Update collected fees
  pool.collectedFeesToken0 = pool.collectedFeesToken0.plus(collectedAmountToken0)
  pool.collectedFeesToken1 = pool.collectedFeesToken1.plus(collectedAmountToken1)
  pool.collectedFeesUSD = pool.collectedFeesUSD.plus(trackedCollectedAmountUSD)

  updatePoolDayData(event)

  token0.save()
  token1.save()
  pool.save()
}
