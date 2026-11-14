export const SUBACCOUNT_DEPOSIT='100000000000000000000000'; // 0.1 NEAR
export function subaccountPlan(parent,prefix,publicKey){
  if(!/^(?=.{2,64}$)[a-z0-9]+(?:[-_][a-z0-9]+)*(?:\.[a-z0-9]+(?:[-_][a-z0-9]+)*)+$/.test(parent)||parent.endsWith('.testnet'))throw Error('Потрібен іменний mainnet-акаунт батька.');
  if(!/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(prefix)||`${prefix}.${parent}`.length>64)throw Error('Некоректне ім’я субакаунта.');
  if(!/^ed25519:[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(publicKey))throw Error('Некоректний публічний ключ.');
  return {network:'mainnet',signerId:parent,receiverId:`${prefix}.${parent}`,actions:[{type:'CreateAccount'},{type:'Transfer',params:{deposit:SUBACCOUNT_DEPOSIT}},{type:'AddKey',params:{publicKey,accessKey:{nonce:0,permission:'FullAccess'}}}]};
}
const base64=bytes=>btoa(String.fromCharCode(...bytes));
const unbase64=text=>Uint8Array.from(atob(text),c=>c.charCodeAt(0));
async function backupKey(password,salt,usage){
  const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:600000},material,{name:'AES-GCM',length:256},false,[usage]);
}
export async function encryptSubaccountBackup(credentials,password){
  if(password.length<12)throw Error('Пароль резервної копії: щонайменше 12 символів.');
  const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
  const key=await backupKey(password,salt,'encrypt');
  const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(credentials)));
  return {format:'planet4-near-subaccount-backup',version:1,kdf:'PBKDF2-SHA256',iterations:600000,cipher:'AES-256-GCM',salt:base64(salt),iv:base64(iv),ciphertext:base64(new Uint8Array(ciphertext))};
}
export async function decryptSubaccountBackup(backup,password){
  if(backup?.format!=='planet4-near-subaccount-backup'||backup.version!==1||backup.iterations!==600000||backup.cipher!=='AES-256-GCM'||backup.kdf!=='PBKDF2-SHA256')throw Error('Невідомий формат копії.');
  const key=await backupKey(password,unbase64(backup.salt),'decrypt');
  const raw=await crypto.subtle.decrypt({name:'AES-GCM',iv:unbase64(backup.iv)},key,unbase64(backup.ciphertext));
  return JSON.parse(new TextDecoder().decode(raw));
}
