import {
  type PublicClient,
  type Address,
  type Hash,
  type Log,
  decodeEventLog,
} from 'viem';
import type { TransferEvent, ApprovalEvent, MorphoEvent, MorphoEventType } from './types';
import { MORPHO_BLUE_ADDRESS } from '@/config/contracts/addresses';
import {
  ERC20_TRANSFER_EVENT_ABI as ERC20_TRANSFER_ABI_IMPORTED,
  ERC20_APPROVAL_EVENT_ABI as ERC20_APPROVAL_ABI_IMPORTED,
  MORPHO_SUPPLY_EVENT_ABI as MORPHO_SUPPLY_ABI_IMPORTED,
  MORPHO_WITHDRAW_EVENT_ABI as MORPHO_WITHDRAW_ABI_IMPORTED,
  MORPHO_BORROW_EVENT_ABI as MORPHO_BORROW_ABI_IMPORTED,
  MORPHO_REPAY_EVENT_ABI as MORPHO_REPAY_ABI_IMPORTED,
  MORPHO_SUPPLY_COLLATERAL_EVENT_ABI as MORPHO_SUPPLY_COLLATERAL_ABI_IMPORTED,
  MORPHO_WITHDRAW_COLLATERAL_EVENT_ABI as MORPHO_WITHDRAW_COLLATERAL_ABI_IMPORTED
} from '@/config/contracts/abis';

// Event ABIs are now imported from '@/config/contracts/abis'
const TRANSFER_EVENT_ABI = ERC20_TRANSFER_ABI_IMPORTED;
const APPROVAL_EVENT_ABI = ERC20_APPROVAL_ABI_IMPORTED;
const MORPHO_SUPPLY_EVENT_ABI = MORPHO_SUPPLY_ABI_IMPORTED;
const MORPHO_WITHDRAW_EVENT_ABI = MORPHO_WITHDRAW_ABI_IMPORTED;
const MORPHO_BORROW_EVENT_ABI = MORPHO_BORROW_ABI_IMPORTED;
const MORPHO_REPAY_EVENT_ABI = MORPHO_REPAY_ABI_IMPORTED;
const MORPHO_SUPPLY_COLLATERAL_EVENT_ABI = MORPHO_SUPPLY_COLLATERAL_ABI_IMPORTED;
const MORPHO_WITHDRAW_COLLATERAL_EVENT_ABI = MORPHO_WITHDRAW_COLLATERAL_ABI_IMPORTED;

/**
 * Event subscription callbacks
 */
export interface EventSubscriptionCallbacks {
  onTransfer?: (event: TransferEvent) => void;
  onApproval?: (event: ApprovalEvent) => void;
  onMorphoEvent?: (event: MorphoEvent) => void;
  onError?: (error: Error) => void;
}

/**
 * Event subscription configuration
 */
export interface EventSubscriptionConfig {
  /** Token addresses to watch for transfers */
  tokenAddresses?: Address[];
  /** User address to filter events for */
  userAddress?: Address;
  /** Market ID to filter events for */
  marketId?: Address;
}

/**
 * Event subscription handle
 */
export interface EventSubscriptionHandle {
  unsubscribe: () => void;
}

/**
 * Decode a transfer event log
 */
export function decodeTransferLog(log: Log): TransferEvent | null {
  try {
    return decodeEventLog({
      abi: [TRANSFER_EVENT_ABI],
      data: log.data,
      topics: log.topics,
    }) as unknown as TransferEvent;
  } catch (error) {
    return null;
  }
}

/**
 * Decode an approval event log
 */
export function decodeApprovalLog(log: Log): ApprovalEvent | null {
  try {
    const decoded = decodeEventLog({
      abi: APPROVAL_EVENT_ABI,
      data: log.data,
      topics: log.topics,
    });
    return {
      owner: (decoded.args as { owner: Address }).owner,
      spender: (decoded.args as { spender: Address }).spender,
      value: (decoded.args as { value: bigint }).value,
      token: log.address,
      blockNumber: log.blockNumber ?? 0n,
      txHash: log.transactionHash ?? ('0x' as Hash),
    };
  } catch (error) {
    return null;
  }
}

/**
 * Decode a Morpho event log
 */
export function decodeMorphoLog(log: Log): MorphoEvent | null {
  try {
    const abi = [
      ...MORPHO_SUPPLY_EVENT_ABI,
      ...MORPHO_WITHDRAW_EVENT_ABI,
      ...MORPHO_BORROW_EVENT_ABI,
      ...MORPHO_REPAY_EVENT_ABI,
      ...MORPHO_SUPPLY_COLLATERAL_EVENT_ABI,
      ...MORPHO_WITHDRAW_COLLATERAL_EVENT_ABI,
    ];
    return decodeEventLog({
      abi,
      data: log.data,
      topics: log.topics,
    }) as unknown as MorphoEvent;
  } catch (error) {
    return null;
  }
}

/**
 * Create event subscription using WebSocket client
 */
export function subscribeToEvents(
  client: PublicClient,
  callbacks: EventSubscriptionCallbacks,
  config: EventSubscriptionConfig = {}
): EventSubscriptionHandle {
  const unsubscribers: Array<() => void> = [];

  // Watch for transfer events
  if (config.tokenAddresses && config.tokenAddresses.length > 0) {
    try {
      const unwatch = client.watchContractEvent({
        address: config.tokenAddresses,
        abi: [TRANSFER_EVENT_ABI],
        eventName: 'Transfer',
        args: config.userAddress ? { _from: config.userAddress } : undefined,
        onLogs(logs) {
          for (const log of logs) {
            try {
              const event = decodeTransferLog(log);
              if (event) {
                callbacks.onTransfer?.(event);
              }
            } catch (error) {
              callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
            }
          }
        },
        onError: (error) => {
          console.error('[ES] Transfer watch error:', error);
          callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
        },
      });
      unsubscribers.push(unwatch);
      console.log('[ES] Transfer event subscription created for', config.tokenAddresses.length, 'tokens');
    } catch (error) {
      console.error('[ES] Failed to subscribe to transfer events:', error);
      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Watch for approval events (for user's tokens)
  if (config.userAddress) {
    try {
      const unwatch = client.watchContractEvent({
        abi: APPROVAL_EVENT_ABI,
        eventName: 'Approval',
        args: { owner: config.userAddress },
        onLogs(logs) {
          for (const log of logs) {
            try {
              const event = decodeApprovalLog(log);
              if (event) {
                console.log('[ES] Approval event received:', event.token.slice(0, 10), '→', event.spender.slice(0, 10));
                callbacks.onApproval?.(event);
              }
            } catch (error) {
              callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
            }
          }
        },
        onError: (error) => {
          console.error('[ES] Approval watch error:', error);
          callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
        },
      });
      unsubscribers.push(unwatch);
      console.log('[ES] Approval event subscription created for user:', config.userAddress.slice(0, 10));
    } catch (error) {
      console.error('[ES] Failed to subscribe to approval events:', error);
      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Watch for Morpho events
  if (true) { // Always watch Morpho events for now
    try {
      const unwatch = client.watchContractEvent({
        address: MORPHO_BLUE_ADDRESS,
        abi: [
          ...MORPHO_SUPPLY_EVENT_ABI,
          ...MORPHO_WITHDRAW_EVENT_ABI,
          ...MORPHO_BORROW_EVENT_ABI,
          ...MORPHO_REPAY_EVENT_ABI,
          ...MORPHO_SUPPLY_COLLATERAL_EVENT_ABI,
          ...MORPHO_WITHDRAW_COLLATERAL_EVENT_ABI,
        ],
        onLogs(logs) {
          for (const log of logs) {
            try {
              const event = decodeMorphoLog(log);
              if (event) {
                callbacks.onMorphoEvent?.(event);
              }
            } catch (error) {
              callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
            }
          }
        },
        onError: (error) => {
          console.error('[ES] Morpho watch error:', error);
          callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
        },
      });
      unsubscribers.push(unwatch);
      console.log('[ES] Morpho event subscription created');
    } catch (error) {
      console.error('[ES] Failed to subscribe to Morpho events:', error);
      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  return {
    unsubscribe: () => {
      for (const unsub of unsubscribers) {
        try {
          unsub();
        } catch {
          // Ignore unsubscribe errors
        }
      }
    },
  };
}

/**
 * Create event subscription callbacks
 */
export function createEventSubscriptionCallbacks(
  client: PublicClient,
  config: EventSubscriptionConfig = {}
): EventSubscriptionCallbacks {
  return {
    onTransfer: (event: TransferEvent) => {
      // Handle transfer events
      console.log('Transfer event:', event);
    },
    onMorphoEvent: (event: MorphoEvent) => {
      // Handle Morpho events
      console.log('Morpho event:', event);
    },
    onError: (error: Error) => {
      console.error('Event subscription error:', error);
    },
  };
}