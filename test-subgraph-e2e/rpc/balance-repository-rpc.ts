/**
 * RPC-based Balance Repository Implementation
 * Fetches ERC20 token balances via direct contract calls using viem
 */

import type { PublicClient } from 'viem';
import { IBalanceRepository } from '@/domain/repositories/balance-repository';
import { Address } from '@/domain/value-objects/address';
import { ERC20_ABI } from '@/config/contracts/abis/erc20.abi';

/**
 * Repository for reading ERC20 token balances from blockchain via RPC
 * Implements IBalanceRepository for domain abstraction
 */
export class RPCBalanceRepository implements IBalanceRepository {
  /**
   * Initialize with viem PublicClient
   * @param publicClient viem PublicClient for contract reads
   */
  constructor(private readonly publicClient: PublicClient) {}

  /**
   * Get balance for a user's token via RPC call
   * @param userAddress User's Ethereum address
   * @param tokenAddress Token's Ethereum address
   * @returns Balance amount in smallest unit (wei for ERC20)
   */
  async getBalance(userAddress: Address, tokenAddress: Address): Promise<bigint> {
    return this.readBalance(userAddress, tokenAddress);
  }

  /**
   * Get balances for a user across multiple tokens via batched multicall
   * Falls back to individual readContract calls if multicall is not supported
   * @param userAddress User's Ethereum address
   * @param tokenAddresses Array of token Ethereum addresses
   * @returns Map of token address to balance amount
   */
  async getBalances(userAddress: Address, tokenAddresses: Address[]): Promise<Map<string, bigint>> {
    if (tokenAddresses.length === 0) {
      return new Map<string, bigint>();
    }

    try {
      return await this.getBalancesViaMulticall(userAddress, tokenAddresses);
    } catch {
      // Fallback to individual calls if multicall is not supported
      return this.getBalancesViaIndividualCalls(userAddress, tokenAddresses);
    }
  }

  /**
   * Batch-fetch balances using viem multicall (single RPC round-trip)
   * @param userAddress User's Ethereum address
   * @param tokenAddresses Array of token Ethereum addresses
   * @returns Map of token address to balance amount (0n for failed calls)
   */
  private async getBalancesViaMulticall(
    userAddress: Address,
    tokenAddresses: Address[],
  ): Promise<Map<string, bigint>> {
    const contracts = tokenAddresses.map((tokenAddress) => ({
      address: tokenAddress.value,
      abi: ERC20_ABI,
      functionName: 'balanceOf' as const,
      args: [userAddress.value] as const,
    }));

    const results = await this.publicClient.multicall({
      contracts,
      allowFailure: true,
    });

    const balanceMap = new Map<string, bigint>();
    tokenAddresses.forEach((tokenAddress, index) => {
      const result = results[index];
      balanceMap.set(
        tokenAddress.value,
        result.status === 'success' ? (result.result as bigint) : 0n,
      );
    });

    return balanceMap;
  }

  /**
   * Fallback: fetch balances individually via Promise.all
   * @param userAddress User's Ethereum address
   * @param tokenAddresses Array of token Ethereum addresses
   * @returns Map of token address to balance amount
   */
  private async getBalancesViaIndividualCalls(
    userAddress: Address,
    tokenAddresses: Address[],
  ): Promise<Map<string, bigint>> {
    const balancePromises = tokenAddresses.map((tokenAddress) =>
      this.readBalance(userAddress, tokenAddress),
    );

    const balances = await Promise.all(balancePromises);

    const balanceMap = new Map<string, bigint>();
    tokenAddresses.forEach((tokenAddress, index) => {
      balanceMap.set(tokenAddress.value, balances[index]);
    });

    return balanceMap;
  }

  /**
   * Internal helper to read balance from contract
   * @param userAddress User's Ethereum address
   * @param tokenAddress Token's Ethereum address
   * @returns Balance amount in smallest unit
   */
  private async readBalance(userAddress: Address, tokenAddress: Address): Promise<bigint> {
    const balance = await this.publicClient.readContract({
      address: tokenAddress.value,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress.value],
    });

    return balance as bigint;
  }
}
