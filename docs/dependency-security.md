# Dependency Security Notes

## 2026-03-31 axios supply-chain audit

- Direct `axios` dependency: none.
- Locked transitive `axios`: `0.21.4` via `@graphprotocol/graph-cli` -> `gluegun` -> `apisauce`.
- Installed `axios`: `0.21.4` in `node_modules`.
- `plain-crypto-js`: not present in `package.json`, lockfiles, or installed modules.

## Operating rule

- Use the committed Yarn lockfile during installs.
- Do not regenerate both Yarn and npm lockfiles during a dependency incident unless the work explicitly requires it.
- Review dependency graph changes before any upgrade.
