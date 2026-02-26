/**
 * Token GraphQL Queries
 * Queries for fetching token data from the Ponder indexer
 * Uses Ponder pagination (limit/offset) and items wrapper
 */

import { gql } from '@apollo/client';
import { TOKEN_FRAGMENT } from './fragments';

/**
 * Query to fetch all tokens
 */
export const GET_ALL_TOKENS = gql`
  query GetAllTokens($limit: Int, $offset: Int) {
    tokens(limit: $limit, offset: $offset) {
      items {
        ...TokenFields
      }
    }
  }
  ${TOKEN_FRAGMENT}
`;

/**
 * Query to fetch a single token by ID
 */
export const GET_TOKEN_BY_ID = gql`
  query GetTokenById($id: String!) {
    token(id: $id) {
      ...TokenFields
    }
  }
  ${TOKEN_FRAGMENT}
`;

/**
 * Query to fetch specific tokens by IDs
 */
export const GET_TOKENS_BY_IDS = gql`
  query GetTokensByIds($ids: [String!]!) {
    tokens(where: { id_in: $ids }) {
      items {
        ...TokenFields
      }
    }
  }
  ${TOKEN_FRAGMENT}
`;
