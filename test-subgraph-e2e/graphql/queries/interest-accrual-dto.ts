/**
 * Ponder Interest Accrual DTO Types
 * Type definitions for Ponder indexer interest accrual event responses
 * All numeric values are strings to preserve precision
 */

export interface PonderInterestAccrualDTO {
  id: string;
  marketId: string;
  timestamp: string;
  blockNumber: string;
  prevBorrowRate: string;
  borrowRate: string;
  supplyRate: string;
  interest: string;
  feeShares: string;
  totalSupply: string;
  totalSupplyShares: string;
  totalBorrow: string;
  totalBorrowShares: string;
  transactionHash: string;
}

export interface PonderInterestAccrualsResponse {
  interestAccruals: { items: PonderInterestAccrualDTO[] };
}

export interface PonderInterestAccrualResponse {
  interestAccrual: PonderInterestAccrualDTO | null;
}

export function isPonderInterestAccrualDTO(value: unknown): value is PonderInterestAccrualDTO {
  if (value === null || value === undefined || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== 'string' || candidate.id.length === 0) return false;
  if (typeof candidate.marketId !== 'string') return false;
  if (typeof candidate.timestamp !== 'string') return false;
  if (typeof candidate.borrowRate !== 'string') return false;
  if (typeof candidate.interest !== 'string') return false;
  if (typeof candidate.totalSupply !== 'string') return false;
  if (typeof candidate.totalBorrow !== 'string') return false;
  if (typeof candidate.transactionHash !== 'string') return false;
  return true;
}
