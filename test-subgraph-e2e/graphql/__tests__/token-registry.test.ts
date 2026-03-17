import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  initializeTokenRegistry,
  resolveTokenWithCache,
  isTokenRegistryInitialized,
  getInitializationError,
  getTokenCache,
  _resetForTesting,
} from '../token-registry';

// Mock @apollo/client
vi.mock('@apollo/client', () => ({
  ApolloClient: vi.fn(),
  gql: (strings: TemplateStringsArray) => strings.join(''),
}));

// Mock token-queries
vi.mock('../queries/token-queries', () => ({
  GET_ALL_TOKENS: 'GET_ALL_TOKENS_QUERY',
}));

// Mock token-resolver
vi.mock('@/utils/token-resolver', () => ({
  resolveTokenByAddress: vi.fn((address: string) => {
    const normalized = address.toLowerCase();
    if (normalized === '0xusdc') {
      return {
        address: normalized,
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        source: 'supported' as const,
      };
    }
    const short = `${normalized.slice(0, 6)}...${normalized.slice(-4)}`;
    return {
      address: normalized,
      symbol: short,
      name: short,
      decimals: 18,
      source: 'fallback' as const,
    };
  }),
}));

function createMockClient(queryFn: ReturnType<typeof vi.fn>) {
  return { query: queryFn } as unknown as Parameters<typeof initializeTokenRegistry>[0];
}

function mockSuccessResponse() {
  return {
    data: {
      tokens: {
        items: [
          { id: '0xAABB', symbol: 'TKA', name: 'Token A', decimals: 8, lastPriceUSD: null, type: null },
          { id: '0xCCDD', symbol: 'TKB', name: 'Token B', decimals: 18, lastPriceUSD: null, type: null },
        ],
      },
    },
  };
}

/** Use zero delays for all tests to keep them fast */
const NO_DELAY = [0, 0, 0];

describe('token-registry', () => {
  beforeEach(() => {
    _resetForTesting();
    vi.restoreAllMocks();
  });

  describe('initializeTokenRegistry', () => {
    it('should populate cache on successful first attempt', async () => {
      const queryFn = vi.fn().mockResolvedValue(mockSuccessResponse());
      const client = createMockClient(queryFn);

      await initializeTokenRegistry(client, NO_DELAY);

      expect(isTokenRegistryInitialized()).toBe(true);
      expect(getInitializationError()).toBeNull();
      expect(queryFn).toHaveBeenCalledTimes(1);

      const cache = getTokenCache();
      expect(cache.size).toBe(2);
      expect(cache.get('0xaabb')).toEqual({
        address: '0xAABB',
        symbol: 'TKA',
        name: 'Token A',
        decimals: 8,
        source: 'cache',
      });
      expect(cache.get('0xccdd')).toEqual({
        address: '0xCCDD',
        symbol: 'TKB',
        name: 'Token B',
        decimals: 18,
        source: 'cache',
      });
    });

    it('should skip if already initialized', async () => {
      const queryFn = vi.fn().mockResolvedValue(mockSuccessResponse());
      const client = createMockClient(queryFn);

      await initializeTokenRegistry(client, NO_DELAY);
      await initializeTokenRegistry(client, NO_DELAY);

      expect(queryFn).toHaveBeenCalledTimes(1);
    });

    it('should retry and succeed on second attempt', async () => {
      const queryFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue(mockSuccessResponse());
      const client = createMockClient(queryFn);

      await initializeTokenRegistry(client, NO_DELAY);

      // 1 initial + 1 retry = 2 calls
      expect(queryFn).toHaveBeenCalledTimes(2);
      expect(isTokenRegistryInitialized()).toBe(true);
      expect(getInitializationError()).toBeNull();
      expect(getTokenCache().size).toBe(2);
    });

    it('should retry and succeed on third attempt', async () => {
      const queryFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue(mockSuccessResponse());
      const client = createMockClient(queryFn);

      await initializeTokenRegistry(client, NO_DELAY);

      // 1 initial + 2 retries = 3 calls
      expect(queryFn).toHaveBeenCalledTimes(3);
      expect(isTokenRegistryInitialized()).toBe(true);
      expect(getInitializationError()).toBeNull();
    });

    it('should set initializationError when all retries fail', async () => {
      const queryFn = vi.fn().mockRejectedValue(new Error('Persistent failure'));
      const client = createMockClient(queryFn);

      await initializeTokenRegistry(client, NO_DELAY);

      // 1 initial + 3 retries = 4 calls
      expect(queryFn).toHaveBeenCalledTimes(4);
      expect(isTokenRegistryInitialized()).toBe(false);

      const err = getInitializationError();
      expect(err).toBeInstanceOf(Error);
      expect(err!.message).toBe('Persistent failure');
    });

    it('should clear initializationError on success after previous failure', async () => {
      // First call: all retries fail
      const failClient = createMockClient(
        vi.fn().mockRejectedValue(new Error('Down'))
      );
      await initializeTokenRegistry(failClient, NO_DELAY);
      expect(getInitializationError()).not.toBeNull();

      // Reset initialized flag to allow re-init (simulating app retry)
      _resetForTesting();

      // Second call: succeeds
      const successClient = createMockClient(
        vi.fn().mockResolvedValue(mockSuccessResponse())
      );
      await initializeTokenRegistry(successClient, NO_DELAY);

      expect(isTokenRegistryInitialized()).toBe(true);
      expect(getInitializationError()).toBeNull();
    });

    it('should handle non-Error thrown values', async () => {
      const queryFn = vi.fn().mockRejectedValue('string error');
      const client = createMockClient(queryFn);

      await initializeTokenRegistry(client, NO_DELAY);

      const err = getInitializationError();
      expect(err).toBeInstanceOf(Error);
      expect(err!.message).toBe('string error');
    });

    it('should handle empty token list without error', async () => {
      const queryFn = vi.fn().mockResolvedValue({
        data: { tokens: { items: [] } },
      });
      const client = createMockClient(queryFn);

      await initializeTokenRegistry(client, NO_DELAY);

      expect(isTokenRegistryInitialized()).toBe(true);
      expect(getInitializationError()).toBeNull();
      expect(getTokenCache().size).toBe(0);
    });
  });

  describe('resolveTokenWithCache', () => {
    it('should return SUPPORTED_TOKENS match over cache', () => {
      const result = resolveTokenWithCache('0xUSDC');
      expect(result.symbol).toBe('USDC');
      expect(result.source).toBe('supported');
    });

    it('should return cached token for unknown address', async () => {
      const queryFn = vi.fn().mockResolvedValue(mockSuccessResponse());
      await initializeTokenRegistry(createMockClient(queryFn), NO_DELAY);

      const result = resolveTokenWithCache('0xAABB');
      expect(result.symbol).toBe('TKA');
      expect(result.source).toBe('cache');
    });

    it('should return address fallback when not in cache', () => {
      const result = resolveTokenWithCache('0xUnknownAddr');
      expect(result.symbol).toContain('...');
      expect(result.source).toBe('fallback');
    });
  });

  describe('getTokenCache', () => {
    it('should return mutable reference to cache map', async () => {
      const cache = getTokenCache();
      cache.set('0xmanual', {
        address: '0xManual',
        symbol: 'MAN',
        name: 'Manual Token',
        decimals: 12,
        source: 'rpc',
      });

      // The entry should persist in the same cache
      expect(getTokenCache().get('0xmanual')?.symbol).toBe('MAN');
    });
  });
});
