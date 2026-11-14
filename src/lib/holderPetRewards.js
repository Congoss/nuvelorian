export const HOLDER_PET_OPTIONS = [
  { id: 'legion_pet', uk: 'Legion Pet', ru: 'Legion Pet', en: 'Legion Pet' },
  { id: 'hereearlypet', uk: 'HERE Early Pet', ru: 'HERE Early Pet', en: 'HERE Early Pet' },
  { id: 'pet-skunk', uk: 'Скунс', ru: 'Скунс', en: 'Junk Skunk' },
  { id: 'pet-raccoon', uk: 'Єнот', ru: 'Енот', en: 'Trash Panda' },
  { id: 'pet-cthulhu', uk: 'Mr.Newbie', ru: 'Mr.Newbie', en: 'Mr.Newbie' },
  { id: 'pet-bot', uk: 'Робот-коробка', ru: 'Робот-коробка', en: 'Box Bot' },
  { id: 'pet5', uk: 'Жуйка', ru: 'Жвачка', en: 'Gum Blob' },
  { id: 'raidboss2_pet', uk: 'Рейдове опудало', ru: 'Рейдовое пугало', en: 'Raid Scarecrow' },
];

export function holderPetAlreadyGranted(player, petId, players = []) {
  if (!petId) return false;
  if (player.holder_pet_grants?.[petId] || player.equipped_items?.pet === petId || player.inventory_items?.some(item => item.id === petId)) return true;
  const wallet = String(player.near_wallet_id || '').trim().toLowerCase();
  return Boolean(wallet && players.some(other => other.holder_pet_grants?.[petId]?.wallet === wallet));
}
