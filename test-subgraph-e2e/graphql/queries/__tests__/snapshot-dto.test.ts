/**
 * Snapshot DTO Types Tests
 * Comprehensive tests for PonderMarketDailySnapshot, PonderMarketHourlySnapshot, and PonderPositionSnapshot DTOs
 * Tests validate type guards, hex string addresses, and BigInt string values
 */

import {
  PonderMarketDailySnapshotDTO,
  PonderMarketHourlySnapshotDTO,
  PonderPositionSnapshotDTO,
  isPonderMarketDailySnapshotDTO,
  isPonderMarketHourlySnapshotDTO,
  isPonderPositionSnapshotDTO,
} from '@/infrastructure/graphql/queries/snapshot-dto';

// Mock addresses and IDs for unit testing
const TEST_DATA = {
  MARKET_ID: '0x8ad59bede55d8de69bc34311db6e45479215a4483283890208644601c035f747',
  POSITION_ID: '0xe5560613a4221f6315e07e55a663b261761f6c59-0x8ad59bede55d8de69bc34311db6e45479215a4483283890208644601c035f747-COLLATERAL-0',
  ACCOUNT_ID: '0xe5560613a4221f6315e07e55a663b261761f6c59',
  TIMESTAMP: '1768125017',
  PREVIOUS_TIMESTAMP: '1768038617',
} as const;

describe('PonderMarketDailySnapshotDTO', () => {
  describe('isPonderMarketDailySnapshotDTO type guard', () => {
    it('should return true for valid market daily snapshot DTO', () => {
      const validDto: PonderMarketDailySnapshotDTO = {
        id: '0x8ad59bede55d8de69bc34311db6e45479215a4483283890208644601c035f747-1768125017',
        marketId: TEST_DATA.MARKET_ID,
        timestamp: TEST_DATA.TIMESTAMP,
        totalSupply: '2289545320000000000',
        totalBorrow: '0',
        totalCollateral: '1000000000000000000',
        totalSupplyUSD: '5700.00',
        totalBorrowUSD: '0.00',
        totalValueLockedUSD: '5733.3221529278',
        borrowRate: '50000000000000000',
        supplyRate: '25000000000000000',
        utilizationRate: '0',
        dailyDepositUSD: '100.50',
        dailyBorrowUSD: '0.00',
        dailyLiquidateUSD: '0.00',
        dailyRepayUSD: '0.00',
        dailyWithdrawUSD: '0.00',
        dailySupplySideRevenueUSD: '0.00',
        dailyProtocolSideRevenueUSD: '0.00',
        dailyTotalRevenueUSD: '0.00',
        inputTokenPriceUSD: '2509.43',
        blockNumber: '19324567',
      };

      expect(isPonderMarketDailySnapshotDTO(validDto)).toBe(true);
    });

    it('should return false if id is missing', () => {
      const invalidDto = {
        marketId: TEST_DATA.MARKET_ID,
        timestamp: TEST_DATA.TIMESTAMP,
        totalSupply: '2289545320000000000',
        totalBorrow: '0',
        totalValueLockedUSD: '5733.3221529278',
        borrowRate: '50000000000000000',
        supplyRate: '25000000000000000',
        dailyDepositUSD: '100.50',
        dailyBorrowUSD: '0.00',
        dailyLiquidateUSD: '0.00',
      };

      expect(isPonderMarketDailySnapshotDTO(invalidDto)).toBe(false);
    });

    it('should return false if timestamp is not a string', () => {
      const invalidDto = {
        id: '0x8ad59bede55d8de69bc34311db6e45479215a4483283890208644601c035f747-1768125017',
        marketId: TEST_DATA.MARKET_ID,
        timestamp: 1768125017,
        totalSupply: '2289545320000000000',
        totalBorrow: '0',
        totalValueLockedUSD: '5733.3221529278',
        borrowRate: '50000000000000000',
        supplyRate: '25000000000000000',
        dailyDepositUSD: '100.50',
        dailyBorrowUSD: '0.00',
        dailyLiquidateUSD: '0.00',
      };

      expect(isPonderMarketDailySnapshotDTO(invalidDto)).toBe(false);
    });

    it('should return false if marketId is missing', () => {
      const invalidDto = {
        id: '0x8ad59bede55d8de69bc34311db6e45479215a4483283890208644601c035f747-1768125017',
        timestamp: TEST_DATA.TIMESTAMP,
        totalSupply: '2289545320000000000',
        totalBorrow: '0',
        totalValueLockedUSD: '5733.3221529278',
        borrowRate: '50000000000000000',
        supplyRate: '25000000000000000',
        dailyDepositUSD: '100.50',
        dailyBorrowUSD: '0.00',
        dailyLiquidateUSD: '0.00',
      };

      expect(isPonderMarketDailySnapshotDTO(invalidDto)).toBe(false);
    });

    it('should return false if required numeric fields are missing', () => {
      const invalidDto = {
        id: '0x8ad59bede55d8de69bc34311db6e45479215a4483283890208644601c035f747-1768125017',
        marketId: TEST_DATA.MARKET_ID,
        timestamp: TEST_DATA.TIMESTAMP,
        totalValueLockedUSD: '5733.3221529278',
        // Missing required fields
      };

      expect(isPonderMarketDailySnapshotDTO(invalidDto)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isPonderMarketDailySnapshotDTO(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isPonderMarketDailySnapshotDTO(undefined)).toBe(false);
    });
  });
});

describe('PonderMarketHourlySnapshotDTO', () => {
  describe('isPonderMarketHourlySnapshotDTO type guard', () => {
    it('should return true for valid market hourly snapshot DTO', () => {
      const validDto: PonderMarketHourlySnapshotDTO = {
        id: '0x8ad59bede55d8de69bc34311db6e45479215a4483283890208644601c035f747-1768125017',
        marketId: TEST_DATA.MARKET_ID,
        timestamp: TEST_DATA.TIMESTAMP,
        totalSupply: '2289545320000000000',
        totalBorrow: '0',
        totalCollateral: '1000000000000000000',
        totalSupplyUSD: '5700.00',
        totalBorrowUSD: '0.00',
        totalValueLockedUSD: '5733.3221529278',
        borrowRate: '50000000000000000',
        supplyRate: '25000000000000000',
        utilizationRate: '0',
        hourlyDepositUSD: '10.50',
        hourlyBorrowUSD: '0.00',
        hourlyLiquidateUSD: '0.00',
        hourlyRepayUSD: '0.00',
        hourlyWithdrawUSD: '0.00',
        inputTokenPriceUSD: '2509.43',
        blockNumber: '19324567',
      };

      expect(isPonderMarketHourlySnapshotDTO(validDto)).toBe(true);
    });

    it('should return false if timestamp is missing', () => {
      const invalidDto = {
        id: '0x8ad59bede55d8de69bc34311db6e45479215a4483283890208644601c035f747-1768125017',
        marketId: TEST_DATA.MARKET_ID,
        totalSupply: '2289545320000000000',
        totalBorrow: '0',
        totalValueLockedUSD: '5733.3221529278',
        borrowRate: '50000000000000000',
        supplyRate: '25000000000000000',
        hourlyDepositUSD: '10.50',
        hourlyBorrowUSD: '0.00',
        hourlyLiquidateUSD: '0.00',
      };

      expect(isPonderMarketHourlySnapshotDTO(invalidDto)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isPonderMarketHourlySnapshotDTO(null)).toBe(false);
    });
  });
});

describe('PonderPositionSnapshotDTO', () => {
  describe('isPonderPositionSnapshotDTO type guard', () => {
    it('should return true for valid position snapshot DTO', () => {
      const validDto: PonderPositionSnapshotDTO = {
        id: TEST_DATA.POSITION_ID,
        positionId: TEST_DATA.POSITION_ID,
        marketId: TEST_DATA.MARKET_ID,
        user: TEST_DATA.ACCOUNT_ID,
        timestamp: TEST_DATA.TIMESTAMP,
        balance: '1110000000000000000',
        balanceUSD: '3138.698357802',
        supplyShares: '1110000000000000000',
        borrowShares: '0',
        collateral: '0',
        principal: '1110000000000000000',
        blockNumber: '19324567',
      };

      expect(isPonderPositionSnapshotDTO(validDto)).toBe(true);
    });

    it('should return false if id is missing', () => {
      const invalidDto = {
        positionId: TEST_DATA.POSITION_ID,
        marketId: TEST_DATA.MARKET_ID,
        user: TEST_DATA.ACCOUNT_ID,
        timestamp: TEST_DATA.TIMESTAMP,
        balance: '1110000000000000000',
        supplyShares: '1110000000000000000',
        borrowShares: '0',
        principal: '1110000000000000000',
      };

      expect(isPonderPositionSnapshotDTO(invalidDto)).toBe(false);
    });

    it('should return false if timestamp is not a string', () => {
      const invalidDto = {
        id: TEST_DATA.POSITION_ID,
        positionId: TEST_DATA.POSITION_ID,
        marketId: TEST_DATA.MARKET_ID,
        user: TEST_DATA.ACCOUNT_ID,
        timestamp: 1768125017,
        balance: '1110000000000000000',
        supplyShares: '1110000000000000000',
        borrowShares: '0',
        principal: '1110000000000000000',
      };

      expect(isPonderPositionSnapshotDTO(invalidDto)).toBe(false);
    });

    it('should return false if balance is not a string', () => {
      const invalidDto = {
        id: TEST_DATA.POSITION_ID,
        positionId: TEST_DATA.POSITION_ID,
        marketId: TEST_DATA.MARKET_ID,
        user: TEST_DATA.ACCOUNT_ID,
        timestamp: TEST_DATA.TIMESTAMP,
        balance: 1110000000000000000,
        supplyShares: '1110000000000000000',
        borrowShares: '0',
        principal: '1110000000000000000',
      };

      expect(isPonderPositionSnapshotDTO(invalidDto)).toBe(false);
    });

    it('should return false if position fields are invalid', () => {
      const invalidDto = {
        id: TEST_DATA.POSITION_ID,
        // Missing positionId, marketId, user
        timestamp: TEST_DATA.TIMESTAMP,
        balance: '1110000000000000000',
        supplyShares: '1110000000000000000',
        borrowShares: '0',
        principal: '1110000000000000000',
      };

      expect(isPonderPositionSnapshotDTO(invalidDto)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isPonderPositionSnapshotDTO(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isPonderPositionSnapshotDTO(undefined)).toBe(false);
    });

    it('should return false for non-object types', () => {
      expect(isPonderPositionSnapshotDTO('string')).toBe(false);
      expect(isPonderPositionSnapshotDTO(123)).toBe(false);
      expect(isPonderPositionSnapshotDTO(true)).toBe(false);
      expect(isPonderPositionSnapshotDTO([])).toBe(false);
    });
  });
});
