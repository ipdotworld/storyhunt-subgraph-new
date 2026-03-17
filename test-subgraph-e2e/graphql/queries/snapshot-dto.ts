/**
 * Ponder Snapshot DTO Types
 * Type definitions for Ponder indexer Snapshot responses (daily, hourly, and position snapshots)
 * All numeric values are strings to preserve precision
 */

/**
 * PonderMarketDailySnapshotDTO - Daily market snapshot from Ponder indexer
 */
export interface PonderMarketDailySnapshotDTO {
  id: string;
  marketId: string;
  timestamp: string;
  totalSupply: string;
  totalBorrow: string;
  totalCollateral: string;
  totalSupplyUSD: string;
  totalBorrowUSD: string;
  totalValueLockedUSD: string;
  borrowRate: string;
  supplyRate: string;
  utilizationRate: string;
  dailyDepositUSD: string;
  dailyBorrowUSD: string;
  dailyLiquidateUSD: string;
  dailyRepayUSD: string;
  dailyWithdrawUSD: string;
  dailySupplySideRevenueUSD: string;
  dailyProtocolSideRevenueUSD: string;
  dailyTotalRevenueUSD: string;
  inputTokenPriceUSD: string | null;
  blockNumber: string;
}

/**
 * PonderMarketHourlySnapshotDTO - Hourly market snapshot from Ponder indexer
 */
export interface PonderMarketHourlySnapshotDTO {
  id: string;
  marketId: string;
  timestamp: string;
  totalSupply: string;
  totalBorrow: string;
  totalCollateral: string;
  totalSupplyUSD: string;
  totalBorrowUSD: string;
  totalValueLockedUSD: string;
  borrowRate: string;
  supplyRate: string;
  utilizationRate: string;
  hourlyDepositUSD: string;
  hourlyBorrowUSD: string;
  hourlyLiquidateUSD: string;
  hourlyRepayUSD: string;
  hourlyWithdrawUSD: string;
  inputTokenPriceUSD: string | null;
  blockNumber: string;
}

/**
 * PonderPositionSnapshotDTO - Position snapshot from Ponder indexer
 */
export interface PonderPositionSnapshotDTO {
  id: string;
  positionId: string;
  marketId: string;
  user: string;
  timestamp: string;
  balance: string;
  balanceUSD: string | null;
  supplyShares: string;
  borrowShares: string;
  collateral: string;
  principal: string;
  blockNumber: string;
}

/**
 * Ponder paginated response wrappers for snapshots
 */
export interface PonderMarketDailySnapshotsResponse {
  marketDailySnapshots: { items: PonderMarketDailySnapshotDTO[] };
}

export interface PonderMarketHourlySnapshotsResponse {
  marketHourlySnapshots: { items: PonderMarketHourlySnapshotDTO[] };
}

export interface PonderPositionSnapshotsResponse {
  positionSnapshots: { items: PonderPositionSnapshotDTO[] };
}

/**
 * Type guard helpers
 */
function isObject(obj: unknown): obj is Record<string, unknown> {
  return obj !== null && obj !== undefined && typeof obj === 'object' && !Array.isArray(obj);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function areNumericStringsValid(obj: Record<string, unknown>, fields: string[]): boolean {
  return fields.every(field => isNonEmptyString(obj[field]));
}

/**
 * Type guard to validate if an object is a PonderMarketDailySnapshotDTO
 */
export function isPonderMarketDailySnapshotDTO(obj: unknown): obj is PonderMarketDailySnapshotDTO {
  if (!isObject(obj)) return false;
  const candidate = obj as Record<string, unknown>;

  return (
    isNonEmptyString(candidate.id) &&
    isNonEmptyString(candidate.marketId) &&
    isNonEmptyString(candidate.timestamp) &&
    areNumericStringsValid(candidate, [
      'totalSupply',
      'totalBorrow',
      'totalValueLockedUSD',
      'borrowRate',
      'supplyRate',
      'dailyDepositUSD',
      'dailyBorrowUSD',
      'dailyLiquidateUSD',
    ])
  );
}

/**
 * Type guard to validate if an object is a PonderMarketHourlySnapshotDTO
 */
export function isPonderMarketHourlySnapshotDTO(obj: unknown): obj is PonderMarketHourlySnapshotDTO {
  if (!isObject(obj)) return false;
  const candidate = obj as Record<string, unknown>;

  return (
    isNonEmptyString(candidate.id) &&
    isNonEmptyString(candidate.marketId) &&
    isNonEmptyString(candidate.timestamp) &&
    areNumericStringsValid(candidate, [
      'totalSupply',
      'totalBorrow',
      'totalValueLockedUSD',
      'borrowRate',
      'supplyRate',
      'hourlyDepositUSD',
      'hourlyBorrowUSD',
      'hourlyLiquidateUSD',
    ])
  );
}

/**
 * Type guard to validate if an object is a PonderPositionSnapshotDTO
 */
export function isPonderPositionSnapshotDTO(obj: unknown): obj is PonderPositionSnapshotDTO {
  if (!isObject(obj)) return false;
  const candidate = obj as Record<string, unknown>;

  return (
    isNonEmptyString(candidate.id) &&
    isNonEmptyString(candidate.positionId) &&
    isNonEmptyString(candidate.marketId) &&
    isNonEmptyString(candidate.user) &&
    isNonEmptyString(candidate.timestamp) &&
    areNumericStringsValid(candidate, ['balance', 'supplyShares', 'borrowShares', 'principal'])
  );
}
