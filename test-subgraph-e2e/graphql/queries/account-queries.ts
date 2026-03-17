/**
 * Account GraphQL Queries
 * Queries for fetching account data from the Ponder indexer
 */

import { gql } from '@apollo/client';
import { ACCOUNT_FRAGMENT } from './fragments';

/**
 * Query to fetch a single account by address
 */
export const GET_ACCOUNT = gql`
  query GetAccount($address: String!) {
    account(id: $address) {
      ...AccountFields
    }
  }
  ${ACCOUNT_FRAGMENT}
`;
