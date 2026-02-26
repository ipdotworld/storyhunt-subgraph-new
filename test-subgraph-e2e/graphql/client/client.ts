/**
 * Apollo Client Configuration
 *
 * SSR-safe Apollo Client: per-request instances on server, singleton on client.
 * On the server (typeof window === 'undefined'), getApolloClient() creates a
 * fresh instance every call to prevent cache sharing between SSR requests.
 * On the client, a module-level singleton is reused across the application.
 */

import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';

import { graphqlConfig } from '@/config';

/**
 * Error link to handle GraphQL and network errors
 */
const errorLink = onError((errorResponse) => {
  const response = errorResponse as {
    graphQLErrors?: Array<{ message: string; locations?: Array<{ line: number; column: number }>; path?: Array<string | number> }>;
    networkError?: Error;
  };

  if (response.graphQLErrors) {
    response.graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(`[GraphQL Error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
    });
  }
  if (response.networkError) {
    console.error(`[Network Error]: ${response.networkError}`);
  }
});

/**
 * HTTP link for GraphQL requests.
 * Ponder indexer does not support query batching, so we use a standard HttpLink.
 */
const httpLink = new HttpLink({
  uri: graphqlConfig.endpoint,
  credentials: 'omit', // Ponder indexer doesn't require credentials
});

/**
 * Create and configure Apollo Client
 */
export function createApolloClient(): ApolloClient {
  return new ApolloClient({
    ssrMode: typeof window === 'undefined', // Enable SSR mode on server
    link: from([errorLink, httpLink]),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            positions: {
              merge(existing, incoming) {
                return incoming;
              },
            },
            markets: {
              merge(existing, incoming) {
                return incoming;
              },
            },
          },
        },
      },
    }),
    defaultOptions: {
      watchQuery: {
        // Tiered cache: cache-and-network gives stale-while-revalidate behavior.
        // User-specific queries (positions, balances) should override to
        // 'network-only' at the hook/query call site.
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all',
      },
      query: {
        // Tiered cache: market/protocol data defaults to cache-first.
        // User-specific queries should override to 'network-only' per call.
        fetchPolicy: 'cache-first',
        errorPolicy: 'all',
      },
    },
  });
}

/**
 * Client-side singleton reference.
 * On the server this is never used; each getApolloClient() call returns a
 * fresh instance to avoid cache leakage between concurrent SSR requests.
 */
let apolloClient: ApolloClient | undefined;

export function getApolloClient(): ApolloClient {
  // Server-side: always create a new instance to prevent shared cache
  if (typeof window === 'undefined') {
    return createApolloClient();
  }

  // Client-side: reuse singleton
  if (!apolloClient) {
    apolloClient = createApolloClient();
  }
  return apolloClient;
}

/**
 * Reset Apollo Client cache and discard the singleton reference.
 * Useful for testing or logout flows.
 */
export function resetApolloClient(): void {
  if (apolloClient) {
    apolloClient.cache.reset();
    apolloClient = undefined;
  }
}
