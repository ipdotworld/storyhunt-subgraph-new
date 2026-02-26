import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PublicClient } from 'viem';
import { RPCPositionRepository } from '../position-repository-rpc';
import { Address } from '@/domain/value-objects/address';
import { ContractReadError } from '@/domain/types/errors';
import { MORPHO_POSITION_ABI } from '@/config/contracts/abis/morpho-market.abi';
import { MORPHO_BLUE_ADDRESS } from '@/config/contracts/addresses';

describe('RPCPositionRepository', () => {
  let mockPublicClient: PublicClient;
  let repository: RPCPositionRepository;
  let userAddress: Address;
  let marketAddress: Address;

  beforeEach(() => {
    userAddress = new Address('0x1234567890123456789012345678901234567890');
    marketAddress = new Address('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd');

    mockPublicClient = {
      readContract: vi.fn(),
    } as unknown as PublicClient;

    repository = new RPCPositionRepository(mockPublicClient);
  });

  describe('getPosition', () => {
    it('should return collateral and debt from contract call', async () => {
      // Contract returns [supplyShares, borrowShares, collateral]
      const supplyShares = 0n;
      const borrowShares = 500000000000000000n;
      const collateral = 1000000000000000000n;

      vi.mocked(mockPublicClient.readContract).mockResolvedValueOnce([
        supplyShares,
        borrowShares,
        collateral,
      ]);

      const result = await repository.getPosition(userAddress, marketAddress);

      expect(result).toEqual({
        collateral: 1000000000000000000n,
        debt: 500000000000000000n,
      });
    });

    it('should call readContract with correct parameters', async () => {
      vi.mocked(mockPublicClient.readContract).mockResolvedValueOnce([0n, 0n, 0n]);

      await repository.getPosition(userAddress, marketAddress);

      expect(mockPublicClient.readContract).toHaveBeenCalledWith({
        address: MORPHO_BLUE_ADDRESS,
        abi: MORPHO_POSITION_ABI,
        functionName: 'position',
        args: [marketAddress.value, userAddress.value],
      });
    });

    it('should map borrowShares to debt field', async () => {
      const borrowShares = 999n;
      vi.mocked(mockPublicClient.readContract).mockResolvedValueOnce([0n, borrowShares, 0n]);

      const result = await repository.getPosition(userAddress, marketAddress);

      expect(result.debt).toBe(999n);
    });

    it('should map collateral output to collateral field', async () => {
      const collateral = 12345n;
      vi.mocked(mockPublicClient.readContract).mockResolvedValueOnce([0n, 0n, collateral]);

      const result = await repository.getPosition(userAddress, marketAddress);

      expect(result.collateral).toBe(12345n);
    });

    it('should handle zero position', async () => {
      vi.mocked(mockPublicClient.readContract).mockResolvedValueOnce([0n, 0n, 0n]);

      const result = await repository.getPosition(userAddress, marketAddress);

      expect(result).toEqual({
        collateral: 0n,
        debt: 0n,
      });
    });

    it('should handle large values', async () => {
      const largeCollateral = 340282366920938463463374607431768211455n; // max uint128
      const largeBorrowShares = 340282366920938463463374607431768211455n;

      vi.mocked(mockPublicClient.readContract).mockResolvedValueOnce([
        0n,
        largeBorrowShares,
        largeCollateral,
      ]);

      const result = await repository.getPosition(userAddress, marketAddress);

      expect(result.collateral).toBe(largeCollateral);
      expect(result.debt).toBe(largeBorrowShares);
    });

    it('should throw ContractReadError when readContract fails', async () => {
      const rpcError = new Error('RPC call failed');
      vi.mocked(mockPublicClient.readContract).mockRejectedValueOnce(rpcError);

      await expect(repository.getPosition(userAddress, marketAddress)).rejects.toThrow(
        ContractReadError,
      );
    });

    it('should include original error as cause in ContractReadError', async () => {
      const rpcError = new Error('RPC call failed');
      vi.mocked(mockPublicClient.readContract).mockRejectedValueOnce(rpcError);

      try {
        await repository.getPosition(userAddress, marketAddress);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ContractReadError);
        expect((error as ContractReadError).cause).toBe(rpcError);
      }
    });

    it('should include user and market address in error message', async () => {
      vi.mocked(mockPublicClient.readContract).mockRejectedValueOnce(new Error('fail'));

      try {
        await repository.getPosition(userAddress, marketAddress);
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as ContractReadError).message).toContain(userAddress.value);
        expect((error as ContractReadError).message).toContain(marketAddress.value);
      }
    });

    it('should discard supplyShares from contract output', async () => {
      const supplyShares = 99999n;
      vi.mocked(mockPublicClient.readContract).mockResolvedValueOnce([supplyShares, 100n, 200n]);

      const result = await repository.getPosition(userAddress, marketAddress);

      // supplyShares should not appear in result
      expect(result).toEqual({
        collateral: 200n,
        debt: 100n,
      });
    });
  });
});
