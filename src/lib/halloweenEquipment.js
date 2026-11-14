export const HALLOWEEN_SET_ITEMS = [
 {slot:'weapon',names:{ua:"Гак капітана Порожнечі",ru:"Крюк капитана Пустоты",en:"Void Captain's Hook"},bonuses:[{type:'pencil_damage_flat',value:25}]},
 {slot:'head',names:{ua:"Череп проклятого капітана",ru:"Череп проклятого капитана",en:"Cursed Captain's Skull"},bonuses:[{type:'boss_damage_flat',value:18}]},
 {slot:'armor',names:{ua:"Кітель капітана Мертвої Зорі",ru:"Китель капитана Мёртвой Звезды",en:"Deadstar Captain's Coat"},bonuses:[{type:'finger_damage_flat',value:25}]},
 {slot:'hands',names:{ua:"Рукавиці могильної хватки",ru:"Рукавицы могильной хватки",en:"Gravegrip Gauntlets"},bonuses:[{type:'poison_damage_flat',value:40}]},
 {slot:'legs',names:{ua:"Штани грабіжника",ru:"Штаны грабителя",en:"Plunderer's Trousers"},bonuses:[{type:'finger_cooldown_sec',value:-20}]},
 {slot:'boots',names:{ua:"Чоботи зоряної катастрофи",ru:"Сапоги звёздной катастрофы",en:"Starwreck Boots"},bonuses:[{type:'pencil_cooldown_sec',value:-35}]},
].map(item=>({...item,id:'halloween_2026_'+item.slot,name:item.names.en,setId:'halloween_2026',setNameI18n:{ua:'Опівнічний жах',ru:'Полуночный ужас',en:'Midnight Terror'},rarity:'epic',sourceType:'halloween',purchasable:false,placeholder:true,attack:0,hp:0}));
export const HALLOWEEN_EQUIPMENT = [
 ...HALLOWEEN_SET_ITEMS,
 { id:'halloween_2026_talisman', hiddenFromCatalog:true, slot:'accessory', name:'Pumpkin Talisman', names:{ua:'Гарбузовий талісман',ru:'Тыквенный талисман',en:'Pumpkin Talisman'}, rarity:'epic', sourceType:'halloween', purchasable:false, attack:0, hp:0, bonuses:[{type:'boss_damage_pct',value:.05},{type:'energy_capacity_flat',value:25}] },
 { id:'halloween_2026_pet', slot:'pet', name:'Pumpkin Frankie', names:{ua:'Гарбузик Френкі',ru:'Тыквик Фрэнки',en:'Pumpkin Frankie'}, rarity:'epic', sourceType:'halloween', purchasable:false, attack:0, hp:0, bonuses:[{type:'small_poison_flat',value:30},{type:'medium_poison_flat',value:45},{type:'large_poison_flat',value:60},{type:'crit_chance_pct',value:.03}] },
];

