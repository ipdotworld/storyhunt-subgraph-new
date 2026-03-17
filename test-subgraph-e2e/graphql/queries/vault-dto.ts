/**
 * Ponder MetaMorpho (Vault) DTO Types
 * Type definitions for Ponder indexer MetaMorpho/Vault responses
 * All numeric values are strings to preserve precision
 */

export interface PonderMetaMorphoDTO {
  id: string;
  name: string;
  symbol: string;
  asset: string;
  curator: string | null;
  guardian: string | null;
  owner: string;
  timelock: string;
  totalAssets: string;
  totalShares: string;
  fee: string;
  lastTotalAssets: string;
  createdAt: string;
  createdAtBlock: string;
}

export interface PonderMetaMorphoMarketDTO {
  id: string;
  vaultId: string;
  marketId: string;
  enabled: boolean;
  cap: string;
  removableAt: string;
  queuePosition: string | null;
}

export interface PonderMetaMorphoPositionDTO {
  id: string;
  vaultId: string;
  user: string;
  shares: string;
  assets: string;
  lastUpdated: string;
}

export interface PonderMetaMorphoDepositDTO {
  id: string;
  vaultId: string;
  user: string;
  assets: string;
  shares: string;
  timestamp: string;
  blockNumber: string;
  transactionHash: string;
}

export interface PonderMetaMorphoWithdrawDTO {
  id: string;
  vaultId: string;
  user: string;
  assets: string;
  shares: string;
  timestamp: string;
  blockNumber: string;
  transactionHash: string;
}

export interface PonderMetaMorphosResponse {
  metaMorphos: { items: PonderMetaMorphoDTO[] };
}

export interface PonderMetaMorphoResponse {
  metaMorpho: PonderMetaMorphoDTO | null;
}

export interface PonderMetaMorphoMarketsResponse {
  metaMorphoMarkets: { items: PonderMetaMorphoMarketDTO[] };
}

export interface PonderMetaMorphoPositionsResponse {
  metaMorphoPositions: { items: PonderMetaMorphoPositionDTO[] };
}

export interface PonderMetaMorphoPositionResponse {
  metaMorphoPosition: PonderMetaMorphoPositionDTO | null;
}

export interface PonderMetaMorphoDepositsResponse {
  metaMorphoDeposits: { items: PonderMetaMorphoDepositDTO[] };
}

export interface PonderMetaMorphoWithdrawsResponse {
  metaMorphoWithdraws: { items: PonderMetaMorphoWithdrawDTO[] };
}

export function isPonderMetaMorphoDTO(value: unknown): value is PonderMetaMorphoDTO {
  if (value === null || value === undefined || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== 'string' || candidate.id.length === 0) return false;
  if (typeof candidate.name !== 'string') return false;
  if (typeof candidate.symbol !== 'string') return false;
  if (typeof candidate.asset !== 'string') return false;
  if (typeof candidate.totalAssets !== 'string') return false;
  if (typeof candidate.totalShares !== 'string') return false;
  return true;
}
