# indy-wallet-watch
Inspect your Hyperledger Indy Wallets. Contain library functions and globally executable commands.

# Executable commands
- `wallet-create` - creates new wallet
- `wallets-list` - list existing wallets
- `wallet-keys` - prints found wallet keys (based on dictionary testing) 
- `wallet-inspect` - prints content of a wallet

# Installation
```bash
npm install -g indy-wallet-watch
```

# Examples

# `wallet-create` 
##### Creates new wallet called `WALLET` protected by `KEY` 
```bash
WALLET=mywallet KEY=123 wallet-create 
```


# `wallets-list`
##### Prints list of all wallets found in `~/.indyclient/wallet`
```bash
wallets-list
```
```
[
  'forward_agent_wallet',
  'frr8mHtVbP',
  'k9Sr5S7oDo',
  'kyc-integration-test-wallet-1555083444',
  'kyc-integration-test-wallet-1555084265',
]
```


# `wallet-keys`
##### Tries to open all wallets with keys specified as JSON array in `KEYS` variable. Prints wallets wallets and keys which opens them. 
```bash
KEYS='["123","key","foobar"]' wallet-keys
```
```json
{
  "discovered": {
    "agent-localpool": {
      "name": "agent-localpool",
      "key": "key"
    },
    "forward-agent": {
      "name": "forward-agent",
      "key": "foobaar"
    }
  },
  "unknown": {
    "well-protected-wallet": {
      "name": "well-protected-wallet"
    }
  }
}
```


# `wallet-inspect`
##### Tries to open all wallets using keys `KEYS` and print content 
```
Target wallets:
["alice","dummy_8gNF3yDuDbAbeFeRHXrPps_NEfND5RXiN","dummy_LEriTkBmcKhSxEKbZhaYDf_BTiIRC09hH","forward_agent_wallet","node_vcx_demo_faber_wallet_1555263472"]
Key dictionary:
["123","key"]
-------------------------------- 'alice--------------------------------'
Key: 'key'
DID table:
<TABLE DISPLPAYED HERE>
└────────────────────────────────┴────────────────────────────────────────────────┴────────────────┴──────────────────────────────────────────────────┘
----------------------------------------Couldn't open wallets--------------------------------------------------
[]
---------------------------------------------------------------------------------------------------------------

```

