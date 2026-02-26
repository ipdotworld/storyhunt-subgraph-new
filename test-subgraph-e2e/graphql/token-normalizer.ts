/**
 * Infrastructure Layer - Single Point of Truth for Decimal Normalization
 * Priority: SUPPORTED_TOKENS > Token Cache > RPC > Fallback (18 with warning)
 *
 * @module infrastructure/graphql/token-normalizer
 */

import { resolveTokenByAddress } from '@/utils/token-resolver';
import { resolveTokenWithCache, getTokenCache } from './token-registry';

export type DecimalSource = 'graphql' | 'supported' | 'cache' | 'rpc' | 'fallback';

/**
 * Function signature for RPC decimal resolution.
 * Injected to avoid cross-module dependency (graphql/ cannot import rpc/).
 * Returns the decimal count or null on failure.
 */
export type RpcDecimalResolver = (tokenAddress: string) => Promise<number | null>;

/**
 * Normalize token data with resolved decimals (synchronous).
 * Priority: GraphQL DTO > SUPPORTED_TOKENS > Token Cache > Fallback (18)
 *
 * Use normalizeTokenDataAsync for the full pipeline including RPC resolution.
 */
export function normalizeTokenData<T extends { decimals?: number }>(
  dto: T,
  tokenAddress: string
): T & { decimals: number; _source: DecimalSource } {
  // If DTO already has decimals (from GraphQL), use that but track source
  if (dto.decimals !== undefined && dto.decimals !== null) {
    return {
      ...dto,
      decimals: dto.decimals,
      _source: 'graphql' as DecimalSource,
    };
  }

  // Check SUPPORTED_TOKENS then token cache
  const cached = resolveTokenWithCache(tokenAddress);
  if (cached.source !== 'fallback') {
    return {
      ...dto,
      decimals: cached.decimals,
      _source: cached.source as DecimalSource,
    };
  }

  // Fallback to 18 decimals
  return {
    ...dto,
    decimals: cached.decimals,
    _source: 'fallback' as DecimalSource,
  };
}

/**
 * Normalize token data with full decimal resolution pipeline (asynchronous).
 * Priority: GraphQL DTO > SUPPORTED_TOKENS > Token Cache > RPC > Fallback (18 with warning)
 *
 * When RPC resolution succeeds, the result is cached in the token cache
 * for subsequent synchronous lookups.
 */
export async function normalizeTokenDataAsync<T extends { decimals?: number }>(
  dto: T,
  tokenAddress: string,
  rpcResolver?: RpcDecimalResolver
): Promise<T & { decimals: number; _source: DecimalSource }> {
  // Try synchronous resolution first (GraphQL > SUPPORTED_TOKENS > Cache)
  const syncResult = normalizeTokenData(dto, tokenAddress);
  if (syncResult._source !== 'fallback') {
    return syncResult;
  }

  // Try RPC resolution if resolver is provided
  if (rpcResolver) {
    try {
      const rpcDecimals = await rpcResolver(tokenAddress);
      if (rpcDecimals !== null && rpcDecimals !== undefined) {
        // Cache the RPC result for subsequent lookups
        const normalized = tokenAddress.toLowerCase();
        const shortAddr = `${normalized.slice(0, 6)}...${normalized.slice(-4)}`;
        getTokenCache().set(normalized, {
          address: normalized,
          symbol: shortAddr,
          name: shortAddr,
          decimals: rpcDecimals,
          source: 'rpc',
        });

        return {
          ...dto,
          decimals: rpcDecimals,
          _source: 'rpc' as DecimalSource,
        };
      }
    } catch (error) {
      console.warn(
        `[TokenNormalizer] RPC decimals() call failed for ${tokenAddress}. ` +
          `Falling back to 18 decimals.`,
        error
      );
    }
  }

  // Final fallback: 18 decimals with warning
  console.warn(
    `[TokenNormalizer] Using fallback 18 decimals for unknown token ${tokenAddress}. ` +
      `Consider adding to SUPPORTED_TOKENS or verifying the token contract.`
  );

  return {
    ...dto,
    decimals: 18,
    _source: 'fallback' as DecimalSource,
  };
}

/**
 * Normalize vault DTO with asset token resolution
 */
export function normalizeVaultDTO<T extends { asset: string; decimals?: number }>(
  dto: T
): T & {
  decimals: number;
  _assetDecimals: number;
  _assetSymbol: string;
  _source: DecimalSource;
} {
  const assetToken = resolveTokenByAddress(dto.asset);

  return {
    ...dto,
    decimals: 18, // ERC-4626 vault shares always 18 decimals
    _assetDecimals: assetToken.decimals,
    _assetSymbol: assetToken.symbol,
    _source: assetToken.source as DecimalSource,
  };
}

/**
 * Log normalization for debugging
 * Only logs when NEXT_PUBLIC_DEBUG_DECIMALS=true
 */
export function logNormalization(
  context: string,
  address: string,
  decimals: number,
  source: DecimalSource
): void {
  if (process.env.NEXT_PUBLIC_DEBUG_DECIMALS !== 'true') return;

  const sourceEmoji = {
    graphql: '[GraphQL]',
    supported: '[Supported]',
    cache: '[Cache]',
    rpc: '[RPC]',
    fallback: '[Fallback]',
  }[source] ?? '[Unknown]';

  console.log(
    `[Normalization] ${sourceEmoji} ${context}: ${address.slice(0, 10)}... ` +
      `decimals=${decimals}, source=${source}`
  );
}
