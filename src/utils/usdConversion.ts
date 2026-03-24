import { Address, BigInt, BigDecimal, dataSource } from '@graphprotocol/graph-ts'
import { Pool as PoolContract } from '../types/templates/Pool/Pool'
import { Pool, PriceState, Token } from '../types/schema'
import { ZERO_BD, STABLECOIN_WRAPPEDNATIVE_POOLADDRESS, STORY_TESTNET_NAME } from './constants'
import { exponentToBigDecimal } from './index'

const BI_18_BD = BigDecimal.fromString('1000000000000000000')
const PRICE_STATE_ID = 'current'

// 2^192 for sqrtPriceX96 conversion
const Q192 = BigInt.fromI32(2).pow(192 as u8).toBigDecimal()

// 10^12 = decimal adjustment for WIP(18dec) - USDC(6dec)
const DECIMAL_ADJUSTMENT = BigDecimal.fromString('1000000000000')

// Read IP/USD price from cached PriceState when available.
// Fallback to the canonical WIP-USDC pool via eth_call until the canonical
// pool has been observed in this deployment.
export function getIPPriceUSD(): BigDecimal {
  // Testnet: no USDC-WIP pool, use hardcoded $1
  if (STABLECOIN_WRAPPEDNATIVE_POOLADDRESS == '' || dataSource.network() == STORY_TESTNET_NAME) {
    return BigDecimal.fromString('1')
  }

  const cachedPriceState = PriceState.load(PRICE_STATE_ID)
  if (cachedPriceState !== null && !cachedPriceState.ipPriceUSD.equals(ZERO_BD)) {
    return cachedPriceState.ipPriceUSD
  }

  let pool = PoolContract.bind(Address.fromString(STABLECOIN_WRAPPEDNATIVE_POOLADDRESS))
  let slot0Result = pool.try_slot0()
  if (slot0Result.reverted) {
    return ZERO_BD
  }

  let sqrtPriceX96 = slot0Result.value.getSqrtPriceX96()
  if (sqrtPriceX96.isZero()) return ZERO_BD

  let num = sqrtPriceX96.times(sqrtPriceX96).toBigDecimal()
  return num.div(Q192).times(DECIMAL_ADJUSTMENT)
}

export function getIPPriceUSDFromPool(pool: Pool, stablecoinIsToken0: boolean): BigDecimal {
  return stablecoinIsToken0 ? pool.token0Price : pool.token1Price
}

export function saveIPPriceUSD(ipPriceUSD: BigDecimal, poolAddress: string, blockNumber: BigInt, timestamp: BigInt): void {
  if (ipPriceUSD.equals(ZERO_BD)) {
    return
  }

  let priceState = PriceState.load(PRICE_STATE_ID)
  if (priceState === null) {
    priceState = new PriceState(PRICE_STATE_ID)
  }

  priceState.ipPriceUSD = ipPriceUSD
  priceState.sourcePool = poolAddress
  priceState.updatedAtBlock = blockNumber
  priceState.updatedAtTimestamp = timestamp
  priceState.save()
}

export function wipToUSD(wipAmount: BigInt): BigDecimal {
  let ipPriceUSD = getIPPriceUSD()
  if (ipPriceUSD.equals(ZERO_BD)) return ZERO_BD
  return wipAmount.toBigDecimal().div(BI_18_BD).times(ipPriceUSD)
}

export function tokenToUSD(tokenAmount: BigInt, tokenAddress: string): BigDecimal {
  let ipPriceUSD = getIPPriceUSD()
  if (ipPriceUSD.equals(ZERO_BD)) return ZERO_BD
  let token = Token.load(tokenAddress)
  if (token === null) return ZERO_BD
  let divisor = exponentToBigDecimal(token.decimals)
  return tokenAmount.toBigDecimal().div(divisor).times(token.derivedIP).times(ipPriceUSD)
}
