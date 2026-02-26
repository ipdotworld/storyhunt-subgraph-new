/**
 * User Transaction GraphQL Queries
 * Queries for fetching user transaction events from the Ponder indexer
 * Uses Ponder pagination (limit/offset) and items wrapper
 */

import { gql } from '@apollo/client';
import { USER_TRANSACTION_FRAGMENT } from './fragments';

/**
 * Query to fetch user transactions with pagination (ordered by timestamp desc)
 */
export const GET_USER_TRANSACTIONS = gql`
  query GetUserTransactions($user: String!, $limit: Int, $offset: Int) {
    userTransactions(
      where: { user: $user }
      orderBy: "timestamp"
      orderDirection: "desc"
      limit: $limit
      offset: $offset
    ) {
      items {
        ...UserTransactionFields
      }
    }
  }
  ${USER_TRANSACTION_FRAGMENT}
`;

/**
 * Query to fetch user transactions for a specific market
 */
export const GET_USER_TRANSACTIONS_BY_MARKET = gql`
  query GetUserTransactionsByMarket($user: String!, $marketId: String!, $limit: Int, $offset: Int) {
    userTransactions(
      where: { user: $user, marketId: $marketId }
      orderBy: "timestamp"
      orderDirection: "desc"
      limit: $limit
      offset: $offset
    ) {
      items {
        ...UserTransactionFields
      }
    }
  }
  ${USER_TRANSACTION_FRAGMENT}
`;
