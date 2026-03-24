import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'

import { exponentToBigDecimal, safeDiv } from '../utils/index'
import { Pool, Token } from './../types/schema'
import { ONE_BD, ZERO_BD, ZERO_BI } from './constants'

const Q192 = BigInt.fromI32(2).pow(192 as u8)

class PricingCandidate {
  price: BigDecimal
  liquidityIP: BigDecimal
  poolAddress: string

  constructor(price: BigDecimal = ZERO_BD, liquidityIP: BigDecimal = ZERO_BD, poolAddress: string = '') {
    this.price = price
    this.liquidityIP = liquidityIP
    this.poolAddress = poolAddress
  }
}

export function sqrtPriceX96ToTokenPrices(sqrtPriceX96: BigInt, token0: Token, token1: Token): BigDecimal[] {
  const num = sqrtPriceX96.times(sqrtPriceX96).toBigDecimal()
  const denom = BigDecimal.fromString(Q192.toString())
  const price1 = num
    .div(denom)
    .times(exponentToBigDecimal(token0.decimals))
    .div(exponentToBigDecimal(token1.decimals))

  const price0 = safeDiv(BigDecimal.fromString('1'), price1)
  return [price0, price1]
}

export function currentPoolCanUpdateTokenPricing(
  token: Token,
  poolAddress: string,
  wrappedNativeAddress: string,
  stablecoinAddresses: string[],
): boolean {
  return (
    token.id == wrappedNativeAddress ||
    stablecoinAddresses.includes(token.id) ||
    token.whitelistPools.includes(poolAddress)
  )
}

function getPricingCandidateForPool(
  token: Token,
  pool: Pool,
  minimumNativeLocked: BigDecimal,
  currentPoolAddress: string = '',
  currentPoolToken0: Token | null = null,
  currentPoolToken1: Token | null = null,
): PricingCandidate {
  if (!pool.liquidity.gt(ZERO_BI)) {
    return new PricingCandidate()
  }

  if (pool.token0 == token.id) {
    const token1 =
      currentPoolToken1 !== null && pool.id == currentPoolAddress
        ? currentPoolToken1
        : Token.load(pool.token1)
    if (token1 !== null) {
      const liquidityIP = pool.totalValueLockedToken1.times(token1.derivedIP)
      if (liquidityIP.gt(minimumNativeLocked)) {
        return new PricingCandidate(pool.token1Price.times(token1.derivedIP as BigDecimal), liquidityIP, pool.id)
      }
    }
  }

  if (pool.token1 == token.id) {
    const token0 =
      currentPoolToken0 !== null && pool.id == currentPoolAddress
        ? currentPoolToken0
        : Token.load(pool.token0)
    if (token0 !== null) {
      const liquidityIP = pool.totalValueLockedToken0.times(token0.derivedIP)
      if (liquidityIP.gt(minimumNativeLocked)) {
        return new PricingCandidate(pool.token0Price.times(token0.derivedIP as BigDecimal), liquidityIP, pool.id)
      }
    }
  }

  return new PricingCandidate()
}

function findBestPricingCandidate(
  token: Token,
  minimumNativeLocked: BigDecimal,
  currentPoolAddress: string = '',
  currentPool: Pool | null = null,
  currentPoolToken0: Token | null = null,
  currentPoolToken1: Token | null = null,
): PricingCandidate {
  const whiteList = token.whitelistPools
  let bestCandidate = new PricingCandidate()

  for (let i = 0; i < whiteList.length; ++i) {
    const poolAddress = whiteList[i]
    const pool = currentPool !== null && poolAddress == currentPoolAddress ? currentPool : Pool.load(poolAddress)

    if (pool !== null) {
      const candidate = getPricingCandidateForPool(
        token,
        pool,
        minimumNativeLocked,
        currentPoolAddress,
        currentPoolToken0,
        currentPoolToken1,
      )
      if (candidate.liquidityIP.gt(bestCandidate.liquidityIP)) {
        bestCandidate = candidate
      }
    }
  }

  return bestCandidate
}

/**
 * Search through graph to find derived IP per token.
 * @todo update to be derived IP (add stablecoin estimates)
 **/
export function findNativePerToken(
  token: Token,
  wrappedNativeAddress: string,
  stablecoinAddresses: string[],
  minimumNativeLocked: BigDecimal,
  ipPriceUSD: BigDecimal,
  currentPoolAddress: string = '',
  currentPool: Pool | null = null,
  currentPoolToken0: Token | null = null,
  currentPoolToken1: Token | null = null,
): BigDecimal {
  if (token.id == wrappedNativeAddress) {
    token.pricingPool = null
    token.pricingPoolLiquidityIP = ZERO_BD
    return ONE_BD
  }

  // hardcoded fix for incorrect rates
  // if whitelist includes token - get the safe price
  if (stablecoinAddresses.includes(token.id)) {
    token.pricingPool = null
    token.pricingPoolLiquidityIP = ZERO_BD
    return safeDiv(ONE_BD, ipPriceUSD)
  }

  const currentPoolIsWhitelisted = currentPoolAddress != '' && token.whitelistPools.includes(currentPoolAddress)
  const currentPoolIsPricingPool = token.pricingPool !== null && token.pricingPool == currentPoolAddress

  if (currentPoolIsWhitelisted && !currentPoolIsPricingPool && token.pricingPoolLiquidityIP.gt(ZERO_BD) && currentPool !== null) {
    const currentCandidate = getPricingCandidateForPool(
      token,
      currentPool,
      minimumNativeLocked,
      currentPoolAddress,
      currentPoolToken0,
      currentPoolToken1,
    )
    if (currentCandidate.liquidityIP.gt(token.pricingPoolLiquidityIP)) {
      token.pricingPool = currentCandidate.poolAddress
      token.pricingPoolLiquidityIP = currentCandidate.liquidityIP
      return currentCandidate.price
    }
    return token.derivedIP
  }

  const bestCandidate = findBestPricingCandidate(
    token,
    minimumNativeLocked,
    currentPoolAddress,
    currentPool,
    currentPoolToken0,
    currentPoolToken1,
  )

  token.pricingPool = bestCandidate.poolAddress == '' ? null : bestCandidate.poolAddress
  token.pricingPoolLiquidityIP = bestCandidate.liquidityIP
  return bestCandidate.price
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD * 2.
 * If both are, return sum of two amounts
 * If neither is, return 0
 */
export function getTrackedAmountUSD(
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token,
  whitelistTokens: string[],
  ipPriceUSD: BigDecimal,
): BigDecimal {
  const price0USD = token0.derivedIP.times(ipPriceUSD)
  const price1USD = token1.derivedIP.times(ipPriceUSD)

  // both are whitelist tokens, return sum of both amounts
  if (whitelistTokens.includes(token0.id) && whitelistTokens.includes(token1.id)) {
    return tokenAmount0.times(price0USD).plus(tokenAmount1.times(price1USD))
  }

  // take double value of the whitelisted token amount
  if (whitelistTokens.includes(token0.id) && !whitelistTokens.includes(token1.id)) {
    return tokenAmount0.times(price0USD).times(BigDecimal.fromString('2'))
  }

  // take double value of the whitelisted token amount
  if (!whitelistTokens.includes(token0.id) && whitelistTokens.includes(token1.id)) {
    return tokenAmount1.times(price1USD).times(BigDecimal.fromString('2'))
  }

  // neither token is on white list, tracked amount is 0
  return ZERO_BD
}
