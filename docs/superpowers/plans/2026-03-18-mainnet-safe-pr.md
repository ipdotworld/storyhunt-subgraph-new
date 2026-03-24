# Mainnet Safe PR Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the low-hanging swap-path improvements that reduce read and write amplification without changing subgraph outputs.

**Architecture:** Keep all current entities, pricing rules, and handler semantics. Focus only on redundant store operations, helper reuse, and obviously safe short-circuits that preserve current results.

**Tech Stack:** AssemblyScript, Graph Protocol mappings, Matchstick tests

---

### Scope

- [ ] Remove redundant `PoolDayData` save/load work in the swap path.
- [ ] Reuse already-loaded `Pool` state where hot-path helpers currently reload it.
- [ ] Add regression coverage around unchanged swap outputs for the touched paths.
- [ ] Verify no manifest, schema, or pricing-model changes are included.
