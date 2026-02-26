/**
 * Position GraphQL Queries
 * Queries for fetching position data from the Ponder indexer
 * Uses Ponder pagination (limit/offset) and items wrapper
 */

import { gql } from '@apollo/client';
import { POSITION_FRAGMENT } from './fragments';

/**
 * Query to fetch a single position by ID
 */
export const GET_POSITION_BY_ID = gql`
  query GetPositionById($id: String!) {
    position(id: $id) {
      ...PositionFields
    }
  }
  ${POSITION_FRAGMENT}
`;

/**
 * Query to fetch all positions for a user
 */
export const GET_POSITIONS_BY_USER = gql`
  query GetPositionsByUser($user: String!, $limit: Int, $offset: Int) {
    positions(where: { user: $user }, limit: $limit, offset: $offset) {
      items {
        ...PositionFields
      }
    }
  }
  ${POSITION_FRAGMENT}
`;

/**
 * Query to fetch all positions in a market
 */
export const GET_POSITIONS_BY_MARKET = gql`
  query GetPositionsByMarket($marketId: String!, $limit: Int, $offset: Int) {
    positions(where: { marketId: $marketId }, limit: $limit, offset: $offset) {
      items {
        ...PositionFields
      }
    }
  }
  ${POSITION_FRAGMENT}
`;

/**
 * Query to fetch all positions for a user in a specific market
 */
export const GET_POSITIONS_BY_USER_AND_MARKET = gql`
  query GetPositionsByUserAndMarket($user: String!, $marketId: String!) {
    positions(where: { user: $user, marketId: $marketId }) {
      items {
        ...PositionFields
      }
    }
  }
  ${POSITION_FRAGMENT}
`;

/**
 * Query to fetch supply positions (SUPPLIER or COLLATERAL) for a user
 */
export const GET_SUPPLY_POSITIONS_BY_USER = gql`
  query GetSupplyPositionsByUser($user: String!, $limit: Int, $offset: Int) {
    positions(
      where: { user: $user, side_in: ["SUPPLIER", "COLLATERAL"] }
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
 * Query to fetch borrow positions for a user
 */
export const GET_BORROW_POSITIONS_BY_USER = gql`
  query GetBorrowPositionsByUser($user: String!, $limit: Int, $offset: Int) {
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
 * Query to fetch collateral positions for a user
 */
export const GET_COLLATERAL_POSITIONS_BY_USER = gql`
  query GetCollateralPositionsByUser($user: String!, $limit: Int, $offset: Int) {
    positions(
      where: { user: $user, side: "COLLATERAL" }
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
 * Query to fetch all positions with pagination
 */
export const GET_ALL_POSITIONS = gql`
  query GetAllPositions($limit: Int!, $offset: Int!) {
    positions(limit: $limit, offset: $offset) {
      items {
        ...PositionFields
      }
    }
  }
  ${POSITION_FRAGMENT}
`;

/**
 * Query to check if a position exists
 */
export const POSITION_EXISTS = gql`
  query PositionExists($id: String!) {
    position(id: $id) {
      id
    }
  }
`;

/**
 * Query to count positions for a user
 */
export const COUNT_POSITIONS_BY_USER = gql`
  query CountPositionsByUser($user: String!) {
    positions(where: { user: $user }, limit: 1000) {
      items {
        id
      }
    }
  }
`;

/**
 * Query to fetch positions with non-zero balance (open positions)
 */
export const GET_OPEN_POSITIONS_BY_USER = gql`
  query GetOpenPositionsByUser($user: String!, $limit: Int, $offset: Int) {
    positions(
      where: { user: $user, balance_gt: "0" }
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
