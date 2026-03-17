/**
 * Oracle GraphQL Queries
 * Queries for fetching oracle data from the Ponder indexer
 * Uses Ponder pagination (limit/offset) and items wrapper
 */

import { gql } from '@apollo/client';
import { ORACLE_FRAGMENT } from './fragments';

/**
 * Query to fetch all oracles
 */
export const GET_ALL_ORACLES = gql`
  query GetAllOracles($limit: Int, $offset: Int) {
    oracles(limit: $limit, offset: $offset) {
      items {
        ...OracleFields
      }
    }
  }
  ${ORACLE_FRAGMENT}
`;

/**
 * Query to fetch a single oracle by ID
 */
export const GET_ORACLE_BY_ID = gql`
  query GetOracleById($id: String!) {
    oracle(id: $id) {
      ...OracleFields
    }
  }
  ${ORACLE_FRAGMENT}
`;
