import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'

export const ZERO_BI = BigInt.fromI32(0)
export const ONE_BI = BigInt.fromI32(1)
export const ZERO_BD = BigDecimal.fromString('0')
export const ONE_BD = BigDecimal.fromString('1')
export const BI_18 = BigInt.fromI32(18)
export const SECONDS_PER_YEAR = BigDecimal.fromString('31536000') // 365 * 24 * 60 * 60

export const V3_FACTORY_CONTRACT = '0xa111ddbe973094f949d78ad755cd560f8737b7e2'
export const NFT_POSITION_MANAGER_ADDRESS = '0xb3823797B00ef062Aaa1c4B3c60149AFc6CCf7a3'
export const ALPHA_HUNTER_ADDRESS = '0x774a44C1CBC75FCBD4Dc81F7b78E7C2796D25834'
export const STABLECOIN_WRAPPEDNATIVE_POOLADDRESS = '0xc56c1be28a22ced0270a4d2f45753d2b6300c1ae'
export const WIP_ADDRESS = '0x1514000000000000000000000000000000000000'
export const IPOWNER_VAULT_ADDRESS = '0x276679F9e03d2E99350d407f964b5b42A3f01c73'
export const STABLECOIN_ADDRESSES = ['0xf1815bd50389c46847f0bda824ec8da914045d14'] // USDC.e (Bridged)
export const WHITELIST_TOKEN_ADDRESSES = [
  '0x1514000000000000000000000000000000000000', // WIP
  '0xf1815bd50389c46847f0bda824ec8da914045d14', // USDC.e (Bridged)
]

export const ETHEREUM_SEPOLIA_V3_FACTORY_CONTRACT = '0x0227628f3f023bb0b980b67d528571c95c6dac1c'
export const ETHEREUM_SEPOLIA_STABLECOIN_WRAPPEDNATIVE_POOLADDRESS =
  '0x3289680dd4d6c10bb19b899729cda5eef58aeff1'
export const ETHEREUM_SEPOLIA_WETH_ADDRESS = '0xfff9976782d46cc05630d1f6ebab18b2324d6b14'
export const ETHEREUM_SEPOLIA_IPOWNER_VAULT_ADDRESS = '0x972fbe4a97ff19b4bcbf4b5e9d5d56e7630c3e5e'
export const ETHEREUM_SEPOLIA_STABLECOIN_ADDRESSES = [
  '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238', // USDC
]
export const ETHEREUM_SEPOLIA_WHITELIST_TOKEN_ADDRESSES = [
  '0xfff9976782d46cc05630d1f6ebab18b2324d6b14', // WETH
  '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238', // USDC
]

//supported chains
// subgraph does not support string enums, hence these constants
export const STORY_TESTNET_NAME = 'story-aeneid'
export const STORY_MAINNET_NAME = 'story'
export const ODYSSEY_TESTNET_NAME = 'odyssey-testnet'
export const ETHEREUM_SEPOLIA_NAME = 'sepolia'
