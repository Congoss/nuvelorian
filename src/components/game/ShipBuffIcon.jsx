import { SHIP_BUFFS } from '@/lib/clanShipBuffs';
export default function ShipBuffIcon({ moduleId, className = '' }) {
 if (!SHIP_BUFFS.some(buff => buff.moduleId === moduleId)) return null;
 return <img aria-hidden="true" alt="" className={className} src={'/clan-ship-buffs/user-v1/' + moduleId + '.webp'}/>;
}
