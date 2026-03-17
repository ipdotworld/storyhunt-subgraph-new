import { describe, it, expect } from 'vitest';
import type {
  SubscriptionType,
  SubscriptionConfig,
  SubscriptionHandle,
  ConnectionStatus,
  TransferEvent,
  MorphoEventType,
  MorphoEvent,
  RealtimeContextValue,
} from '@/infrastructure/websocket/types';

describe('WebSocket Types', () => {
  describe('SubscriptionType', () => {
    it('should support transfer subscription type', () => {
      const subType: SubscriptionType = 'transfer';
      expect(subType).toBe('transfer');
    });

    it('should support morpho subscription type', () => {
      const subType: SubscriptionType = 'morpho';
      expect(subType).toBe('morpho');
    });

    it('should support pending subscription type', () => {
      const subType: SubscriptionType = 'pending';
      expect(subType).toBe('pending');
    });

    it('should support block subscription type', () => {
      const subType: SubscriptionType = 'block';
      expect(subType).toBe('block');
    });
  });

  describe('SubscriptionConfig', () => {
    it('should create a valid transfer subscription config', () => {
      const config: SubscriptionConfig = {
        type: 'transfer',
        address: '0x1234567890123456789012345678901234567890',
        tokens: ['0x0000000000000000000000000000000000000001'],
      };
      expect(config.type).toBe('transfer');
      expect(config.address).toBeDefined();
      expect(config.tokens).toHaveLength(1);
    });

    it('should create a valid morpho subscription config', () => {
      const config: SubscriptionConfig = {
        type: 'morpho',
        address: '0x1234567890123456789012345678901234567890',
      };
      expect(config.type).toBe('morpho');
      expect(config.address).toBeDefined();
    });

    it('should support contracts in subscription config', () => {
      const config: SubscriptionConfig = {
        type: 'morpho',
        address: '0x1234567890123456789012345678901234567890',
        contracts: ['0xabcd'],
      };
      expect(config.contracts).toEqual(['0xabcd']);
    });
  });

  describe('SubscriptionHandle', () => {
    it('should create a valid subscription handle', () => {
      const handle: SubscriptionHandle = {
        id: 'sub-123',
        type: 'transfer',
        status: 'active',
        unsubscribe: () => {},
      };
      expect(handle.id).toBe('sub-123');
      expect(handle.type).toBe('transfer');
      expect(handle.status).toBe('active');
      expect(typeof handle.unsubscribe).toBe('function');
    });

    it('should support inactive subscription status', () => {
      const handle: SubscriptionHandle = {
        id: 'sub-123',
        type: 'transfer',
        status: 'inactive',
        unsubscribe: () => {},
      };
      expect(handle.status).toBe('inactive');
    });
  });

  describe('ConnectionStatus', () => {
    it('should support connected status', () => {
      const status: ConnectionStatus = 'connected';
      expect(status).toBe('connected');
    });

    it('should support connecting status', () => {
      const status: ConnectionStatus = 'connecting';
      expect(status).toBe('connecting');
    });

    it('should support disconnected status', () => {
      const status: ConnectionStatus = 'disconnected';
      expect(status).toBe('disconnected');
    });

    it('should support reconnecting status', () => {
      const status: ConnectionStatus = 'reconnecting';
      expect(status).toBe('reconnecting');
    });
  });

  describe('TransferEvent', () => {
    it('should create a valid transfer event', () => {
      const event: TransferEvent = {
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        amount: 1000n,
        token: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        blockNumber: 12345n,
        txHash: '0xhash123',
      };
      expect(event.from).toBeDefined();
      expect(event.to).toBeDefined();
      expect(event.amount).toBe(1000n);
      expect(event.token).toBeDefined();
      expect(event.blockNumber).toBe(12345n);
      expect(event.txHash).toBe('0xhash123');
    });
  });

  describe('MorphoEventType', () => {
    it('should support Supply event type', () => {
      const type: MorphoEventType = 'Supply';
      expect(type).toBe('Supply');
    });

    it('should support Withdraw event type', () => {
      const type: MorphoEventType = 'Withdraw';
      expect(type).toBe('Withdraw');
    });

    it('should support Borrow event type', () => {
      const type: MorphoEventType = 'Borrow';
      expect(type).toBe('Borrow');
    });

    it('should support Repay event type', () => {
      const type: MorphoEventType = 'Repay';
      expect(type).toBe('Repay');
    });

    it('should support Liquidate event type', () => {
      const type: MorphoEventType = 'Liquidate';
      expect(type).toBe('Liquidate');
    });

    it('should support SupplyCollateral event type', () => {
      const type: MorphoEventType = 'SupplyCollateral';
      expect(type).toBe('SupplyCollateral');
    });

    it('should support WithdrawCollateral event type', () => {
      const type: MorphoEventType = 'WithdrawCollateral';
      expect(type).toBe('WithdrawCollateral');
    });
  });

  describe('MorphoEvent', () => {
    it('should create a valid morpho event', () => {
      const event: MorphoEvent = {
        type: 'Supply',
        marketId: 'market-123',
        user: '0x1234567890123456789012345678901234567890',
        assets: 5000n,
        shares: 4900n,
        blockNumber: 12345n,
        txHash: '0xhash456',
      };
      expect(event.type).toBe('Supply');
      expect(event.marketId).toBe('market-123');
      expect(event.user).toBeDefined();
      expect(event.assets).toBe(5000n);
      expect(event.shares).toBe(4900n);
      expect(event.blockNumber).toBe(12345n);
      expect(event.txHash).toBe('0xhash456');
    });
  });

  describe('RealtimeContextValue', () => {
    it('should create a valid realtime context value', () => {
      const context: RealtimeContextValue = {
        isConnected: true,
        connectionStatus: 'connected',
        subscriptionCount: 5,
        forceReconnect: () => Promise.resolve(),
        isGraphQLPaused: () => false,
      };
      expect(context.isConnected).toBe(true);
      expect(context.connectionStatus).toBe('connected');
      expect(context.subscriptionCount).toBe(5);
      expect(typeof context.forceReconnect).toBe('function');
      expect(typeof context.isGraphQLPaused).toBe('function');
    });
  });
});
