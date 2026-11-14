import { getSpentTalentPoints, getAvailableTalentPoints, getTalentBaseEnergy, getPlayerLevelEnergyBonus } from '../../src/lib/talents.js';
import { calculateEquipmentEffects } from '../../src/lib/equipmentEffects.js';
export function resetPlayerTalents(player) {
 const spent=getSpentTalentPoints(player);
 if (!spent) throw Object.assign(new Error('Немає витрачених очок талантів'),{code:'TALENT_RESET_EMPTY'});
 const cost=Number(player.talent_reset_count||0)>0?50:0;
 if (Number(player.premium||0)<cost) throw Object.assign(new Error('Потрібно 50 паперу'),{code:'TALENT_RESET_FUNDS'});
 const base=getTalentBaseEnergy(player), points=getAvailableTalentPoints(player)+spent;
 Object.assign(player,{premium:Number(player.premium||0)-cost,talent_tree_version:2,talent_levels:{},advanced_attacks:{},available_talent_points:points,talent_points:points,total_talent_points_spent:0,talent_base_max_energy:base,max_energy:base+getPlayerLevelEnergyBonus(player.level)+calculateEquipmentEffects(player).effects.energyCapacityFlat,unlocked_talent_sectors:[1],talent_combat_state:{},talent_reset_count:Number(player.talent_reset_count||0)+1});
 return {reset:{cost,refundedPoints:spent}};
}
