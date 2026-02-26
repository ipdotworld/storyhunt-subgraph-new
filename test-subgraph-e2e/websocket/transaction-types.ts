/**
 * Re-export from domain layer for backward compatibility
 * Infrastructure layer should import from domain
 */
export {
  type TransactionStatus,
  type TransactionType,
  type OptimisticUpdateData,
  type TrackedTransaction,
  type TransactionTrackerState,
  type TransactionCallbacks,
  CACHE_INVALIDATION_MAP,
} from '@/domain/types/transaction-types';
