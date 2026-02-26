import { describe, it, expect, beforeEach } from 'vitest';
import { isTransferEvent, isMorphoEvent, decodeTransferEvent, decodeMorphoEvent, padAddress, padTopicToAddress } from '@/infrastructure/websocket/event-decoder';
import { TRANSFER_EVENT_TOPIC, MORPHO_EVENT_TOPICS, WSS_URL, MORPHO_BLUE_ADDRESS_CONSTANT } from '@/infrastructure/websocket/constants';
import type { Log } from 'viem';

describe('WebSocket Integration Tests', () => {
  describe('Event Detection and Decoding Pipeline', () => {
    it('should correctly identify and decode transfer events', () => {
      const transferLog: Log = {
        address: '0xabcd123456789abcd123456789abcd123456789a' as `0x${string}`,
        topics: [
          TRANSFER_EVENT_TOPIC,
          '0x0000000000000000000000001234567890123456789012345678901234567890',
          '0x0000000000000000000000000987654321098765432109876543210987654321',
        ],
        data: '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
        blockNumber: 12345n,
        transactionHash: '0xaaaa123456789abcd123456789abcd123456789abcd123456789abcd12345',
        transactionIndex: 0,
        blockHash: '0xbbbb123456789abcd123456789abcd123456789abcd123456789abcd12345',
        logIndex: 0,
        removed: false,
      };

      expect(isTransferEvent(transferLog)).toBe(true);
      expect(isMorphoEvent(transferLog)).toBe(false);

      const decoded = decodeTransferEvent(transferLog);
      expect(decoded).not.toBeNull();
      if (decoded) {
        expect(decoded.blockNumber).toBe(12345n);
        expect(decoded.from).toBeDefined();
        expect(decoded.to).toBeDefined();
      }
    });

    it('should correctly identify and decode morpho supply events', () => {
      const morphoLog: Log = {
        address: '0xd21587df9DbAf7CF95584E4B47c314DC78A01CD0' as `0x${string}`,
        topics: [
          MORPHO_EVENT_TOPICS.Supply,
          '0x00000000000000000000000001234567890123456789012345678901234567890',
          '0x00000000000000000000000000000000000000000000000000000000000000ff',
        ],
        data: '0x0000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000de0b6b3a7640000',
        blockNumber: 54321n,
        transactionHash: '0xcccc123456789abcd123456789abcd123456789abcd123456789abcd12345',
        transactionIndex: 0,
        blockHash: '0xdddd123456789abcd123456789abcd123456789abcd123456789abcd12345',
        logIndex: 0,
        removed: false,
      };

      expect(isMorphoEvent(morphoLog)).toBe(true);
      expect(isTransferEvent(morphoLog)).toBe(false);

      const decoded = decodeMorphoEvent(morphoLog);
      expect(decoded).not.toBeNull();
      if (decoded) {
        expect(decoded.type).toBe('Supply');
        expect(decoded.blockNumber).toBe(54321n);
        expect(decoded.user).toBeDefined();
      }
    });

    it('should handle multiple event types correctly', () => {
      const eventTypes = [
        { topic: MORPHO_EVENT_TOPICS.Supply, expectedType: 'Supply' },
        { topic: MORPHO_EVENT_TOPICS.Withdraw, expectedType: 'Withdraw' },
        { topic: MORPHO_EVENT_TOPICS.Borrow, expectedType: 'Borrow' },
        { topic: MORPHO_EVENT_TOPICS.Repay, expectedType: 'Repay' },
        { topic: MORPHO_EVENT_TOPICS.Liquidate, expectedType: 'Liquidate' },
      ];

      eventTypes.forEach(({ topic, expectedType }) => {
        const log: Log = {
          address: '0xd21587df9DbAf7CF95584E4B47c314DC78A01CD0' as `0x${string}`,
          topics: [topic, '0x00000000000000000000000001234567890123456789012345678901234567890'] as [`0x${string}`, `0x${string}`],
          data: ('0x' + '0'.repeat(64)) as `0x${string}`,
          blockNumber: 1n,
          transactionHash: '0x123' as `0x${string}`,
          transactionIndex: 0,
          blockHash: '0xabc' as `0x${string}`,
          logIndex: 0,
          removed: false,
        };

        expect(isMorphoEvent(log)).toBe(true);
        const decoded = decodeMorphoEvent(log);
        expect(decoded?.type).toBe(expectedType);
      });
    });

    it('should reject logs with wrong topic signature', () => {
      const invalidLog: Log = {
        address: '0xabcd123456789abcd123456789abcd123456789a' as `0x${string}`,
        topics: [('0x' + '0'.repeat(64)) as `0x${string}`],
        data: '0x' as `0x${string}`,
        blockNumber: 1n,
        transactionHash: '0x123' as `0x${string}`,
        transactionIndex: 0,
        blockHash: '0xabc' as `0x${string}`,
        logIndex: 0,
        removed: false,
      };

      expect(isTransferEvent(invalidLog)).toBe(false);
      expect(isMorphoEvent(invalidLog)).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type information through decoding', () => {
      const log: Log = {
        address: '0xabcd123456789abcd123456789abcd123456789a' as `0x${string}`,
        topics: [
          TRANSFER_EVENT_TOPIC,
          '0x0000000000000000000000001234567890123456789012345678901234567890',
          '0x0000000000000000000000000987654321098765432109876543210987654321',
        ],
        data: '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
        blockNumber: 12345n,
        transactionHash: '0xaaaa123456789abcd123456789abcd123456789abcd123456789abcd12345',
        transactionIndex: 0,
        blockHash: '0xbbbb123456789abcd123456789abcd123456789abcd123456789abcd12345',
        logIndex: 0,
        removed: false,
      };

      const event = decodeTransferEvent(log);
      if (event) {
        const blockNum: bigint = event.blockNumber;
        const amount: bigint = event.amount;
        expect(typeof blockNum).toBe('bigint');
        expect(typeof amount).toBe('bigint');
      }
    });
  });

  describe('Real WebSocket Configuration', () => {
    it('should have valid WebSocket endpoint configured', () => {
      // WSS_URL must be set via environment variable
      expect(WSS_URL).toBeDefined();
      expect(WSS_URL).toMatch(/^wss:\/\//);
      expect(WSS_URL).toContain('nodit.io');
    });

    it('should have valid Morpho Blue address constant', () => {
      expect(MORPHO_BLUE_ADDRESS_CONSTANT).toBeDefined();
      expect(MORPHO_BLUE_ADDRESS_CONSTANT).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(MORPHO_BLUE_ADDRESS_CONSTANT).toBe('0xd21587df9DbAf7CF95584E4B47c314DC78A01CD0');
    });

    it('should validate transfer event topic format', () => {
      expect(TRANSFER_EVENT_TOPIC).toBeDefined();
      expect(TRANSFER_EVENT_TOPIC).toMatch(/^0x[a-f0-9]{64}$/);
      expect(TRANSFER_EVENT_TOPIC).toBe('0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef');
    });

    it('should validate all morpho event topics format', () => {
      const topicNames = ['Supply', 'Withdraw', 'Borrow', 'Repay', 'Liquidate', 'SupplyCollateral', 'WithdrawCollateral'] as const;

      topicNames.forEach((name) => {
        const topic = MORPHO_EVENT_TOPICS[name];
        expect(topic).toBeDefined();
        expect(topic).toMatch(/^0x[a-f0-9]{64}$/);
      });
    });
  });

  describe('Address Padding Utilities', () => {
    it('should correctly pad 20-byte addresses to 32 bytes', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const padded = padAddress(address);

      expect(padded).toMatch(/^0x[a-f0-9]{64}$/i);
      expect(padded).toContain('1234567890123456789012345678901234567890');
    });

    it('should correctly convert 32-byte topics to addresses', () => {
      const topic = '0x0000000000000000000000001234567890123456789012345678901234567890';
      const address = padTopicToAddress(topic);

      expect(address).toMatch(/^0x[a-f0-9]{40}$/i);
      expect(address.toLowerCase()).toContain('1234567890123456789012345678901234567890'.toLowerCase());
    });

    it('should handle invalid address input gracefully', () => {
      const invalidTopic = '0x';
      const address = padTopicToAddress(invalidTopic);

      expect(address).toBe('0x0000000000000000000000000000000000000000');
    });
  });

  describe('Real Data Event Processing', () => {
    it('should process realistic transfer event with proper amounts', () => {
      const transferLog: Log = {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC on mainnet
        topics: [
          TRANSFER_EVENT_TOPIC,
          '0x0000000000000000000000001234567890123456789012345678901234567890',
          '0x0000000000000000000000000987654321098765432109876543210987654321',
        ],
        data: '0x0000000000000000000000000000000000000000000000000000000005f5e100', // 100 USDC (6 decimals)
        blockNumber: 20000000n,
        transactionHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
        transactionIndex: 42,
        blockHash: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        logIndex: 15,
        removed: false,
      };

      const event = decodeTransferEvent(transferLog);

      expect(event).not.toBeNull();
      if (event) {
        expect(event.blockNumber).toBe(20000000n);
        expect(event.amount).toBe(100000000n);
        expect(event.token).toBe('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
      }
    });

    it('should process realistic Morpho Blue supply event', () => {
      const morphoLog: Log = {
        address: '0xd21587df9DbAf7CF95584E4B47c314DC78A01CD0' as `0x${string}`, // Morpho Blue address
        topics: [
          MORPHO_EVENT_TOPICS.Supply,
          '0x00000000000000000000000001234567890123456789012345678901234567890',
          '0xb323b82f454ef6b861b954ff2f7e56e6f68e6c0b2e0eb9f11a40f06f9d6e7b5f', // Market ID
        ] as [`0x${string}`, `0x${string}`, `0x${string}`],
        // assets: 100000000 (0x5f5e100), shares: 1000 (0x3e8)
        data: ('0x0000000000000000000000000000000000000000000000000000000005f5e100' +
              '00000000000000000000000000000000000000000000000000000000000003e8') as `0x${string}`,
        blockNumber: 20000000n,
        transactionHash: '0xabcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234',
        transactionIndex: 10,
        blockHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        logIndex: 5,
        removed: false,
      };

      const event = decodeMorphoEvent(morphoLog);

      expect(event).not.toBeNull();
      if (event) {
        expect(event.type).toBe('Supply');
        expect(event.blockNumber).toBe(20000000n);
        expect(event.assets).toBe(100000000n);
        expect(event.shares).toBe(1000n);
      }
    });

    it('should handle all morpho event types with real data format', () => {
      const eventTypes: Array<[keyof typeof MORPHO_EVENT_TOPICS, string]> = [
        ['Supply', 'Supply'],
        ['Withdraw', 'Withdraw'],
        ['Borrow', 'Borrow'],
        ['Repay', 'Repay'],
        ['Liquidate', 'Liquidate'],
      ];

      eventTypes.forEach(([topicKey, expectedType]) => {
        const log: Log = {
          address: '0xd21587df9DbAf7CF95584E4B47c314DC78A01CD0' as `0x${string}`,
          topics: [
            MORPHO_EVENT_TOPICS[topicKey],
            '0x00000000000000000000000001234567890123456789012345678901234567890',
            '0xb323b82f454ef6b861b954ff2f7e56e6f68e6c0b2e0eb9f11a40f06f9d6e7b5f',
          ],
          data: ('0x0000000000000000000000000000000000000000000000000000000005f5e100' +
                '0000000000000000000000000000000000000000000000000000000000000003e8') as `0x${string}`,
          blockNumber: 20000000n,
          transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          transactionIndex: 0,
          blockHash: '0x5678901234567890abcdef5678901234567890abcdef5678901234567890abcd',
          logIndex: 0,
          removed: false,
        };

        const event = decodeMorphoEvent(log);
        expect(event?.type).toBe(expectedType);
      });
    });
  });
});
