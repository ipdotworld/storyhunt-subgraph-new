/**
 * Token Registry
 * Caches token metadata from Ponder indexer for fast lookups
 * Falls back to SUPPORTED_TOKENS and address-based display
 *
 * Retry strategy: 3 retries with exponential backoff (30s, 60s, 120s).
 * On all retries failing, remains in degraded state using SUPPORTED_TOKENS.
 */

import { ApolloClient } from '@apollo/client';
import { GET_ALL_TOKENS } from './queries/token-queries';
import { resolveTokenByAddress, type ResolvedToken } from '@/utils/token-resolver';
import { resolveTokenPrice } from '@/utils/price-fallback';
import type { PonderTokensResponse } from './queries/token-dto';

const tokenCache = new Map<string, ResolvedToken>();
let isInitialized = false;
let initializationError: Error | null = null;

/** Default retry delays in milliseconds: 30s, 60s, 120s */
const DEFAULT_RETRY_DELAYS_MS = [30_000, 60_000, 120_000];

/**
 * Initialize token registry from Ponder indexer.
 * Call once during app initialization.
 *
 * Retries up to 3 times with exponential backoff on failure.
 * On success after previous failure, clears initializationError.
 *
 * @param client - Apollo client instance
 * @param retryDelaysMs - Override retry delay schedule (useful for testing)
 */
export async function initializeTokenRegistry(
  client: ApolloClient,
  retryDelaysMs: number[] = DEFAULT_RETRY_DELAYS_MS
): Promise<void> {
  if (isInitialized) return;

  // First attempt
  const firstAttemptError = await attemptInitialization(client);
  if (!firstAttemptError) {
    isInitialized = true;
    initializationError = null;
    return;
  }

  // Retry attempts with backoff
  for (let i = 0; i < retryDelaysMs.length; i++) {
    console.warn(
      `[TokenRegistry] Retry ${i + 1}/${retryDelaysMs.length} in ${retryDelaysMs[i]}ms...`
    );
    await sleep(retryDelaysMs[i]);

    const retryError = await attemptInitialization(client);
    if (!retryError) {
      isInitialized = true;
      initializationError = null;
      return;
    }
  }

  // All attempts exhausted
  initializationError = firstAttemptError;
  console.error(
    '[TokenRegistry] All retries failed. Operating in degraded state (SUPPORTED_TOKENS + address display).',
    firstAttemptError
  );
}

/**
 * Single initialization attempt. Returns the error on failure, null on success.
 */
async function attemptInitialization(
  client: ApolloClient
): Promise<Error | null> {
  try {
    const { data } = await client.query<PonderTokensResponse>({
      query: GET_ALL_TOKENS,
    });

    if (data?.tokens?.items) {
      for (const token of data.tokens.items) {
        const normalized = token.id.toLowerCase();
        tokenCache.set(normalized, {
          address: token.id,
          symbol: token.symbol || `${normalized.slice(0, 6)}...${normalized.slice(-4)}`,
          name: token.name || token.symbol || normalized,
          decimals: token.decimals ?? 18,
          source: 'cache',
          lastPriceUSD: token.lastPriceUSD ? parseFloat(token.lastPriceUSD) / 1e18 : undefined,
        });
      }
    }
    return null;
  } catch (error) {
    console.error('[TokenRegistry] Failed to initialize from Ponder:', error);
    return error instanceof Error ? error : new Error(String(error));
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Resolve token with Ponder cache support.
 * Priority: 1. SUPPORTED_TOKENS  2. Ponder cache  3. Address fallback
 */
export function resolveTokenWithCache(hexAddress: string): ResolvedToken {
  const normalized = hexAddress.toLowerCase();
  const cached = tokenCache.get(normalized);
  const resolved = resolveTokenByAddress(hexAddress);

  // If resolved to a known token, enrich with Ponder cache price if available
  if (!resolved.symbol.startsWith('0x')) {
    const ponderPrice = cached?.lastPriceUSD;
    const price = resolveTokenPrice(ponderPrice, resolved.symbol, resolved.address);
    return { ...resolved, lastPriceUSD: price ?? undefined };
  }

  // Check Ponder cache for unknown tokens
  if (cached) {
    return cached;
  }

  return resolved;
}

export function isTokenRegistryInitialized(): boolean {
  return isInitialized;
}

/**
 * Get the last initialization error, if any.
 * Non-null when all retry attempts have failed.
 */
export function getInitializationError(): Error | null {
  return initializationError;
}

/**
 * Get the token cache map for external population (e.g., RPC decimal resolution).
 */
export function getTokenCache(): Map<string, ResolvedToken> {
  return tokenCache;
}

/**
 * Reset internal state. Intended for testing only.
 */
export function _resetForTesting(): void {
  tokenCache.clear();
  isInitialized = false;
  initializationError = null;
}
