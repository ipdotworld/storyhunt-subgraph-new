/**
 * Vault (MetaMorpho) GraphQL Queries
 * Queries for fetching vault data from the Ponder indexer
 * Uses Ponder pagination (limit/offset) and items wrapper
 */

import { gql } from '@apollo/client';
import {
  META_MORPHO_FRAGMENT,
  META_MORPHO_MARKET_FRAGMENT,
  META_MORPHO_POSITION_FRAGMENT,
} from './fragments';

/**
 * Query to fetch all vaults
 */
export const GET_VAULTS = gql`
  query GetVaults($limit: Int, $offset: Int) {
    metaMorphos(
      limit: $limit
      offset: $offset
      orderBy: "lastTotalAssets"
      orderDirection: "desc"
    ) {
      items {
        ...MetaMorphoFields
      }
    }
  }
  ${META_MORPHO_FRAGMENT}
`;

/**
 * Query to fetch a single vault by ID
 */
export const GET_VAULT_BY_ID = gql`
  query GetVaultById($id: String!) {
    metaMorpho(id: $id) {
      ...MetaMorphoFields
    }
  }
  ${META_MORPHO_FRAGMENT}
`;

/**
 * Query to fetch vault market allocations
 */
export const GET_VAULT_MARKET_ALLOCATIONS = gql`
  query GetVaultMarketAllocations($vaultId: String!, $limit: Int, $offset: Int) {
    metaMorphoMarkets(
      where: { vaultId: $vaultId }
      limit: $limit
      offset: $offset
    ) {
      items {
        ...MetaMorphoMarketFields
      }
    }
  }
  ${META_MORPHO_MARKET_FRAGMENT}
`;

/**
 * Query to fetch a user's position in a specific vault
 */
export const GET_VAULT_USER_POSITION = gql`
  query GetVaultUserPosition($vaultId: String!, $user: String!) {
    metaMorphoPositions(
      where: { vaultId: $vaultId, user: $user }
      limit: 1
    ) {
      items {
        ...MetaMorphoPositionFields
      }
    }
  }
  ${META_MORPHO_POSITION_FRAGMENT}
`;

/**
 * Query to fetch all vault positions for a user
 */
export const GET_USER_VAULT_POSITIONS = gql`
  query GetUserVaultPositions($user: String!, $limit: Int, $offset: Int) {
    metaMorphoPositions(
      where: { user: $user, shares_gt: "0" }
      limit: $limit
      offset: $offset
    ) {
      items {
        ...MetaMorphoPositionFields
      }
    }
  }
  ${META_MORPHO_POSITION_FRAGMENT}
`;

/**
 * Query to fetch vault deposits
 */
export const GET_VAULT_DEPOSITS = gql`
  query GetVaultDeposits($vaultId: String!, $limit: Int, $offset: Int) {
    metaMorphoDeposits(
      where: { vaultId: $vaultId }
      orderBy: "timestamp"
      orderDirection: "desc"
      limit: $limit
      offset: $offset
    ) {
      items {
        id
        vaultId
        user
        assets
        shares
        timestamp
        blockNumber
        transactionHash
      }
    }
  }
`;

/**
 * Query to fetch vault withdrawals
 */
export const GET_VAULT_WITHDRAWALS = gql`
  query GetVaultWithdrawals($vaultId: String!, $limit: Int, $offset: Int) {
    metaMorphoWithdraws(
      where: { vaultId: $vaultId }
      orderBy: "timestamp"
      orderDirection: "desc"
      limit: $limit
      offset: $offset
    ) {
      items {
        id
        vaultId
        user
        assets
        shares
        timestamp
        blockNumber
        transactionHash
      }
    }
  }
`;
