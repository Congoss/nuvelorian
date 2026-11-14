// Reset basic boss attacks only; preserve escape penalties and other timers.
export function resetVictoryWeaponCooldowns(player) {
 const {fist,knuckle,...remaining}=player.weapon_cooldowns || {};
 player.weapon_cooldowns=remaining;
}
