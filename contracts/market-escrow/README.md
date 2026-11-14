# Planet4 market escrow contract

A small NEAR contract that holds a buyer's PL4 (NEP-141) while a game item changes hands.

**Status: written and tested locally. Not deployed to testnet or mainnet, and not yet used by the live game.**
The live mainnet pilot still uses the game server's escrow described in the root README.

## What it does

1. The buyer pays with `ft_transfer_call` on the token, receiver = this contract,
   `msg = {"trade_id": "...", "seller": "seller.near"}`. The contract keeps the tokens and records the trade.
2. `release(trade_id)` — only the operator (the game server account) can call it, after the item was delivered.
   The contract sends the seller `amount − fee` and the fee recipient `fee` (5%, rounded down).
3. `refund(trade_id)` — the operator at any time, or **the buyer alone after the timeout**. The full amount goes
   back to the buyer. The game server cannot keep a buyer's tokens locked.

Rules fixed at creation and not changeable afterwards: token, fee recipient, fee rate (max 10%), per-trade cap,
refund timeout. The owner can only pause new trades and replace the operator. There is no owner withdrawal and no
upgrade method. Pausing never blocks `release` or `refund` of trades already inside.

A failed transfer (for example the seller has no storage on the token) leaves that leg unpaid and retryable;
a leg that was paid is never paid again. Once any payout has started, a refund is impossible.

What the contract does **not** do: it does not own or move game items. The operator still decides that an item was
delivered. Items remain game-server records.

## Layout

| Path | What |
| --- | --- |
| `core/` | All rules as a pure Rust state machine, no chain dependency. 12 unit tests, including a random walk that checks token conservation |
| `contract/` | The NEAR contract (near-sdk 5.30): checks the caller, stores state, sends `ft_transfer` |
| `res/p4_market_escrow.wasm` | The built contract |
| `tests/` | Runs the built wasm in an in-memory NEAR mock with a mock NEP-141 token. 8 tests, Node only |
| `lower-wasm.mjs` | Post-build step: rewrites newer wasm instructions into baseline WebAssembly |

## Test

```sh
npm run test:escrow                      # from the repository root; needs only Node 20+
cargo test -p p4-escrow-core             # in this folder; needs Rust
```

The mock runtime in `tests/near-mock.mjs` is a test double written for this project. It runs receipts immediately
and does not meter gas. It is not a substitute for a testnet run.

## Build

```sh
rustup target add wasm32-unknown-unknown
RUSTFLAGS="--cfg near" cargo build -p p4-market-escrow --target wasm32-unknown-unknown --release
npm i --no-save binaryen
node lower-wasm.mjs target/wasm32-unknown-unknown/release/p4_market_escrow.wasm res/p4_market_escrow.wasm
```

`--cfg near` is required by near-sdk 5.30: without it panic messages are not reported to the chain.
`cargo near build` is the standard tool and also embeds the ABI; this build does not use it, so the binary has
no embedded ABI and is not a verified reproducible build.

## Deploy (not done yet)

With [near-cli-rs](https://github.com/near/near-cli-rs), on testnet first:

```sh
near contract deploy <escrow-account> use-file res/p4_market_escrow.wasm \
  with-init-call new json-args '{"owner":"<owner>","operator":"<game-server-account>","token":"<token>","fee_recipient":"<treasury>","fee_bps":500,"max_amount":"<cap in smallest units>","refund_after_sec":86400}' \
  prepaid-gas '100 Tgas' attached-deposit '0 NEAR' network-config testnet sign-with-keychain send
```

Before the first trade, the escrow account, the seller and the fee recipient each need `storage_deposit` on the
token. Call `release` with at least 80 Tgas and `refund` with at least 40 Tgas.

## Known limits

- No audit. Keep `max_amount` small.
- Trade records are never deleted, so contract storage grows with the number of trades.
- If the seller never registers storage on the token, the seller leg stays unpaid until they do.
