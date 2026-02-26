import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  normalizeTokenData,
  normalizeTokenDataAsync,
  normalizeVaultDTO,
  logNormalization,
  type DecimalSource,
  type RpcDecimalResolver,
} from '../token-normalizer';
import { getTokenCache, _resetForTesting } from '../token-registry';

// Mock token-resolver
vi.mock('@/utils/token-resolver', () => ({
  resolveTokenByAddress: vi.fn((address: string) => {
    const normalized = address.toLowerCase();

    // USDC - 6 decimals
    if (normalized === '0x11e88c0befd6552fe214425ef821bb272c3e889c') {
      return {
        address: normalized,
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        source: 'supported',
      };
    }

    // WBTC - 8 decimals
    if (normalized === '0xf86345d4c9b5fc7580acd680eec6906335425758') {
      return {
        address: normalized,
        symbol: 'WBTC',
        name: 'Wrapped BTC',
        decimals: 8,
        source: 'supported',
      };
    }

    // WETH - 18 decimals
    if (normalized === '0x4200000000000000000000000000000000000006') {
      return {
        address: normalized,
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
        source: 'supported',
      };
    }

    // Unknown token - fallback to 18 decimals
    const shortAddr = `${normalized.slice(0, 6)}...${normalized.slice(-4)}`;
    return {
      address: normalized,
      symbol: shortAddr,
      name: shortAddr,
      decimals: 18,
      source: 'fallback',
    };
  }),
}));

describe('normalizeTokenData', () => {
  beforeEach(() => {
    _resetForTesting();
  });

  it('should preserve GraphQL-provided decimals', () => {
    const dto = { id: '0x123', decimals: 6 };
    const result = normalizeTokenData(dto, '0xunknown');

    expect(result.decimals).toBe(6);
    expect(result._source).toBe('graphql');
  });

  it('should resolve decimals for USDC from SUPPORTED_TOKENS', () => {
    const dto = { id: '0x123' };
    const result = normalizeTokenData(
      dto,
      '0x11e88c0befd6552fe214425ef821bb272c3e889c'
    );

    expect(result.decimals).toBe(6);
    expect(result._source).toBe('supported');
  });

  it('should resolve decimals for WBTC from SUPPORTED_TOKENS', () => {
    const dto = { id: '0x456' };
    const result = normalizeTokenData(
      dto,
      '0xf86345d4c9b5fc7580acd680eec6906335425758'
    );

    expect(result.decimals).toBe(8);
    expect(result._source).toBe('supported');
  });

  it('should resolve decimals for WETH from SUPPORTED_TOKENS', () => {
    const dto = { id: '0x789' };
    const result = normalizeTokenData(
      dto,
      '0x4200000000000000000000000000000000000006'
    );

    expect(result.decimals).toBe(18);
    expect(result._source).toBe('supported');
  });

  it('should fallback to 18 for unknown tokens', () => {
    const dto = { id: '0x123' };
    const result = normalizeTokenData(dto, '0xunknowntoken');

    expect(result.decimals).toBe(18);
    expect(result._source).toBe('fallback');
  });

  it('should preserve all other DTO properties', () => {
    const dto = {
      id: '0x123',
      name: 'Test Token',
      totalAssets: '1000000',
    };
    const result = normalizeTokenData(
      dto,
      '0x11e88c0befd6552fe214425ef821bb272c3e889c'
    );

    expect(result.id).toBe('0x123');
    expect(result.name).toBe('Test Token');
    expect(result.totalAssets).toBe('1000000');
    expect(result.decimals).toBe(6);
    expect(result._source).toBe('supported');
  });

  it('should handle explicit decimals: 0 as valid', () => {
    const dto = { id: '0x123', decimals: 0 };
    const result = normalizeTokenData(dto, '0xunknown');

    expect(result.decimals).toBe(0);
    expect(result._source).toBe('graphql');
  });

  it('should handle null decimals by resolving from token', () => {
    const dto = { id: '0x123', decimals: null as unknown as undefined };
    const result = normalizeTokenData(
      dto,
      '0x11e88c0befd6552fe214425ef821bb272c3e889c'
    );

    expect(result.decimals).toBe(6);
    expect(result._source).toBe('supported');
  });

  it('should resolve from token cache when not in SUPPORTED_TOKENS', () => {
    const cachedAddress = '0xaabbccdd11223344556677889900aabbccddeeff';
    getTokenCache().set(cachedAddress.toLowerCase(), {
      address: cachedAddress.toLowerCase(),
      symbol: 'CACHED',
      name: 'Cached Token',
      decimals: 12,
      source: 'cache',
    });

    const dto = { id: '0x123' };
    const result = normalizeTokenData(dto, cachedAddress);

    expect(result.decimals).toBe(12);
    expect(result._source).toBe('cache');
  });

  it('should prefer SUPPORTED_TOKENS over token cache', () => {
    // Pre-populate cache with wrong decimals for USDC
    const usdcAddress = '0x11e88c0befd6552fe214425ef821bb272c3e889c';
    getTokenCache().set(usdcAddress.toLowerCase(), {
      address: usdcAddress.toLowerCase(),
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 99, // intentionally wrong
      source: 'cache',
    });

    const dto = { id: '0x123' };
    const result = normalizeTokenData(dto, usdcAddress);

    // SUPPORTED_TOKENS should win (6 decimals, not 99)
    expect(result.decimals).toBe(6);
    expect(result._source).toBe('supported');
  });
});

describe('normalizeTokenDataAsync', () => {
  beforeEach(() => {
    _resetForTesting();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should use GraphQL decimals without calling RPC', async () => {
    const rpcResolver = vi.fn();
    const dto = { id: '0x123', decimals: 8 };
    const result = await normalizeTokenDataAsync(dto, '0xunknown', rpcResolver);

    expect(result.decimals).toBe(8);
    expect(result._source).toBe('graphql');
    expect(rpcResolver).not.toHaveBeenCalled();
  });

  it('should use SUPPORTED_TOKENS without calling RPC', async () => {
    const rpcResolver = vi.fn();
    const dto = { id: '0x123' };
    const result = await normalizeTokenDataAsync(
      dto,
      '0x11e88c0befd6552fe214425ef821bb272c3e889c',
      rpcResolver
    );

    expect(result.decimals).toBe(6);
    expect(result._source).toBe('supported');
    expect(rpcResolver).not.toHaveBeenCalled();
  });

  it('should use token cache without calling RPC', async () => {
    const cachedAddress = '0xaabbccdd11223344556677889900aabbccddeeff';
    getTokenCache().set(cachedAddress.toLowerCase(), {
      address: cachedAddress.toLowerCase(),
      symbol: 'CACHED',
      name: 'Cached Token',
      decimals: 9,
      source: 'cache',
    });

    const rpcResolver = vi.fn();
    const dto = { id: '0x123' };
    const result = await normalizeTokenDataAsync(dto, cachedAddress, rpcResolver);

    expect(result.decimals).toBe(9);
    expect(result._source).toBe('cache');
    expect(rpcResolver).not.toHaveBeenCalled();
  });

  it('should call RPC resolver for unknown tokens and return result', async () => {
    const rpcResolver: RpcDecimalResolver = vi.fn().mockResolvedValue(6);
    const unknownAddress = '0xdeadbeef00000000000000000000000000000001';
    const dto = { id: '0x123' };
    const result = await normalizeTokenDataAsync(dto, unknownAddress, rpcResolver);

    expect(result.decimals).toBe(6);
    expect(result._source).toBe('rpc');
    expect(rpcResolver).toHaveBeenCalledWith(unknownAddress);
  });

  it('should cache RPC result for subsequent lookups', async () => {
    const rpcResolver: RpcDecimalResolver = vi.fn().mockResolvedValue(8);
    const unknownAddress = '0xdeadbeef00000000000000000000000000000002';
    const dto = { id: '0x123' };

    // First call: RPC
    await normalizeTokenDataAsync(dto, unknownAddress, rpcResolver);

    // Verify cached
    const cached = getTokenCache().get(unknownAddress.toLowerCase());
    expect(cached).toBeDefined();
    expect(cached!.decimals).toBe(8);
    expect(cached!.source).toBe('rpc');

    // Second call: should use cache, not RPC
    const rpcResolver2: RpcDecimalResolver = vi.fn().mockResolvedValue(99);
    const result2 = await normalizeTokenDataAsync(dto, unknownAddress, rpcResolver2);

    expect(result2.decimals).toBe(8);
    expect(result2._source).toBe('rpc'); // cached source is 'rpc'
    expect(rpcResolver2).not.toHaveBeenCalled();
  });

  it('should fall back to 18 when RPC returns null', async () => {
    const rpcResolver: RpcDecimalResolver = vi.fn().mockResolvedValue(null);
    const unknownAddress = '0xdeadbeef00000000000000000000000000000003';
    const dto = { id: '0x123' };
    const result = await normalizeTokenDataAsync(dto, unknownAddress, rpcResolver);

    expect(result.decimals).toBe(18);
    expect(result._source).toBe('fallback');
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Using fallback 18 decimals'),
      // no error arg for the fallback path
    );
  });

  it('should fall back to 18 when RPC throws an error', async () => {
    const rpcResolver: RpcDecimalResolver = vi.fn().mockRejectedValue(
      new Error('Contract not found')
    );
    const unknownAddress = '0xdeadbeef00000000000000000000000000000004';
    const dto = { id: '0x123' };
    const result = await normalizeTokenDataAsync(dto, unknownAddress, rpcResolver);

    expect(result.decimals).toBe(18);
    expect(result._source).toBe('fallback');
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('RPC decimals() call failed'),
      expect.any(Error)
    );
  });

  it('should fall back to 18 when no RPC resolver is provided', async () => {
    const unknownAddress = '0xdeadbeef00000000000000000000000000000005';
    const dto = { id: '0x123' };
    const result = await normalizeTokenDataAsync(dto, unknownAddress);

    expect(result.decimals).toBe(18);
    expect(result._source).toBe('fallback');
  });

  it('should not cache when RPC returns null', async () => {
    const rpcResolver: RpcDecimalResolver = vi.fn().mockResolvedValue(null);
    const unknownAddress = '0xdeadbeef00000000000000000000000000000006';
    const dto = { id: '0x123' };
    await normalizeTokenDataAsync(dto, unknownAddress, rpcResolver);

    const cached = getTokenCache().get(unknownAddress.toLowerCase());
    expect(cached).toBeUndefined();
  });

  it('should not cache when RPC throws', async () => {
    const rpcResolver: RpcDecimalResolver = vi.fn().mockRejectedValue(
      new Error('Network error')
    );
    const unknownAddress = '0xdeadbeef00000000000000000000000000000007';
    const dto = { id: '0x123' };
    await normalizeTokenDataAsync(dto, unknownAddress, rpcResolver);

    const cached = getTokenCache().get(unknownAddress.toLowerCase());
    expect(cached).toBeUndefined();
  });

  it('should handle RPC returning 0 as a valid decimal count', async () => {
    const rpcResolver: RpcDecimalResolver = vi.fn().mockResolvedValue(0);
    const unknownAddress = '0xdeadbeef00000000000000000000000000000008';
    const dto = { id: '0x123' };
    const result = await normalizeTokenDataAsync(dto, unknownAddress, rpcResolver);

    expect(result.decimals).toBe(0);
    expect(result._source).toBe('rpc');
  });
});

describe('normalizeVaultDTO', () => {
  it('should resolve USDC asset correctly', () => {
    const dto = {
      id: '0xvault',
      asset: '0x11e88c0befd6552fe214425ef821bb272c3e889c',
      name: 'USDC Vault',
    };

    const result = normalizeVaultDTO(dto);

    expect(result.decimals).toBe(18); // Vault shares always 18
    expect(result._assetDecimals).toBe(6); // USDC
    expect(result._assetSymbol).toBe('USDC');
    expect(result._source).toBe('supported');
  });

  it('should resolve WBTC asset correctly', () => {
    const dto = {
      id: '0xvault',
      asset: '0xf86345d4c9b5fc7580acd680eec6906335425758',
      name: 'WBTC Vault',
    };

    const result = normalizeVaultDTO(dto);

    expect(result.decimals).toBe(18); // Vault shares always 18
    expect(result._assetDecimals).toBe(8); // WBTC
    expect(result._assetSymbol).toBe('WBTC');
    expect(result._source).toBe('supported');
  });

  it('should resolve WETH asset correctly', () => {
    const dto = {
      id: '0xvault',
      asset: '0x4200000000000000000000000000000000000006',
      name: 'WETH Vault',
    };

    const result = normalizeVaultDTO(dto);

    expect(result.decimals).toBe(18); // Vault shares always 18
    expect(result._assetDecimals).toBe(18); // WETH
    expect(result._assetSymbol).toBe('WETH');
    expect(result._source).toBe('supported');
  });

  it('should handle unknown asset with fallback', () => {
    const dto = {
      id: '0xvault',
      asset: '0xunknownassetaddress1234567890',
      name: 'Unknown Vault',
    };

    const result = normalizeVaultDTO(dto);

    expect(result.decimals).toBe(18); // Vault shares always 18
    expect(result._assetDecimals).toBe(18); // Fallback
    expect(result._source).toBe('fallback');
  });

  it('should preserve all original DTO properties', () => {
    const dto = {
      id: '0xvault',
      asset: '0x11e88c0befd6552fe214425ef821bb272c3e889c',
      name: 'USDC Vault',
      totalAssets: '1000000000',
      curator: '0xcurator',
    };

    const result = normalizeVaultDTO(dto);

    expect(result.id).toBe('0xvault');
    expect(result.asset).toBe('0x11e88c0befd6552fe214425ef821bb272c3e889c');
    expect(result.name).toBe('USDC Vault');
    expect(result.totalAssets).toBe('1000000000');
    expect(result.curator).toBe('0xcurator');
  });
});

describe('logNormalization', () => {
  const originalEnv = process.env.NEXT_PUBLIC_DEBUG_DECIMALS;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_DEBUG_DECIMALS = originalEnv;
    vi.restoreAllMocks();
  });

  it('should not log when DEBUG_DECIMALS is not enabled', () => {
    delete process.env.NEXT_PUBLIC_DEBUG_DECIMALS;

    logNormalization('Test', '0x123456789abcdef', 6, 'supported');

    expect(console.log).not.toHaveBeenCalled();
  });

  it('should not log when DEBUG_DECIMALS is false', () => {
    process.env.NEXT_PUBLIC_DEBUG_DECIMALS = 'false';

    logNormalization('Test', '0x123456789abcdef', 6, 'supported');

    expect(console.log).not.toHaveBeenCalled();
  });

  it('should log when DEBUG_DECIMALS is true', () => {
    process.env.NEXT_PUBLIC_DEBUG_DECIMALS = 'true';

    logNormalization('Test', '0x123456789abcdef', 6, 'supported');

    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('[Normalization]')
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('[Supported]')
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Test')
    );
  });

  it('should format source labels correctly', () => {
    process.env.NEXT_PUBLIC_DEBUG_DECIMALS = 'true';

    const sources: DecimalSource[] = [
      'graphql',
      'supported',
      'cache',
      'rpc',
      'fallback',
    ];
    const expectedLabels = [
      '[GraphQL]',
      '[Supported]',
      '[Cache]',
      '[RPC]',
      '[Fallback]',
    ];

    sources.forEach((source, index) => {
      vi.mocked(console.log).mockClear();
      logNormalization('Test', '0x123', 18, source);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining(expectedLabels[index])
      );
    });
  });

  it('should truncate address in log output', () => {
    process.env.NEXT_PUBLIC_DEBUG_DECIMALS = 'true';

    logNormalization(
      'VaultMapping',
      '0x1234567890abcdef1234567890abcdef12345678',
      6,
      'supported'
    );

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('0x12345678...')
    );
  });
});
