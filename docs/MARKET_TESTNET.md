# Local NEAR Testnet rehearsal

Implemented locally, disabled by default. No deployment or blockchain transaction has been performed. This is a separate custodial rehearsal with a fixture item, not production inventory or an atomic escrow smart contract. Mainnet PL4 (`pl4.nearlytrade.near`) is explicitly rejected.

Create a testnet wallet at https://testnet.mynearwallet.com/ and obtain free test NEAR from https://near-faucet.io/. Keep all keys and recovery phrases outside this project. Only public account IDs are needed for configuration.

Four distinct named testnet accounts are required: buyer, seller, vault and fee recipient. Configure the following in the local environment only when the accounts and test token are ready:

```ini
MARKET_TESTNET_SETTLEMENT=1
MARKET_TESTNET_TOKEN=<token-contract.testnet>
MARKET_TESTNET_DECIMALS=<actual-token-decimals>
MARKET_TESTNET_BUYER=<buyer.testnet>
MARKET_TESTNET_SELLER=<seller.testnet>
MARKET_TESTNET_VAULT=<vault.testnet>
MARKET_TESTNET_FEE_RECIPIENT=<fees.testnet>
```

All token recipients must be registered with the chosen FT contract and signing accounts need test NEAR for gas. The buyer needs one test token. Metadata and chain ID are checked through the fixed testnet RPC before reservation; no token contract or decimals are assumed.

Run `npm run start:market`, open `http://127.0.0.1:4183/market-testnet?mockUserId=880001`. With missing configuration the page shows setup instructions and cannot prepare payments.

The explicit wallet button prepares only a testnet `ft_transfer`. Buyer pays 1 token to the vault; the vault operator separately signs 0.97 to seller and 0.03 to fee recipient. This is three transfers, not an atomic chain operation. The fixture item transfers only after all three successful final receipts match sender, receiver, token, amount, memo and token-emitted event. No automatic signing or background payout exists. The current scope does not authorize executing even these test transfers without the user's next instruction.

Paste an existing transaction hash to retry verification without sending again. Reservations expire after 15 minutes; the local `expire` action releases unpaid reservations. Late confirmed funding requires a full refund. A partial payout requires reconciliation and blocks automatic refunds. Keep `.local/market-testnet-settlement.json`; it contains the local replay journal and item state. Configuration changes against this saved state are rejected.

`npm run test:market` includes proof matching, replay protection, restart, failed persistence, late funding, refund and reservation race checks using mocked RPC. Live wallet signing and a live receipt are still pending. Browser visual verification is also pending.
