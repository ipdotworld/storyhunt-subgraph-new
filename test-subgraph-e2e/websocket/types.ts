import type { Address, Hash, Hex } from 'viem';

/**
 * Types for WebSocket real-time subscriptions
 */

export type SubscriptionType = 'transfer' | 'morpho' | 'pending' | 'block';

export interface SubscriptionConfig {
  type: SubscriptionType;
  address: Address;
  tokens?: Address[];
  contracts?: Hex[];
}

export interface SubscriptionHandle {
  id: string;
  type: SubscriptionType;
  status: 'active' | 'inactive';
  unsubscribe: () => void;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

export interface TransferEvent {
  from: Address;
  to: Address;
  amount: bigint;
  token: Address;
  blockNumber: bigint;
  txHash: Hash;
}

export interface ApprovalEvent {
  owner: Address;
  spender: Address;
  value: bigint;
  token: Address;
  blockNumber: bigint;
  txHash: Hash;
}

export type MorphoEventType = 'Supply' | 'Withdraw' | 'Borrow' | 'Repay' | 'Liquidate' | 'SupplyCollateral' | 'WithdrawCollateral';

export interface MorphoEvent {
  type: MorphoEventType;
  marketId: string;
  user: Address;
  assets: bigint;
  shares: bigint;
  blockNumber: bigint;
  txHash: Hash;
}

export interface RealtimeContextValue {
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  subscriptionCount: number;
  forceReconnect: () => Promise<void>;
  /** Check if GraphQL refetching is paused (post-transaction indexer lag period) */
  isGraphQLPaused: () => boolean;
}
