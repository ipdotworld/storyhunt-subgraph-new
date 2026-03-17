/**
 * RPC-based Position Repository Implementation
 * Fetches user position data (collateral and debt) via direct contract calls using viem
 */

import type { Hex, PublicClient } from 'viem';
import { Address } from '@/domain/value-objects/address';
import type { PositionData } from '@/domain/types/position-types';
import { ContractReadError } from '@/domain/types/errors';
import { MORPHO_POSITION_ABI } from '@/config/contracts/abis/morpho-market.abi';
import { MORPHO_BLUE_ADDRESS } from '@/config/contracts/addresses';

// Re-export for backward compatibility
export type { PositionData } from '@/domain/types/position-types';

/**
 * Repository for reading position data from blockchain via RPC
 * Provides simple interface for fetching collateral and debt amounts
 */
export class RPCPositionRepository {
  /**
   * Initialize with viem PublicClient
   * @param publicClient viem PublicClient for contract reads
   */
  constructor(private readonly publicClient: PublicClient) {}

  /**
   * Get position (collateral and debt) for a user in a specific market via RPC call
   * @param userAddress User's Ethereum address
   * @param marketAddress Market identifier (bytes32 market ID)
   * @returns Position data with collateral and debt amounts
   * @throws ContractReadError when the contract call fails
   */
  async getPosition(userAddress: Address, marketAddress: Address): Promise<PositionData> {
    try {
      const [, borrowShares, collateral] = await this.publicClient.readContract({
        address: MORPHO_BLUE_ADDRESS,
        abi: MORPHO_POSITION_ABI,
        functionName: 'position',
        args: [marketAddress.value as Hex, userAddress.value],
      });

      return {
        collateral: BigInt(collateral),
        debt: BigInt(borrowShares),
      };
    } catch (error) {
      throw new ContractReadError(
        `Failed to read position for user ${userAddress.value} in market ${marketAddress.value}`,
        error,
      );
    }
  }
}
