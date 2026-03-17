/**
 * Ponder Token DTO Types
 * Type definitions for Ponder indexer Token responses
 * All numeric values are strings to preserve precision
 */

export interface PonderTokenDTO {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  lastPriceUSD: string | null;
  type: string | null;
}

export interface PonderTokensResponse {
  tokens: { items: PonderTokenDTO[] };
}

export interface PonderTokenResponse {
  token: PonderTokenDTO | null;
}

export function isPonderTokenDTO(value: unknown): value is PonderTokenDTO {
  if (value === null || value === undefined || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== 'string' || candidate.id.length === 0) return false;
  if (typeof candidate.symbol !== 'string') return false;
  if (typeof candidate.name !== 'string') return false;
  if (typeof candidate.decimals !== 'number') return false;
  return true;
}
