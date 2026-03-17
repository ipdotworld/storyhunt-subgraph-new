/**
 * Ponder Account DTO Types
 * Type definitions for Ponder indexer Account responses
 * All numeric values are strings to preserve precision
 */

export interface PonderAccountDTO {
  address: string;
  openPositionCount: string;
  closedPositionCount: string;
  depositCount: string;
  withdrawCount: string;
  borrowCount: string;
  repayCount: string;
  liquidationCount: string;
  liquidateCount: string;
  transferSentCount: string;
  transferReceivedCount: string;
  flashloanCount: string;
}

export interface PonderAccountsResponse {
  accounts: { items: PonderAccountDTO[] };
}

export interface PonderAccountResponse {
  account: PonderAccountDTO | null;
}
