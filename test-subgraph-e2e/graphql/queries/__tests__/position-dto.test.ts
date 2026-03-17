/**
 * Position DTO Types Tests
 * Tests for Ponder Position DTO type definitions and type guards
 */

import {
  PonderPositionDTO,
  PositionSide,
  isPonderPositionDTO,
} from '@/infrastructure/graphql/queries/position-dto';

// Mock data for unit testing
const TEST_ADDRESSES = {
  VALID_1: '0x1234567890123456789012345678901234567890',
  VALID_2: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  VALID_3: '0xaaaabbbbccccddddeeeeffffaabbccddee112222',
  VALID_4: '0x1111222233334444555566667777888899990000',
} as const;

const TEST_AMOUNTS = {
  ONE_ETH: '1000000000000000000',
  FIVE_ETH: '5000000000000000000',
} as const;

// Helper to create a valid PonderPositionDTO
const createValidPositionDTO = (override?: Partial<PonderPositionDTO>): PonderPositionDTO => ({
  id: 'position-123',
  marketId: TEST_ADDRESSES.VALID_2,
  user: TEST_ADDRESSES.VALID_1,
  supplyShares: TEST_AMOUNTS.ONE_ETH,
  borrowShares: '0',
  collateral: '0',
  lastUpdated: '1700000000',
  side: 'SUPPLIER' as PositionSide,
  supplyBalance: TEST_AMOUNTS.ONE_ETH,
  borrowBalance: '0',
  supplyBalanceUSD: '2500.00',
  borrowBalanceUSD: '0',
  isCollateral: false,
  assetToken: TEST_ADDRESSES.VALID_3,
  supplyPrincipal: TEST_AMOUNTS.ONE_ETH,
  borrowPrincipal: '0',
  depositCount: '1',
  withdrawCount: '0',
  borrowCount: '0',
  repayCount: '0',
  liquidationCount: '0',
  ...override,
});

describe('PonderPositionDTO Types', () => {
  describe('isPonderPositionDTO type guard', () => {
    it('should return true for valid position DTO', () => {
      const validDto = createValidPositionDTO({ side: 'SUPPLIER' });

      expect(isPonderPositionDTO(validDto)).toBe(true);
    });

    it('should return true for valid borrow position DTO', () => {
      const validDto = createValidPositionDTO({
        id: 'borrow-456',
        side: 'BORROWER',
        borrowBalance: TEST_AMOUNTS.FIVE_ETH,
        borrowShares: TEST_AMOUNTS.FIVE_ETH,
      });

      expect(isPonderPositionDTO(validDto)).toBe(true);
    });

    it('should return true for valid collateral position DTO', () => {
      const validDto = createValidPositionDTO({
        side: 'COLLATERAL',
        isCollateral: true,
      });

      expect(isPonderPositionDTO(validDto)).toBe(true);
    });

    it('should return false if id is missing', () => {
      const invalidDto = createValidPositionDTO() as unknown as Record<string, unknown>;
      delete invalidDto.id;

      expect(isPonderPositionDTO(invalidDto)).toBe(false);
    });

    it('should return false if id is empty', () => {
      const invalidDto = createValidPositionDTO({ id: '' });

      expect(isPonderPositionDTO(invalidDto)).toBe(false);
    });

    it('should return false if user is missing', () => {
      const invalidDto = createValidPositionDTO() as unknown as Record<string, unknown>;
      delete invalidDto.user;

      expect(isPonderPositionDTO(invalidDto)).toBe(false);
    });

    it('should return false if marketId is missing', () => {
      const invalidDto = createValidPositionDTO() as unknown as Record<string, unknown>;
      delete invalidDto.marketId;

      expect(isPonderPositionDTO(invalidDto)).toBe(false);
    });

    it('should return false if supplyBalance is not a string', () => {
      const invalidDto = {
        ...createValidPositionDTO(),
        supplyBalance: 12345,
      };

      expect(isPonderPositionDTO(invalidDto)).toBe(false);
    });

    it('should return false if supplyShares is not a string', () => {
      const invalidDto = {
        ...createValidPositionDTO(),
        supplyShares: 12345,
      };

      expect(isPonderPositionDTO(invalidDto)).toBe(false);
    });

    it('should return false if borrowShares is not a string', () => {
      const invalidDto = {
        ...createValidPositionDTO(),
        borrowShares: 12345,
      };

      expect(isPonderPositionDTO(invalidDto)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isPonderPositionDTO(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isPonderPositionDTO(undefined)).toBe(false);
    });

    it('should return false for empty object', () => {
      expect(isPonderPositionDTO({})).toBe(false);
    });
  });
});
