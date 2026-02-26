/**
 * Ponder User Transaction DTO Types
 * Type definitions for Ponder indexer transaction event responses
 * All numeric values are strings to preserve precision
 */

export type TransactionType =
  | 'DEPOSIT'
  | 'WITHDRAW'
  | 'BORROW'
  | 'REPAY'
  | 'LIQUIDATION'
  | 'TRANSFER'
  | 'FLASHLOAN';

export interface PonderUserTransactionDTO {
  id: string;
  type: TransactionType;
  marketId: string;
  user: string;
  amount: string;
  amountUSD: string | null;
  shares: string | null;
  timestamp: string;
  blockNumber: string;
  transactionHash: string;
  logIndex: string;
}

export interface PonderUserTransactionsResponse {
  userTransactions: { items: PonderUserTransactionDTO[] };
}

export interface PonderUserTransactionResponse {
  userTransaction: PonderUserTransactionDTO | null;
}

export function isPonderUserTransactionDTO(value: unknown): value is PonderUserTransactionDTO {
  if (value === null || value === undefined || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== 'string' || candidate.id.length === 0) return false;
  if (typeof candidate.type !== 'string') return false;
  if (typeof candidate.marketId !== 'string') return false;
  if (typeof candidate.user !== 'string') return false;
  if (typeof candidate.amount !== 'string') return false;
  if (typeof candidate.timestamp !== 'string') return false;
  if (typeof candidate.transactionHash !== 'string') return false;
  return true;
}
