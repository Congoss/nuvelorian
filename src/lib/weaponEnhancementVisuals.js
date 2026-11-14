export const ENHANCEMENT_VISUALS=[
 {level:4,color:'#c4e8ff',halo:'#82b9df',name:'Сріблясто-блакитний контур',density:0,reach:0,haloOpacity:.15},
 {level:6,color:'#4b69ff',halo:'#4b69ff',name:'Блакитне світіння та іскри',density:5,reach:6,haloOpacity:.32},
 {level:8,color:'#8847ff',halo:'#8847ff',name:'Синьо-фіолетова хвиля',density:7,reach:8,haloOpacity:.44},
 {level:10,color:'#d32ce6',halo:'#d32ce6',name:'Фіолетово-рожева плазма',density:12,reach:12,haloOpacity:.54},
 {level:12,color:'#eb4b4b',halo:'#eb4b4b',name:'Червоне полум’я та слабкі розряди',density:15,reach:15,haloOpacity:.7},
 {level:15,color:'#e4ae39',halo:'#e4ae39',name:'Золота аура, полум’я та живі розряди',density:18,reach:18,haloOpacity:.86}
];
export function weaponEnhancementVisual(level){
 const safe=Math.max(0,Math.min(15,Math.floor(Number(level)||0)));
 const stage=ENHANCEMENT_VISUALS.filter(s=>s.level<=safe).at(-1);
 return stage?{...stage,intensity:1+(safe-stage.level)*.055}:null;
}
export function weaponCanvasTransform(width,height,viewBox,padding=0){
 const [vx,vy,vw,vh]=viewBox.split(/\s+/).map(Number);
 const scale=Math.min((width-2*padding)/vw,(height-2*padding)/vh);
 return {scale,x:(width-vw*scale)/2-vx*scale,y:height-padding-vh*scale-vy*scale};
}
