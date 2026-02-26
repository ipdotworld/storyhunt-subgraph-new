/**
 * Market DTO Types Tests
 * Comprehensive tests for Ponder Market DTO type definitions and type guards
 * Tests validate hex string addresses, BigInt string values, and DTO structure
 */

import {
  PonderMarketDTO,
  isPonderMarketDTO,
} from '@/infrastructure/graphql/queries/market-dto';
import { ZERO_ADDRESS } from '@/config';

// Mock addresses for unit testing
const TEST_ADDRESSES = {
  VALID_1: '0x1234567890123456789012345678901234567890',
  VALID_2: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  VALID_3: '0xaaaabbbbccccddddeeeeffffaabbccddee112222',
  VALID_4: '0x1111222233334444555566667777888899990000',
} as const;

describe('PonderMarketDTO Types', () => {
  describe('isPonderMarketDTO type guard', () => {
    it('should return true for valid market DTO', () => {
      const validDto: PonderMarketDTO = {
        id: TEST_ADDRESSES.VALID_1,
        loanToken: TEST_ADDRESSES.VALID_4,
        collateralToken: TEST_ADDRESSES.VALID_3,
        oracle: TEST_ADDRESSES.VALID_2,
        irm: TEST_ADDRESSES.VALID_1,
        lltv: '850000000000000000',
        totalSupply: '1000000000000000000000',
        totalSupplyShares: '1000000000000000000000',
        totalBorrow: '500000000000000000000',
        totalBorrowShares: '500000000000000000000',
        totalCollateral: '2500000000000000000000',
        fee: '10000000000000000',
        interest: '50000000000000000',
        lastUpdate: '1700000999',
        createdAt: '1700000000',
        createdAtBlock: '12345678',
        borrowRate: '50000000000000000',
        supplyRate: '25000000000000000',
        utilizationRate: '500000000000000000',
        maximumLTV: '800000000000000000',
        liquidationThreshold: '850000000000000000',
        liquidationPenalty: '50000000000000000',
        inputTokenPriceUSD: '2500.00',
        totalValueLockedUSD: '2500000.00',
        cumulativeSupplySideRevenueUSD: '10000.00',
        cumulativeProtocolSideRevenueUSD: '5000.00',
        cumulativeTotalRevenueUSD: '15000.00',
        transactionCount: '1000',
        depositCount: '500',
        withdrawCount: '200',
        borrowCount: '150',
        repayCount: '100',
        liquidationCount: '5',
        transferCount: '50',
        flashloanCount: '10',
      };

      expect(isPonderMarketDTO(validDto)).toBe(true);
    });

    it('should return true for inactive market with zero values', () => {
      const validDto: PonderMarketDTO = {
        id: TEST_ADDRESSES.VALID_2,
        loanToken: TEST_ADDRESSES.VALID_4,
        collateralToken: TEST_ADDRESSES.VALID_3,
        oracle: ZERO_ADDRESS,
        irm: ZERO_ADDRESS,
        lltv: '0',
        totalSupply: '0',
        totalSupplyShares: '0',
        totalBorrow: '0',
        totalBorrowShares: '0',
        totalCollateral: '0',
        fee: '0',
        interest: '0',
        lastUpdate: '1600000999',
        createdAt: '1600000000',
        createdAtBlock: '10000000',
        borrowRate: '0',
        supplyRate: '0',
        utilizationRate: '0',
        maximumLTV: '0',
        liquidationThreshold: '0',
        liquidationPenalty: '0',
        inputTokenPriceUSD: null,
        totalValueLockedUSD: '0',
        cumulativeSupplySideRevenueUSD: '0',
        cumulativeProtocolSideRevenueUSD: '0',
        cumulativeTotalRevenueUSD: '0',
        transactionCount: '0',
        depositCount: '0',
        withdrawCount: '0',
        borrowCount: '0',
        repayCount: '0',
        liquidationCount: '0',
        transferCount: '0',
        flashloanCount: '0',
      };

      expect(isPonderMarketDTO(validDto)).toBe(true);
    });

    it('should return false if id is missing', () => {
      const invalidDto = {
        loanToken: TEST_ADDRESSES.VALID_4,
        collateralToken: TEST_ADDRESSES.VALID_3,
        totalSupply: '1000000000000000000000',
        totalBorrow: '500000000000000000000',
        borrowRate: '50000000000000000',
        supplyRate: '25000000000000000',
      };

      expect(isPonderMarketDTO(invalidDto)).toBe(false);
    });

    it('should return false if id is invalid hex', () => {
      const invalidDto = {
        id: 'invalid-id',
        loanToken: TEST_ADDRESSES.VALID_4,
        collateralToken: TEST_ADDRESSES.VALID_3,
        totalSupply: '1000000000000000000000',
        totalBorrow: '500000000000000000000',
        borrowRate: '50000000000000000',
        supplyRate: '25000000000000000',
      };

      expect(isPonderMarketDTO(invalidDto)).toBe(false);
    });

    it('should return false if loanToken is missing', () => {
      const invalidDto = {
        id: TEST_ADDRESSES.VALID_1,
        collateralToken: TEST_ADDRESSES.VALID_3,
        totalSupply: '1000000000000000000000',
        totalBorrow: '500000000000000000000',
        borrowRate: '50000000000000000',
        supplyRate: '25000000000000000',
      };

      expect(isPonderMarketDTO(invalidDto)).toBe(false);
    });

    it('should return false if totalSupply is not a string', () => {
      const invalidDto = {
        id: TEST_ADDRESSES.VALID_1,
        loanToken: TEST_ADDRESSES.VALID_4,
        collateralToken: TEST_ADDRESSES.VALID_3,
        totalSupply: 1000000000000000000000,
        totalBorrow: '500000000000000000000',
        borrowRate: '50000000000000000',
        supplyRate: '25000000000000000',
      };

      expect(isPonderMarketDTO(invalidDto)).toBe(false);
    });

    it('should return false if totalSupply is missing', () => {
      const invalidDto = {
        id: TEST_ADDRESSES.VALID_1,
        loanToken: TEST_ADDRESSES.VALID_4,
        collateralToken: TEST_ADDRESSES.VALID_3,
        totalBorrow: '500000000000000000000',
        borrowRate: '50000000000000000',
        supplyRate: '25000000000000000',
      };

      expect(isPonderMarketDTO(invalidDto)).toBe(false);
    });

    it('should return false if totalBorrow is not a string', () => {
      const invalidDto = {
        id: TEST_ADDRESSES.VALID_1,
        loanToken: TEST_ADDRESSES.VALID_4,
        collateralToken: TEST_ADDRESSES.VALID_3,
        totalSupply: '1000000000000000000000',
        totalBorrow: 500000000000000000000,
        borrowRate: '50000000000000000',
        supplyRate: '25000000000000000',
      };

      expect(isPonderMarketDTO(invalidDto)).toBe(false);
    });

    it('should return false if totalBorrow is missing', () => {
      const invalidDto = {
        id: TEST_ADDRESSES.VALID_1,
        loanToken: TEST_ADDRESSES.VALID_4,
        collateralToken: TEST_ADDRESSES.VALID_3,
        totalSupply: '1000000000000000000000',
        borrowRate: '50000000000000000',
        supplyRate: '25000000000000000',
      };

      expect(isPonderMarketDTO(invalidDto)).toBe(false);
    });

    it('should return false if borrowRate is missing', () => {
      const invalidDto = {
        id: TEST_ADDRESSES.VALID_1,
        loanToken: TEST_ADDRESSES.VALID_4,
        collateralToken: TEST_ADDRESSES.VALID_3,
        totalSupply: '1000000000000000000000',
        totalBorrow: '500000000000000000000',
        supplyRate: '25000000000000000',
      };

      expect(isPonderMarketDTO(invalidDto)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isPonderMarketDTO(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isPonderMarketDTO(undefined)).toBe(false);
    });

    it('should return false for non-object types', () => {
      expect(isPonderMarketDTO('string')).toBe(false);
      expect(isPonderMarketDTO(123)).toBe(false);
      expect(isPonderMarketDTO(true)).toBe(false);
      expect(isPonderMarketDTO([])).toBe(false);
    });
  });
});
