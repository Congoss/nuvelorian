import EnhancementDemo from '@/components/game/EnhancementDemo';
import {DEFAULT_EQUIPMENT_ITEMS} from '@/components/game/equipmentData';
export default function EquipmentEnhancePreview(){
 const item=DEFAULT_EQUIPMENT_ITEMS.find(i=>i.id==='nuvelor_weapon')||DEFAULT_EQUIPMENT_ITEMS.find(i=>i.slot==='weapon');
 return <main style={{minHeight:'100dvh',background:'radial-gradient(ellipse at top,#303a27,#090f0c 70%)',padding:'20px 12px',color:'#e6edcf'}}><div style={{maxWidth:460,margin:'auto'}}><a href="/" style={{fontSize:12,color:'#a8ba91'}}>← До гри</a><a href="/player-profile-preview" style={{display:'block',marginTop:12,padding:12,border:'1px solid #8b9857',borderRadius:8,color:'#e8db99',fontWeight:700,textAlign:'center'}}>Профіль героя · екіпіровка та заточка →</a><EnhancementDemo item={item}/></div></main>;
}
