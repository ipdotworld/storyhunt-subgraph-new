/**
 * Ponder Market DTO Types
 * Type definitions for Ponder indexer Market responses
 * All numeric values are strings to preserve precision
 */

export interface PonderMarketDTO {
  id: string;
  loanToken: string;
  collateralToken: string;
  oracle: string;
  irm: string;
  lltv: string;
  totalSupply: string;
  totalSupplyShares: string;
  totalBorrow: string;
  totalBorrowShares: string;
  totalCollateral: string;
  fee: string;
  interest: string;
  lastUpdate: string;
  createdAt: string;
  createdAtBlock: string;
  borrowRate: string;
  supplyRate: string;
  utilizationRate: string;
  maximumLTV: string;
  liquidationThreshold: string;
  liquidationPenalty: string;
  inputTokenPriceUSD: string | null;
  totalValueLockedUSD: string;
  cumulativeSupplySideRevenueUSD: string;
  cumulativeProtocolSideRevenueUSD: string;
  cumulativeTotalRevenueUSD: string;
  transactionCount: string;
  depositCount: string;
  withdrawCount: string;
  borrowCount: string;
  repayCount: string;
  liquidationCount: string;
  transferCount: string;
  flashloanCount: string;
}

export interface PonderMarketsResponse {
  markets: { items: PonderMarketDTO[] };
}

export interface PonderMarketResponse {
  market: PonderMarketDTO | null;
}

function isValidHexString(str: string): boolean {
  return /^0x[0-9a-fA-F]*$/.test(str);
}

export function isPonderMarketDTO(value: unknown): value is PonderMarketDTO {
  if (value === null || value === undefined || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== 'string' || !isValidHexString(candidate.id)) return false;
  if (typeof candidate.loanToken !== 'string') return false;
  if (typeof candidate.collateralToken !== 'string') return false;
  if (typeof candidate.totalSupply !== 'string') return false;
  if (typeof candidate.totalBorrow !== 'string') return false;
  if (typeof candidate.borrowRate !== 'string') return false;
  if (typeof candidate.supplyRate !== 'string') return false;
  return true;
}
