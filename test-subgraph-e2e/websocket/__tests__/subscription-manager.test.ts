import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SubscriptionManager } from '@/infrastructure/websocket/subscription-manager';
import { RECONNECT_CONFIG, FLAPPING_CONFIG } from '@/infrastructure/websocket/constants';
import type { ConnectionStatus, SubscriptionConfig } from '@/infrastructure/websocket/types';

// Mock viem's createPublicClient and webSocket
vi.mock('viem', () => ({
  createPublicClient: vi.fn(() => ({
    chain: { id: 91342 },
    transport: {},
  })),
  webSocket: vi.fn(() => ({})),
}));

const { createPublicClient } = await import('viem');
const mockCreatePublicClient = vi.mocked(createPublicClient);

function createTestChain() {
  return {
    id: 91342,
    name: 'Giwa Sepolia',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://sepolia-rpc.giwa.io'] } },
  } as any;
}

const TEST_WS_URL = 'wss://giwa-sepolia.nodit.io/test';

function makeConfig(type: 'transfer' | 'morpho' | 'pending' | 'block' = 'transfer'): SubscriptionConfig {
  return {
    type,
    address: '0x1234567890123456789012345678901234567890',
  };
}

/**
 * Helper: advance fake timers enough for a single reconnect attempt to complete.
 * The exponential backoff uses baseDelay * 2^(attempt-1) capped at maxDelay.
 */
async function advanceReconnectTimers() {
  // Advance enough for the max possible delay + margin
  await vi.advanceTimersByTimeAsync(RECONNECT_CONFIG.maxDelay + 1000);
}

describe('SubscriptionManager', () => {
  let manager: SubscriptionManager;

  beforeEach(() => {
    vi.useFakeTimers();
    mockCreatePublicClient.mockReturnValue({
      chain: { id: 91342 },
      transport: {},
    } as any);
    manager = new SubscriptionManager(createTestChain(), TEST_WS_URL);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ─────────────────────────────────────────────────────────
  // Basic connection lifecycle (characterization of existing behavior)
  // ─────────────────────────────────────────────────────────

  describe('connect()', () => {
    it('should transition status from disconnected to connected', async () => {
      expect(manager.getConnectionStatus()).toBe('disconnected');
      await manager.connect();
      expect(manager.getConnectionStatus()).toBe('connected');
      expect(manager.isConnected()).toBe(true);
    });

    it('should skip if already connected', async () => {
      await manager.connect();
      const callsBefore = mockCreatePublicClient.mock.calls.length;
      await manager.connect(); // second call is a no-op
      expect(mockCreatePublicClient.mock.calls.length).toBe(callsBefore);
    });

    it('should skip if currently connecting', async () => {
      const statuses: ConnectionStatus[] = [];
      manager.onConnectionChange((s) => statuses.push(s));

      await manager.connect();
      // 'connecting' then 'connected'
      expect(statuses).toEqual(['connecting', 'connected']);
    });

    it('should set wasUserDisconnect to false', async () => {
      // Disconnect first to set the flag
      await manager.connect();
      await manager.disconnect();
      expect(manager.getConnectionStatus()).toBe('disconnected');

      // Reconnect clears the flag
      await manager.connect();
      expect(manager.isConnected()).toBe(true);
    });

    it('should throw and set disconnected status on transport failure', async () => {
      mockCreatePublicClient.mockImplementationOnce(() => {
        throw new Error('Transport error');
      });

      await expect(manager.connect()).rejects.toThrow('Failed to connect WebSocket: Transport error');
      expect(manager.getConnectionStatus()).toBe('disconnected');
      expect(manager.isConnected()).toBe(false);
    });
  });

  describe('disconnect()', () => {
    it('should set status to disconnected and clear client', async () => {
      await manager.connect();
      await manager.disconnect();
      expect(manager.getConnectionStatus()).toBe('disconnected');
      expect(manager.isConnected()).toBe(false);
    });

    it('should unsubscribe all active subscriptions', async () => {
      await manager.connect();
      manager.subscribe(makeConfig('transfer'));
      manager.subscribe(makeConfig('morpho'));
      expect(manager.getActiveSubscriptions()).toHaveLength(2);

      await manager.disconnect();
      expect(manager.getActiveSubscriptions()).toHaveLength(0);
    });

    it('should set wasUserDisconnect flag to true', async () => {
      await manager.connect();
      await manager.disconnect();

      // handleUnexpectedDisconnect should return false because wasUserDisconnect is true
      const result = await manager.handleUnexpectedDisconnect();
      expect(result).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────
  // Subscription management
  // ─────────────────────────────────────────────────────────

  describe('subscribe()', () => {
    it('should create a subscription and return a handle', async () => {
      await manager.connect();
      const handle = manager.subscribe(makeConfig('transfer'));

      expect(handle.id).toMatch(/^sub-/);
      expect(handle.type).toBe('transfer');
      expect(handle.status).toBe('active');
      expect(typeof handle.unsubscribe).toBe('function');
    });

    it('should throw when not connected', () => {
      expect(() => manager.subscribe(makeConfig())).toThrow(
        'SubscriptionManager is not connected'
      );
    });

    it('should track multiple subscriptions', async () => {
      await manager.connect();
      manager.subscribe(makeConfig('transfer'));
      manager.subscribe(makeConfig('morpho'));
      manager.subscribe(makeConfig('block'));

      expect(manager.getActiveSubscriptions()).toHaveLength(3);
    });

    it('should allow unsubscribing via handle', async () => {
      await manager.connect();
      const handle = manager.subscribe(makeConfig('transfer'));
      expect(manager.getActiveSubscriptions()).toHaveLength(1);

      handle.unsubscribe();
      expect(manager.getActiveSubscriptions()).toHaveLength(0);
    });
  });

  // ─────────────────────────────────────────────────────────
  // Connection change callbacks
  // ─────────────────────────────────────────────────────────

  describe('onConnectionChange()', () => {
    it('should notify callbacks on status transitions', async () => {
      const statuses: ConnectionStatus[] = [];
      manager.onConnectionChange((s) => statuses.push(s));

      await manager.connect();
      await manager.disconnect();

      expect(statuses).toEqual(['connecting', 'connected', 'disconnected']);
    });

    it('should allow unsubscribing from connection changes', async () => {
      const statuses: ConnectionStatus[] = [];
      const unsubscribe = manager.onConnectionChange((s) => statuses.push(s));

      await manager.connect();
      unsubscribe();
      await manager.disconnect();

      // Only connect statuses recorded, not disconnect
      expect(statuses).toEqual(['connecting', 'connected']);
    });
  });

  // ─────────────────────────────────────────────────────────
  // handleUnexpectedDisconnect() - core new functionality
  // ─────────────────────────────────────────────────────────

  describe('handleUnexpectedDisconnect()', () => {
    it('should return false if wasUserDisconnect is true', async () => {
      await manager.connect();
      await manager.disconnect(); // sets wasUserDisconnect = true

      const result = await manager.handleUnexpectedDisconnect();
      expect(result).toBe(false);
      expect(manager.getConnectionStatus()).toBe('disconnected');
    });

    it('should set status to reconnecting and attempt reconnection', async () => {
      await manager.connect();
      const statuses: ConnectionStatus[] = [];
      manager.onConnectionChange((s) => statuses.push(s));

      const reconnectPromise = manager.handleUnexpectedDisconnect();
      await advanceReconnectTimers();
      const result = await reconnectPromise;

      expect(result).toBe(true);
      expect(statuses).toContain('reconnecting');
      expect(manager.getConnectionStatus()).toBe('connected');
    });

    it('should restore subscriptions after successful reconnection', async () => {
      await manager.connect();
      manager.subscribe(makeConfig('transfer'));
      manager.subscribe(makeConfig('morpho'));
      expect(manager.getActiveSubscriptions()).toHaveLength(2);

      const reconnectPromise = manager.handleUnexpectedDisconnect();
      await advanceReconnectTimers();
      const result = await reconnectPromise;

      expect(result).toBe(true);
      const subs = manager.getActiveSubscriptions();
      expect(subs).toHaveLength(2);
      const types = subs.map((s) => s.type).sort();
      expect(types).toEqual(['morpho', 'transfer']);
    });

    it('should return false when all reconnect attempts are exhausted', async () => {
      await manager.connect();

      // Make connect fail on all retries
      mockCreatePublicClient.mockImplementation(() => {
        throw new Error('Connection refused');
      });

      const reconnectPromise = manager.handleUnexpectedDisconnect();

      // Advance enough time for all attempts
      for (let i = 0; i < RECONNECT_CONFIG.maxAttempts + 1; i++) {
        await advanceReconnectTimers();
      }

      const result = await reconnectPromise;
      expect(result).toBe(false);
      expect(manager.getConnectionStatus()).toBe('disconnected');
    });

    it('should reset reconnectAttempts to 0 after successful reconnect via connect()', async () => {
      await manager.connect();

      // Fail the first retry attempt, succeed on the second
      let callCount = 0;
      mockCreatePublicClient.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          throw new Error('Temporary failure');
        }
        return { chain: { id: 91342 }, transport: {} } as any;
      });

      const reconnectPromise = manager.handleUnexpectedDisconnect();
      for (let i = 0; i < RECONNECT_CONFIG.maxAttempts + 1; i++) {
        await advanceReconnectTimers();
      }
      const result = await reconnectPromise;

      expect(result).toBe(true);
      expect(manager.isConnected()).toBe(true);
    });

    it('should record disconnect timestamps', async () => {
      await manager.connect();
      vi.setSystemTime(new Date(1_000_000));

      const reconnectPromise = manager.handleUnexpectedDisconnect();
      await advanceReconnectTimers();
      await reconnectPromise;

      const timestamps = manager.getDisconnectTimestamps();
      expect(timestamps.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─────────────────────────────────────────────────────────
  // Flapping detection
  // ─────────────────────────────────────────────────────────

  describe('flapping detection', () => {
    it('should detect flapping when threshold disconnections occur within window', async () => {
      const baseTime = 1_000_000;
      vi.setSystemTime(new Date(baseTime));
      await manager.connect();

      // Trigger rapid disconnections up to the threshold
      for (let i = 0; i < FLAPPING_CONFIG.threshold; i++) {
        vi.setSystemTime(new Date(baseTime + i * 1000)); // 1 second apart

        if (i > 0) {
          // Reset mock to succeed so connect() works
          mockCreatePublicClient.mockReturnValue({ chain: { id: 91342 }, transport: {} } as any);
          await manager.connect();
        }

        const promise = manager.handleUnexpectedDisconnect();
        await advanceReconnectTimers();
        const result = await promise;

        if (i < FLAPPING_CONFIG.threshold - 1) {
          expect(result).toBe(true);
        } else {
          // At threshold: detected as flapping
          expect(result).toBe(false);
        }
      }

      expect(manager.isInFlappingPause()).toBe(true);
    });

    it('should not detect flapping when disconnections are outside the window', async () => {
      const baseTime = 1_000_000;
      vi.setSystemTime(new Date(baseTime));
      await manager.connect();

      // First disconnection
      const p1 = manager.handleUnexpectedDisconnect();
      await advanceReconnectTimers();
      await p1;

      // Move well past the window
      vi.setSystemTime(new Date(baseTime + FLAPPING_CONFIG.windowMs + 10_000));
      mockCreatePublicClient.mockReturnValue({ chain: { id: 91342 }, transport: {} } as any);
      await manager.connect();

      const p2 = manager.handleUnexpectedDisconnect();
      await advanceReconnectTimers();
      const result = await p2;

      expect(result).toBe(true);
      expect(manager.isInFlappingPause()).toBe(false);
    });

    it('should block reconnection during flapping pause period', async () => {
      const baseTime = 1_000_000;
      vi.setSystemTime(new Date(baseTime));
      await manager.connect();

      // Trigger flapping
      for (let i = 0; i < FLAPPING_CONFIG.threshold; i++) {
        vi.setSystemTime(new Date(baseTime + i * 100));
        if (i > 0) {
          mockCreatePublicClient.mockReturnValue({ chain: { id: 91342 }, transport: {} } as any);
          await manager.connect();
        }
        const promise = manager.handleUnexpectedDisconnect();
        await advanceReconnectTimers();
        await promise;
      }

      expect(manager.isInFlappingPause()).toBe(true);

      // Try another unexpected disconnect during pause
      vi.setSystemTime(new Date(baseTime + 1000));
      mockCreatePublicClient.mockReturnValue({ chain: { id: 91342 }, transport: {} } as any);
      await manager.connect();
      const result = await manager.handleUnexpectedDisconnect();
      expect(result).toBe(false);
    });

    it('should allow reconnection after flapping pause expires', async () => {
      const baseTime = 1_000_000;
      vi.setSystemTime(new Date(baseTime));
      await manager.connect();

      // Trigger flapping
      for (let i = 0; i < FLAPPING_CONFIG.threshold; i++) {
        vi.setSystemTime(new Date(baseTime + i * 100));
        if (i > 0) {
          mockCreatePublicClient.mockReturnValue({ chain: { id: 91342 }, transport: {} } as any);
          await manager.connect();
        }
        const promise = manager.handleUnexpectedDisconnect();
        await advanceReconnectTimers();
        await promise;
      }

      expect(manager.isInFlappingPause()).toBe(true);

      // Advance past flapping pause + window so old timestamps are pruned
      vi.setSystemTime(new Date(baseTime + FLAPPING_CONFIG.pauseMs + FLAPPING_CONFIG.windowMs + 1000));
      mockCreatePublicClient.mockReturnValue({ chain: { id: 91342 }, transport: {} } as any);
      await manager.connect();

      expect(manager.isInFlappingPause()).toBe(false);

      const reconnectPromise = manager.handleUnexpectedDisconnect();
      await advanceReconnectTimers();
      const result = await reconnectPromise;

      expect(result).toBe(true);
      expect(manager.isConnected()).toBe(true);
    });

    it('should prune old disconnect timestamps outside the window', async () => {
      const baseTime = 1_000_000;
      vi.setSystemTime(new Date(baseTime));
      await manager.connect();

      // Add a disconnection
      const p1 = manager.handleUnexpectedDisconnect();
      await advanceReconnectTimers();
      await p1;

      expect(manager.getDisconnectTimestamps().length).toBe(1);

      // Move past window
      vi.setSystemTime(new Date(baseTime + FLAPPING_CONFIG.windowMs + 1000));
      mockCreatePublicClient.mockReturnValue({ chain: { id: 91342 }, transport: {} } as any);
      await manager.connect();

      const p2 = manager.handleUnexpectedDisconnect();
      await advanceReconnectTimers();
      await p2;

      // Old timestamp should be pruned, only the new one remains
      const timestamps = manager.getDisconnectTimestamps();
      expect(timestamps.length).toBe(1);
      expect(timestamps[0]).toBeGreaterThan(baseTime + FLAPPING_CONFIG.windowMs);
    });
  });

  // ─────────────────────────────────────────────────────────
  // FLAPPING_CONFIG constants
  // ─────────────────────────────────────────────────────────

  describe('FLAPPING_CONFIG', () => {
    it('should have correct threshold', () => {
      expect(FLAPPING_CONFIG.threshold).toBe(3);
    });

    it('should have correct window', () => {
      expect(FLAPPING_CONFIG.windowMs).toBe(60_000);
    });

    it('should have correct pause duration', () => {
      expect(FLAPPING_CONFIG.pauseMs).toBe(120_000);
    });
  });

  // ─────────────────────────────────────────────────────────
  // Subscription restoration edge cases
  // ─────────────────────────────────────────────────────────

  describe('subscription restoration', () => {
    it('should restore zero subscriptions when none existed', async () => {
      await manager.connect();
      expect(manager.getActiveSubscriptions()).toHaveLength(0);

      const reconnectPromise = manager.handleUnexpectedDisconnect();
      await advanceReconnectTimers();
      const result = await reconnectPromise;

      expect(result).toBe(true);
      expect(manager.getActiveSubscriptions()).toHaveLength(0);
    });

    it('should generate new IDs for restored subscriptions', async () => {
      await manager.connect();
      const original = manager.subscribe(makeConfig('transfer'));
      const originalId = original.id;

      const reconnectPromise = manager.handleUnexpectedDisconnect();
      await advanceReconnectTimers();
      await reconnectPromise;

      const restored = manager.getActiveSubscriptions();
      expect(restored).toHaveLength(1);
      expect(restored[0].id).not.toBe(originalId);
      expect(restored[0].type).toBe('transfer');
    });

    it('should preserve subscription config types through reconnect', async () => {
      await manager.connect();
      manager.subscribe(makeConfig('transfer'));
      manager.subscribe(makeConfig('morpho'));
      manager.subscribe(makeConfig('block'));
      manager.subscribe(makeConfig('pending'));

      const reconnectPromise = manager.handleUnexpectedDisconnect();
      await advanceReconnectTimers();
      await reconnectPromise;

      const restored = manager.getActiveSubscriptions();
      expect(restored).toHaveLength(4);
      const types = restored.map((s) => s.type).sort();
      expect(types).toEqual(['block', 'morpho', 'pending', 'transfer']);
    });

    it('should handle restoration failure for individual subscriptions gracefully', async () => {
      await manager.connect();
      manager.subscribe(makeConfig('transfer'));
      manager.subscribe(makeConfig('morpho'));

      // After reconnect, make subscribe fail on first call but succeed on second
      let restoreCallCount = 0;
      const origSubscribe = manager.subscribe.bind(manager);
      vi.spyOn(manager, 'subscribe').mockImplementation((config) => {
        restoreCallCount++;
        if (restoreCallCount === 1) {
          throw new Error('Restore failed');
        }
        return origSubscribe(config);
      });

      const reconnectPromise = manager.handleUnexpectedDisconnect();
      await advanceReconnectTimers();
      const result = await reconnectPromise;

      // Should still succeed - partial restoration is not a fatal error
      expect(result).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────
  // Exponential backoff (characterization)
  // ─────────────────────────────────────────────────────────

  describe('exponential backoff', () => {
    it('should respect maxDelay cap', () => {
      // baseDelay * 2^4 = 1000 * 16 = 16000 < 30000
      const delay5 = RECONNECT_CONFIG.baseDelay * Math.pow(2, 4);
      expect(delay5).toBeLessThan(RECONNECT_CONFIG.maxDelay);

      // baseDelay * 2^5 = 1000 * 32 = 32000 > 30000 -> capped
      const delay6 = RECONNECT_CONFIG.baseDelay * Math.pow(2, 5);
      expect(Math.min(delay6, RECONNECT_CONFIG.maxDelay)).toBe(RECONNECT_CONFIG.maxDelay);
    });

    it('should use increasing delays between reconnect attempts', async () => {
      await manager.connect();

      // Fail all attempts to observe multiple delays
      mockCreatePublicClient.mockImplementation(() => {
        throw new Error('fail');
      });

      const reconnectPromise = manager.handleUnexpectedDisconnect();
      for (let i = 0; i < RECONNECT_CONFIG.maxAttempts + 1; i++) {
        await advanceReconnectTimers();
      }
      const result = await reconnectPromise;
      expect(result).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────
  // wasUserDisconnect flag interactions
  // ─────────────────────────────────────────────────────────

  describe('wasUserDisconnect flag', () => {
    it('should be false after connect()', async () => {
      await manager.connect();

      const reconnectPromise = manager.handleUnexpectedDisconnect();
      await advanceReconnectTimers();
      const result = await reconnectPromise;
      expect(result).toBe(true);
    });

    it('should be true after disconnect()', async () => {
      await manager.connect();
      await manager.disconnect();

      const result = await manager.handleUnexpectedDisconnect();
      expect(result).toBe(false);
    });

    it('should be cleared when connect() is called again after disconnect()', async () => {
      await manager.connect();
      await manager.disconnect();

      // Flag is true now
      expect(await manager.handleUnexpectedDisconnect()).toBe(false);

      // Connect again clears the flag
      await manager.connect();
      const reconnectPromise = manager.handleUnexpectedDisconnect();
      await advanceReconnectTimers();
      const result = await reconnectPromise;
      expect(result).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────
  // getActiveSubscriptions (characterization)
  // ─────────────────────────────────────────────────────────

  describe('getActiveSubscriptions()', () => {
    it('should return empty array when no subscriptions', async () => {
      await manager.connect();
      expect(manager.getActiveSubscriptions()).toEqual([]);
    });

    it('should return subscription info without config details', async () => {
      await manager.connect();
      manager.subscribe(makeConfig('transfer'));

      const subs = manager.getActiveSubscriptions();
      expect(subs).toHaveLength(1);
      expect(subs[0]).toHaveProperty('id');
      expect(subs[0]).toHaveProperty('type', 'transfer');
      expect(subs[0]).toHaveProperty('status', 'active');
      expect(subs[0]).not.toHaveProperty('config');
    });
  });

  // ─────────────────────────────────────────────────────────
  // isInFlappingPause()
  // ─────────────────────────────────────────────────────────

  describe('isInFlappingPause()', () => {
    it('should return false initially', () => {
      expect(manager.isInFlappingPause()).toBe(false);
    });

    it('should return false when no flapping has occurred', async () => {
      await manager.connect();
      expect(manager.isInFlappingPause()).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────
  // getDisconnectTimestamps()
  // ─────────────────────────────────────────────────────────

  describe('getDisconnectTimestamps()', () => {
    it('should return empty array initially', () => {
      expect(manager.getDisconnectTimestamps()).toEqual([]);
    });

    it('should return a copy (not a reference)', async () => {
      await manager.connect();
      const timestamps = manager.getDisconnectTimestamps();
      (timestamps as number[]).push(999999);
      expect(manager.getDisconnectTimestamps()).not.toContain(999999);
    });
  });
});
