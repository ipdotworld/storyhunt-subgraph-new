/**
 * Borrow GraphQL Queries
 * Queries for fetching borrow market data from the Ponder indexer
 * Uses Ponder pagination (limit/offset) and items wrapper
 */

import { gql } from '@apollo/client';
import { MARKET_FRAGMENT, POSITION_FRAGMENT } from './fragments';

/**
 * Query to fetch all borrow markets (markets with totalBorrow > 0 or all markets for borrowing)
 */
export const GET_BORROW_MARKETS = gql`
  query GetBorrowMarkets($limit: Int, $offset: Int) {
    markets(
      limit: $limit
      offset: $offset
    ) {
      items {
        ...MarketFields
      }
    }
  }
  ${MARKET_FRAGMENT}
`;

/**
 * Query to fetch all markets for borrow view
 */
export const GET_ALL_MARKETS_FOR_BORROW = gql`
  query GetAllMarketsForBorrow($limit: Int, $offset: Int) {
    markets(limit: $limit, offset: $offset) {
      items {
        ...MarketFields
      }
    }
  }
  ${MARKET_FRAGMENT}
`;

/**
 * Query to fetch a single borrow market by ID
 */
export const GET_BORROW_MARKET_BY_ID = gql`
  query GetBorrowMarketById($id: String!) {
    market(id: $id) {
      ...MarketFields
    }
  }
  ${MARKET_FRAGMENT}
`;

/**
 * Query to fetch borrow markets with pagination
 */
export const GET_BORROW_MARKETS_PAGINATED = gql`
  query GetBorrowMarketsPaginated($limit: Int!, $offset: Int!) {
    markets(
      limit: $limit
      offset: $offset
    ) {
      items {
        ...MarketFields
      }
    }
  }
  ${MARKET_FRAGMENT}
`;

/**
 * Query to fetch user's borrow positions (positions with side BORROWER)
 */
export const GET_USER_BORROW_POSITIONS = gql`
  query GetUserBorrowPositions($user: String!, $limit: Int, $offset: Int) {
    positions(
      where: { user: $user, side: "BORROWER" }
      limit: $limit
      offset: $offset
    ) {
      items {
        ...PositionFields
      }
    }
  }
  ${POSITION_FRAGMENT}
`;

/**
 * Query to fetch all positions for a user (both supply and borrow)
 */
export const GET_USER_ALL_POSITIONS = gql`
  query GetUserAllPositions($user: String!, $limit: Int, $offset: Int) {
    positions(where: { user: $user }, limit: $limit, offset: $offset) {
      items {
        ...PositionFields
      }
    }
  }
  ${POSITION_FRAGMENT}
`;

/**
 * Query to fetch a single position by ID (aliased for borrow context)
 */
export const GET_POSITION_BY_ID = gql`
  query GetBorrowPositionById($id: String!) {
    position(id: $id) {
      ...PositionFields
    }
  }
  ${POSITION_FRAGMENT}
`;

/**
 * Query to fetch user positions for a specific market
 */
export const GET_USER_POSITIONS_FOR_MARKET = gql`
  query GetUserPositionsForMarket($user: String!, $marketId: String!) {
    positions(where: { user: $user, marketId: $marketId }) {
      items {
        ...PositionFields
      }
    }
  }
  ${POSITION_FRAGMENT}
`;

/**
 * Query to fetch user borrow positions with pagination
 */
export const GET_USER_BORROW_POSITIONS_PAGINATED = gql`
  query GetUserBorrowPositionsPaginated($user: String!, $limit: Int!, $offset: Int!) {
    positions(
      where: { user: $user, side: "BORROWER" }
      limit: $limit
      offset: $offset
    ) {
      items {
        ...PositionFields
      }
    }
  }
  ${POSITION_FRAGMENT}
`;

/**
 * Query to count total borrow markets
 */
export const COUNT_BORROW_MARKETS = gql`
  query CountBorrowMarkets {
    markets(limit: 1000) {
      items {
        id
      }
    }
  }
`;

/**
 * Query to count user's borrow positions
 */
export const COUNT_USER_BORROW_POSITIONS = gql`
  query CountUserBorrowPositions($user: String!) {
    positions(where: { user: $user, side: "BORROWER" }, limit: 1000) {
      items {
        id
      }
    }
  }
`;
