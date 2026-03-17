import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PublicClient } from 'viem';
import { RPCBalanceRepository } from '../balance-repository-rpc';
import { Address } from '@/domain/value-objects/address';

describe('RPCBalanceRepository', () => {
  let mockPublicClient: PublicClient;
  let repository: RPCBalanceRepository;
  let userAddress: Address;
  let tokenAddress: Address;

  beforeEach(() => {
    userAddress = new Address('0x1234567890123456789012345678901234567890');
    tokenAddress = new Address('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd');

    // Mock PublicClient
    mockPublicClient = {
      readContract: vi.fn(),
      multicall: vi.fn(),
    } as unknown as PublicClient;

    repository = new RPCBalanceRepository(mockPublicClient);
  });

  describe('getBalance', () => {
    it('should fetch balance for a single token', async () => {
      const expectedBalance = 1000000000000000000n; // 1 token with 18 decimals

      vi.mocked(mockPublicClient.readContract).mockResolvedValueOnce(expectedBalance);

      const balance = await repository.getBalance(userAddress, tokenAddress);

      expect(balance).toBe(expectedBalance);
      expect(mockPublicClient.readContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: tokenAddress.value,
          functionName: 'balanceOf',
          args: [userAddress.value],
        })
      );
    });

    it('should handle zero balance', async () => {
      vi.mocked(mockPublicClient.readContract).mockResolvedValueOnce(0n);

      const balance = await repository.getBalance(userAddress, tokenAddress);

      expect(balance).toBe(0n);
    });

    it('should handle large balance values', async () => {
      const largeBalance = 115792089237316195423570985008687907853269984665640564039457584007913129639935n; // max uint256

      vi.mocked(mockPublicClient.readContract).mockResolvedValueOnce(largeBalance);

      const balance = await repository.getBalance(userAddress, tokenAddress);

      expect(balance).toBe(largeBalance);
    });

    it('should throw error when readContract fails', async () => {
      const error = new Error('RPC call failed');
      vi.mocked(mockPublicClient.readContract).mockRejectedValueOnce(error);

      await expect(repository.getBalance(userAddress, tokenAddress)).rejects.toThrow('RPC call failed');
    });

    it('should pass correct ABI to readContract', async () => {
      vi.mocked(mockPublicClient.readContract).mockResolvedValueOnce(100n);

      await repository.getBalance(userAddress, tokenAddress);

      const callArgs = vi.mocked(mockPublicClient.readContract).mock.calls[0][0];
      expect(callArgs).toHaveProperty('abi');
      expect(Array.isArray(callArgs.abi)).toBe(true);
    });

    it('should not use multicall for single token', async () => {
      vi.mocked(mockPublicClient.readContract).mockResolvedValueOnce(100n);

      await repository.getBalance(userAddress, tokenAddress);

      expect(mockPublicClient.multicall).not.toHaveBeenCalled();
      expect(mockPublicClient.readContract).toHaveBeenCalledTimes(1);
    });
  });

  describe('getBalances (multicall path)', () => {
    it('should fetch balances for multiple tokens via multicall', async () => {
      const token1 = new Address('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
      const token2 = new Address('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
      const balance1 = 1000000000000000000n;
      const balance2 = 500000000000000000n;

      vi.mocked(mockPublicClient.multicall).mockResolvedValueOnce([
        { status: 'success', result: balance1 },
        { status: 'success', result: balance2 },
      ]);

      const result = await repository.getBalances(userAddress, [token1, token2]);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(2);
      expect(result.get(token1.value)).toBe(balance1);
      expect(result.get(token2.value)).toBe(balance2);
    });

    it('should return empty map for empty token list', async () => {
      const result = await repository.getBalances(userAddress, []);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
      expect(mockPublicClient.multicall).not.toHaveBeenCalled();
    });

    it('should call multicall with correct contracts array', async () => {
      const token1 = new Address('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
      const token2 = new Address('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');

      vi.mocked(mockPublicClient.multicall).mockResolvedValueOnce([
        { status: 'success', result: 100n },
        { status: 'success', result: 200n },
      ]);

      await repository.getBalances(userAddress, [token1, token2]);

      expect(mockPublicClient.multicall).toHaveBeenCalledWith({
        contracts: [
          expect.objectContaining({
            address: token1.value,
            functionName: 'balanceOf',
            args: [userAddress.value],
          }),
          expect.objectContaining({
            address: token2.value,
            functionName: 'balanceOf',
            args: [userAddress.value],
          }),
        ],
        allowFailure: true,
      });
    });

    it('should use single multicall instead of individual readContract calls', async () => {
      const tokens = [
        new Address('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
        new Address('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'),
        new Address('0xcccccccccccccccccccccccccccccccccccccccc'),
      ];

      vi.mocked(mockPublicClient.multicall).mockResolvedValueOnce([
        { status: 'success', result: 100n },
        { status: 'success', result: 200n },
        { status: 'success', result: 300n },
      ]);

      await repository.getBalances(userAddress, tokens);

      expect(mockPublicClient.multicall).toHaveBeenCalledTimes(1);
      expect(mockPublicClient.readContract).not.toHaveBeenCalled();
    });

    it('should handle mixed balances including zero', async () => {
      const token1 = new Address('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
      const token2 = new Address('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');

      vi.mocked(mockPublicClient.multicall).mockResolvedValueOnce([
        { status: 'success', result: 1000n },
        { status: 'success', result: 0n },
      ]);

      const result = await repository.getBalances(userAddress, [token1, token2]);

      expect(result.get(token1.value)).toBe(1000n);
      expect(result.get(token2.value)).toBe(0n);
    });

    it('should maintain order of results matching token order', async () => {
      const tokens = [
        new Address('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
        new Address('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'),
        new Address('0xcccccccccccccccccccccccccccccccccccccccc'),
      ];
      const balances = [100n, 200n, 300n];

      vi.mocked(mockPublicClient.multicall).mockResolvedValueOnce(
        balances.map((b) => ({ status: 'success' as const, result: b }))
      );

      const result = await repository.getBalances(userAddress, tokens);

      expect(Array.from(result.entries())).toEqual(
        tokens.map((token, index) => [token.value, balances[index]])
      );
    });
  });

  describe('getBalances (partial failure handling)', () => {
    it('should return 0n for tokens whose multicall entry fails', async () => {
      const token1 = new Address('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
      const token2 = new Address('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
      const token3 = new Address('0xcccccccccccccccccccccccccccccccccccccccc');

      vi.mocked(mockPublicClient.multicall).mockResolvedValueOnce([
        { status: 'success', result: 1000n },
        { status: 'failure', error: new Error('Contract reverted'), result: undefined },
        { status: 'success', result: 3000n },
      ]);

      const result = await repository.getBalances(userAddress, [token1, token2, token3]);

      expect(result.get(token1.value)).toBe(1000n);
      expect(result.get(token2.value)).toBe(0n);
      expect(result.get(token3.value)).toBe(3000n);
    });

    it('should return all 0n when every multicall entry fails', async () => {
      const token1 = new Address('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
      const token2 = new Address('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');

      vi.mocked(mockPublicClient.multicall).mockResolvedValueOnce([
        { status: 'failure', error: new Error('Reverted'), result: undefined },
        { status: 'failure', error: new Error('Reverted'), result: undefined },
      ]);

      const result = await repository.getBalances(userAddress, [token1, token2]);

      expect(result.get(token1.value)).toBe(0n);
      expect(result.get(token2.value)).toBe(0n);
    });
  });

  describe('getBalances (multicall fallback to Promise.all)', () => {
    it('should fall back to individual calls when multicall throws', async () => {
      const token1 = new Address('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
      const token2 = new Address('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');

      // Multicall not supported
      vi.mocked(mockPublicClient.multicall).mockRejectedValueOnce(
        new Error('multicall not supported')
      );

      // Fallback individual calls succeed
      vi.mocked(mockPublicClient.readContract)
        .mockResolvedValueOnce(1000n)
        .mockResolvedValueOnce(2000n);

      const result = await repository.getBalances(userAddress, [token1, token2]);

      expect(result.get(token1.value)).toBe(1000n);
      expect(result.get(token2.value)).toBe(2000n);
      expect(mockPublicClient.multicall).toHaveBeenCalledTimes(1);
      expect(mockPublicClient.readContract).toHaveBeenCalledTimes(2);
    });

    it('should propagate errors from fallback individual calls', async () => {
      const token1 = new Address('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
      const token2 = new Address('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');

      // Multicall not supported
      vi.mocked(mockPublicClient.multicall).mockRejectedValueOnce(
        new Error('multicall not supported')
      );

      // Fallback individual call fails
      vi.mocked(mockPublicClient.readContract)
        .mockResolvedValueOnce(1000n)
        .mockRejectedValueOnce(new Error('RPC call failed'));

      await expect(
        repository.getBalances(userAddress, [token1, token2])
      ).rejects.toThrow('RPC call failed');
    });

    it('should call readContract once per token in fallback path', async () => {
      const tokens = [
        new Address('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
        new Address('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'),
      ];

      vi.mocked(mockPublicClient.multicall).mockRejectedValueOnce(
        new Error('multicall not supported')
      );
      vi.mocked(mockPublicClient.readContract)
        .mockResolvedValueOnce(100n)
        .mockResolvedValueOnce(200n);

      await repository.getBalances(userAddress, tokens);

      expect(mockPublicClient.readContract).toHaveBeenCalledTimes(2);
    });
  });
});
