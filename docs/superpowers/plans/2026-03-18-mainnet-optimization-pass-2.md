# Mainnet Optimization Pass 2 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce remaining swap-handler latency by removing most `getIPPriceUSD()` RPC calls and avoiding full whitelist-pool rescans when the active pricing source is unchanged.

**Architecture:** Preserve the current pricing formulas as the source of truth, but cache two expensive decisions in entity state. `PriceState` stores the canonical WIP/USDC-derived IP price from real pool events with `slot0()` as fallback, and each `Token` stores its current best pricing pool plus the liquidity score used to choose it so non-source swaps can avoid a full rescan.

**Tech Stack:** AssemblyScript, Graph Protocol mappings, Goldsky subgraphs

---

### Task 1: Cache canonical IP/USD from canonical pool events

**Files:**
- Modify: `schema.graphql`
- Modify: `src/utils/usdConversion.ts`
- Modify: `src/mappings/pool/initialize.ts`
- Modify: `src/mappings/pool/swap.ts`

- [ ] Add a `PriceState` entity for the latest canonical IP/USD value.
- [ ] Update canonical WIP/USDC `Initialize` and `Swap` handlers to write `PriceState`.
- [ ] Keep `slot0()` as fallback in `getIPPriceUSD()` until `PriceState` exists.

### Task 2: Materialize each token’s active pricing source

**Files:**
- Modify: `schema.graphql`
- Modify: `src/mappings/ipworld.ts`
- Modify: `src/utils/pricing.ts`
- Modify: `src/mappings/pool/swap.ts`
- Modify: `src/mappings/pool/initialize.ts`

- [ ] Add `pricingPool` and `pricingPoolLiquidityIP` to `Token`.
- [ ] Initialize those fields for new tokens.
- [ ] Teach `findNativePerToken()` to reuse the stored source unless the current pool is the source or overtakes it.
- [ ] Keep the old full whitelist scan as fallback when cached source data is missing or needs refresh.

### Task 3: Verify generated types and build output

**Files:**
- Modify: `src/types/schema.ts` (generated)

- [ ] Run `npm run build:mainnet`.
- [ ] Fix any codegen or AssemblyScript errors from the new cached entities and fields.
- [ ] Deploy only after build succeeds and the diff contains no unrelated lockfile churn.
