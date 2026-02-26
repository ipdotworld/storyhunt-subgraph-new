/**
 * Market and Position Snapshot GraphQL Queries
 * Queries for fetching historical snapshot data from the Ponder indexer
 * Uses Ponder pagination (limit/offset) and items wrapper
 * All queries use descending order (newest first)
 */

import { gql } from '@apollo/client';

/**
 * Query to fetch market daily snapshots
 */
export const GET_MARKET_DAILY_SNAPSHOTS = gql`
  query GetMarketDailySnapshots($marketId: String!, $limit: Int!, $offset: Int) {
    marketDailySnapshots(
      where: { marketId: $marketId }
      orderBy: "timestamp"
      orderDirection: "desc"
      limit: $limit
      offset: $offset
    ) {
      items {
        id
        marketId
        timestamp
        totalSupply
        totalBorrow
        totalCollateral
        totalSupplyUSD
        totalBorrowUSD
        totalValueLockedUSD
        borrowRate
        supplyRate
        utilizationRate
        dailyDepositUSD
        dailyBorrowUSD
        dailyLiquidateUSD
        dailyRepayUSD
        dailyWithdrawUSD
        dailySupplySideRevenueUSD
        dailyProtocolSideRevenueUSD
        dailyTotalRevenueUSD
        inputTokenPriceUSD
        blockNumber
      }
    }
  }
`;

/**
 * Query to fetch market hourly snapshots
 */
export const GET_MARKET_HOURLY_SNAPSHOTS = gql`
  query GetMarketHourlySnapshots($marketId: String!, $limit: Int!, $offset: Int) {
    marketHourlySnapshots(
      where: { marketId: $marketId }
      orderBy: "timestamp"
      orderDirection: "desc"
      limit: $limit
      offset: $offset
    ) {
      items {
        id
        marketId
        timestamp
        totalSupply
        totalBorrow
        totalCollateral
        totalSupplyUSD
        totalBorrowUSD
        totalValueLockedUSD
        borrowRate
        supplyRate
        utilizationRate
        hourlyDepositUSD
        hourlyBorrowUSD
        hourlyLiquidateUSD
        hourlyRepayUSD
        hourlyWithdrawUSD
        inputTokenPriceUSD
        blockNumber
      }
    }
  }
`;

/**
 * Query to fetch position snapshots
 */
export const GET_POSITION_SNAPSHOTS = gql`
  query GetPositionSnapshots($positionId: String!, $limit: Int!, $offset: Int) {
    positionSnapshots(
      where: { positionId: $positionId }
      orderBy: "timestamp"
      orderDirection: "desc"
      limit: $limit
      offset: $offset
    ) {
      items {
        id
        positionId
        marketId
        user
        timestamp
        balance
        balanceUSD
        supplyShares
        borrowShares
        collateral
        principal
        blockNumber
      }
    }
  }
`;
