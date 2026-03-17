/**
 * Market GraphQL Queries
 * Queries for fetching market data from the Ponder indexer
 * Uses Ponder pagination (limit/offset) and items wrapper
 */

import { gql } from '@apollo/client';
import { MARKET_FRAGMENT } from './fragments';

/**
 * Query to fetch a single market by ID
 */
export const GET_MARKET_BY_ID = gql`
  query GetMarketById($id: String!) {
    market(id: $id) {
      ...MarketFields
    }
  }
  ${MARKET_FRAGMENT}
`;

/**
 * Query to fetch all markets with pagination
 */
export const GET_ALL_MARKETS = gql`
  query GetAllMarkets($limit: Int!, $offset: Int!) {
    markets(limit: $limit, offset: $offset) {
      items {
        ...MarketFields
      }
    }
  }
  ${MARKET_FRAGMENT}
`;

/**
 * Query to fetch all active markets
 * Note: totalSupply filter removed to show all created markets during development
 */
export const GET_ACTIVE_MARKETS = gql`
  query GetActiveMarkets($limit: Int, $offset: Int) {
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
 * Query to fetch markets by loan token address
 */
export const GET_MARKET_BY_TOKEN_ADDRESS = gql`
  query GetMarketByTokenAddress($tokenAddress: String!) {
    markets(where: { loanToken: $tokenAddress }, limit: 1) {
      items {
        ...MarketFields
      }
    }
  }
  ${MARKET_FRAGMENT}
`;

/**
 * Query to fetch market by contract address (id)
 */
export const GET_MARKET_BY_ADDRESS = gql`
  query GetMarketByAddress($address: String!) {
    markets(where: { id: $address }, limit: 1) {
      items {
        ...MarketFields
      }
    }
  }
  ${MARKET_FRAGMENT}
`;

/**
 * Query to check if market exists
 */
export const MARKET_EXISTS = gql`
  query MarketExists($id: String!) {
    market(id: $id) {
      id
    }
  }
`;

/**
 * Query to count total markets
 */
export const COUNT_MARKETS = gql`
  query CountMarkets {
    markets(limit: 1000) {
      items {
        id
      }
    }
  }
`;

/**
 * Query to fetch markets with utilization data
 * Sorting handled in the adapter layer
 */
export const GET_MARKETS_WITH_UTILIZATION = gql`
  query GetMarketsWithUtilization($limit: Int, $offset: Int) {
    markets(limit: $limit, offset: $offset) {
      items {
        ...MarketFields
      }
    }
  }
  ${MARKET_FRAGMENT}
`;
