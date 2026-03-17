import { Address, BigInt, BigDecimal } from '@graphprotocol/graph-ts'
import { Pool as PoolContract } from '../types/templates/Pool/Pool'
import { Token } from '../types/schema'
import { ZERO_BD, STABLECOIN_WRAPPEDNATIVE_POOLADDRESS } from './constants'
import { exponentToBigDecimal } from './index'

const BI_18_BD = BigDecimal.fromString('1000000000000000000')

// 2^192 for sqrtPriceX96 conversion
const Q192 = BigInt.fromI32(2).pow(192 as u8).toBigDecimal()

// 10^12 = decimal adjustment for WIP(18dec) - USDC(6dec)
const DECIMAL_ADJUSTMENT = BigDecimal.fromString('1000000000000')

// Read IP/USD price directly from the WIP-USDC pool contract via eth_call.
// Graph node caches eth_calls per block, so 100 events in 1 block = 1 RPC call.
// No Pool entity or PoolCreated event needed - works from any startBlock.
// If STABLECOIN_WRAPPEDNATIVE_POOLADDRESS is empty, returns hardcoded price (testnet).
export function getIPPriceUSD(): BigDecimal {
  // Testnet: no USDC-WIP pool, use hardcoded price
  if (STABLECOIN_WRAPPEDNATIVE_POOLADDRESS == '') {
    return BigDecimal.fromString('1.5')
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
