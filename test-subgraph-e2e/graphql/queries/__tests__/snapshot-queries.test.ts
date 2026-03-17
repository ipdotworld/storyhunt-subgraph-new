/**
 * Snapshot Queries Tests
 * Tests for GraphQL queries: GET_MARKET_DAILY_SNAPSHOTS, GET_MARKET_HOURLY_SNAPSHOTS, GET_POSITION_SNAPSHOTS
 */

import { gql } from '@apollo/client';
import {
  GET_MARKET_DAILY_SNAPSHOTS,
  GET_MARKET_HOURLY_SNAPSHOTS,
  GET_POSITION_SNAPSHOTS,
} from '@/infrastructure/graphql/queries/snapshot-queries';

// Test constants
const TEST_MARKET_ID = '0x8ad59bede55d8de69bc34311db6e45479215a4483283890208644601c035f747';
const TEST_POSITION_ID = '0xe5560613a4221f6315e07e55a663b261761f6c59-0x8ad59bede55d8de69bc34311db6e45479215a4483283890208644601c035f747-COLLATERAL-0';

describe('Snapshot GraphQL Queries', () => {
  describe('GET_MARKET_DAILY_SNAPSHOTS', () => {
    it('should be defined as a GraphQL query string', () => {
      expect(GET_MARKET_DAILY_SNAPSHOTS).toBeDefined();
      expect(typeof GET_MARKET_DAILY_SNAPSHOTS).toBe('object'); // gql returns DocumentNode
    });

    it('should contain query operation name', () => {
      const queryStr = GET_MARKET_DAILY_SNAPSHOTS.loc?.source.body || '';
      expect(queryStr).toContain('query');
      expect(queryStr).toContain('marketDailySnapshots');
    });

    it('should accept marketId variable', () => {
      const queryStr = GET_MARKET_DAILY_SNAPSHOTS.loc?.source.body || '';
      expect(queryStr).toContain('marketId');
    });

    it('should accept limit variable for pagination', () => {
      const queryStr = GET_MARKET_DAILY_SNAPSHOTS.loc?.source.body || '';
      expect(queryStr).toContain('limit');
    });

    it('should request timestamp field', () => {
      const queryStr = GET_MARKET_DAILY_SNAPSHOTS.loc?.source.body || '';
      expect(queryStr).toContain('timestamp');
    });

    it('should request market data', () => {
      const queryStr = GET_MARKET_DAILY_SNAPSHOTS.loc?.source.body || '';
      expect(queryStr).toContain('market');
    });

    it('should request totalValueLockedUSD field', () => {
      const queryStr = GET_MARKET_DAILY_SNAPSHOTS.loc?.source.body || '';
      expect(queryStr).toContain('totalValueLockedUSD');
    });

    it('should request daily USD fields', () => {
      const queryStr = GET_MARKET_DAILY_SNAPSHOTS.loc?.source.body || '';
      expect(queryStr).toContain('dailyDepositUSD');
      expect(queryStr).toContain('dailyBorrowUSD');
      expect(queryStr).toContain('dailyLiquidateUSD');
    });
  });

  describe('GET_MARKET_HOURLY_SNAPSHOTS', () => {
    it('should be defined as a GraphQL query string', () => {
      expect(GET_MARKET_HOURLY_SNAPSHOTS).toBeDefined();
      expect(typeof GET_MARKET_HOURLY_SNAPSHOTS).toBe('object');
    });

    it('should contain query operation name', () => {
      const queryStr = GET_MARKET_HOURLY_SNAPSHOTS.loc?.source.body || '';
      expect(queryStr).toContain('query');
      expect(queryStr).toContain('marketHourlySnapshots');
    });

    it('should accept marketId variable', () => {
      const queryStr = GET_MARKET_HOURLY_SNAPSHOTS.loc?.source.body || '';
      expect(queryStr).toContain('marketId');
    });

    it('should request hourly USD fields', () => {
      const queryStr = GET_MARKET_HOURLY_SNAPSHOTS.loc?.source.body || '';
      expect(queryStr).toContain('hourlyDepositUSD');
      expect(queryStr).toContain('hourlyBorrowUSD');
      expect(queryStr).toContain('hourlyLiquidateUSD');
    });

    it('should order by timestamp descending', () => {
      const queryStr = GET_MARKET_HOURLY_SNAPSHOTS.loc?.source.body || '';
      expect(queryStr).toContain('orderBy: "timestamp"');
      expect(queryStr).toContain('orderDirection: "desc"');
    });
  });

  describe('GET_POSITION_SNAPSHOTS', () => {
    it('should be defined as a GraphQL query string', () => {
      expect(GET_POSITION_SNAPSHOTS).toBeDefined();
      expect(typeof GET_POSITION_SNAPSHOTS).toBe('object');
    });

    it('should contain query operation name', () => {
      const queryStr = GET_POSITION_SNAPSHOTS.loc?.source.body || '';
      expect(queryStr).toContain('query');
      expect(queryStr).toContain('positionSnapshots');
    });

    it('should accept positionId variable', () => {
      const queryStr = GET_POSITION_SNAPSHOTS.loc?.source.body || '';
      expect(queryStr).toContain('positionId');
    });

    it('should accept limit variable for pagination', () => {
      const queryStr = GET_POSITION_SNAPSHOTS.loc?.source.body || '';
      expect(queryStr).toContain('limit');
    });

    it('should request balance field', () => {
      const queryStr = GET_POSITION_SNAPSHOTS.loc?.source.body || '';
      expect(queryStr).toContain('balance');
    });

    it('should request balanceUSD field', () => {
      const queryStr = GET_POSITION_SNAPSHOTS.loc?.source.body || '';
      expect(queryStr).toContain('balanceUSD');
    });

    it('should request position and user references', () => {
      const queryStr = GET_POSITION_SNAPSHOTS.loc?.source.body || '';
      expect(queryStr).toContain('position');
      expect(queryStr).toContain('user');
    });

    it('should order by timestamp descending', () => {
      const queryStr = GET_POSITION_SNAPSHOTS.loc?.source.body || '';
      expect(queryStr).toContain('orderBy: "timestamp"');
      expect(queryStr).toContain('orderDirection: "desc"');
    });
  });
});
