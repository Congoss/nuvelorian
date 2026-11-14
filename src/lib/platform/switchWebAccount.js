export async function switchWebAccount({
 logout=()=>fetch('/api/auth/web/logout',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:'{}'}),
 disconnect=()=>import('./nearWallet.js').then(m=>m.disconnectNearSession()),
 clearSelection=()=>window.localStorage.removeItem('selected-wallet'),
 navigate=()=>window.location.assign('/?switchAccount=1'),
}={}){
 const response=await logout();
 if(!response.ok)throw Error('Не вдалося завершити вхід. Спробуй ще раз.');
 // Wallet unlink is deliberately never called: it could remove the only
 // recovery method. The app cookie is already cleared before navigation.
 let timer;
 await Promise.race([Promise.resolve().then(disconnect).catch(()=>{}),new Promise(resolve=>{timer=setTimeout(resolve,500);})]);
 clearTimeout(timer);
 clearSelection();
 navigate();
}
