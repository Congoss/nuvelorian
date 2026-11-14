# PvP NEAR AI verification

Release candidate: Beta 4.14, 2026-11-14. Production verification is pending until the release checks complete.

The production check must use the deployed engine and the configured NEAR AI Cloud provider, obtain a real valid policy, apply it to a future AI move and verify its SHA-256 reveal. It uses an isolated synthetic duel and makes no player inventory, balance or ranked-state changes. A successful test is integration evidence, not a claim that a real player completed that synthetic duel.

Unit tests cover invalid JSON, invalid/negative probabilities, missing keys, network failure, and stripping private/pending fields from the model input. The live arena reports `aiProvider: near-ai` only for a move selected using an actual model policy. First moves and outage fallbacks may use `local`.

Inference runs asynchronously. Provider failure leaves the normal local pilot active. Credentials are supplied through protected server configuration and are never included in source or diagnostic output. No TEE attestation or private inference guarantee is claimed.
