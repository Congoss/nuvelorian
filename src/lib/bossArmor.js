export const SHKRABAN_ARMOR = Object.freeze({physicalBlockChance:.15,poisonBlockChance:.20,baseBreachMs:10000,breachPerLevelMs:1000});
export const hasBossArmor = fight => String(fight?.boss_id||fight?.bossId||'')==='boss8';
export const armorBreachSecondsLeft = (state, now) => Math.max(0, Math.ceil((Number(state?.breachUntil || 0) - now) / 1000));
export function armorCopy(language='uk'){
 return language==='en'?{
 title:'Armored bosses',active:'Armor',broken:'Armor breached',close:'Understood',seconds:'s',intro:'Shkraban has reinforced his casing. Prepare a breach before spending a large poison batch.',
 rules:["Each physical attack has a 15% chance to be blocked. Each poison batch has a 20% chance to be blocked, whether it contains ×1 or ×100. If blocked, the entire batch deals no direct damage.","Two Fingers, Enema, and the Corrosive Poison talent give you a chance to breach armor.","While the timer runs (10–20 s), your attacks ignore armor."],
 tip:"Try ×1 poison first. Save ×100 for when the shield cracks."
 }:language==='ru'?{
 title:'Боссы с бронёй',active:'Броня',broken:'Броня пробита',close:'Понятно',seconds:'с',intro:'Шкрябан укрепил свой корпус. Подготовь пробой перед большой пачкой ядов.',
 rules:["У каждого физического удара 15% шанса попасть в блок. У каждой пачки яда — 20%, будь то ×1 или ×100. Если блок сработал, вся пачка не наносит прямого урона.","Два пальца, Клизма и талант «Едкий яд» дают шанс пробить броню.","Пока идёт таймер (10–20 с), твои атаки проходят без блока."],
 tip:"Начни с яда ×1. Используй ×100, когда щит треснет."
 }:{
 title:'Боси з бронею',active:'Броня',broken:'Броню пробито',close:'Зрозуміло',seconds:'с',intro:'Шкрябан зміцнив свій корпус. Підготуй пробій перед великою пачкою отрут.',
 rules:["Кожен фізичний удар має 15% шансу потрапити під блок. Кожна пачка отрути має 20% шансу на блок, і для ×1, і для ×100. Якщо блок спрацює, вся пачка не завдасть прямої шкоди.","«Два пальці», «Клізма» й талант «Їдка отрута» дають шанс пробити броню.","Поки йде таймер (10–20 с), твої атаки проходять без блоку."],
 tip:"Почни з отрути ×1. Використай ×100, коли щит трісне."
 };
}
