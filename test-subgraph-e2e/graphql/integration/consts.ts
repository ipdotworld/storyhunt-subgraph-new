/**
 * GraphQL Test Constants
 *
 * Contains known test data from the Sepolia Giwa Chain Ponder indexer.
 * These constants are used across integration test files for consistency.
 *
 * NOTE: This file contains ONLY real data from the live Sepolia indexer.
 * Mock/fake data for unit tests should be defined locally in each test file.
 */

// =============================================================================
// Live Indexer Test Data - Known data from Sepolia Ponder indexer
// =============================================================================

/**
 * Known Markets from the Sepolia Giwa Chain Ponder indexer
 * These are real market IDs that exist on the live testnet
 */
export const TEST_MARKETS = {
  USDC_WETH: {
    id: '0x8ad59bede55d8de69bc34311db6e45479215a4483283890208644601c035f747',
    name: 'USDC / WETH',
    inputTokenSymbol: 'WETH',
  },
} as const;

/**
 * Known Users (accounts with positions) from the Sepolia indexer
 */
export const TEST_USERS = {
  PRIMARY: '0xe5560613a4221f6315e07e55a663b261761f6c59',
} as const;

/**
 * Known Positions from the Sepolia indexer
 */
export const TEST_POSITIONS = {
  COLLATERAL: {
    id: `${TEST_USERS.PRIMARY}-${TEST_MARKETS.USDC_WETH.id}-COLLATERAL-0`,
    side: 'COLLATERAL',
    userAddress: TEST_USERS.PRIMARY,
    marketId: TEST_MARKETS.USDC_WETH.id,
  },
} as const;
