/**
 * Live GraphQL Integration Tests
 *
 * Tests Apollo Client data fetching against the real Ponder indexer.
 *
 * These tests verify:
 * 1. GraphQL connection and data fetching
 * 2. DTO type guard validation with real data
 * 3. Ponder flat-field schema compliance
 * 4. Repository methods with live queries
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { ApolloClient, InMemoryCache, HttpLink, gql } from '@apollo/client';
import {
  isPonderMarketDTO,
  PonderMarketDTO,
  PonderMarketsResponse,
  PonderMarketResponse,
} from '@/infrastructure/graphql/queries/market-dto';
import {
  isPonderPositionDTO,
  PonderPositionDTO,
  PonderPositionsResponse,
  PonderPositionResponse,
} from '@/infrastructure/graphql/queries/position-dto';
import { graphqlConfig, ZERO_ADDRESS } from '@/config';
import { TEST_MARKETS, TEST_USERS, TEST_POSITIONS } from '../consts';

// Create a test Apollo Client for live queries
const createTestClient = () => {
  return new ApolloClient({
    link: new HttpLink({
      uri: graphqlConfig.endpoint,
      fetch,
    }),
    cache: new InMemoryCache(),
    defaultOptions: {
      query: {
        fetchPolicy: 'no-cache', // Always fetch fresh data for tests
      },
    },
  });
};

describe.skip('Live GraphQL Integration Tests', () => {
  let client: ApolloClient;

  beforeAll(() => {
    client = createTestClient();
  });

  describe('Connection Tests', () => {
    it('should connect to the Ponder indexer successfully', async () => {
      const query = gql`
        query TestConnection {
          markets(limit: 1) {
            items {
              id
            }
          }
        }
      `;

      const result = await client.query<{ markets: { items: { id: string }[] } }>({ query });
      const data = result.data!;

      expect(data).toBeDefined();
      expect(data.markets).toBeDefined();
      expect(data.markets.items).toBeDefined();
      expect(Array.isArray(data.markets.items)).toBe(true);
    });
  });

  describe('Market Data Fetching', () => {
    it('should fetch markets with all required fields', async () => {
      const query = gql`
        query GetMarkets {
          markets(limit: 5) {
            items {
              id
              loanToken
              collateralToken
              oracle
              irm
              lltv
              totalSupply
              totalBorrow
              borrowRate
              supplyRate
              utilizationRate
            }
          }
        }
      `;

      const result = await client.query<PonderMarketsResponse>({ query });
      const markets = result.data!.markets.items;

      expect(markets.length).toBeGreaterThan(0);

      // Validate first non-zero market
      const validMarket = markets.find((m: PonderMarketDTO) => m.id !== ZERO_ADDRESS);

      if (validMarket) {
        expect(validMarket.id).toMatch(/^0x[a-fA-F0-9]+$/);
        expect(typeof validMarket.loanToken).toBe('string');
        expect(typeof validMarket.collateralToken).toBe('string');
        expect(typeof validMarket.totalSupply).toBe('string');
        expect(typeof validMarket.totalBorrow).toBe('string');
      }
    });

    it('should fetch market by ID', async () => {
      const query = gql`
        query GetMarketById($id: String!) {
          market(id: $id) {
            id
            loanToken
            collateralToken
            totalSupply
            totalBorrow
            borrowRate
            supplyRate
          }
        }
      `;

      const result = await client.query<PonderMarketResponse>({
        query,
        variables: { id: TEST_MARKETS.USDC_WETH.id },
      });

      const market = result.data!.market;
      expect(market).not.toBeNull();
      if (market) {
        expect(market.id).toBe(TEST_MARKETS.USDC_WETH.id);
        expect(typeof market.loanToken).toBe('string');
        expect(typeof market.collateralToken).toBe('string');
      }
    });

    it('should fetch market with full financial data', async () => {
      const query = gql`
        query GetMarketFinancialData($id: String!) {
          market(id: $id) {
            id
            totalSupply
            totalBorrow
            totalCollateral
            totalSupplyShares
            totalBorrowShares
            totalValueLockedUSD
            maximumLTV
            liquidationThreshold
            liquidationPenalty
            borrowRate
            supplyRate
          }
        }
      `;

      const result = await client.query<PonderMarketResponse>({
        query,
        variables: { id: TEST_MARKETS.USDC_WETH.id },
      });

      const market = result.data!.market;
      expect(market).not.toBeNull();

      if (market) {
        // All values should be strings in Ponder DTOs
        const stringFields = [
          'totalSupply',
          'totalBorrow',
          'totalCollateral',
          'totalSupplyShares',
          'totalBorrowShares',
          'totalValueLockedUSD',
          'maximumLTV',
          'liquidationThreshold',
          'liquidationPenalty',
        ] as const;

        stringFields.forEach((field) => {
          const val = market[field];
          expect(typeof val).toBe('string');
        });
      }
    });
  });

  describe('Position Data Fetching', () => {
    it('should fetch positions with all required fields', async () => {
      const query = gql`
        query GetPositions {
          positions(limit: 5) {
            items {
              id
              user
              marketId
              side
              balance
              supplyShares
              borrowShares
              collateral
            }
          }
        }
      `;

      const result = await client.query<PonderPositionsResponse>({ query });
      const positions = result.data!.positions.items;

      expect(positions.length).toBeGreaterThan(0);

      const position = positions[0];
      expect(position.id).toBeDefined();
      expect(typeof position.user).toBe('string');
      expect(position.user).toMatch(/^0x[a-fA-F0-9]+$/);
      expect(typeof position.marketId).toBe('string');
      expect(['SUPPLIER', 'BORROWER', 'COLLATERAL', null]).toContain(position.side);
      expect(typeof position.supplyBalance).toBe('string');
    });

    it('should fetch positions by user address', async () => {
      const query = gql`
        query GetPositionsByUser($userAddress: String!) {
          positions(where: { user: $userAddress }) {
            items {
              id
              user
              side
              balance
            }
          }
        }
      `;

      const result = await client.query<PonderPositionsResponse>({
        query,
        variables: { userAddress: TEST_USERS.PRIMARY },
      });

      const positions = result.data!.positions.items;
      expect(positions.length).toBeGreaterThan(0);

      // All positions should belong to the queried user
      positions.forEach((pos: PonderPositionDTO) => {
        expect(pos.user.toLowerCase()).toBe(TEST_USERS.PRIMARY.toLowerCase());
      });
    });

    it('should fetch position by ID', async () => {
      const query = gql`
        query GetPositionById($id: String!) {
          position(id: $id) {
            id
            side
            balance
            user
            marketId
          }
        }
      `;

      const result = await client.query<PonderPositionResponse>({
        query,
        variables: { id: TEST_POSITIONS.COLLATERAL.id },
      });

      const position = result.data!.position;
      expect(position).not.toBeNull();
      if (position) {
        expect(position.id).toBe(TEST_POSITIONS.COLLATERAL.id);
        expect(position.side).toBe(TEST_POSITIONS.COLLATERAL.side);
        expect(position.user).toBe(TEST_POSITIONS.COLLATERAL.userAddress);
      }
    });

    it('should fetch positions by market', async () => {
      const query = gql`
        query GetPositionsByMarket($marketId: String!) {
          positions(where: { marketId: $marketId }, limit: 10) {
            items {
              id
              side
              balance
              marketId
            }
          }
        }
      `;

      const result = await client.query<PonderPositionsResponse>({
        query,
        variables: { marketId: TEST_MARKETS.USDC_WETH.id },
      });

      const positions = result.data!.positions.items;
      expect(positions.length).toBeGreaterThan(0);

      // All positions should belong to the queried market
      positions.forEach((pos: PonderPositionDTO) => {
        expect(pos.marketId).toBe(TEST_MARKETS.USDC_WETH.id);
      });
    });
  });

  describe('DTO Type Guard Validation with Live Data', () => {
    it('should validate PonderMarketDTO structure from live data', async () => {
      const query = gql`
        query GetFullMarketData {
          markets(limit: 3) {
            items {
              id
              loanToken
              collateralToken
              totalSupply
              totalBorrow
              borrowRate
              supplyRate
            }
          }
        }
      `;

      const result = await client.query<PonderMarketsResponse>({ query });
      const markets = result.data!.markets.items;

      // Find a valid market (not zero address)
      const validMarket = markets.find((m: PonderMarketDTO) => m.id !== ZERO_ADDRESS);

      if (validMarket) {
        expect(isPonderMarketDTO(validMarket)).toBe(true);
      }
    });

    it('should validate PonderPositionDTO structure from live data', async () => {
      const query = gql`
        query GetFullPositionData {
          positions(limit: 3) {
            items {
              id
              user
              marketId
              side
              balance
              supplyShares
              borrowShares
            }
          }
        }
      `;

      const result = await client.query<PonderPositionsResponse>({ query });
      const positions = result.data!.positions.items;

      positions.forEach((position: unknown) => {
        expect(isPonderPositionDTO(position)).toBe(true);
      });
    });
  });

  describe('Data Integrity Tests', () => {
    it('should return consistent data on repeated queries', async () => {
      const query = gql`
        query GetMarketCount {
          markets {
            items {
              id
            }
          }
        }
      `;

      const result1 = await client.query<PonderMarketsResponse>({ query });
      const result2 = await client.query<PonderMarketsResponse>({ query });
      const data1 = result1.data!;
      const data2 = result2.data!;

      // Market count should be consistent
      expect(data1.markets.items.length).toBe(data2.markets.items.length);
    });

    it('should handle empty results gracefully', async () => {
      const query = gql`
        query GetNonExistentMarket {
          market(id: "0x0000000000000000000000000000000000000001") {
            id
            loanToken
          }
        }
      `;

      const result = await client.query<PonderMarketResponse>({ query });
      const data = result.data!;
      expect(data.market).toBeNull();
    });

    it('should return proper string values for numeric fields', async () => {
      const query = gql`
        query GetMarketBalances {
          markets(limit: 5) {
            items {
              id
              totalSupply
              totalBorrow
            }
          }
        }
      `;

      const result = await client.query<PonderMarketsResponse>({ query });
      const markets = result.data!.markets.items;

      markets.forEach((market: PonderMarketDTO) => {
        // Values should be strings in Ponder DTOs
        expect(typeof market.totalSupply).toBe('string');
        expect(typeof market.totalBorrow).toBe('string');
      });
    });
  });
});
