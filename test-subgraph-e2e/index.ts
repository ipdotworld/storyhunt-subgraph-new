/**
 * Infrastructure Layer Barrel Export
 *
 * Infrastructure implementations for external integrations.
 * This layer should NOT import from hooks/, components/, or view-models/.
 *
 * Note: Repository implementations (including hybrid GraphQL/RPC logic)
 * are internal to providers/repository-provider.tsx and not exported here.
 */

export * from './graphql';
export * from './websocket';
export * from './rpc';
