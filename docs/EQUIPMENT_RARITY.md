# Equipment rarity (local presentation prototype)

One shared scale in `src/lib/equipmentRarity.js`; Ukrainian/Russian/English labels. Inspired by the ascending color language of CS-style loot, without copying its category names or assuming its drop odds.

| Class | Color | Initial assignment |
| --- | --- | --- |
| Standard | Gray | Direct currency-shop purchases and ordinary paid packs, regardless of price/power |
| Uncommon | Light blue | Cardboard, Night Disinfector, Box Bot |
| Rare | Blue | Nuvelor, Set4, Junk Skunk |
| Epic | Purple | Set5, Gum Blob, Epic Battle Pass rewards |
| Legendary | Pink | Anubis, Shkraban, Legendary Battle Pass rewards; legacy legendary raid rewards |
| Mythic | Red | Purrgulp, Toaster; available for deliberately configured future boss gear |
| Artifact | Gold | Reserved for exceptional future drops/pets, not assigned automatically |

Rarity is a curated content class, not a new random drop roll. It does not change combat statistics, forging, purchase/trade restrictions, item prices or drop probability. Enhancement is shown separately (+0…+15). A boss item bought from another player keeps its original rarity; a direct shop purchase remains Standard. Legacy inventory rows derive classification from their catalog ID and provenance without a save migration. Existing event/holder/raid labels are retained when explicitly available; Battle Pass rewards are an explicit exception to the purchased-gear rule: Epic rewards are Epic and Legendary rewards are Legendary, including gear, pets and animations. Legacy IDs and skeleton Legendary rewards retain their track class.

New content: assign `rarityTier` in the trusted item catalog (`standard`, `uncommon`, `rare`, `epic`, `legendary`, `mythic`, `artifact`). For a future boss family, add an explicit entry in `BOSS_EQUIPMENT_RARITY`. New bosses do not automatically receive the highest color, and multiple bosses can share one class. For a purchased item, purchase provenance wins over a claimed high tier. Unknown content falls back to Standard until curated.

Rarity uses `rarityTier` as a presentation field; original legacy `rarity` values remain intact for Battle Pass/source logic. Current UI: market card border and named badge, market filter, detail dialog, inventory card badge/bottom stripe, equipped-slot border, and forge picker badge. Color is accompanied by text so color alone is not required to interpret a class.

Checks: `node --test tests/equipment-rarity.test.mjs`. Local only; no deployment or balance change.


Event collection: `event`, orange `#ffa451`, labels Івентова / Ивентовая / Event. This is a separate origin/collection class rather than a higher rung in the power ladder. It covers event gear, pets and accessories, including event-shop rewards. Legacy Halloween item IDs resolve without migration. Future events can use sourceType event/seasonal_event/event_shop/event_reward or an eventId; explicit rarityTier event is supported too. Battle Pass Epic/Legendary classes stay separate. Trading restrictions and stats remain unchanged.
