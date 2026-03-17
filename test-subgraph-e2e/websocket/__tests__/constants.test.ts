import { describe, it, expect } from 'vitest';
import {
  TRANSFER_EVENT_TOPIC,
  MORPHO_BLUE_ADDRESS_CONSTANT,
  MORPHO_EVENT_TOPICS,
  RECONNECT_CONFIG,
  WSS_URL,
} from '@/infrastructure/websocket/constants';

describe('WebSocket Constants', () => {
  describe('TRANSFER_EVENT_TOPIC', () => {
    it('should be a valid transfer event topic', () => {
      expect(TRANSFER_EVENT_TOPIC).toBe('0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef');
    });

    it('should be a hex string', () => {
      expect(TRANSFER_EVENT_TOPIC).toMatch(/^0x[a-f0-9]+$/i);
    });

    it('should have correct length', () => {
      expect(TRANSFER_EVENT_TOPIC).toHaveLength(66); // 0x + 64 hex chars
    });
  });

  describe('MORPHO_BLUE_ADDRESS_CONSTANT', () => {
    it('should be a valid address', () => {
      expect(MORPHO_BLUE_ADDRESS_CONSTANT).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should be the correct Morpho Blue address on Giwa Sepolia', () => {
      expect(MORPHO_BLUE_ADDRESS_CONSTANT).toBe('0xd21587df9DbAf7CF95584E4B47c314DC78A01CD0');
    });
  });

  describe('MORPHO_EVENT_TOPICS', () => {
    it('should have Supply topic', () => {
      expect(MORPHO_EVENT_TOPICS.Supply).toBeDefined();
      expect(MORPHO_EVENT_TOPICS.Supply).toMatch(/^0x[a-f0-9]{64}$/i);
    });

    it('should have Withdraw topic', () => {
      expect(MORPHO_EVENT_TOPICS.Withdraw).toBeDefined();
      expect(MORPHO_EVENT_TOPICS.Withdraw).toMatch(/^0x[a-f0-9]{64}$/i);
    });

    it('should have Borrow topic', () => {
      expect(MORPHO_EVENT_TOPICS.Borrow).toBeDefined();
      expect(MORPHO_EVENT_TOPICS.Borrow).toMatch(/^0x[a-f0-9]{64}$/i);
    });

    it('should have Repay topic', () => {
      expect(MORPHO_EVENT_TOPICS.Repay).toBeDefined();
      expect(MORPHO_EVENT_TOPICS.Repay).toMatch(/^0x[a-f0-9]{64}$/i);
    });

    it('should have Liquidate topic', () => {
      expect(MORPHO_EVENT_TOPICS.Liquidate).toBeDefined();
      expect(MORPHO_EVENT_TOPICS.Liquidate).toMatch(/^0x[a-f0-9]{64}$/i);
    });

    it('should have SupplyCollateral topic', () => {
      expect(MORPHO_EVENT_TOPICS.SupplyCollateral).toBeDefined();
      expect(MORPHO_EVENT_TOPICS.SupplyCollateral).toMatch(/^0x[a-f0-9]{64}$/i);
    });

    it('should have WithdrawCollateral topic', () => {
      expect(MORPHO_EVENT_TOPICS.WithdrawCollateral).toBeDefined();
      expect(MORPHO_EVENT_TOPICS.WithdrawCollateral).toMatch(/^0x[a-f0-9]{64}$/i);
    });

    it('should have exactly 7 event topics', () => {
      const topics = Object.keys(MORPHO_EVENT_TOPICS);
      expect(topics).toHaveLength(7);
    });
  });

  describe('RECONNECT_CONFIG', () => {
    it('should have maxAttempts property', () => {
      expect(RECONNECT_CONFIG.maxAttempts).toBe(5);
    });

    it('should have baseDelay property', () => {
      expect(RECONNECT_CONFIG.baseDelay).toBe(1000);
    });

    it('should have maxDelay property', () => {
      expect(RECONNECT_CONFIG.maxDelay).toBe(30000);
    });

    it('should have jitterFactor property', () => {
      expect(RECONNECT_CONFIG.jitterFactor).toBe(0.1);
    });

    it('should have valid configuration values', () => {
      expect(RECONNECT_CONFIG.baseDelay).toBeGreaterThan(0);
      expect(RECONNECT_CONFIG.maxDelay).toBeGreaterThan(RECONNECT_CONFIG.baseDelay);
      expect(RECONNECT_CONFIG.jitterFactor).toBeGreaterThan(0);
      expect(RECONNECT_CONFIG.jitterFactor).toBeLessThan(1);
    });
  });

  describe('WSS_URL', () => {
    it('should be a valid WSS URL', () => {
      // WSS_URL must be set via environment variable
      expect(WSS_URL).toBeDefined();
      expect(WSS_URL).toMatch(/^wss:\/\//);
    });
  });
});
