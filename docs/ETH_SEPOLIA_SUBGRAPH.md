# ETH Sepolia Subgraph

This repo now has a Sepolia manifest for testing ETH indexing before mainnet.

## Files

- `subgraph-sepolia.yaml` indexes Sepolia `IPWorld`, `IPOwnerVault`, and dynamic pool templates.
- `src/utils/chains.ts` returns Sepolia pricing and vault config when `dataSource.network()` is `sepolia`.
- `src/utils/constants.ts` holds Sepolia addresses. Keep them lowercase in mapping config.

## Addresses

- IPWorld: `0xAD02dB09AF336817c3839b18A833bf77401cDFBb`
- IPOwnerVault: `0x972fBe4a97FF19b4BcbF4B5E9D5D56e7630c3E5E`
- Uniswap V3 factory: `0x0227628f3F023bb0B980b67D528571c95c6DaC1c`
- WETH: `0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14`
- USDC: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`
- WETH/USDC 0.05% pool: `0x3289680dD4d6C10bb19b899729cda5eEF58AEfF1`

## Start Blocks

- IPWorld: block `10823898`, creation tx `0x872e3b2da93ec518f9882dcde5deb2846750cf0f4cca21f6dbc6c2ebdabc0daa`
- IPOwnerVault: block `10823898`, creation tx `0xf61fef751d9f683a37d29628cd4dc87cf4caed0630e75f1f39ea42b2bf534bbe`

## Commands

- Build: `yarn build:sepolia`
- Deploy: `yarn deploy:sepolia`

The deploy script builds `subgraph-sepolia.yaml`, then deploys the compiled `build/` directory to `storyhunt-subgraph-ethereum-sepolia/v0.1.0`. Change the version before redeploying a new revision.

## Current Goldsky deployment

- Name: `storyhunt-subgraph-ethereum-sepolia/v0.1.0`
- GraphQL API: `https://api.goldsky.com/api/public/project_cm62xvsdx4gdo01yyhwbw7rsy/subgraphs/storyhunt-subgraph-ethereum-sepolia/v0.1.0/gn`
- Checked on 2026-05-17: healthy, active, 100% synced, `_meta.hasIndexingErrors=false`

## Webhooks

- `eth-sepolia-token-deployed` (`webhook_cmp8pds77je8p01wp0jdb78hh`)
  - Entity: `token_deployment`
  - URL: `https://dev-api.ip.world/api/v1/webhooks/11155111/token_deployed`
- `eth-sepolia-swap` (`webhook_cmp8pds1pjrhc01rhaa1t4h20`)
  - Entity: `swap`
  - URL: `https://dev-api.ip.world/api/v1/webhooks/11155111/swap`

These URLs require the backend ETH branch route support to be deployed. Before that deploy, the chain-id path returns `404` on dev.

## Notes

The manifest starts at block `10823898`, the creation block for both indexed protocol contracts. The previous draft used `10800000`, which was safe but earlier than needed.
