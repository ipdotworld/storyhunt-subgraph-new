/**
 * RPC-based Allowance Repository Implementation
 * Fetches ERC20 token allowances via direct contract calls using viem
 */

import type { PublicClient } from 'viem';
import { IAllowanceRepository } from '@/domain/repositories/allowance-repository';
import { Address } from '@/domain/value-objects/address';
import { ERC20_ABI } from '@/config/contracts/abis/erc20.abi';

export class RPCAllowanceRepository implements IAllowanceRepository {
  /**
   * Initialize with viem PublicClient
   * @param publicClient viem PublicClient for contract reads
   */
  constructor(private readonly publicClient: PublicClient) {}

  /**
   * Get allowance amount via RPC call
   * @param owner Token owner's Ethereum address
   * @param spender Address authorized to spend tokens
   * @param tokenAddress Token's Ethereum address
   * @returns Allowance amount in smallest unit (wei for ERC20)
   */
  async getAllowance(owner: Address, spender: Address, tokenAddress: Address): Promise<bigint> {
    const allowance = await this.publicClient.readContract({
      address: tokenAddress.value,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [owner.value, spender.value],
    });

    return allowance as bigint;
  }
}
