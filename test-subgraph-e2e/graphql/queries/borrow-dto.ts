/**
 * Ponder Borrow DTO Types
 * Type definitions for Ponder indexer Borrow responses
 * All numeric values are strings to preserve precision
 */

import type { PonderMarketDTO } from './market-dto';
import { isPonderMarketDTO } from './market-dto';
export type { PonderMarketDTO };
export { isPonderMarketDTO };

export type PonderBorrowMarketDTO = PonderMarketDTO;

export interface PonderUserBorrowPositionDTO {
  id: string;
  marketId: string;
  user: string;
  collateral: string;
  borrowed: string;
}

export interface PonderBorrowMarketsResponse {
  markets: { items: PonderBorrowMarketDTO[] };
}

export interface PonderBorrowMarketResponse {
  market: PonderBorrowMarketDTO | null;
}

export interface PonderUserBorrowPositionsResponse {
  positions: { items: PonderUserBorrowPositionDTO[] };
}

export function isPonderBorrowMarketDTO(value: unknown): value is PonderBorrowMarketDTO {
  return isPonderMarketDTO(value);
}

export function isPonderUserBorrowPositionDTO(value: unknown): value is PonderUserBorrowPositionDTO {
  if (value === null || value === undefined || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== 'string' || candidate.id.length === 0) return false;
  if (typeof candidate.marketId !== 'string') return false;
  if (typeof candidate.user !== 'string') return false;
  if (typeof candidate.collateral !== 'string') return false;
  if (typeof candidate.borrowed !== 'string') return false;
  return true;
}
