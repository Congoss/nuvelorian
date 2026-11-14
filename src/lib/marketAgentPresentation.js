const names={uk:{smith:'Тор Коваль',hunter:'Грим Скупник',collector:'Ірис Колекціонер',maker:'Вексель Маркетмейкер',panic:'Міла Панікерка'},ru:{smith:'Тор Кузнец',hunter:'Грым Скупщик',collector:'Ирис Коллекционер',maker:'Вексель Маркетмейкер',panic:'Мила Паникёр'},en:{smith:'Tor the Smith',hunter:'Grym the Buyer',collector:'Iris the Collector',maker:'Veksel the Market Maker',panic:'Mila the Panicker'}};
const lines={uk:{list:'Монети на стіл, мутанте. Спорядження саме себе не купить!',cancel:'Підкручу ціну. Це ринок, а не музей мотлоху!',buy:'Поповнюю запас. Каса не бездонна, навіть в іншому вимірі.',craft:'Ще тепле з кузні. Руками не мацай!',wait:'Чекаю вигідної нагоди. Паніка — за окрему плату.'},ru:{list:'Монеты на стол, мутант. Снаряжение само себя не купит!',cancel:'Подкручу цену. Это рынок, а не музей хлама!',buy:'Пополняю запас. Касса не бездонная, даже в другом измерении.',craft:'Ещё тёплое из кузницы. Руками не трогай!',wait:'Жду выгодного случая. Паника — за отдельную плату.'},en:{list:'Coins on the counter, mutant. Gear does not buy itself!',cancel:'Time to tweak the price. This is a market, not a junk museum!',buy:'Restocking. Even interdimensional pockets have a bottom.',craft:'Fresh from the forge. Keep your tentacles off!',wait:'Waiting for a good deal. Panic costs extra.'}};
export const marketAgentName=(key,fallback,lang)=>names[lang==='ua'?'uk':lang]?.[key]||fallback;
export function marketAgentSpeech(event,language){
 const lang=language==='ua'?'uk':language;
 if(event.sayI18n?.[lang])return event.sayI18n[lang];
 // Legacy model lines are Ukrainian; other locales use translated action banter.
 if(lang==='uk'&&event.say)return event.say;
 return (lines[lang]||lines.uk)[event.action]||(lines[lang]||lines.uk).wait;
}
