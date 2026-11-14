import {equipmentRarity,rarityLabel} from '@/lib/equipmentRarity';
import './equipmentRarity.css';
export default function EquipmentRarityBadge({item,language='uk',className=''}) {
  const rarity=equipmentRarity(item);
  return <span className={`equipment-rarity-badge ${className}`} style={{color:rarity.color,borderColor:rarity.color+'66',backgroundColor:rarity.color+'12'}}><span aria-hidden="true" style={{backgroundColor:rarity.color}}/>{rarityLabel(rarity,language)}</span>;
}
