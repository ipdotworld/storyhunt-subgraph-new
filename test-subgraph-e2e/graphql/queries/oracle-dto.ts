/**
 * Ponder Oracle DTO Types
 * Type definitions for Ponder indexer Oracle responses
 * All numeric values are strings to preserve precision
 */

export type OracleType = 'CHAINLINK' | 'REDSTONE' | 'FX' | 'CUSTOM';

export interface PonderOracleDTO {
  id: string;
  address: string;
  type: string;
  baseAsset: string;
  quoteAsset: string;
  lastPrice: string | null;
  lastPriceBlockNumber: string | null;
  lastPriceTimestamp: string | null;
  decimals: number;
}

export interface PonderOraclesResponse {
  oracles: { items: PonderOracleDTO[] };
}

export interface PonderOracleResponse {
  oracle: PonderOracleDTO | null;
}

export function isPonderOracleDTO(value: unknown): value is PonderOracleDTO {
  if (value === null || value === undefined || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== 'string' || candidate.id.length === 0) return false;
  if (typeof candidate.address !== 'string') return false;
  if (typeof candidate.type !== 'string') return false;
  if (typeof candidate.baseAsset !== 'string') return false;
  if (typeof candidate.quoteAsset !== 'string') return false;
  if (typeof candidate.decimals !== 'number') return false;
  return true;
}
