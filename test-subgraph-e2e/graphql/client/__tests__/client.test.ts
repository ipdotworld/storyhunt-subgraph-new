/**
 * Characterization tests for Apollo Client configuration.
 *
 * Verifies:
 * - BatchHttpLink usage with correct batching config (REQ-P1-004)
 * - Tiered cache policy defaults (REQ-P1-005)
 * - Server context (typeof window === 'undefined') creates new instance per call
 * - Client context returns the same singleton instance
 * - resetApolloClient clears cache and nullifies singleton reference
 * - createApolloClient always returns a fresh instance (factory unchanged)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Capture constructor args for assertions
let lastBatchHttpLinkOpts: Record<string, unknown> | undefined;
let lastApolloClientOpts: Record<string, unknown> | undefined;

// Mock @apollo/client before imports.
vi.mock('@apollo/client', () => {
  class MockInMemoryCache {
    _options: Record<string, unknown>;
    reset = vi.fn().mockResolvedValue(undefined);
    constructor(opts?: Record<string, unknown>) {
      this._options = opts ?? {};
    }
  }

  class MockApolloClient {
    _id: number;
    _options: Record<string, unknown>;
    cache: MockInMemoryCache;
    ssrMode: boolean;
    defaultOptions: Record<string, unknown>;
    constructor(opts: { cache: MockInMemoryCache; ssrMode: boolean; defaultOptions: Record<string, unknown> }) {
      this._id = Math.random();
      this._options = opts;
      this.cache = opts.cache;
      this.ssrMode = opts.ssrMode;
      this.defaultOptions = opts.defaultOptions;
      lastApolloClientOpts = opts;
    }
  }

  const from = vi.fn().mockImplementation((links: unknown[]) => links);

  return {
    ApolloClient: MockApolloClient,
    InMemoryCache: MockInMemoryCache,
    from,
  };
});

vi.mock('@apollo/client/link/batch-http', () => {
  class MockBatchHttpLink {
    _type = 'BatchHttpLink';
    uri: string;
    credentials: string;
    batchMax: number;
    batchInterval: number;
    constructor(opts: { uri: string; credentials: string; batchMax: number; batchInterval: number }) {
      this.uri = opts.uri;
      this.credentials = opts.credentials;
      this.batchMax = opts.batchMax;
      this.batchInterval = opts.batchInterval;
      lastBatchHttpLinkOpts = opts;
    }
  }

  return { BatchHttpLink: MockBatchHttpLink };
});

vi.mock('@apollo/client/link/error', () => ({
  onError: vi.fn().mockReturnValue({ _type: 'ErrorLink' }),
}));

vi.mock('@/config', () => ({
  graphqlConfig: { endpoint: 'http://test-endpoint/graphql' },
}));

describe('Apollo Client Configuration', () => {
  // Store original window to restore later
  const originalWindow = globalThis.window;

  afterEach(() => {
    // Restore window
    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      writable: true,
      configurable: true,
    });
    vi.resetModules();
    lastBatchHttpLinkOpts = undefined;
    lastApolloClientOpts = undefined;
  });

  describe('REQ-P1-004: Query Batching', () => {
    it('should use BatchHttpLink (not HttpLink)', async () => {
      const { createApolloClient } = await import('../client');
      createApolloClient();

      expect(lastBatchHttpLinkOpts).toBeDefined();
      expect(lastBatchHttpLinkOpts!.uri).toBe('http://test-endpoint/graphql');
    });

    it('should configure batchMax of 10', async () => {
      const { createApolloClient } = await import('../client');
      createApolloClient();

      expect(lastBatchHttpLinkOpts!.batchMax).toBe(10);
    });

    it('should configure batchInterval of 10ms', async () => {
      const { createApolloClient } = await import('../client');
      createApolloClient();

      expect(lastBatchHttpLinkOpts!.batchInterval).toBe(10);
    });

    it('should omit credentials for Ponder indexer', async () => {
      const { createApolloClient } = await import('../client');
      createApolloClient();

      expect(lastBatchHttpLinkOpts!.credentials).toBe('omit');
    });
  });

  describe('REQ-P1-005: Tiered Cache Policy', () => {
    it('should set watchQuery fetchPolicy to cache-and-network', async () => {
      const { createApolloClient } = await import('../client');
      createApolloClient();

      const opts = lastApolloClientOpts as {
        defaultOptions: { watchQuery: { fetchPolicy: string } };
      };
      expect(opts.defaultOptions.watchQuery.fetchPolicy).toBe('cache-and-network');
    });

    it('should set query fetchPolicy to cache-first for market/protocol data', async () => {
      const { createApolloClient } = await import('../client');
      createApolloClient();

      const opts = lastApolloClientOpts as {
        defaultOptions: { query: { fetchPolicy: string } };
      };
      expect(opts.defaultOptions.query.fetchPolicy).toBe('cache-first');
    });

    it('should keep errorPolicy as all for resilient error handling', async () => {
      const { createApolloClient } = await import('../client');
      createApolloClient();

      const opts = lastApolloClientOpts as {
        defaultOptions: {
          watchQuery: { errorPolicy: string };
          query: { errorPolicy: string };
        };
      };
      expect(opts.defaultOptions.watchQuery.errorPolicy).toBe('all');
      expect(opts.defaultOptions.query.errorPolicy).toBe('all');
    });
  });

  describe('createApolloClient (factory)', () => {
    it('should return a new instance on each call', async () => {
      const { createApolloClient } = await import('../client');
      const a = createApolloClient();
      const b = createApolloClient();
      expect(a).not.toBe(b);
    });
  });

  describe('getApolloClient - server context (SSR)', () => {
    beforeEach(() => {
      // Simulate server: window is undefined
      // @ts-expect-error -- deliberately removing window for SSR simulation
      delete globalThis.window;
    });

    it('should create a new instance on every call', async () => {
      const { getApolloClient } = await import('../client');
      const a = getApolloClient();
      const b = getApolloClient();
      expect(a).not.toBe(b);
    });

    it('should never share cache between calls', async () => {
      const { getApolloClient } = await import('../client');
      const a = getApolloClient();
      const b = getApolloClient();
      expect(a.cache).not.toBe(b.cache);
    });
  });

  describe('getApolloClient - client context (browser)', () => {
    beforeEach(() => {
      // Ensure window is defined (jsdom provides it)
      if (typeof globalThis.window === 'undefined') {
        Object.defineProperty(globalThis, 'window', {
          value: {},
          writable: true,
          configurable: true,
        });
      }
    });

    it('should return the same singleton instance', async () => {
      const { getApolloClient } = await import('../client');
      const a = getApolloClient();
      const b = getApolloClient();
      expect(a).toBe(b);
    });

    it('should share cache between calls', async () => {
      const { getApolloClient } = await import('../client');
      const a = getApolloClient();
      const b = getApolloClient();
      expect(a.cache).toBe(b.cache);
    });
  });

  describe('resetApolloClient', () => {
    beforeEach(() => {
      // Client context for singleton testing
      if (typeof globalThis.window === 'undefined') {
        Object.defineProperty(globalThis, 'window', {
          value: {},
          writable: true,
          configurable: true,
        });
      }
    });

    it('should clear cache and nullify singleton so next call creates fresh instance', async () => {
      const { getApolloClient, resetApolloClient } = await import('../client');

      const before = getApolloClient();
      resetApolloClient();
      const after = getApolloClient();

      expect(before).not.toBe(after);
      expect(before.cache.reset).toHaveBeenCalled();
    });

    it('should be safe to call when no client exists', async () => {
      const { resetApolloClient } = await import('../client');
      // Should not throw
      expect(() => resetApolloClient()).not.toThrow();
    });
  });

  describe('Cache Type Policies', () => {
    it('should configure merge policies for positions and markets fields', async () => {
      const { InMemoryCache } = await import('@apollo/client');
      const { createApolloClient } = await import('../client');
      createApolloClient();

      // The InMemoryCache constructor was called; inspect its options
      const cacheOpts = (lastApolloClientOpts as { cache: { _options: Record<string, unknown> } }).cache._options as {
        typePolicies: {
          Query: {
            fields: {
              positions: { merge: (existing: unknown, incoming: unknown) => unknown };
              markets: { merge: (existing: unknown, incoming: unknown) => unknown };
            };
          };
        };
      };

      // Verify InMemoryCache was used
      expect(InMemoryCache).toBeDefined();

      const fields = cacheOpts.typePolicies.Query.fields;

      // Merge functions should replace existing with incoming
      expect(fields.positions.merge('old', 'new')).toBe('new');
      expect(fields.markets.merge('old', 'new')).toBe('new');
    });
  });
});
