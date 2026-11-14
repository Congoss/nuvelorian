const portraits={hull:'/ship-cheese-boss/portrait-card-v3.webp',engine:'/ship-soldier-boss/portrait-card-v2.webp',hangar:'/ship-kangaroo-boss/portrait-card.webp',portal:'/ship-gum-queen/portrait-card.webp'};
export function getShipBossPortrait(id,fallback=portraits.engine){return portraits[id]||fallback;}
export function isShipBossReleased(id){return Object.hasOwn(portraits,id);}
