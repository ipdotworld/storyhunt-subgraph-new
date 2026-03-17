import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PublicClient } from 'viem';
import { RPCAllowanceRepository } from '../allowance-repository-rpc';
import { Address } from '@/domain/value-objects/address';

describe('RPCAllowanceRepository', () => {
  let mockPublicClient: PublicClient;
  let repository: RPCAllowanceRepository;
  let ownerAddress: Address;
  let spenderAddress: Address;
  let tokenAddress: Address;

  beforeEach(() => {
    ownerAddress = new Address('0x1234567890123456789012345678901234567890');
    spenderAddress = new Address('0x0987654321098765432109876543210987654321');
    tokenAddress = new Address('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd');

    // Mock PublicClient
    mockPublicClient = {
      readContract: vi.fn(),
    } as unknown as PublicClient;

    repository = new RPCAllowanceRepository(mockPublicClient);
  });

  describe('getAllowance', () => {
    it('should fetch allowance between owner and spender', async () => {
      const expectedAllowance = 1000000000000000000n; // 1 token with 18 decimals

      vi.mocked(mockPublicClient.readContract).mockResolvedValueOnce(expectedAllowance);

      const allowance = await repository.getAllowance(ownerAddress, spenderAddress, tokenAddress);

      expect(allowance).toBe(expectedAllowance);
      expect(mockPublicClient.readContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: tokenAddress.value,
          functionName: 'allowance',
          args: [ownerAddress.value, spenderAddress.value],
        })
      );
    });

    it('should handle zero allowance', async () => {
      vi.mocked(mockPublicClient.readContract).mockResolvedValueOnce(0n);

      const allowance = await repository.getAllowance(ownerAddress, spenderAddress, tokenAddress);

      expect(allowance).toBe(0n);
    });

    it('should handle unlimited allowance (max uint256)', async () => {
      const unlimitedAllowance = 115792089237316195423570985008687907853269984665640564039457584007913129639935n; // max uint256

      vi.mocked(mockPublicClient.readContract).mockResolvedValueOnce(unlimitedAllowance);

      const allowance = await repository.getAllowance(ownerAddress, spenderAddress, tokenAddress);

      expect(allowance).toBe(unlimitedAllowance);
    });

    it('should handle large allowance values', async () => {
      const largeAllowance = 999999999999999999999999999999999999999n;

      vi.mocked(mockPublicClient.readContract).mockResolvedValueOnce(largeAllowance);

      const allowance = await repository.getAllowance(ownerAddress, spenderAddress, tokenAddress);

      expect(allowance).toBe(largeAllowance);
    });

    it('should throw error when readContract fails', async () => {
      const error = new Error('RPC call failed');
      vi.mocked(mockPublicClient.readContract).mockRejectedValueOnce(error);

      await expect(repository.getAllowance(ownerAddress, spenderAddress, tokenAddress)).rejects.toThrow('RPC call failed');
    });

    it('should pass correct ABI to readContract', async () => {
      vi.mocked(mockPublicClient.readContract).mockResolvedValueOnce(100n);

      await repository.getAllowance(ownerAddress, spenderAddress, tokenAddress);

      const callArgs = vi.mocked(mockPublicClient.readContract).mock.calls[0][0];
      expect(callArgs).toHaveProperty('abi');
      expect(Array.isArray(callArgs.abi)).toBe(true);
    });

    it('should use correct token address for contract call', async () => {
      const customToken = new Address('0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef');
      vi.mocked(mockPublicClient.readContract).mockResolvedValueOnce(500n);

      await repository.getAllowance(ownerAddress, spenderAddress, customToken);

      const callArgs = vi.mocked(mockPublicClient.readContract).mock.calls[0][0];
      expect(callArgs.address).toBe(customToken.value);
    });

    it('should handle different owner and spender combinations', async () => {
      const owner1 = new Address('0x1111111111111111111111111111111111111111');
      const owner2 = new Address('0x2222222222222222222222222222222222222222');
      const spender1 = new Address('0x3333333333333333333333333333333333333333');
      const spender2 = new Address('0x4444444444444444444444444444444444444444');

      vi.mocked(mockPublicClient.readContract)
        .mockResolvedValueOnce(100n)
        .mockResolvedValueOnce(200n)
        .mockResolvedValueOnce(300n)
        .mockResolvedValueOnce(400n);

      const allowance1 = await repository.getAllowance(owner1, spender1, tokenAddress);
      const allowance2 = await repository.getAllowance(owner1, spender2, tokenAddress);
      const allowance3 = await repository.getAllowance(owner2, spender1, tokenAddress);
      const allowance4 = await repository.getAllowance(owner2, spender2, tokenAddress);

      expect(allowance1).toBe(100n);
      expect(allowance2).toBe(200n);
      expect(allowance3).toBe(300n);
      expect(allowance4).toBe(400n);
      expect(mockPublicClient.readContract).toHaveBeenCalledTimes(4);
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network timeout');
      vi.mocked(mockPublicClient.readContract).mockRejectedValueOnce(networkError);

      await expect(repository.getAllowance(ownerAddress, spenderAddress, tokenAddress)).rejects.toThrow('Network timeout');
    });

    it('should handle contract revert errors', async () => {
      const revertError = new Error('execution reverted: Token contract error');
      vi.mocked(mockPublicClient.readContract).mockRejectedValueOnce(revertError);

      await expect(repository.getAllowance(ownerAddress, spenderAddress, tokenAddress)).rejects.toThrow('execution reverted');
    });
  });
});
