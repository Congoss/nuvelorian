import { createContext } from 'react';
export const WeaponEnhancementContext=createContext({level:0,paused:false,visible:true});
export function isWeaponArtLayer(alt=''){
 return /weapon/i.test(alt)&&!/selected gloves|gloves over|laser|glow|impulse|pupil|armor|jacket|helmet|boots|legs/i.test(alt);
}
