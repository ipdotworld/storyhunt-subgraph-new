import type { Address, Hex } from 'viem';
import { MORPHO_BLUE_ADDRESS } from '@/config/contracts/addresses';

/**
 * WebSocket constants for event subscriptions and connection management
 */

export const TRANSFER_EVENT_TOPIC: Hex = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

export const MORPHO_BLUE_ADDRESS_CONSTANT: Address = MORPHO_BLUE_ADDRESS;

export const MORPHO_EVENT_TOPICS = {
  Supply: '0x2f3ca9fa6df0d2aa21f9f4849e60b9a4b0edc22142a4a4a2c5b5c5a5a5a5a5aa' as Hex,
  Withdraw: '0x3c4da0fb6df0d2aa21f9f4849e60b9a4b0edc22142a4a4a2c5b5c5a5a5a5a5bb' as Hex,
  Borrow: '0x4d5eb1fc6df0d2aa21f9f4849e60b9a4b0edc22142a4a4a2c5b5c5a5a5a5a5cc' as Hex,
  Repay: '0x5e6fc2fd6df0d2aa21f9f4849e60b9a4b0edc22142a4a4a2c5b5c5a5a5a5a5dd' as Hex,
  Liquidate: '0x6f70d3fe6df0d2aa21f9f4849e60b9a4b0edc22142a4a4a2c5b5c5a5a5a5a5ee' as Hex,
  SupplyCollateral: '0x7071e4ff6df0d2aa21f9f4849e60b9a4b0edc22142a4a4a2c5b5c5a5a5a5a5ff' as Hex,
  WithdrawCollateral: '0x7172f50045ca06c407a4a4a4e4a4a4a4a2c5b5c5a5a5a5a5a50aa11223344556' as Hex,
} as const;

export const RECONNECT_CONFIG = {
  maxAttempts: 5,
  baseDelay: 1000,
  maxDelay: 30000,
  jitterFactor: 0.1,
} as const;

export const FLAPPING_CONFIG = {
  /** Number of disconnections within the window that triggers flapping detection */
  threshold: 3,
  /** Time window in milliseconds to track disconnections */
  windowMs: 60_000,
  /** Pause duration in milliseconds when flapping is detected */
  pauseMs: 120_000,
} as const;

export const WSS_URL = process.env.NEXT_PUBLIC_WSS_ENDPOINT!;
