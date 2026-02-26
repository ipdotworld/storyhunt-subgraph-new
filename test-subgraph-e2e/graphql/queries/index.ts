/**
 * GraphQL Queries & DTO Types - Public API
 * Exports all Ponder fragments, queries, and DTO type definitions
 */

// ============================================================
// Fragments
// ============================================================
export {
  TOKEN_FRAGMENT,
  ORACLE_FRAGMENT,
  MARKET_FRAGMENT,
  POSITION_FRAGMENT,
  USER_TRANSACTION_FRAGMENT,
  META_MORPHO_FRAGMENT,
  META_MORPHO_MARKET_FRAGMENT,
  META_MORPHO_POSITION_FRAGMENT,
  ACCOUNT_FRAGMENT,
} from './fragments';

// ============================================================
// Queries
// ============================================================

// Market Queries
export {
  GET_MARKET_BY_ID,
  GET_ALL_MARKETS,
  GET_ACTIVE_MARKETS,
  GET_MARKET_BY_TOKEN_ADDRESS,
  GET_MARKET_BY_ADDRESS,
  MARKET_EXISTS,
  COUNT_MARKETS,
  GET_MARKETS_WITH_UTILIZATION,
} from './market-queries';

// Position Queries
export {
  GET_POSITION_BY_ID,
  GET_POSITIONS_BY_USER,
  GET_POSITIONS_BY_MARKET,
  GET_POSITIONS_BY_USER_AND_MARKET,
  GET_SUPPLY_POSITIONS_BY_USER,
  GET_BORROW_POSITIONS_BY_USER,
  GET_COLLATERAL_POSITIONS_BY_USER,
  GET_ALL_POSITIONS,
  POSITION_EXISTS,
  COUNT_POSITIONS_BY_USER,
  GET_OPEN_POSITIONS_BY_USER,
} from './position-queries';

// Borrow Queries
export {
  GET_BORROW_MARKETS,
  GET_ALL_MARKETS_FOR_BORROW,
  GET_BORROW_MARKET_BY_ID,
  GET_BORROW_MARKETS_PAGINATED,
  GET_USER_BORROW_POSITIONS,
  GET_USER_ALL_POSITIONS,
  GET_POSITION_BY_ID as GET_BORROW_POSITION_BY_ID,
  GET_USER_POSITIONS_FOR_MARKET,
  GET_USER_BORROW_POSITIONS_PAGINATED,
  COUNT_BORROW_MARKETS,
  COUNT_USER_BORROW_POSITIONS,
} from './borrow-queries';

// Vault (MetaMorpho) Queries
export {
  GET_VAULTS,
  GET_VAULT_BY_ID,
  GET_VAULT_MARKET_ALLOCATIONS,
  GET_VAULT_USER_POSITION,
  GET_USER_VAULT_POSITIONS,
  GET_VAULT_DEPOSITS,
  GET_VAULT_WITHDRAWALS,
} from './vault-queries';

// Token Queries
export {
  GET_ALL_TOKENS,
  GET_TOKEN_BY_ID,
  GET_TOKENS_BY_IDS,
} from './token-queries';

// Snapshot Queries
export {
  GET_MARKET_DAILY_SNAPSHOTS,
  GET_MARKET_HOURLY_SNAPSHOTS,
  GET_POSITION_SNAPSHOTS,
} from './snapshot-queries';

// Oracle Queries
export {
  GET_ALL_ORACLES,
  GET_ORACLE_BY_ID,
} from './oracle-queries';

// Account Queries
export { GET_ACCOUNT } from './account-queries';

// User Transaction Queries
export {
  GET_USER_TRANSACTIONS,
  GET_USER_TRANSACTIONS_BY_MARKET,
} from './user-transaction-queries';

// Interest Accrual Queries
export { GET_INTEREST_ACCRUALS } from './interest-accrual-queries';

// ============================================================
// DTO Types
// ============================================================

// Generic Ponder paginated response type
export interface PonderPaginatedResponse<T> {
  items: T[];
}

// Market DTOs
export type {
  PonderMarketDTO,
  PonderMarketsResponse,
  PonderMarketResponse,
} from './market-dto';

export { isPonderMarketDTO } from './market-dto';

// Position DTOs
export type {
  PositionSide,
  PonderPositionDTO,
  PonderPositionsResponse,
  PonderPositionResponse,
} from './position-dto';

export { isPonderPositionDTO } from './position-dto';

// Borrow DTOs
export type {
  PonderBorrowMarketDTO,
  PonderUserBorrowPositionDTO,
  PonderBorrowMarketsResponse,
  PonderBorrowMarketResponse,
  PonderUserBorrowPositionsResponse,
} from './borrow-dto';

export {
  isPonderBorrowMarketDTO,
  isPonderUserBorrowPositionDTO,
} from './borrow-dto';

// Vault (MetaMorpho) DTOs
export type {
  PonderMetaMorphoDTO,
  PonderMetaMorphoMarketDTO,
  PonderMetaMorphoPositionDTO,
  PonderMetaMorphoDepositDTO,
  PonderMetaMorphoWithdrawDTO,
  PonderMetaMorphosResponse,
  PonderMetaMorphoResponse,
  PonderMetaMorphoMarketsResponse,
  PonderMetaMorphoPositionsResponse,
  PonderMetaMorphoPositionResponse,
  PonderMetaMorphoDepositsResponse,
  PonderMetaMorphoWithdrawsResponse,
} from './vault-dto';

export { isPonderMetaMorphoDTO } from './vault-dto';

// Token DTOs
export type {
  PonderTokenDTO,
  PonderTokensResponse,
  PonderTokenResponse,
} from './token-dto';

export { isPonderTokenDTO } from './token-dto';

// Snapshot DTOs
export type {
  PonderMarketDailySnapshotDTO,
  PonderMarketHourlySnapshotDTO,
  PonderPositionSnapshotDTO,
  PonderMarketDailySnapshotsResponse,
  PonderMarketHourlySnapshotsResponse,
  PonderPositionSnapshotsResponse,
} from './snapshot-dto';

export {
  isPonderMarketDailySnapshotDTO,
  isPonderMarketHourlySnapshotDTO,
  isPonderPositionSnapshotDTO,
} from './snapshot-dto';

// Oracle DTOs
export type {
  OracleType,
  PonderOracleDTO,
  PonderOraclesResponse,
  PonderOracleResponse,
} from './oracle-dto';

export { isPonderOracleDTO } from './oracle-dto';

// Account DTOs
export type {
  PonderAccountDTO,
  PonderAccountsResponse,
  PonderAccountResponse,
} from './account-dto';

// User Transaction DTOs
export type {
  TransactionType,
  PonderUserTransactionDTO,
  PonderUserTransactionsResponse,
  PonderUserTransactionResponse,
} from './user-transaction-dto';

export { isPonderUserTransactionDTO } from './user-transaction-dto';

// Interest Accrual DTOs
export type {
  PonderInterestAccrualDTO,
  PonderInterestAccrualsResponse,
  PonderInterestAccrualResponse,
} from './interest-accrual-dto';

export { isPonderInterestAccrualDTO } from './interest-accrual-dto';
