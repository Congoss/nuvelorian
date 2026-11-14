import { ADMIN_PET_OPTIONS } from '../../src/lib/adminPetCatalog.js';
import { getBalancedEquipmentItem } from '../../src/lib/equipmentBalance.js';

export function grantPet(player, petId) {
  const pet = ADMIN_PET_OPTIONS.find(item => item.id === petId);
  if (!pet) throw Object.assign(new Error('Unknown pet'), {code:'PET_UNKNOWN',statusCode:400});
  const inventory = Array.isArray(player.inventory_items) ? player.inventory_items : [];
  if (inventory.some(item => item.id === petId) || player.equipped_items?.pet === petId) return {added:0,petId};
  player.inventory_items = [...inventory, {...getBalancedEquipmentItem(petId), id:petId,slot:'pet',type:'equipment',count:1,locked:false,name:pet.en}];
  return {added:1,petId};
}
