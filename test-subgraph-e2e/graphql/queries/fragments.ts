/**
 * Ponder GraphQL Fragments
 * Reusable GraphQL fragments for Ponder indexer field selections
 * All fragments match Ponder DTO type definitions
 */

import { gql } from '@apollo/client';

/**
 * Token fragment - Token fields from Ponder indexer
 */
export const TOKEN_FRAGMENT = gql`
  fragment TokenFields on token {
    id
    symbol
    name
    decimals
    lastPriceUSD
    type
  }
`;

/**
 * Oracle fragment - Oracle fields from Ponder indexer
 */
export const ORACLE_FRAGMENT = gql`
  fragment OracleFields on oracle {
    id
    address
    type
    baseAsset
    quoteAsset
    lastPrice
    lastPriceBlockNumber
    lastPriceTimestamp
    decimals
  }
`;

/**
 * Market fragment - Complete market fields from Ponder indexer
 */
export const MARKET_FRAGMENT = gql`
  fragment MarketFields on market {
    id
    loanToken
    collateralToken
    oracle
    irm
    lltv
    totalSupply
    totalSupplyShares
    totalBorrow
    totalBorrowShares
    totalCollateral
    fee
    interest
    lastUpdate
    createdAt
    createdAtBlock
    borrowRate
    supplyRate
    utilizationRate
    maximumLTV
    liquidationThreshold
    liquidationPenalty
    inputTokenPriceUSD
    totalValueLockedUSD
    cumulativeSupplySideRevenueUSD
    cumulativeProtocolSideRevenueUSD
    cumulativeTotalRevenueUSD
    transactionCount
    depositCount
    withdrawCount
    borrowCount
    repayCount
    liquidationCount
    transferCount
    flashloanCount
  }
`;

/**
 * Position fragment - Complete position fields from Ponder indexer
 */
export const POSITION_FRAGMENT = gql`
  fragment PositionFields on position {
    id
    marketId
    user
    supplyShares
    borrowShares
    collateral
    lastUpdated
    side
    supplyBalance
    borrowBalance
    supplyBalanceUSD
    borrowBalanceUSD
    isCollateral
    assetToken
    supplyPrincipal
    borrowPrincipal
    depositCount
    withdrawCount
    borrowCount
    repayCount
    liquidationCount
    asset {
      id
      symbol
      name
      decimals
      lastPriceUSD
    }
    market {
      id
      loanToken
      collateralToken
      borrowRate
      supplyRate
      utilizationRate
      maximumLTV
      liquidationThreshold
      totalValueLockedUSD
      totalSupply
      totalBorrow
      totalCollateral
    }
  }
`;

/**
 * User Transaction fragment - Transaction event fields from Ponder indexer
 */
export const USER_TRANSACTION_FRAGMENT = gql`
  fragment UserTransactionFields on userTransaction {
    id
    type
    marketId
    user
    amount
    amountUSD
    shares
    timestamp
    blockNumber
    transactionHash
    logIndex
  }
`;

/**
 * MetaMorpho (Vault) fragment - Vault fields from Ponder indexer
 */
export const META_MORPHO_FRAGMENT = gql`
  fragment MetaMorphoFields on metaMorpho {
    id
    name
    symbol
    asset
    curator
    guardian
    owner
    timelock
    totalAssets
    totalShares
    fee
    lastTotalAssets
    createdAt
    createdAtBlock
  }
`;

/**
 * MetaMorpho Market fragment - Vault market allocation fields
 */
export const META_MORPHO_MARKET_FRAGMENT = gql`
  fragment MetaMorphoMarketFields on metaMorphoMarket {
    id
    vaultId
    marketId
    enabled
    cap
    removableAt
    queuePosition
  }
`;

/**
 * MetaMorpho Position fragment - Vault user position fields
 */
export const META_MORPHO_POSITION_FRAGMENT = gql`
  fragment MetaMorphoPositionFields on metaMorphoPosition {
    id
    vaultId
    user
    shares
    assets
    lastUpdated
  }
`;

/**
 * Account fragment - Account fields from Ponder indexer
 */
export const ACCOUNT_FRAGMENT = gql`
  fragment AccountFields on account {
    address
    openPositionCount
    closedPositionCount
    depositCount
    withdrawCount
    borrowCount
    repayCount
    liquidationCount
    liquidateCount
    transferSentCount
    transferReceivedCount
    flashloanCount
  }
`;
