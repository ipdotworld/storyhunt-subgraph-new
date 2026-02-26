/**
 * Ponder Position DTO Types
 * Type definitions for Ponder indexer Position responses
 * All numeric values are strings to preserve precision
 */

export type PositionSide = 'SUPPLIER' | 'BORROWER' | 'COLLATERAL';

export interface PonderPositionDTO {
  id: string;
  marketId: string;
  user: string;
  supplyShares: string;
  borrowShares: string;
  collateral: string;
  lastUpdated: string;
  side: PositionSide | null;
  supplyBalance: string;
  borrowBalance: string;
  supplyBalanceUSD: string | null;
  borrowBalanceUSD: string | null;
  isCollateral: boolean;
  assetToken: string | null;
  supplyPrincipal: string;
  borrowPrincipal: string;
  depositCount: string;
  withdrawCount: string;
  borrowCount: string;
  repayCount: string;
  liquidationCount: string;
}

export interface PonderPositionsResponse {
  positions: { items: PonderPositionDTO[] };
}

export interface PonderPositionResponse {
  position: PonderPositionDTO | null;
}

export function isPonderPositionDTO(value: unknown): value is PonderPositionDTO {
  if (value === null || value === undefined || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== 'string' || candidate.id.length === 0) return false;
  if (typeof candidate.marketId !== 'string') return false;
  if (typeof candidate.user !== 'string') return false;
  if (typeof candidate.supplyBalance !== 'string') return false;
  if (typeof candidate.supplyShares !== 'string') return false;
  if (typeof candidate.borrowShares !== 'string') return false;
  return true;
}
