// Local-only second talent tree. The original tree is deliberately unchanged.
const rows = [
 ['Два пальці','Два пальца','Two Fingers','Замінює Палець: +20% шкоди. Шанс пробити броню +1% за рівень.'],
 ['Клізма','Клизма','Enema','Замінює Олівець: +20% шкоди, кровотеча зберігається. Шанс пробою +2% за рівень.'],
 ['Їдка отрута','Едкий яд','Corrosive poison','Шанс відкрити пробій для наступних атак +0,5% за рівень. Одна спроба на пачку.'],
 ['Тривалий пролом','Долгий пролом','Lasting breach','Пробій триває 10 секунд +1 секунду за рівень. Максимум 20 секунд.'],
 ['Миттєва готовність','Мгновенная готовность','Instant readiness','Шанс обнулити власне відновлення нового удару +1% за рівень.'],
 ['Дуплет','Дуплет','Double strike','Шанс подвійного фізичного удару +1% за рівень. Додається до старого таланту Пальця.'],
 ['Третій зайвий','Третий лишний','Third strike','Шанс перетворити подвійний удар на потрійний +1% за рівень.'],
 ['Брудне тавро','Грязное клеймо','Toxic brand','Максимум токсичних міток +1 за рівень: від 5 до 15.'],
 ['Роз’їдання','Разъедание','Corrosion','Невдалий пробій отрутою підвищує наступний шанс на 0,1% за рівень. До 5 невдач; пробій скидає бонус.'],
 ['У відкриту рану','В открытую рану','Open wound','Шкода отрут під час пробою +2% за рівень.'],
 ['Незмивні мітки','Несмываемые метки','Lasting marks','Шанс зберегти всі мітки після підриву Флягою +2% за рівень.'],
 ['Подвійне тавро','Двойное клеймо','Double brand','Шанс накласти додаткову мітку +2% за рівень. Одна перевірка на пачку.'],
 ['Передозування','Передозировка','Overdose','Бонус підриву Фляги +0,5% за рівень за кожну мітку понад п’яту. Не посилює всю атаку.'],
 ['Рвана рана','Рваная рана','Jagged wound','Шанс подвійної шкоди кожного тику кровотечі +1% за рівень.'],
 ['Не згортається','Не сворачивается','Unclotted','Отрута з шансом +2% за рівень подовжує кровотечу на 3 секунди. До 60 секунд залишку.'],
 ['Кислотна кров','Кислотная кровь','Acid blood','Поки бос кровоточить, шанс криту отрут +1% за рівень. Було 10% → на рівні 10 стане 20%.'],
 ['Без осічки','Без осечки','No misfire','Шанс повернути витрачену заблоковану пачку отрут +3% за рівень.'],
 ['З розгону','С разгона','Momentum','Відкриття пробою з шансом +2% за рівень готує обидва фізичні удари.'],
 ['Кривавий слід','Кровавый след','Bloody trail','Крит отрутою з шансом +2% за рівень оновлює кровотечу, зберігаючи її силу. До 60 секунд.'],
 ['Остання крапля','Последняя капля','Last drop','Пачка без криту підвищує наступний шанс криту на 0,2% за рівень. До 5 накопичень; крит скидає бонус.'],
];
const descriptions = {
 ru:[
 'Заменяет Палец: +20% урона. Шанс пробить броню +1% за уровень.',
 'Заменяет Карандаш: +20% урона, кровотечение сохраняется. Шанс пробоя +2% за уровень.',
 'Шанс открыть пробой для следующих атак +0,5% за уровень. Одна попытка на пачку.',
 'Пробой длится 10 секунд +1 секунду за уровень. Максимум 20 секунд.',
 'Шанс сбросить собственное восстановление нового удара +1% за уровень.',
 'Шанс двойного физического удара +1% за уровень. Складывается со старым талантом Пальца.',
 'Шанс превратить двойной удар в тройной +1% за уровень.',
 'Максимум токсичных меток +1 за уровень: от 5 до 15.',
 'Неудачный пробой ядом повышает следующий шанс на 0,1% за уровень. До 5 неудач; пробой сбрасывает бонус.',
 'Урон ядов во время пробоя +2% за уровень.',
 'Шанс сохранить все метки после взрыва Флягой +2% за уровень.',
 'Шанс наложить дополнительную метку +2% за уровень. Одна проверка на пачку.',
 'Бонус взрыва Фляги +0,5% за уровень за каждую метку сверх пятой. Не усиливает всю атаку.',
 'Шанс двойного урона каждого тика кровотечения +1% за уровень.',
 'Яд с шансом +2% за уровень продлевает кровотечение на 3 секунды. До 60 секунд остатка.',
 'Пока босс кровоточит, шанс крита ядов +1% за уровень. Было 10% → на уровне 10 станет 20%.',
 'Шанс вернуть потраченную заблокированную пачку ядов +3% за уровень.',
 'Открытие пробоя с шансом +2% за уровень подготавливает оба физических удара.',
 'Крит ядом с шансом +2% за уровень обновляет кровотечение, сохраняя силу. До 60 секунд.',
 'Пачка без крита повышает следующий шанс крита на 0,2% за уровень. До 5 накоплений; крит сбрасывает бонус.'
 ],
 en:[
 'Replaces Finger: +20% damage. Armor breach chance +1% per level.',
 'Replaces Pencil: +20% damage, keeps bleeding. Armor breach chance +2% per level.',
 'Poison has +0.5% breach chance per level for subsequent attacks. One attempt per batch.',
 'Breach lasts 10 seconds plus 1 second per level. Maximum 20 seconds.',
 'New physical attacks have +1% chance per level to reset their own cooldown.',
 'Physical double-strike chance +1% per level. Adds to the original Finger talent.',
 'Double strikes have +1% chance per level to become triple strikes.',
 'Maximum toxic marks +1 per level: from 5 to 15.',
 'Failed poison breach adds 0.1% per level to later attempts. Up to 5 stacks; breach clears the bonus.',
 'Poison damage during breach +2% per level.',
 'Chance to keep all marks after a Flask detonation +2% per level.',
 'Chance to apply an extra mark +2% per level. One roll per batch.',
 'Flask detonation bonus +0.5% per level for each mark above five. Does not boost the entire hit.',
 'Each bleeding tick has +1% chance per level to deal double damage.',
 'Poison has +2% chance per level to extend bleeding by 3 seconds. Up to 60 seconds remaining.',
 'While the boss bleeds, poison critical chance +1% per level. 10% becomes 20% at level 10.',
 'Chance to return the consumed blocked poison batch +3% per level.',
 'Opening a breach has +2% chance per level to ready both physical attacks.',
 'A poison critical batch has +2% chance per level to refresh bleeding without changing damage. Up to 60 seconds.',
 'A batch without critical hits adds 0.2% per level to the next critical chance. Up to 5 stacks; a critical clears the bonus.'
 ]
};
export const ADVANCED_TALENTS = rows.map(([uk,ru,en,description],i)=>({id:`a${String(i+1).padStart(2,'0')}`,name:uk,nameI18n:{uk,ua:uk,ru,en},description,descriptionI18n:{uk:description,ua:description,ru:descriptions.ru[i],en:descriptions.en[i]},maxLevel:10,sectorId:7,advanced:true,icon:`/skills/advanced/a${String(i+1).padStart(2,'0')}-cartoon.webp`}));
export const advancedLevel = (levels,id) => Math.max(0,Math.min(10,Math.floor(Number(levels?.[id])||0)));
export const isAdvancedUnlocked = p => Number(p?.talent_tree_version||0)>=2 && Array.from({length:60},(_,i)=>`t${String(i+1).padStart(2,'0')}`).every(id=>Number(p?.talent_levels?.[id]||0)>=10);
export const advancedCost = (level,id) => id==='a10'?10+level:2*(level+1);
export const advancedSpent = (id,level) => Array.from({length:advancedLevel({value:level},'value')},(_,i)=>advancedCost(i,id)).reduce((sum,cost)=>sum+cost,0);
export const ADVANCED_TOTAL_COST = 2235;
export function setAdvancedAttack(player,id,enabled){
 const talentId=id==='fist'?'a01':id==='knuckle'?'a02':null;
 if(!talentId || !isAdvancedUnlocked(player) || advancedLevel(player.talent_levels,talentId)<1)throw new Error('Attack is locked');
 player.advanced_attacks={...player.advanced_attacks,[id]:Boolean(enabled)};
 return player;
}

export function advancedEffectValue(id,level){
 const l=Math.max(0,Math.min(10,Number(level)||0));
 const values={a01:`${l}%`,a02:`${l*2}%`,a03:`${l*.5}%`,a04:`${10+l} s`,a05:`${l}%`,a06:`+${l}%`,a07:`${l}%`,a08:`${5+l}`,a09:`+${Number((l*.1).toFixed(1))}% × 5`,a10:`+${l*2}%`,a11:`${l*2}%`,a12:`${l*2}%`,a13:`+${l*.5}% × 10`,a14:`${l}%`,a15:`${l*2}% · +3 s`,a16:`+${l}%`,a17:`${l*3}%`,a18:`${l*2}%`,a19:`${l*2}%`,a20:`+${Number((l*.2).toFixed(1))}% × 5`};
 return values[id]||'';
}

export const ADVANCED_SECOND_SECTOR = ['a08','a11','a12','a13','a14','a15','a16','a17','a19','a20'];
export const ADVANCED_SECTOR_KEY = 'a18';
