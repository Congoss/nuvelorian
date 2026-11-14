# Market economy and starting prices (2026-11-11)

Full analysis: Claude doc "Planet4 — экономика маркета и стартовые цены". Code: `src/lib/marketPricing.js`.

- Prices are USD-anchored and converted to PL4 at the live quote (`server/services/pl4-quote.js`; fallback $0.0000077).
- Gear piece USD = set power (`EQUIPMENT_SET_BALANCE.hit`) × $0.025 × boss tier (1.0 / set5 1.2 / anubis 1.4 / shkraban 1.6) × slot weight (legs 1.3, head 1.15, weapon/armor 1, hands/boots 0.85). Cardboard: $0.10 flat (guaranteed drop).
- Pets: pet-bot $1.50, pet-skunk $0.50, pet5 $4, pet-purrgulp $14, pet-toaster $24.
- Enhancement premium: cheapest expected gum route per level (normal $0.10, improved $0.25, premium $0.99), × 0.8 resale. +5 $0.65, +10 $2.76, +15 $6.72.
- Drop rates per eligible kill: gear 3% (33 kills avg), pet 0.65% (154), rank bonus up to +0.73% gear. Gum to +15: 1,529 normal / 104 improved / 15 premium expected.
- Tradable: boss set gear and boss pets only. Bound: starter, NFT holder pets (`sourceType: nft_holder`, `holder_pet_grants`, `nonTransferable`), Battle Pass, event, pack, gift items.
- Price cap: 1B PL4 (total supply).
