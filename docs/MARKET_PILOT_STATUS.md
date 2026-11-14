# Mainnet market status — production Beta 4.14

The live player market uses PL4 (`pl4.nearlytrade.near`) on NEAR mainnet. The public statistics endpoint reported four verified trades on 2026-11-14: two player trades, one merchant sale and one merchant purchase. Current counts can change; see the live page and the linked final receipts.

- Guests can inspect listings and the merchant feed. Trading requires a verified NEAR wallet, ownership checks and the existing pilot budgets.
- Listings and item ownership are persisted by the game server. The server verifies final token-transfer receipts and the seller's five-percent fee before delivery. This is not a deployed trustless escrow contract.
- Tor and Grym have their own NEAR accounts. Protected server-held FullAccess keys sign only after application-policy validation; these are not protocol-restricted FunctionCall keys.
- Merchant rules restrict price choices, restocking, identity groups, spending and repeated buyback. NEAR AI may select a bounded candidate; it cannot invent prices or sign transactions itself.
- Unpaid reservations are per lot and no longer block other purchases. They remain recoverable for late payments. Unknown payment results must be verified before retrying. Automatic expiry/cancellation is not implemented by this direct-transfer flow.
- The repository escrow contract is tested separately and is not the current live settlement mechanism.

For judge instructions and real transaction links, see the root README and HACKATHON_DEMO.md. Local simulation commands remain available and are explicitly labelled as simulated PL4.
