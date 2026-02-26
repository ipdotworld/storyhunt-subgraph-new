/**
 * Interest Accrual GraphQL Queries
 * Queries for fetching interest accrual events from the Ponder indexer
 * Uses Ponder pagination (limit/offset) and items wrapper
 */

import { gql } from '@apollo/client';

/**
 * Query to fetch interest accruals for a market (ordered by timestamp desc)
 */
export const GET_INTEREST_ACCRUALS = gql`
  query GetInterestAccruals($marketId: String!, $limit: Int, $offset: Int) {
    interestAccruals(
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
        blockNumber
        prevBorrowRate
        borrowRate
        supplyRate
        interest
        feeShares
        totalSupply
        totalSupplyShares
        totalBorrow
        totalBorrowShares
        transactionHash
      }
    }
  }
`;
