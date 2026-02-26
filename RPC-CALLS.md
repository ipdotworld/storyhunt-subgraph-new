# RPC Calls Reference

This document covers RPC calls for data that **cannot be indexed from blockchain events** and requires real-time on-chain queries. These functions must be called directly against the Story Aeneid Testnet RPC endpoint.

## Network Information

| Property          | Value                                          |
| ----------------- | ---------------------------------------------- |
| Network           | Story Aeneid Testnet                           |
| Chain ID          | 1315                                           |
| IPWorld Proxy     | `0x77475A8ca1AfE6a6dc9E82B32210709054937099`   |
| IPOwnerVault Proxy| `0x276679F9e03d2E99350d407f964b5b42A3f01c73`   |

---

## IPOwnerVault Functions

These functions query vesting-related state for an IP Owner's vault.

---

### 1. `remaining(address token) -> uint256`

**Purpose:** Get the amount of tokens still locked in vesting for a given token address.

**Use Case:** Display the IP Owner's locked vesting balance that has not yet vested.

**Function Signature:**

```solidity
function remaining(address token) external view returns (uint256)
```

**ABI:**

```json
[
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "remaining",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]
```

**Parameters:**

| Name    | Type      | Description                                    |
| ------- | --------- | ---------------------------------------------- |
| `token` | `address` | The ERC-20 token address to query vesting for  |

**Return Value:**

| Type      | Description                                         |
| --------- | --------------------------------------------------- |
| `uint256` | Amount of tokens still locked (not yet vested), in the token's smallest unit (wei) |

**Example (ethers.js v6):**

```typescript
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://aeneid.storyrpc.io");

const VAULT_ADDRESS = "0x276679F9e03d2E99350d407f964b5b42A3f01c73";
const TOKEN_ADDRESS = "0x..."; // ERC-20 token address

const abi = [
  "function remaining(address token) external view returns (uint256)"
];

const vault = new ethers.Contract(VAULT_ADDRESS, abi, provider);

const remainingAmount = await vault.remaining(TOKEN_ADDRESS);
console.log("Remaining locked tokens:", ethers.formatUnits(remainingAmount, 18));
```

---

### 2. `released(address token) -> uint256`

**Purpose:** Get the cumulative amount of vested tokens that have already been released (claimed) for a given token address.

**Use Case:** Display the IP Owner's total claimed vesting tokens over the lifetime of the vault.

**Function Signature:**

```solidity
function released(address token) external view returns (uint256)
```

**ABI:**

```json
[
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "released",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]
```

**Parameters:**

| Name    | Type      | Description                                    |
| ------- | --------- | ---------------------------------------------- |
| `token` | `address` | The ERC-20 token address to query releases for |

**Return Value:**

| Type      | Description                                              |
| --------- | -------------------------------------------------------- |
| `uint256` | Cumulative amount of tokens released from vesting, in the token's smallest unit (wei) |

**Example (ethers.js v6):**

```typescript
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://aeneid.storyrpc.io");

const VAULT_ADDRESS = "0x276679F9e03d2E99350d407f964b5b42A3f01c73";
const TOKEN_ADDRESS = "0x..."; // ERC-20 token address

const abi = [
  "function released(address token) external view returns (uint256)"
];

const vault = new ethers.Contract(VAULT_ADDRESS, abi, provider);

const releasedAmount = await vault.released(TOKEN_ADDRESS);
console.log("Total released tokens:", ethers.formatUnits(releasedAmount, 18));
```

---

### 3. `releasable(address token) -> uint256`

**Purpose:** Get the amount of vested tokens that are currently available to claim right now for a given token address.

**Use Case:** Display the IP Owner's pending claimable amount -- tokens that have vested but have not yet been withdrawn.

**Function Signature:**

```solidity
function releasable(address token) external view returns (uint256)
```

**ABI:**

```json
[
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "releasable",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]
```

**Parameters:**

| Name    | Type      | Description                                        |
| ------- | --------- | -------------------------------------------------- |
| `token` | `address` | The ERC-20 token address to query claimable amount |

**Return Value:**

| Type      | Description                                                |
| --------- | ---------------------------------------------------------- |
| `uint256` | Amount of tokens available to claim right now, in the token's smallest unit (wei) |

**Example (ethers.js v6):**

```typescript
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://aeneid.storyrpc.io");

const VAULT_ADDRESS = "0x276679F9e03d2E99350d407f964b5b42A3f01c73";
const TOKEN_ADDRESS = "0x..."; // ERC-20 token address

const abi = [
  "function releasable(address token) external view returns (uint256)"
];

const vault = new ethers.Contract(VAULT_ADDRESS, abi, provider);

const claimableAmount = await vault.releasable(TOKEN_ADDRESS);
console.log("Claimable tokens:", ethers.formatUnits(claimableAmount, 18));
```

---

## IPWorld Functions

These functions query world-level state from the IPWorld contract.

---

### 4. `pendingTreasury(address token) -> uint256`

**Purpose:** Get the amount of tokens that have accumulated in the contract but have not yet been flushed to the IP's treasury address.

**Use Case:** Check how much is waiting for a treasury flush operation. This is useful for monitoring accumulated fees or rewards before they are distributed.

**Function Signature:**

```solidity
function pendingTreasury(address token) external view returns (uint256)
```

**ABI:**

```json
[
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "pendingTreasury",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]
```

**Parameters:**

| Name    | Type      | Description                                          |
| ------- | --------- | ---------------------------------------------------- |
| `token` | `address` | The ERC-20 token address to query pending amount for |

**Return Value:**

| Type      | Description                                                        |
| --------- | ------------------------------------------------------------------ |
| `uint256` | Amount of tokens accumulated but not yet sent to ipTreasury, in the token's smallest unit (wei) |

**Example (ethers.js v6):**

```typescript
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://aeneid.storyrpc.io");

const IPWORLD_ADDRESS = "0x77475A8ca1AfE6a6dc9E82B32210709054937099";
const TOKEN_ADDRESS = "0x..."; // ERC-20 token address

const abi = [
  "function pendingTreasury(address token) external view returns (uint256)"
];

const ipWorld = new ethers.Contract(IPWORLD_ADDRESS, abi, provider);

const pendingAmount = await ipWorld.pendingTreasury(TOKEN_ADDRESS);
console.log("Pending treasury tokens:", ethers.formatUnits(pendingAmount, 18));
```

---

### 5. `referral(address ipaId) -> address`

**Purpose:** Get the referral wallet address associated with a given IP Asset.

**Use Case:** Identify the referral recipient for an IP. This is used to determine who receives referral fees or rewards when an IP Asset generates revenue.

**Function Signature:**

```solidity
function referral(address ipaId) external view returns (address)
```

**ABI:**

```json
[
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "ipaId",
        "type": "address"
      }
    ],
    "name": "referral",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]
```

**Parameters:**

| Name    | Type      | Description                          |
| ------- | --------- | ------------------------------------ |
| `ipaId` | `address` | The IP Asset address (IPA ID) to query the referral for |

**Return Value:**

| Type      | Description                                            |
| --------- | ------------------------------------------------------ |
| `address` | The referral wallet address for the given IP Asset. Returns `0x0000000000000000000000000000000000000000` if no referral is set. |

**Example (ethers.js v6):**

```typescript
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://aeneid.storyrpc.io");

const IPWORLD_ADDRESS = "0x77475A8ca1AfE6a6dc9E82B32210709054937099";
const IPA_ID = "0x..."; // IP Asset address

const abi = [
  "function referral(address ipaId) external view returns (address)"
];

const ipWorld = new ethers.Contract(IPWORLD_ADDRESS, abi, provider);

const referralAddress = await ipWorld.referral(IPA_ID);
console.log("Referral address:", referralAddress);

if (referralAddress === ethers.ZeroAddress) {
  console.log("No referral is set for this IP Asset.");
}
```

---

### 6. `ipTreasury(address ipaId) -> address`

**Purpose:** Get the treasury wallet address associated with a given IP Asset.

**Use Case:** Identify where flushed tokens are sent for an IP. The treasury address is the destination for accumulated fees and rewards once a treasury flush is executed.

**Function Signature:**

```solidity
function ipTreasury(address ipaId) external view returns (address)
```

**ABI:**

```json
[
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "ipaId",
        "type": "address"
      }
    ],
    "name": "ipTreasury",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]
```

**Parameters:**

| Name    | Type      | Description                          |
| ------- | --------- | ------------------------------------ |
| `ipaId` | `address` | The IP Asset address (IPA ID) to query the treasury for |

**Return Value:**

| Type      | Description                                            |
| --------- | ------------------------------------------------------ |
| `address` | The treasury wallet address for the given IP Asset. Returns `0x0000000000000000000000000000000000000000` if no treasury is set. |

**Example (ethers.js v6):**

```typescript
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://aeneid.storyrpc.io");

const IPWORLD_ADDRESS = "0x77475A8ca1AfE6a6dc9E82B32210709054937099";
const IPA_ID = "0x..."; // IP Asset address

const abi = [
  "function ipTreasury(address ipaId) external view returns (address)"
];

const ipWorld = new ethers.Contract(IPWORLD_ADDRESS, abi, provider);

const treasuryAddress = await ipWorld.ipTreasury(IPA_ID);
console.log("Treasury address:", treasuryAddress);
```

---

## Combined ABI for Convenience

For projects that need all functions in a single ABI array:

```json
[
  {
    "inputs": [{ "internalType": "address", "name": "token", "type": "address" }],
    "name": "remaining",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "token", "type": "address" }],
    "name": "released",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "token", "type": "address" }],
    "name": "releasable",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "token", "type": "address" }],
    "name": "pendingTreasury",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "ipaId", "type": "address" }],
    "name": "referral",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "ipaId", "type": "address" }],
    "name": "ipTreasury",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
]
```

---

## Quick Reference Table

| #  | Contract      | Function           | Parameter       | Returns   | Use Case                          |
| -- | ------------- | ------------------ | --------------- | --------- | --------------------------------- |
| 1  | IPOwnerVault  | `remaining(token)` | token address   | `uint256` | Locked vesting balance            |
| 2  | IPOwnerVault  | `released(token)`  | token address   | `uint256` | Total claimed vesting tokens      |
| 3  | IPOwnerVault  | `releasable(token)`| token address   | `uint256` | Pending claimable amount          |
| 4  | IPWorld       | `pendingTreasury(token)` | token address | `uint256` | Tokens waiting for treasury flush |
| 5  | IPWorld       | `referral(ipaId)`  | IPA address     | `address` | Referral recipient for an IP      |
| 6  | IPWorld       | `ipTreasury(ipaId)`| IPA address     | `address` | Treasury destination for an IP    |

---

## Notes

- All `uint256` return values are in the token's smallest unit (wei). Use `ethers.formatUnits(value, decimals)` to convert to human-readable format.
- All functions are `view` functions and do not require gas to call.
- The IPOwnerVault address (`0x276679...`) is a proxy contract. The underlying implementation may be upgraded, but the interface remains stable.
- The IPWorld address (`0x77475A...`) is also a proxy contract.
- Replace `"0x..."` placeholders in the examples with actual token or IPA addresses before use.
