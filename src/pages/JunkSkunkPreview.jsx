import { useState } from 'react';
import JunkSkunkPet from '@/components/game/JunkSkunkPet';
export default function JunkSkunkPreview() {
 const [paused,setPaused]=useState(false);
 return <main style={{minHeight:'100dvh',background:'radial-gradient(ellipse at center,#26382d,#090f0d 75%)',color:'#edf3dc',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,gap:16}}>
  <h1 style={{fontSize:24,fontWeight:800}}>Junk Skunk</h1>
  <p style={{color:'#a9bf9b'}}>Пет Шорка · живі очі, хвіст і зелена хмарка</p>
  <div className={paused?'preview-paused':''} style={{width:'min(100%,560px)'}}><JunkSkunkPet closeUp className="w-full" /></div>
  <button onClick={()=>setPaused(v=>!v)} style={{padding:'10px 24px',background:'#c4d86c',color:'#172113',borderRadius:8,fontWeight:700}}>{paused?'Продовжити':'Пауза'}</button>
  <a href="/clan-ship-preview" style={{color:'#a9bf9b'}}>← Корабель</a>
 </main>;
}

