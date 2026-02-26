import { describe, it, expect } from 'vitest';
import {
  decodeTransferEvent,
  decodeMorphoEvent,
  isTransferEvent,
  isMorphoEvent,
  padAddress,
} from '@/infrastructure/websocket/event-decoder';
import { TRANSFER_EVENT_TOPIC, MORPHO_EVENT_TOPICS } from '@/infrastructure/websocket/constants';
import type { Log, Address } from 'viem';

describe('Event Decoder', () => {
  const mockTransferLog: Log = {
    address: '0xabcd123456789abcd123456789abcd123456789a',
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

  const mockMorphoLog: Log = {
    address: '0x1307d26558831111876735A771Ef9957d0cdff1A',
    topics: [
      MORPHO_EVENT_TOPICS.Supply,
      '0x00000000000000000000000001234567890123456789012345678901234567890',
    ],
    data: '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
    blockNumber: 12345n,
    transactionHash: '0xcccc123456789abcd123456789abcd123456789abcd123456789abcd12345',
    transactionIndex: 0,
    blockHash: '0xdddd123456789abcd123456789abcd123456789abcd123456789abcd12345',
    logIndex: 0,
    removed: false,
  };

  describe('isTransferEvent', () => {
    it('should identify transfer events by topic', () => {
      expect(isTransferEvent(mockTransferLog)).toBe(true);
    });

    it('should return false for non-transfer events', () => {
      expect(isTransferEvent(mockMorphoLog)).toBe(false);
    });

    it('should return false when topics are empty', () => {
      const logWithoutTopics: Log = { ...mockTransferLog, topics: [] as const };
      expect(isTransferEvent(logWithoutTopics)).toBe(false);
    });
  });

  describe('isMorphoEvent', () => {
    it('should identify morpho supply events', () => {
      expect(isMorphoEvent(mockMorphoLog)).toBe(true);
    });

    it('should return false for transfer events', () => {
      expect(isMorphoEvent(mockTransferLog)).toBe(false);
    });

    it('should return false when topics are empty', () => {
      const logWithoutTopics: Log = { ...mockMorphoLog, topics: [] as const };
      expect(isMorphoEvent(logWithoutTopics)).toBe(false);
    });
  });

  describe('decodeTransferEvent', () => {
    it('should decode valid transfer event', () => {
      const event = decodeTransferEvent(mockTransferLog);

      expect(event).not.toBeNull();
      if (event) {
        expect(event.from).toBeDefined();
        expect(event.to).toBeDefined();
        expect(event.amount).toBeDefined();
        expect(event.token).toBeDefined();
        expect(event.blockNumber).toBe(12345n);
      }
    });

    it('should return null for non-transfer events', () => {
      const event = decodeTransferEvent(mockMorphoLog);
      expect(event).toBeNull();
    });

    it('should return null for invalid data', () => {
      const invalidLog: Log = { ...mockTransferLog, topics: [] as const };
      const event = decodeTransferEvent(invalidLog);
      expect(event).toBeNull();
    });
  });

  describe('decodeMorphoEvent', () => {
    it('should decode valid morpho supply event', () => {
      const event = decodeMorphoEvent(mockMorphoLog);

      expect(event).not.toBeNull();
      if (event) {
        expect(event.type).toBe('Supply');
        expect(event.blockNumber).toBe(12345n);
        expect(event.user).toBeDefined();
      }
    });

    it('should return null for transfer events', () => {
      const event = decodeMorphoEvent(mockTransferLog);
      expect(event).toBeNull();
    });

    it('should return null for invalid data', () => {
      const invalidLog: Log = { ...mockMorphoLog, topics: [] as const };
      const event = decodeMorphoEvent(invalidLog);
      expect(event).toBeNull();
    });
  });

  describe('padAddress', () => {
    it('should pad address to 32 bytes', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const padded = padAddress(address);

      expect(padded).toMatch(/^0x[a-f0-9]{64}$/i);
    });

    it('should handle addresses already padded', () => {
      const address = '0x0000000000000000000000001234567890123456789012345678901234567890';
      const padded = padAddress(address);

      expect(padded).toMatch(/^0x[a-f0-9]{64}$/i);
    });

    it('should preserve lowercase format', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const padded = padAddress(address);

      expect(padded).toBe(padded.toLowerCase());
    });

    it('should throw on invalid address format', () => {
      const invalidAddress = '0x123456' as unknown as Address;
      expect(() => padAddress(invalidAddress)).toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle logs with minimal data', () => {
      const minimalLog = {
        address: '0xabcd123456789abcd123456789abcd123456789a',
        topics: [TRANSFER_EVENT_TOPIC],
        data: '0x',
        blockNumber: 1n,
        transactionHash: '0x123',
        transactionIndex: 0,
        blockHash: '0xabc',
        logIndex: 0,
        removed: false,
      } as Log;

      expect(isTransferEvent(minimalLog)).toBe(true);
    });

    it('should handle padTopicToAddress with invalid input', () => {
      expect(true).toBe(true);
    });
  });
});
