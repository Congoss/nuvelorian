import {useEffect,useRef,useState} from 'react';
import {gameApi} from '@/services/gameApi';
import GameTextureButton from '@/components/game/GameTextureButton';
import MarkerFrame from '@/components/game/MarkerFrame';
import '@/components/game/market.css';
const legs={funding:'Оплата покупця',seller:'Виплата продавцю',fee:'Комісія 3%',refund:'Повернення покупцю'};
const states={awaiting_payment:'Очікує оплати',payment_confirmed:'Оплату підтверджено',payout_pending:'Очікує завершення виплат',completed:'Угоду завершено',expired:'Резерв прострочений',refund_required:'Потрібне повернення',refunded:'Повернення підтверджено'};
function Button({children,...props}){return <GameTextureButton {...props}><span className="market-button-label">{children}</span></GameTextureButton>;}
export default function MarketTestnetPreview(){
  const [data,setData]=useState(null),[orderId,setOrderId]=useState(''),[leg,setLeg]=useState('funding'),[intent,setIntent]=useState(null),[hash,setHash]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const connector=useRef(null),reserveId=useRef(crypto.randomUUID());
  const order=data?.orders?.find(o=>o.id===orderId) || data?.orders?.at(-1);
  async function refresh(){const next=await gameApi.marketTestnet();setData(next);return next;}
  useEffect(()=>{let live=true;gameApi.bootstrapCurrentPlayer().then(()=>gameApi.marketTestnet()).then(next=>{if(live)setData(next);}).catch(e=>{if(live)setError(e.code || e.message);});return()=>{live=false;};},[]);
  async function run(action){if(busy)return;setBusy(true);setError('');try{await action();}catch(e){setError(e.code || e.message || 'Помилка');}finally{setBusy(false);}}
  async function reserve(){const response=await gameApi.marketTestnet({action:'reserve',requestId:reserveId.current});setData({...response.state,ready:true});setOrderId(response.result.id);setIntent(null);setHash('');}
  async function prepare(){const response=await gameApi.marketTestnet({action:'instruction',orderId:order.id,leg});setIntent(response.result);setHash(sessionStorage.getItem(`p4-testnet:${order.id}:${leg}`) || '');}
  async function confirm(txHash=hash){const response=await gameApi.marketTestnet({action:'confirm',orderId:order.id,leg,txHash});setData({...response.state,ready:true});setIntent(null);setHash('');}
  async function sign(){
    if(intent?.network!=='testnet'||!intent.receiverId.endsWith('.testnet')||intent.actions?.length!==1)throw Error('TESTNET_ONLY');
    if(!connector.current){const {NearConnector}=await import('@hot-labs/near-connect');connector.current=new NearConnector({network:'testnet',autoConnect:false,footerBranding:null});}
    const wallet=await connector.current.connect();
    const accounts=await wallet.getAccounts({network:'testnet'});
    if(!accounts.some(account=>account.accountId===intent.signerId))throw Error('Підключи тестовий акаунт '+intent.signerId);
    const call=intent.actions[0];if(call.type!=='FunctionCall'||call.params.methodName!=='ft_transfer'||call.params.deposit!=='1')throw Error('INVALID_TRANSFER_INSTRUCTION');
    const {actionCreators}=await import('@near-wallet-selector/core');
    const result=await wallet.signAndSendTransaction({network:'testnet',signerId:intent.signerId,receiverId:intent.receiverId,actions:[actionCreators.functionCall('ft_transfer',call.params.args,BigInt(call.params.gas),1n)]});
    const txHash=result?.transaction?.hash || result?.transaction_outcome?.id;
    if(!txHash)throw Error('Гаманець не повернув хеш. Встав його нижче для перевірки.');
    sessionStorage.setItem(`p4-testnet:${order.id}:${leg}`,txHash);setHash(txHash);await confirm(txHash);
  }
  return <main className="p4-market" style={{maxWidth:680,margin:'0 auto',minHeight:'100dvh',padding:18}}>
    <h1 style={{fontSize:22,fontWeight:900,marginBottom:12}}>Маркет · NEAR Testnet</h1>
    <p style={{fontSize:13,lineHeight:1.6,marginBottom:14}}>Окрема лабораторія: тестовий токен і демонстраційна річ. Баланси P4 та інвентар основної гри тут не використовуються. Сервер не зберігає ключів і не підписує переказів.</p>
    <a href={'/'+window.location.search} style={{color:'#b7e77b',textDecoration:'underline'}}>Повернутися до гри</a>
    {error && <p role="alert" style={{color:'#ffc08e',padding:'12px 0',overflowWrap:'anywhere'}}>{error}</p>}
    {!data?<p role="status">Завантаження…</p>:!data.ready?<MarkerFrame innerClassName="p-4 mt-4"><h2 className="font-bold text-lg">Спочатку налаштування</h2><p className="my-3 text-sm">Почни зі створення власного акаунта в <a className="underline" href="https://testnet.mynearwallet.com/" target="_blank" rel="noreferrer">NEAR Testnet Wallet</a>. Ключі та seed-фразу зберігай у себе.</p><p className="text-sm">Розрахунки зараз вимкнені. Для ввімкнення потрібні тестовий токен, адреси покупця, продавця, тестової каси та отримувача комісії.</p>{data.error && <p>{data.error}</p>}</MarkerFrame>:<>
      <div style={{margin:'15px 0',display:'grid',gap:7,fontSize:12,overflowWrap:'anywhere'}}><span>Токен: {data.config.token}</span><span>Покупець: {data.config.buyer}</span><span>Продавець: {data.config.seller}</span><span>Тестова каса: {data.config.vault}</span><span>Комісія: {data.config.feeRecipient}</span></div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Button disabled={busy||data.listing.status!=='active'} onClick={()=>run(reserve)}>Зарезервувати тестову річ · 1 токен</Button><Button tone="gray" disabled={busy} onClick={()=>run(refresh)}>Оновити</Button></div>
      {data.orders?.length>0 && <label style={{display:'grid',margin:'12px 0',gap:5}}>Угода<select value={order?.id || ''} onChange={e=>{setOrderId(e.target.value);setIntent(null);setHash('');}}>{data.orders.map(o=><option value={o.id} key={o.id}>{o.id} · {states[o.status]}</option>)}</select></label>}
      {order && <MarkerFrame innerClassName="p-4"><h2 className="font-bold">{states[order.status]}</h2><p className="text-sm my-2">Річ буде передана лише після підтвердження оплати та обох виплат. Ці перекази не є однією атомарною блокчейн-транзакцією.</p><select disabled={busy} value={leg} onChange={e=>{setLeg(e.target.value);setIntent(null);setHash('');}}>{Object.entries(legs).map(([key,label])=><option value={key} key={key}>{label}{order.proofs[key]?' ✓':''}</option>)}</select><div className="my-3"><Button disabled={busy||['completed','refunded'].includes(order.status)} onClick={()=>run(prepare)}>Показати переказ</Button></div>
        {intent && <><p className="text-sm my-2">Підписує: {intent.signerId}. Отримувач: {intent.actions[0].params.args.receiver_id}. Лише тестова мережа.</p><details><summary>Деталі переказу</summary><pre className="text-xs overflow-auto my-3">{JSON.stringify(intent,null,2)}</pre></details><Button disabled={busy} onClick={()=>run(sign)}>Підписати у тестовому гаманці</Button></>}
        <label style={{display:'grid',gap:5,margin:'14px 0'}}>Хеш уже виконаного переказу<input aria-label="Хеш переказу" value={hash} disabled={busy} onChange={e=>setHash(e.target.value.trim())}/></label><Button disabled={busy||!hash} onClick={()=>run(()=>confirm())}>Перевірити без нового переказу</Button>
        <ol className="text-sm my-3">{Object.entries(order.proofs).map(([key,p])=><li key={key}>{legs[key]}: {p.skipped?'Не потрібна':<a className="underline" href={'https://testnet.nearblocks.io/txns/'+p.txHash} target="_blank" rel="noreferrer">підтверджено</a>}</li>)}</ol>
      </MarkerFrame>}
    </>}
    <p role="status" className="mt-3 text-sm">{busy?'Обробка…':''}</p>
  </main>;
}
