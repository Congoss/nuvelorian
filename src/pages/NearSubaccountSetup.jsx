import {useRef,useState} from 'react';
import {subaccountPlan,encryptSubaccountBackup,decryptSubaccountBackup} from '@/lib/nearSubaccount';
import {waitForNearWallet} from '@/lib/platform/nearWallet';

const style={background:'#182419',color:'#e9f2dc',border:'1px solid #597342',borderRadius:8,padding:12,width:'100%'};
async function readAccount(account,publicKey=''){
 const response=await fetch('/api/local-near/account?'+new URLSearchParams({account,publicKey}),{cache:'no-store'});
 const payload=await response.json();if(!response.ok)throw Error(payload.error?.message || payload.message || 'Не вдалося перевірити акаунт.');return payload.data;
}
export default function NearSubaccountSetup(){
 const connector=useRef(null),wallet=useRef(null),secret=useRef(null),pending=useRef(false);
 const [parent,setParent]=useState(''),[prefix,setPrefix]=useState('tor'),[plan,setPlan]=useState(null),[password,setPassword]=useState(''),[repeat,setRepeat]=useState(''),[backup,setBackup]=useState(null),[saved,setSaved]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[done,setDone]=useState(false),[attempted,setAttempted]=useState(false),[hash,setHash]=useState('');
 async function run(fn){if(pending.current)return;pending.current=true;setBusy(true);setMessage('');try{await fn();}catch(error){setMessage(error.message || 'Операцію не завершено.');}finally{pending.current=false;setBusy(false);}}
 async function connect(){
  if(!connector.current){const {NearConnector}=await import('@hot-labs/near-connect');connector.current=new NearConnector({network:'mainnet',autoConnect:false,footerBranding:null});}
  wallet.current=await waitForNearWallet(connector.current.connect());
  const accounts=await wallet.current.getAccounts({network:'mainnet'}),account=accounts[0]?.accountId || '';
  if(plan&&account!==plan.signerId)throw Error('Підключи '+plan.signerId+' для цього субакаунта.');
  setParent(account);
 }
 async function prepare(){
  if(password!==repeat)throw Error('Паролі не збігаються.');
  if(password.length<12)throw Error('Пароль: щонайменше 12 символів.');
  if(!parent)throw Error('Спочатку підключи основний гаманець.');
  const {KeyPair}=await import('@near-js/crypto');
  const key=KeyPair.fromRandom('ed25519'),intent=subaccountPlan(parent,prefix,key.getPublicKey().toString());
  if((await readAccount(intent.receiverId)).exists)throw Error('Цей субакаунт уже існує.');
  const encrypted=await encryptSubaccountBackup({network:'mainnet',account_id:intent.receiverId,public_key:key.getPublicKey().toString(),private_key:key.toString()},password);
  secret.current=key;setPlan(intent);setBackup(encrypted);setPassword('');setRepeat('');setSaved(false);
 }
 function download(){
  const url=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'})),anchor=document.createElement('a');
  anchor.href=url;anchor.download=plan.receiverId+'.encrypted.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
 }
 function downloadWalletKey(){
  if(!secret.current||!plan)throw Error('Спочатку віднови зашифровану копію ключа.');
  const credentials={account_id:plan.receiverId,public_key:secret.current.getPublicKey().toString(),private_key:secret.current.toString()};
  const url=URL.createObjectURL(new Blob([JSON.stringify(credentials,null,2)],{type:'application/json'})),anchor=document.createElement('a');
  anchor.href=url;anchor.download=plan.receiverId+'.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
  setMessage('Файл ключа завантажено. Поле private_key містить ключ ed25519:… для імпорту в сумісний гаманець.');
 }
 async function resumeUnsigned(){
  if((await readAccount(plan.receiverId)).exists)throw Error('Акаунт уже існує. Перевір його створення.');
  setAttempted(false);setMessage('Можна продовжити з тим самим збереженим ключем.');
 }
 async function verify(){
  const status=await readAccount(plan.receiverId,plan.actions[2].params.publicKey);
  if(!status.exists){setMessage('Субакаунт ще не підтверджений. Якщо підписував — зачекай і перевір повторно; не надсилай оплату знову.');return;}
  if(!status.keyMatches)throw Error('Акаунт існує, але ключ не відповідає резервній копії. Не підписуй повторно.');
  setDone(true);setMessage('Субакаунт створено, повний доступ нового ключа підтверджено.');
 }
 async function create(){
  if(!saved||!backup||!plan||!wallet.current||!secret.current)throw Error('Спочатку збережи резервну копію.');
  if(/hot/i.test(wallet.current.manifest?.id || '')||/hot wallet/i.test(wallet.current.manifest?.name || ''))throw Error('HOT блокує Add full key у цьому сценарії. Не повторюй підписання: потрібен інший підписант основного акаунта або NEAR CLI. Збережений ключ субакаунта залишається чинним.');
  const accounts=await wallet.current.getAccounts({network:'mainnet'});
  if(!accounts.some(a=>a.accountId===plan.signerId))throw Error('Підключи '+plan.signerId);
  if((await readAccount(plan.receiverId)).exists)throw Error('Акаунт уже існує. Натисни перевірку створення.');
  if(!(await readAccount(plan.signerId)).exists)throw Error('Основний акаунт не знайдено.');
  // Reconstruct rather than trusting editable UI state. Wallet approval is mandatory.
  const transaction=subaccountPlan(plan.signerId,prefix,secret.current.getPublicKey().toString());
  if(transaction.receiverId!==plan.receiverId)throw Error('Ім’я змінилося.');
  setAttempted(true);
  let result;
  try{result=await waitForNearWallet(wallet.current.signAndSendTransaction(transaction));}
  catch(error){if(['USER_REJECTED','USER_REJECTED_REQUEST',4001].includes(error.code))setAttempted(false);throw error;}
  setHash(result?.transaction?.hash || result?.transaction_outcome?.id || '');await verify();
 }
 async function restore(event){
  const file=event.target.files?.[0];if(!file)return;
  if(file.size>12000)throw Error('Невірний файл копії.');
  const encrypted=JSON.parse(await file.text()),credentials=await decryptSubaccountBackup(encrypted,password);
  const {KeyPair}=await import('@near-js/crypto'),key=KeyPair.fromString(credentials.private_key);
  const label=credentials.account_id.split('.')[0],owner=credentials.account_id.slice(label.length+1);
  const intent=subaccountPlan(owner,label,key.getPublicKey().toString());
  if(credentials.network!=='mainnet'||credentials.public_key!==key.getPublicKey().toString())throw Error('Невірна резервна копія.');
  secret.current=key;setPlan(intent);setPrefix(label);setParent(owner);setBackup(encrypted);setSaved(true);setPassword('');setRepeat('');setAttempted(true);setMessage('Копію відновлено локально. Перевір створення акаунта; новий ключ не генерується.');
 }
 return <main style={{maxWidth:560,margin:'0 auto',padding:24,minHeight:'100dvh',background:'#0c140e',color:'#edf4dc',fontFamily:'Rubik,sans-serif',lineHeight:1.6}}>
  <h1 style={{fontSize:24,fontWeight:800}}>Субакаунт торговця</h1>
  <p style={{color:'#e4c879'}}>Mainnet · 0.1 NEAR з основного акаунта + мережева комісія.</p>
  <p>Новий ключ субакаунта створюється лише у браузері. Ключ основного гаманця сюди вводити не потрібно.</p>
  <p style={{color:'#f3cd86'}}>HOT заблокував створення через Add full key. Для підписання потрібен інший підписант того самого основного акаунта або NEAR CLI. Збережений ключ субакаунта не змінюй.</p>
  <button style={{...style,marginTop:16}} disabled={busy||done} onClick={()=>run(connect)}>Підключити основний гаманець</button>
  <p>Основний акаунт: <strong>{parent || 'не підключено'}</strong></p>
  {!plan?<div style={{display:'grid',gap:12}}>
   <label>Ім’я субакаунта<input style={style} value={prefix} disabled={busy} onChange={e=>setPrefix(e.target.value.trim().toLowerCase())}/></label>
   <p>{parent?`${prefix}.${parent}`:'Наприклад: tor.ваш-акаунт.near'}</p>
   <label>Новий пароль резервної копії (не пароль HOT)<input type="password" autoComplete="new-password" style={style} value={password} onChange={e=>setPassword(e.target.value)}/></label>
   <label>Повтори пароль<input type="password" autoComplete="new-password" style={style} value={repeat} onChange={e=>setRepeat(e.target.value)}/></label>
   <button style={style} disabled={busy||!parent} onClick={()=>run(prepare)}>Підготувати субакаунт</button>
   <details><summary>Відновити попередню резервну копію</summary><p>Введи її пароль у поле вище та обери зашифрований файл. Дані нікуди не надсилаються.</p><input type="file" accept=".json" disabled={busy} onChange={e=>run(()=>restore(e))}/></details>
  </div>:<div style={{display:'grid',gap:12}}>
   <p>Новий акаунт: <strong>{plan.receiverId}</strong><br/>Баланс: <strong>0.1 NEAR</strong></p>
   <p style={{overflowWrap:'anywhere'}}>Публічний ключ: {plan.actions[2].params.publicKey}</p>
   <button style={style} onClick={download}>Завантажити зашифровану копію ключа</button>
   <button style={style} disabled={busy||!secret.current} onClick={()=>run(downloadWalletKey)}>Завантажити NEAR-файл із приватним ключем</button>
   <p>Цей другий файл не зашифрований. У ньому поле <code>private_key</code> — ключ для імпорту в сумісний гаманець. Не надсилай цей файл або ключ у чат. Фраза з 12 слів тут не створюється.</p>
   <p>{done?'Акаунт підтверджено — можна імпортувати ключ у гаманець.':'Поки акаунт не створено в мережі, гаманець може не знайти його навіть із правильним ключем.'}</p>
   <p>Збережи файл і пароль окремо. Після закриття сторінки відновлення доступу до субакаунта потребуватиме цієї копії.</p>
   <label><input type="checkbox" checked={saved} onChange={e=>setSaved(e.target.checked)}/> Файл завантажено, пароль збережено.</label>
   {!attempted&&!done&&<button style={{...style,background:'#a9d737',color:'#142006',fontWeight:800}} disabled={busy||!saved} onClick={()=>run(create)}>Створити за 0.1 NEAR + комісія · підпис у гаманці</button>}
   <button style={style} disabled={busy} onClick={()=>run(verify)}>Перевірити створення без нового платежу</button>
   {attempted&&!done&&<p>Спробу підписання вже відкрито. Якщо відхилив її у HOT, спочатку перевір статус.</p>}
   {attempted&&!done&&<button style={style} disabled={busy} onClick={()=>run(resumeUnsigned)}>Я ще не підписував / точно відхилив — продовжити створення</button>}
  </div>}
  <p role="status" style={{marginTop:18,color:done?'#bfea6a':'#f3cd86',overflowWrap:'anywhere'}}>{busy?'Обробка…':message}</p>
  {hash&&<a href={'https://nearblocks.io/txns/'+hash} target="_blank" rel="noreferrer">Транзакція у NEAR Explorer</a>}
 </main>;
}
