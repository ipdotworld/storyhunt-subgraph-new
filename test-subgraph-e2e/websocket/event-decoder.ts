import {
  type Log,
  type Address,
  type Hex,
  parseAbiParameters,
  decodeAbiParameters,
} from 'viem';
import {
  TRANSFER_EVENT_TOPIC,
  MORPHO_EVENT_TOPICS,
} from './constants';
import { ZERO_ADDRESS } from '@/config/contracts/addresses';
import type { TransferEvent, MorphoEvent, MorphoEventType } from './types';

/**
 * Decode ERC20 Transfer events from logs
 * Transfer event signature: Transfer(indexed address from, indexed address to, uint256 value)
 */
export function decodeTransferEvent(log: Log): TransferEvent | null {
  if (!isTransferEvent(log)) {
    return null;
  }

  try {
    const [fromTopic, toTopic] = log.topics.slice(1);

    const from = padTopicToAddress(fromTopic);
    const to = padTopicToAddress(toTopic);

    const abiParams = parseAbiParameters(['uint256 amount']);
    const [amount] = decodeAbiParameters(abiParams, log.data);

    return {
      from,
      to,
      amount: BigInt(amount as unknown as string),
      token: log.address,
      blockNumber: log.blockNumber ?? 0n,
      txHash: log.transactionHash || '0x',
    };
  } catch (error) {
    console.warn('Failed to decode transfer event:', error);
    return null;
  }
}

/**
 * Decode Morpho Blue events from logs
 * Supports: Supply, Withdraw, Borrow, Repay, Liquidate, SupplyCollateral, WithdrawCollateral
 */
export function decodeMorphoEvent(log: Log): MorphoEvent | null {
  if (!isMorphoEvent(log)) {
    return null;
  }

  try {
    const eventTopic = log.topics[0];
    let eventType: MorphoEventType | null = null;

    if (eventTopic === MORPHO_EVENT_TOPICS.Supply) {
      eventType = 'Supply';
    } else if (eventTopic === MORPHO_EVENT_TOPICS.Withdraw) {
      eventType = 'Withdraw';
    } else if (eventTopic === MORPHO_EVENT_TOPICS.Borrow) {
      eventType = 'Borrow';
    } else if (eventTopic === MORPHO_EVENT_TOPICS.Repay) {
      eventType = 'Repay';
    } else if (eventTopic === MORPHO_EVENT_TOPICS.Liquidate) {
      eventType = 'Liquidate';
    } else if (eventTopic === MORPHO_EVENT_TOPICS.SupplyCollateral) {
      eventType = 'SupplyCollateral';
    } else if (eventTopic === MORPHO_EVENT_TOPICS.WithdrawCollateral) {
      eventType = 'WithdrawCollateral';
    } else {
      return null;
    }

    const user = padTopicToAddress(log.topics[1] as Hex);

    try {
      const abiParams = parseAbiParameters(['uint256 assets', 'uint256 shares']);
      const decoded = decodeAbiParameters(abiParams, log.data);
      const assets = BigInt(decoded[0] as unknown as string);
      const shares = BigInt(decoded[1] as unknown as string);

      return {
        type: eventType,
        marketId: log.topics[2] ? log.topics[2].substring(0, 18) : 'unknown',
        user,
        assets,
        shares,
        blockNumber: log.blockNumber ?? 0n,
        txHash: log.transactionHash || '0x',
      };
    } catch {
      const assets = BigInt(log.data || '0');
      return {
        type: eventType,
        marketId: log.topics[2] ? log.topics[2].substring(0, 18) : 'unknown',
        user,
        assets,
        shares: 0n,
        blockNumber: log.blockNumber ?? 0n,
        txHash: log.transactionHash || '0x',
      };
    }
  } catch (error) {
    console.warn('Failed to decode morpho event:', error);
    return null;
  }
}

/**
 * Check if log is a transfer event
 */
export function isTransferEvent(log: Log): boolean {
  return log.topics.length > 0 && log.topics[0] === TRANSFER_EVENT_TOPIC;
}

/**
 * Check if log is a morpho blue event
 */
export function isMorphoEvent(log: Log): boolean {
  if (log.topics.length === 0) {
    return false;
  }

  const topic = log.topics[0];
  const morphoTopics = Object.values(MORPHO_EVENT_TOPICS);

  return morphoTopics.includes(topic as never);
}

/**
 * Pad address topic (32 bytes) to standard address (20 bytes)
 */
export function padTopicToAddress(topic: Hex): Address {
  if (!topic || topic === '0x') {
    return ZERO_ADDRESS;
  }

  try {
    const hex = topic.startsWith('0x') ? topic.slice(2) : topic;
    const address = '0x' + hex.slice(-40);
    return address.toLowerCase() as Address;
  } catch {
    return ZERO_ADDRESS;
  }
}

/**
 * Pad address to 32 bytes for topic filtering
 */
export function padAddress(address: Address): Hex {
  const normalized = address.toLowerCase();
  const hex = normalized.startsWith('0x') ? normalized.substring(2) : normalized;

  if (hex.length === 40) {
    return ('0x' + '0'.repeat(24) + hex) as Hex;
  }

  if (hex.length === 64) {
    return normalized as Hex;
  }

  throw new Error(`Invalid address format: ${address}`);
}
