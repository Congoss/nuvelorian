import {marketAgentName,marketAgentSpeech} from '@/lib/marketAgentPresentation';
import {useEffect,useMemo,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Bot,LockKeyhole,Search,SlidersHorizontal,Store,X} from 'lucide-react';
import {gameApi} from '@/services/gameApi';
import {isWebPlatform} from '@/lib/platform/config';
import {DEFAULT_EQUIPMENT_ITEMS,localizeEquipmentItemName,describeEquipmentBonuses} from './equipmentData';
import MarkerFrame from './MarkerFrame';
import shopBanner from '@/assets/ui/market-banner-compact.png';
import marketCardTexture from '@/assets/ui/market-card-portal.png';
import pl4TokenLogo from '@/assets/ui/pl4-token.webp';
import EquipmentRarityBadge from './EquipmentRarityBadge';
import {equipmentRarity,rarityLabel,EQUIPMENT_RARITIES} from '@/lib/equipmentRarity';
import GameTextureButton from './GameTextureButton';
import {warmFirstFrameImages} from '@/lib/sceneAssets';
import scrapIcon from '@/assets/optimized/cosmohand.webp';
import './market.css';
import {isWalletRejection} from '@/lib/platform/walletErrors';
const copy={uk:{title:'Маркет',npc:'Скупник NPC',buy:'Купити',sell:'Продати',mine:'Мої лоти',search:'Знайти річ…',all:'Усі слоти',rarity:'Уся рідкість',empty:'Немає доступних речей',test:'Тестова оплата · без реальних транзакцій',scrap:'Металобрухт',balance:'Тестові P4',price:'Ціна',cancel:'Зняти лот',list:'Виставити',confirm:'Підтвердити',back:'Назад',fee:'Комісія продавця 5%. Отримувач mainnet: nuvelorian.near; комісія обліковується лише в тесті.',note:'Виставлені речі заблоковані до покупки або зняття лота. Одягнені та прив’язані речі недоступні.',quote:'Ціна за комплектом; +5% за кожен рівень заточки.',net:'Продавець отримає',done:'Готово',retry:'Повторити',sort:'Спочатку дешевші',expensive:'Спочатку дорожчі',error:'Операцію не виконано. Оновіть стан або повторіть запит.'},ru:{title:'Маркет',npc:'Скупщик NPC',buy:'Купить',sell:'Продать',mine:'Мои лоты',search:'Найти вещь…',all:'Все слоты',rarity:'Любая редкость',empty:'Нет доступных вещей',test:'Тестовая оплата · без реальных транзакций',scrap:'Металлолом',balance:'Тестовые P4',price:'Цена',cancel:'Снять лот',list:'Выставить',confirm:'Подтвердить',back:'Назад',fee:'Комиссия продавца 5%. Получатель mainnet: nuvelorian.near; комиссия учитывается только в тесте.',note:'Выставленные вещи заблокированы до покупки или снятия. Надетые и привязанные вещи недоступны.',quote:'Цена по комплекту; +5% за каждый уровень заточки.',net:'Продавец получит',done:'Готово',retry:'Повторить',sort:'Сначала дешевле',expensive:'Сначала дороже',error:'Операция не выполнена. Обновите состояние или повторите запрос.'},en:{title:'Market',npc:'NPC buyer',buy:'Buy',sell:'Sell',mine:'My listings',search:'Find item…',all:'All slots',rarity:'All rarities',empty:'No available items',test:'Test payment · no real transactions',scrap:'Scrap',balance:'Test P4',price:'Price',cancel:'Cancel listing',list:'List item',confirm:'Confirm',back:'Back',fee:'Seller fee: 5%. Mainnet recipient: nuvelorian.near; fees are recorded in the test ledger only.',note:'Listed items are locked until purchased or cancelled. Equipped and bound items are unavailable.',quote:'Set-based price; +5% per enhancement level.',net:'Seller receives',done:'Done',retry:'Retry',sort:'Price: low first',expensive:'Price: high first',error:'Operation failed. Refresh state or retry the request.'}};
// Large PL4 amounts: group thousands; hide cents above 1,000 PL4.
const money=n=>{const v=n/100;return v>=1000?Math.round(v).toLocaleString('en-US'):v.toFixed(2);};
const cached=new Map();
const slots={uk:{weapon:'Зброя',head:'Голова',hands:'Руки',armor:'Броня',legs:'Штани',boots:'Взуття',pet:'Улюбленці',accessory:'Аксесуари'},ru:{weapon:'Оружие',head:'Голова',hands:'Руки',armor:'Броня',legs:'Штаны',boots:'Обувь',pet:'Питомцы',accessory:'Аксессуары'},en:{weapon:'Weapon',head:'Head',hands:'Hands',armor:'Armor',legs:'Legs',boots:'Boots',pet:'Pets',accessory:'Accessories'}};
const labels={uk:{market:'Ринок P4',filters:'Фільтри',fee:'Комісія',locked:'На продажу',available:'Доступно',items:'Предмети',npcHint:'Здай зайве спорядження за металобрухт.',marketHint:'Спорядження інших гравців за P4.',example:'Приклад механіки',details:'Деталі тестового режиму',loading:'Завантаження…',working:'Обробка…',received:'Ви отримаєте',seller:'Продавець'},ru:{market:'Рынок P4',filters:'Фильтры',fee:'Комиссия',locked:'На продаже',available:'Доступно',items:'Предметы',npcHint:'Сдай лишнее снаряжение за металлолом.',marketHint:'Снаряжение других игроков за P4.',example:'Пример механики',details:'Детали тестового режима',loading:'Загрузка…',working:'Обработка…',received:'Вы получите',seller:'Продавец'},en:{market:'P4 market',filters:'Filters',fee:'Fee',locked:'Listed',available:'Available',items:'Items',npcHint:'Trade spare equipment for scrap.',marketHint:'Equipment from other players for P4.',example:'Mechanics example',details:'Test mode details',loading:'Loading…',working:'Processing…',received:'You receive',seller:'Seller'}};
const agentText={
 uk:{tab:'ШІ-торговці',feed:'Стрічка ринку',fair:'Оцінка ринку',ofFair:'від оцінки',ai:'ШІ',balance:'Баланс',listings:'Лоти',holdings:'Речі',burned:'Спалено на кування',quiet:'Ринок поки тихий…',llm:'ШІ підключено; ліміти контролює сервер',rules:'Рішення за правилами',useFair:'Ставка за оцінкою',roles:{smith:'Кує речі, коли їх бракує',hunter:'Поповнює продане за частину виручки',collector:'Збирає зброю й заточене',maker:'Тримає ціни біля оцінки',panic:'Панікує, коли ціни падають'},act:{buy:'купив',list:'виставив',cancel:'зняв і знизить ціну',craft:'викував',wait:'чекає',pause:'зупинив торгівлю'},treasury:'Каса торговців',pnl:'Зміна каси',cash:'Доступні кошти',stock:'Речі за собівартістю',today:'Ліміт на сьогодні',paused:'Торгівлю ШІ зупинено',from:'у'},
 ru:{tab:'ИИ-торговцы',feed:'Лента рынка',fair:'Оценка рынка',ofFair:'от оценки',ai:'ИИ',balance:'Баланс',listings:'Лоты',holdings:'Вещи',burned:'Сожжено на ковку',quiet:'Рынок пока тихий…',llm:'ИИ подключён; лимиты контролирует сервер',rules:'Решения по правилам',useFair:'Цена по оценке',roles:{smith:'Куёт вещи, когда их не хватает',hunter:'Пополняет проданное на часть выручки',collector:'Собирает оружие и заточенное',maker:'Держит цены около оценки',panic:'Паникует, когда цены падают'},act:{buy:'купил',list:'выставил',cancel:'снял и снизит цену',craft:'выковал',wait:'ждёт',pause:'остановил торговлю'},treasury:'Касса торговцев',pnl:'Изменение кассы',cash:'Доступные средства',stock:'Вещи по себестоимости',today:'Лимит на сегодня',paused:'Торговля ИИ остановлена',from:'у'},
 en:{tab:'AI traders',feed:'Market feed',fair:'Market estimate',ofFair:'of estimate',ai:'AI',balance:'Balance',listings:'Listings',holdings:'Items',burned:'Burned on forging',quiet:'The market is quiet…',llm:'AI connected; server enforces limits',rules:'Rule-based decisions',useFair:'Use estimate',roles:{smith:'Forges gear when supply runs out',hunter:'Restocks sold items using sale proceeds',collector:'Collects weapons and enhanced gear',maker:'Keeps prices near the estimate',panic:'Panics when prices fall'},act:{buy:'bought',list:'listed',cancel:'pulled to mark down',craft:'forged',wait:'is waiting',pause:'paused trading'},treasury:'Traders\' treasury',pnl:'Treasury change',cash:'Available cash',stock:'Stock at cost',today:'Left today',paused:'AI trading paused',from:'from'}};
const simulationCopy={uk:{run:'Симулювати 7 днів',title:'Симуляція тижня',day:'День',cash:'Гроші',stock:'Речі',note:'Окрема тестова економіка: 6 гравців, 2 торговці. Збереження гри не змінюється. Це сценарій, а не прогноз прибутку.'},ru:{run:'Симулировать 7 дней',title:'Симуляция недели',day:'День',cash:'Деньги',stock:'Вещи',note:'Отдельная тестовая экономика: 6 игроков, 2 торговца. Сохранение игры не меняется. Это сценарий, а не прогноз прибыли.'},en:{run:'Simulate 7 days',title:'Week simulation',day:'Day',cash:'Cash',stock:'Stock',note:'Separate test economy: 6 players, 2 traders. Your game save is unchanged. A scenario, not a profit forecast.'}};
const catalogById=new Map(DEFAULT_EQUIPMENT_ITEMS.map(item=>[item.id,item]));
function equipment(item){return {...catalogById.get(item.id),...item,icon:catalogById.get(item.id)?.icon || item.icon};}
function MarketButton({children,...props}){return <GameTextureButton {...props}><span className="market-button-label">{children}</span></GameTextureButton>;}
const estimateCopy={uk:{label:'Орієнтовна ціна',hint:'Оцінка для порівняння, не гарантована ціна викупу.'},ru:{label:'Ориентировочная цена',hint:'Оценка для сравнения, не гарантированная цена выкупа.'},en:{label:'Estimated price',hint:'A reference estimate, not a guaranteed buyback price.'}};
const rowEstimate=row=>{const value=row?.fair ?? row?.item?.fair;return Number.isFinite(value)&&value>0?value:null;};
const paymentErrors={
 VERIFIED_WALLET_REQUIRED:['Прив’яжи та підтвердь NEAR-гаманець у профілі.','Привяжи и подтверди NEAR-кошелёк в профиле.','Link and verify your NEAR wallet in your profile.'],
 WRONG_PAYMENT_WALLET:['Обери гаманець, прив’язаний до цього профілю.','Выбери кошелёк, привязанный к этому профилю.','Select the wallet linked to this profile.'],
 MAINNET_WALLET_REQUIRED:['Потрібен гаманець у мережі NEAR Mainnet.','Нужен кошелёк в сети NEAR Mainnet.','Use a wallet on NEAR Mainnet.'],
 PL4_STORAGE_REGISTRATION_REQUIRED:['Один з отримувачів ще не зареєстрований у PL4.','Один из получателей ещё не зарегистрирован в PL4.','A payment recipient is not registered for PL4 yet.'],
 INSUFFICIENT_PL4:['На прив’язаному гаманці недостатньо PL4.','На привязанном кошельке недостаточно PL4.','Insufficient PL4 in your linked wallet.'],
 PILOT_BUDGET_EXHAUSTED:['Загальний ліміт пілоту вичерпано.','Общий лимит пилота исчерпан.','The shared pilot spending limit is exhausted.'],
 FINISH_PENDING_ORDER:['Спочатку заверши попередню оплату нижче на сторінці.','Сначала заверши предыдущую оплату ниже на странице.','Finish your pending payment below first.'],
 LOT_UNAVAILABLE:['Цей лот уже недоступний.','Этот лот уже недоступен.','This listing is no longer available.'],
 ITEM_ALREADY_OWNED:['Така річ уже є в інвентарі.','Такая вещь уже есть в инвентаре.','You already have this item in your inventory.'],
};
function paymentError(error,lang,action='buy'){
 const i=lang==='ru'?1:lang==='en'?2:0;
 if(isWalletRejection(error))return ['Підписання скасовано. Можна повторити.','Подписание отменено. Можно повторить.','Signing cancelled. You can try again.'][i];
 if(error.code==='WEB_ONLY')return ['Ринок PL4 доступний у вебверсії. Відкрий гру в браузері через профіль.','Рынок PL4 доступен в вебверсии. Открой игру в браузере через профиль.','The PL4 market is available on the web. Open the browser game from your profile.'][i];
 if(!['buy','confirm'].includes(action))return paymentErrors[error.code||error.message]?.[i] || ['Не вдалося виконати дію. Онови маркет і спробуй ще раз.','Не удалось выполнить действие. Обнови маркет и попробуй ещё раз.','Could not complete the action. Refresh the market and try again.'][i];
 return paymentErrors[error.code||error.message]?.[i] || ['Операцію не завершено. Якщо оплату вже відправлено, перевір її хеш без повторної оплати.','Операция не завершена. Если платёж уже отправлен, проверь его хеш без повторной оплаты.','Operation not completed. If payment was sent, verify its hash without paying again.'][i];
}
function Currency({value,scrap=false,usd,hideTicker=false}){return <span className="market-currency">{scrap?<img src={scrapIcon} alt=""/>:<img className="market-token-logo" src={pl4TokenLogo} alt=""/>}<span>{value}</span>{!scrap && !hideTicker && <small>$PL4</small>}{!scrap && usd && <small className="market-usd">{usd}</small>}</span>;}

export default function MarketPanel({profile,onSyncProfile}){
 const lang=profile?.language==='ua'?'uk':profile?.language || 'uk',t=copy[lang] || copy.uk,l=labels[lang] || labels.uk,slotLabels=slots[lang] || slots.uk;
 const [data,setData]=useState(()=>cached.get(profile.id)),[tab,setTab]=useState('npc'),[query,setQuery]=useState(''),[slot,setSlot]=useState(''),[rarity,setRarity]=useState(''),[sort,setSort]=useState('asc'),[selected,setSelected]=useState(null),[price,setPrice]=useState('10'),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[retry,setRetry]=useState(null),[filtersOpen,setFiltersOpen]=useState(false);
 const [p4Quote,setP4Quote]=useState(null),[quoteFailed,setQuoteFailed]=useState(false);
 useEffect(()=>{
  if(!isWebPlatform)return;
  let disposed=false,busy=false;
  const controller=new AbortController();
  const refresh=async()=>{
   if(busy || document.visibilityState==='hidden')return;
   busy=true;
   try{
    const response=await fetch('/api/public/pl4-quote',{cache:'no-store',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(8000)])});
    const payload=await response.json(),quote=payload.data || payload;
    if(!response.ok || quote.token!=='pl4.nearlytrade.near' || !Number.isFinite(quote.price_usd) || quote.price_usd<=0 || quote.stale)throw Error('QUOTE_UNAVAILABLE');
    if(!disposed){setP4Quote(quote.price_usd);setQuoteFailed(false);}
   }catch{if(!disposed){setP4Quote(null);setQuoteFailed(true);}}
   finally{busy=false;}
  };
  void refresh();
  const timer=setInterval(refresh,60000);
  document.addEventListener('visibilitychange',refresh);
  return()=>{disposed=true;controller.abort();clearInterval(timer);document.removeEventListener('visibilitychange',refresh);};
 },[]);
 const usd=cents=>p4Quote===null?null:`(≈ ${new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(cents/100*p4Quote)})`;
 const quoteStatus=quoteFailed?(lang==='en'?'Price unavailable':lang==='ru'?'Курс недоступен':'Курс недоступний'):'…';
 const [simulation,setSimulation]=useState(null),[simulating,setSimulating]=useState(false);
 const sim=simulationCopy[lang] || simulationCopy.uk;
 async function simulateWeek(){if(simulating)return;setSimulating(true);try{setSimulation(await gameApi.marketSimulation());}catch{setMessage(t.error);}finally{setSimulating(false);}}
 const inFlight=useRef(false),dialogRef=useRef(null);
 const commit=next=>{cached.set(profile.id,next);setData(next);onSyncProfile(next.player);};
 const a=agentText[lang] || agentText.uk;
 const selectedRef=useRef(null);selectedRef.current=selected;
 // AI traders act every few seconds; refresh the web snapshot while the panel is idle.
 useEffect(()=>{
  if(!isWebPlatform)return;
  let last='',reading=false;
  const timer=setInterval(()=>{
   if(reading || inFlight.current || selectedRef.current || document.visibilityState==='hidden')return;
   reading=true;
   gameApi.localMarket().then(next=>{const key=JSON.stringify([next.lots,next.balance,next.items,next.feed?.[0]?.id]);if(key===last)return;last=key;cached.set(profile.id,next);setData(next);if(JSON.stringify(next.player)!==JSON.stringify(cached.get('player:'+profile.id))){cached.set('player:'+profile.id,next.player);onSyncProfile(next.player);}}).catch(()=>{}).finally(()=>{reading=false;});
  },5000);
  return()=>clearInterval(timer);
 },[profile.id,onSyncProfile]);
 useEffect(()=>{let live=true;gameApi.localMarket().then(next=>{if(live){cached.set(profile.id,next);setData(next);onSyncProfile(next.player);}}).catch(()=>{if(live)setMessage(t.error);});return()=>{live=false;};},[profile.id,onSyncProfile,t.error]);
 useEffect(()=>{
  if(!selected)return;
  const previous=document.activeElement;
  dialogRef.current?.querySelector('input,button')?.focus();
  const keydown=event=>{
   if(event.key==='Escape'&&!inFlight.current){setSelected(null);return;}
   if(event.key!=='Tab')return;
   const focusable=[...dialogRef.current.querySelectorAll('button:not(:disabled),input:not(:disabled)')],first=focusable[0],last=focusable.at(-1);
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  };
  document.addEventListener('keydown',keydown);
  return()=>{document.removeEventListener('keydown',keydown);previous?.focus();};
 },[selected]);
 const web=isWebPlatform && data?.web;
 const name=item=>localizeEquipmentItemName(equipment(item),lang) || item.id;
 const rows=useMemo(()=>{
  if(!data)return [];
  const list=tab==='agents'?[]:tab==='buy'?data.lots.filter(l=>l.status==='active' && l.sellerId!==profile.id):tab==='mine'?data.lots.filter(l=>['active','reserved'].includes(l.status) && l.sellerId===profile.id):data.items.filter(item=>tab!=='sell' || item.tradable!==false).map(item=>({id:item.id,item}));
  return list.filter(r=>(!slot || r.item.slot===slot)&&(!rarity || equipmentRarity(equipment(r.item)).id===rarity)&&name(r.item).toLowerCase().includes(query.toLowerCase())).sort((a,b)=>(sort==='asc'?1:-1)*((a.price || a.item.npcPrice || 0)-(b.price || b.item.npcPrice || 0)));
 // Catalog is static; filters refresh with the current server snapshot.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[data,tab,profile.id,query,slot,rarity,sort,lang]);
 const cents=/^\d+(\.\d{1,2})?$/.test(price)?Math.round(Number(price)*100):0;
 async function payMainnet(orderId,instruction){
  const {getNearWalletConnector,waitForNearWallet}=await import('@/lib/platform/nearWallet');
  const connector=await getNearWalletConnector();if(connector.network!=='mainnet')throw Error('MAINNET_WALLET_REQUIRED');
  const wallet=await waitForNearWallet(connector.connect());
  const accounts=await wallet.getAccounts({network:'mainnet'});
  const intent=instruction || await gameApi.marketPaymentInstruction(orderId);
  if(intent.network!=='mainnet'||intent.receiverId!=='pl4.nearlytrade.near'||!accounts.some(a=>a.accountId===intent.signerId))throw Error('WRONG_PAYMENT_WALLET');
  const saved=sessionStorage.getItem('p4-mainnet-tx:'+orderId);
  if(saved){const next=await gameApi.localMarket({action:'confirm',orderId,txHash:saved,requestId:crypto.randomUUID()});commit(next.state);return;}
  if(sessionStorage.getItem('p4-mainnet-attempt:'+orderId))throw Error('Перевір хеш попередньої спроби, щоб не оплатити двічі.');
  sessionStorage.setItem('p4-mainnet-attempt:'+orderId,'1');
  let result;
  try{result=await waitForNearWallet(wallet.signAndSendTransaction(intent));}
  catch(error){if(isWalletRejection(error))sessionStorage.removeItem('p4-mainnet-attempt:'+orderId);throw error;}
  const txHash=result?.transaction?.hash || result?.transaction_outcome?.id;
  if(!txHash)throw Error('Встав хеш платежу для перевірки. Не оплачуй повторно.');
  sessionStorage.setItem('p4-mainnet-tx:'+orderId,txHash);
  const next=await gameApi.localMarket({action:'confirm',orderId,txHash,requestId:crypto.randomUUID()});commit(next.state);
 }
 async function registerFeeRecipient(){
  if(inFlight.current)return;inFlight.current=true;setBusy(true);setMessage('');
  try{
   const intent=await gameApi.marketRegistration();
   if(intent.network!=='mainnet'||intent.receiverId!=='pl4.nearlytrade.near'||intent.actions?.length!==1||intent.actions[0].params.methodName!=='storage_deposit'||intent.actions[0].params.args.account_id!=='nuvelorian.near')throw Error('INVALID_REGISTRATION');
   const {getNearWalletConnector,waitForNearWallet}=await import('@/lib/platform/nearWallet');const connector=await getNearWalletConnector();if(connector.network!=='mainnet')throw Error('MAINNET_WALLET_REQUIRED');const wallet=await waitForNearWallet(connector.connect());const accounts=await wallet.getAccounts({network:'mainnet'});if(!accounts.some(a=>a.accountId===intent.signerId))throw Error('WRONG_PAYMENT_WALLET');
   await waitForNearWallet(wallet.signAndSendTransaction(intent));commit(await gameApi.localMarket());
  }catch(error){setMessage(paymentError(error,lang));}finally{inFlight.current=false;setBusy(false);}
 }
 async function execute(body){if(data?.readOnly){setSelected(null);setMessage(lang==='ru'?'Закрытый пилот: торговля доступна приглашённым тестерам.':lang==='en'?'Closed pilot: trading is open to invited testers.':'Закритий пілот: торгівля доступна запрошеним тестерам.');return;}if(inFlight.current)return;inFlight.current=true;setBusy(true);setMessage('');try{
  if(data?.mainnet){
   const pending=body.action==='buy'&&data.orders?.find(o=>o.lotId===body.lotId&&o.status==='awaiting_payment');
   if(pending)await payMainnet(pending.id);
   else{const next=await gameApi.localMarket({...body,action:body.action==='buy'?'reserve':body.action});commit(next.state);if(body.action==='buy')await payMainnet(next.result.orderId,next.result.instruction);}
  }else commit(await gameApi.localMarket(body));
  setRetry(null);setSelected(null);setMessage(t.done);
 }catch(error){setMessage(data?.mainnet?paymentError(error,lang,body.action):t.error);if(!data?.mainnet&&(!error.status || error.status>=500))setRetry(body);else{setRetry(null);gameApi.localMarket().then(commit).catch(()=>{});}}finally{inFlight.current=false;setBusy(false);}}
 async function recoverPayment(order,send=false){
  if(inFlight.current)return;inFlight.current=true;setBusy(true);setMessage('');
  try{
   if(send)await payMainnet(order.id);
   else{const hash=sessionStorage.getItem('p4-mainnet-tx:'+order.id)||window.prompt(lang==='ru'?'Хеш уже отправленного платежа':lang==='en'?'Hash of the payment already sent':'Хеш уже відправленого платежу');if(!hash)return;const next=await gameApi.localMarket({action:'confirm',orderId:order.id,txHash:hash.trim(),requestId:crypto.randomUUID()});commit(next.state);}
  }catch(error){setMessage(paymentError(error,lang));}finally{inFlight.current=false;setBusy(false);}
 }
 function submit(){const action=tab==='npc'?'npc':tab==='sell'?'list':tab==='mine'?'cancel':'buy';execute({action,requestId:crypto.randomUUID(),...(['npc','list'].includes(action)?{itemId:selected.item.id,...(action==='list'?{price:cents}:{})}:{lotId:selected.id})});}
 const readOnly=data?.readOnly===true;
 const viewOnlyText=lang==='ru'?'Закрытый пилот: рынок открыт для просмотра. Торговать пока могут приглашённые тестеры.':lang==='en'?'Closed pilot: the market is view-only for now. Trading is open to invited testers.':'Закритий пілот: ринок відкрито для перегляду. Торгувати поки можуть запрошені тестери.';
 useEffect(()=>{if(readOnly&&['npc','sell','mine'].includes(tab)){setTab('buy');setSelected(null);}},[readOnly,tab]);
 const chooseTab=next=>{setTab(next);setSelected(null);};
 const rarities=[...new Set((data?.items || []).concat((data?.lots || []).map(l=>l.item)).map(i=>equipmentRarity(equipment(i)).id).filter(Boolean))];
 const selectedEquipment=selected?equipment(selected.item):null;
 const estimateLabel=estimateCopy[lang] || estimateCopy.uk;
 const selectedEstimate=rowEstimate(selected);
 return <section className="p4-market" style={{'--market-card-texture':`url("${marketCardTexture}")`}}>
  <div className="market-shop-banner">
   <img src={shopBanner} alt="" className="market-shop-banner-art"/>
   <h1 className="sr-only">{t.title}</h1>
   <span className="market-test-badge"><i/>{data?.mainnet?'MAINNET':lang==='en'?'TEST':'ТЕСТ'}</span>
   <nav className="market-main-tabs" aria-label={t.title}>
    {!readOnly && <MarketButton aria-pressed={tab==='npc'} tone={tab==='npc'?'green':'gray'} onClick={()=>chooseTab('npc')}><Store size={17}/>{t.npc}</MarketButton>}
    {web && <MarketButton aria-pressed={tab!=='npc'} tone="blue" onClick={()=>chooseTab('buy')}>{l.market}</MarketButton>}
   </nav>
  </div>
  <div className={`market-balances ${web?'':'market-balances-single'}`}>
   <div className="market-balance"><small>{t.scrap}</small><Currency scrap value={data?Number(data.scrap).toLocaleString(lang):'…'}/></div>
   {web && <div className="market-balance"><small>{data?.mainnet?'PL4 · Mainnet':t.balance}</small><Currency value={data?.balance==null?'…':money(data.balance)}/></div>}
  </div>
  {data?.mainnet&&data.feeRecipientRegistered===false&&<div className="market-mainnet-orders"><p>{lang==='ru'?'Получатель комиссии nuvelorian.near ещё не зарегистрирован в PL4. Оплата пока недоступна.':lang==='en'?'Fee recipient nuvelorian.near is not registered for PL4 yet. Payments are unavailable.':'Отримувач комісії nuvelorian.near ще не зареєстрований у PL4. Оплата поки недоступна.'}</p>{data.pilotOwner===true&&<MarketButton disabled={busy} onClick={registerFeeRecipient}>{lang==='ru'?'Зарегистрировать получателя комиссии':lang==='en'?'Register fee recipient':'Зареєструвати отримувача комісії'}</MarketButton>}</div>}
  {readOnly && <p className="market-status" role="status">{viewOnlyText}</p>}
  {web && tab!=='npc' && <nav className="market-subtabs" aria-label={l.market}>{(readOnly?['buy']:['buy','sell','mine']).map(key=><MarketButton key={key} aria-pressed={tab===key} tone={tab===key?'yellow':'gray'} onClick={()=>chooseTab(key)}>{t[key]}</MarketButton>)}{data?.agents && <MarketButton aria-pressed={tab==='agents'} tone={tab==='agents'?'yellow':'gray'} onClick={()=>chooseTab('agents')}><Bot size={15}/>{a.tab}</MarketButton>}</nav>}
  {tab==='agents' && data?.agents && <MarkerFrame className="market-stock market-agents" innerClassName="market-stock-inner" variant="transparent" showBorder={false}>
   <div className="market-section-heading"><span/><h2>{a.tab}</h2><small>{data.llm?a.llm:a.rules}</small></div>
   <div className="market-agent-list">{data.agents.map(agent=><div key={agent.id} className={`market-agent market-agent-${agent.role}`}>
    <div className="market-agent-head"><Bot size={18}/><b>{marketAgentName(agent.key,agent.name,lang)}</b></div>
    <p>{a.roles[agent.role]}</p>
    <dl><div><dt>{a.balance}</dt><dd>{money(agent.balance)} P4</dd></div><div><dt>{a.listings}</dt><dd>{agent.listings}</dd></div><div><dt>{a.holdings}</dt><dd>{agent.holdings}</dd></div></dl>
    {agent.nearAccount && <code>{agent.nearAccount}</code>}
    {agent.nearAccount && agent.wallet?.checkedAt && <small className={agent.wallet.ok?'market-agent-wallet':'market-agent-wallet market-agent-wallet-warn'}>{agent.wallet.ok?`${Math.round(agent.wallet.pl4).toLocaleString('en-US')} PL4 · ${agent.wallet.near.toFixed(2)} NEAR`:(agent.wallet.error || agent.wallet.issues?.join('; '))}</small>}
   </div>)}</div>
   {data.paused && <p className="market-status market-status-error" role="status">{a.paused}</p>}
   {data.treasury && <div className="market-fee-strip"><span>{a.treasury}</span><b>{money(data.treasury.value)} P4{usd(data.treasury.value) && <small> {usd(data.treasury.value)}</small>}</b></div>}
   {data.treasury && <><div className="market-fee-strip"><span>{a.cash}</span><b>{money(data.treasury.cash)} P4</b></div><div className="market-fee-strip"><span>{a.stock}</span><b>{money(data.treasury.stock)} P4</b></div></>}{data.treasury && Number.isFinite(data.treasury.pnl) && <div className="market-fee-strip"><span>{a.pnl}</span><b>{data.treasury.pnl>=0?'+':'−'}{money(Math.abs(data.treasury.pnl))} P4{usd(Math.abs(data.treasury.pnl)) && <small> {usd(Math.abs(data.treasury.pnl))}</small>}</b></div>}
   {Number.isFinite(data.dailyLeft) && <div className="market-fee-strip"><span>{a.today}</span><b>{money(data.dailyLeft)} P4{usd(data.dailyLeft) && <small> {usd(data.dailyLeft)}</small>}</b></div>}
   {data.burned>0 && <div className="market-fee-strip"><span>{a.burned}</span><b>{money(data.burned)} P4</b></div>}
   {!data?.mainnet&&<MarketButton disabled={simulating} onClick={simulateWeek}>{simulating?l.working:sim.run}</MarketButton>}
   {simulation && <section className="market-simulation" aria-label={sim.title}><h3>{sim.title}</h3><p>{sim.note}</p><div className="market-sim-bars" role="img" aria-label={sim.title}>{simulation.rows.map(row=>{const max=Math.max(1,...simulation.rows.map(r=>r.cash+r.stockAtCost));return <div key={row.day} className="market-sim-column"><div className="market-sim-track" title={`${sim.day} ${row.day}: ${sim.cash} ${money(row.cash)} P4; ${sim.stock} ${money(row.stockAtCost)} P4`}><i style={{height:`${row.stockAtCost/max*100}%`}}/><b style={{height:`${row.cash/max*100}%`}}/></div><span>{row.day}</span></div>;})}</div><div className="market-sim-legend"><span>{sim.cash}</span><span>{sim.stock}</span></div><div className="market-sim-table"><table><thead><tr><th>{sim.day}</th><th>{sim.cash} P4</th><th>{sim.stock} P4</th></tr></thead><tbody>{simulation.rows.map(row=><tr key={row.day}><td>{row.day}</td><td>{money(row.cash)}</td><td>{money(row.stockAtCost)}</td></tr>)}</tbody></table></div></section>}
   <div className="market-section-heading"><span/><h2>{a.feed}</h2><small>{data.feed.length}</small></div>
   <ol className="market-feed">{data.feed.length?data.feed.map(e=><li key={e.id} title={e.reason || undefined}>
    <time>{new Date(e.at).toLocaleTimeString(lang,{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</time>
    <span><b>{marketAgentName(e.agent,e.name,lang)}</b> {a.act[e.action] || e.action}{e.itemId && <> <em>{name({id:e.itemId})}</em></>}{e.price && <> · {money(e.price)} P4</>}{e.seller && <> {a.from} {e.seller}</>}{e.txHash&&<> · <a href={'https://nearblocks.io/txns/'+encodeURIComponent(e.txHash)} target="_blank" rel="noreferrer">NEAR ↗</a></>}</span>
    {e.say && <q>{marketAgentSpeech(e,lang)}</q>}
   </li>):<li className="market-feed-empty">{a.quiet}</li>}</ol>
  </MarkerFrame>}
  {tab!=='agents' && <MarkerFrame className="market-stock" innerClassName="market-stock-inner" variant="transparent" showBorder={false}>
   <div className="market-section-heading"><span/><h2>{tab==='npc'?l.items:t[tab]}</h2><small>{rows.length}</small></div>
   {tab==='npc' && <p className="market-npc-hint">{lang==='ru'?'Продай лишнее снаряжение скупщику за металлолом.':lang==='en'?'Sell spare equipment to the NPC for scrap.':'Продай зайве спорядження скупнику за металобрухт.'}</p>}
   <div className="market-search"><Search size={15} aria-hidden="true"/><input aria-label={t.search} placeholder={t.search} value={query} onChange={e=>setQuery(e.target.value)}/><button type="button" className="market-filter-toggle" aria-label={l.filters} aria-expanded={filtersOpen} onClick={()=>setFiltersOpen(v=>!v)}><SlidersHorizontal size={16}/>{(slot||rarity)&&<i/>}</button></div>
   {filtersOpen && <div className="market-filters"><select aria-label={t.all} value={slot} onChange={e=>setSlot(e.target.value)}><option value="">{t.all}</option>{Object.entries(slotLabels).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select><select aria-label={t.rarity} value={rarity} onChange={e=>setRarity(e.target.value)}><option value="">{t.rarity}</option>{rarities.map(r=><option key={r} value={r}>{rarityLabel(EQUIPMENT_RARITIES[r],lang)}</option>)}</select><select aria-label={t.sort} value={sort} onChange={e=>setSort(e.target.value)}><option value="asc">{t.sort}</option><option value="desc">{t.expensive}</option></select></div>}
   <p className={`market-status ${message===t.error?'market-status-error':''}`} role="status">{busy?l.working:message}</p>
   {retry && !selected && <MarketButton disabled={busy} onClick={()=>execute(retry)}>{t.retry}</MarketButton>}
   <div className="market-grid">{rows.map(row=>{
    const item=equipment(row.item),locked=tab==='mine',open=()=>{setSelected(row);setPrice(row.item.fair?(row.item.fair/100).toFixed(2):'10');setMessage('');setRetry(null);};
    return <MarkerFrame key={row.id} className="market-shop-card" innerClassName={`market-shop-card-inner${tab!=='npc' && rowEstimate(row)!==null?' market-shop-card-with-estimate':''}`} variant="transparent" borderStartColor={equipmentRarity(item).color} borderEndColor={equipmentRarity(item).color}>
     <button type="button" className="market-shop-item" disabled={busy || !!retry || row.status==='reserved'} aria-label={name(row.item)} onClick={open}>
      <span className="market-shop-item-title">{name(row.item)}{['weapon','head','hands','armor','legs','boots'].includes(item.slot) && <span className="market-title-enhancement"> +{Math.max(0,Math.min(15,Math.floor(Number(item.enhancementLevel)||0)))}</span>}</span>
      <span className="market-shop-item-art"><img src={item.icon} alt=""/>{locked && <LockKeyhole className="market-shop-lock" size={14}/>}</span>
      <span className="market-shop-item-count"><EquipmentRarityBadge item={item} language={lang}/><span>×1</span>{row.sellerAi && <span className="market-ai-badge" title={row.seller}><Bot size={11}/>{a.ai}</span>}</span>
     </button>
     {tab!=='npc' && rowEstimate(row)!==null && <div className="market-shop-estimate"><span>{lang==='ru'?'Оценка':lang==='en'?'Estimate':'Оцінка'}</span><b>≈ {money(rowEstimate(row))} <small>$PL4</small></b></div>}
     <MarketButton className="market-shop-price" tone={locked?'gray':'green'} disabled={busy || !!retry || row.status==='reserved'} onClick={open}>{row.status==='reserved'?(lang==='ru'?'Зарезервировано':lang==='en'?'Reserved':'Зарезервовано'):tab==='npc'?<><span>{lang==='ru'?'Продать за':lang==='en'?'Sell for':'Продати за'}</span><Currency scrap value={row.item.npcPrice}/></>:row.price?<Currency value={money(row.price)}/>:t.list}</MarketButton>
    </MarkerFrame>;
   })}</div>
   {!rows.length && <div className="market-empty"><Store size={36}/><p>{data?t.empty:l.loading}</p></div>}
  </MarkerFrame>}
  {data?.mainnet && <section className="market-mainnet-orders"><p>{lang==='ru'?'Реальная оплата PL4 · комиссия 5%':lang==='en'?'Real PL4 payments · 5% seller fee':'Реальна оплата PL4 · комісія 5%'}</p>{data.orders?.filter(o=>o.status==='awaiting_payment').map(order=><div key={order.id}><p>{name(order.item)} · {money(order.price)} $PL4</p><MarketButton disabled={busy} onClick={()=>recoverPayment(order,true)}>{lang==='ru'?'Оплатить в кошельке':lang==='en'?'Pay in wallet':'Сплатити в гаманці'}</MarketButton><MarketButton disabled={busy} onClick={()=>recoverPayment(order)}>{lang==='ru'?'Проверить отправленный платёж':lang==='en'?'Verify sent payment':'Перевірити відправлений платіж'}</MarketButton><small>{lang==='ru'?'Если результат неизвестен, проверь отправленный платёж. Резерв этой вещи сохранён; другие покупки доступны.':lang==='en'?'If the result is unknown, verify the sent payment. This item stays reserved; you can buy other items.':'Якщо результат невідомий, перевір надісланий платіж. Резерв цієї речі збережено; інші покупки доступні.'}</small></div>)}{data.pendingDeliveries?.map(delivery=><MarketButton key={delivery.orderId} disabled={busy} onClick={()=>execute({action:'claim',orderId:delivery.orderId,requestId:crypto.randomUUID()})}>{lang==='ru'?'Забрать оплаченную вещь':lang==='en'?'Claim paid item':'Забрати оплачену річ'}</MarketButton>)}</section>}
  <div className="market-help"><LockKeyhole size={15}/><p>{t.note}</p></div>
  {data?.mainnet&&data.budget&&<div className="market-fee-strip"><span>{lang==='ru'?'Остаток общего лимита пилота':lang==='en'?'Pilot spending limit remaining':'Залишок загального ліміту пілоту'}</span><b>{money(Math.max(0,data.budget.capHundredths-data.budget.usedHundredths))} $PL4</b></div>}
  {data?.mainnet&&data.orders?.filter(o=>o.txHash).slice(-5).reverse().map(order=><div className="market-fee-strip" key={order.id}><span>{name(order.item)}</span><a href={'https://nearblocks.io/txns/'+encodeURIComponent(order.txHash)} target="_blank" rel="noreferrer">{lang==='ru'?'Платёж подтверждён':lang==='en'?'Payment confirmed':'Платіж підтверджено'} ↗</a></div>)}
  {web && tab!=='npc' && <div className="market-fee-strip"><span>{l.fee}</span><b>5%</b></div>}
  <details className="market-test-details"><summary>{data?.mainnet?'Mainnet · PL4':l.details}</summary><p>{data?.mainnet?(lang==='ru'?'Реальные переводы PL4. Комиссия 5% → nuvelorian.near.':lang==='en'?'Real PL4 transfers. Seller fee 5% → nuvelorian.near.':'Реальні перекази PL4. Комісія 5% → nuvelorian.near.'):t.test}</p>{!data?.mainnet&&<p>{tab==='npc'?t.quote:t.fee}</p>}{web && <code>pl4.nearlytrade.near</code>}{import.meta.env.DEV && web && <a href={'/market-testnet'+window.location.search}>NEAR Testnet · {l.details}</a>}<a href="/market-example/index.html" target="_blank" rel="noreferrer">index.html · {l.example}</a></details>
  {selected && createPortal(<div className="p4-market market-overlay" onClick={e=>{if(e.target===e.currentTarget&&!busy)setSelected(null);}}><MarkerFrame className="market-dialog" innerClassName="market-dialog-inner" variant="transparent" backgroundImage={marketCardTexture} backgroundPosition="center"><div ref={dialogRef} role="dialog" aria-modal="true" aria-label={name(selected.item)}>
   <div className="market-dialog-header"><span>{tab==='npc'?t.npc:t[tab]}</span><button type="button" aria-label={t.back} disabled={busy} onClick={()=>setSelected(null)}><X size={20}/></button></div>
   <h2>{name(selected.item)}{selected.item.enhancementLevel>0 && <span className="market-title-enhancement"> +{selected.item.enhancementLevel}</span>}</h2>
   <p className="market-dialog-slot">{slotLabels[selected.item.slot]}</p><div className="market-dialog-rarity"><EquipmentRarityBadge item={selectedEquipment} language={lang}/></div>
   <div className="market-dialog-art"><img src={selectedEquipment.icon} alt=""/></div>
   {selected.seller && <div className="market-dialog-seller"><span>{l.seller}</span><strong>{selected.seller}</strong>{selected.sellerAi && <span className="market-ai-badge"><Bot size={11}/>{a.ai}</span>}</div>}
   <ul className="market-item-bonuses">{describeEquipmentBonuses(selectedEquipment,lang).map(line=><li key={line}>{line}</li>)}</ul>
   {tab!=='npc' && selectedEstimate!==null && <div className="market-reference-price"><div className="market-quote-row"><span>{estimateLabel.label}</span><Currency value={money(selectedEstimate)} usd={usd(selectedEstimate)}/></div><p>{estimateLabel.hint}</p></div>}
   {tab==='sell'?<><label className="market-price-label">{t.price} $PL4<input disabled={busy || !!retry} inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value)}/><span className="market-price-usd">{usd(cents) || `(${quoteStatus})`}</span></label><div className="market-quote-row"><span>{l.fee} · 5%</span><Currency value={money(Math.ceil(cents*.05))} usd={usd(Math.ceil(cents*.05))}/></div><div className="market-quote-row market-quote-total"><span>{t.net}</span><Currency value={money(Math.max(0,cents-Math.ceil(cents*.05)))} usd={usd(Math.max(0,cents-Math.ceil(cents*.05)))}/></div></>:tab==='mine'?<div className="market-help"><LockKeyhole size={16}/><p>{t.cancel}</p></div>:<div className="market-quote-row market-quote-total"><span>{tab==='npc'?l.received:<>{t.price} <b>$PL4</b></>}</span><Currency hideTicker={tab!=='npc'} scrap={tab==='npc'} value={tab==='npc'?selected.item.npcPrice:money(selected.price)} usd={tab==='npc'?null:usd(selected.price)}/></div>}
   <p className="market-dialog-status" role="status">{data?.mainnet?message:message===t.error?message:''}</p>
   {retry && <MarketButton disabled={busy} onClick={()=>execute(retry)}>{t.retry}</MarketButton>}
   <div className="market-dialog-actions"><MarketButton tone="gray" disabled={busy} onClick={()=>setSelected(null)}>{t.back}</MarketButton><MarketButton disabled={busy || !!retry || (tab==='sell' && (cents<1 || cents>100000000000))} onClick={submit}>{busy?l.working:tab==='sell'?t.list:tab==='mine'?t.cancel:tab==='npc'?t.sell:t.confirm}</MarketButton></div>
  </div></MarkerFrame></div>,document.body)}
 </section>;
}

export function warmFirstFrame(){return warmFirstFrameImages([shopBanner,marketCardTexture,pl4TokenLogo]);}











