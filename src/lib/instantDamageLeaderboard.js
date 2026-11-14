// Own-screen presentation only. Rewards, final rankings and other players keep
// using server-confirmed damage. Rebased views include only remaining taps.
export function instantDamageRow(view,confirmed){
 if(!view)return confirmed;
 const base=view.confirmedDamageLog || confirmed || {};
 const projected=view.displayDamageLog || view.damageLog || base;
 return {...base,...projected,pending_damage:Math.max(0,Number(projected.damage || 0)-Number(base.damage || 0))};
}
