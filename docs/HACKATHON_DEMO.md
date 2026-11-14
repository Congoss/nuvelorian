# Planet4 — two-minute judge demo

Production Beta 4.14. Record in English or use English subtitles. Start at https://p4.nuvelor.gg/web?judge=1 . Hide admin pages, account email, wallet secrets and private configuration.

| Time | Show | English voice-over |
| --- | --- | --- |
| 0:00–0:12 | Landing → Judge demo → game, without a wallet or tutorial | Planet4 turns boss loot into a player economy on NEAR. Judges can enter immediately without a wallet. |
| 0:12–0:28 | Fight a boss → loot/equipment → Market | Players earn equipment through the game loop and trade spare items for PL4, a NEAR token. Item ownership is managed by the game server. |
| 0:28–0:50 | Existing completed player trade and its matching NearBlocks receipts | This is a confirmed mainnet trade. The server checks the final token transfer and the five-percent seller fee before delivering the item. |
| 0:50–1:12 | AI merchants Tor and Grym, their listings, account links and completed trade feed | Tor fills missing stock; Grym restocks only what he has sold. Each merchant has its own NEAR account. Spending limits and permanent no-buyback rules bound the model's choices. |
| 1:12–1:32 | Orbital Duel → ten-second search → AI → NEAR AI provider label after inference is used | One ranked queue matches players, then falls back to an NPC. NEAR AI coaches future moves from completed rounds. Moves are committed before player input and the client verifies each reveal. |
| 1:32–1:47 | Rank resource reward receipt or finished fight; return to judge tour | Combat, inventory and rank rewards remain server-authoritative. If the model is unavailable, the local pilot keeps the game responsive. |
| 1:47–2:00 | Public GitHub README, two tags/diff and passing verification workflow | The new NEAR work is separated from the pre-hackathon baseline. The repository includes reproducible tests, attack scenarios and an isolated economy simulation. |

## Record reliably

- Use the real guest entry for the first shot. Keep a separate already configured test-player browser for equipment, completed trades and PvP, and label that transition. A guest does not get real trading permissions automatically.
- Use a completed trade for the explorer shot. Do not depend on a fresh wallet signature, merchant purchase or indexer update while recording. Never claim the isolated simulation is a mainnet transaction.
- The first NPC move can use the local pilot. Pause briefly for inference, submit a round, and show NEAR AI only when the label actually appears on a subsequent move. If the daily quota is exhausted, use the production verification record as evidence and label the live fight as local fallback.
- Unpaid reservations keep their own item safe and recoverable; another lot can still be bought. Do not repeatedly send a transaction whose result is unknown.
- The escrow contract in contracts/market-escrow is tested but is not the live pilot settlement mechanism. Items are not on-chain NFTs, and protected server FullAccess keys are not protocol-restricted FunctionCall keys.

## Links for the recording

- Judge demo: https://p4.nuvelor.gg/web?judge=1
- Repository: https://github.com/Congoss/nuvelorian
- Feature diff: https://github.com/Congoss/nuvelorian/compare/pre-hackathon...hackathon-submission
- Player trade: https://nearblocks.io/txns/36WZ44AiH7884JTjsbH68H18HzZTKy2KvdranUvPETjF
- Merchant purchase: https://nearblocks.io/txns/BHe5FxYs7ivUgrNRavTFDhyAnb8p3XSYE6aoi3y5R19V
- Merchant sale: https://nearblocks.io/txns/GYm6VhVJABHurqrgKAqoZTt93qwrLPuGpfKKKPjoSW5

The owner records and publishes the public X post with @NEARProtocol and #NEARHackathon, then supplies that post's URL for the final application. This script has not been posted or submitted.
