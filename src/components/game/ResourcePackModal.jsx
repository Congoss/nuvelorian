import {useEffect,useState} from 'react';
import {getPaymentRates} from '@/services/paymentsApi';
import {createPortal} from 'react-dom';
import {RESOURCE_PACKS} from '@/lib/resourcePacks';
import {applyFriday13SaleToProduct} from '@/lib/friday13Event';
import {isWebPlatform} from '@/lib/platform/config';
import {getResourceIcon} from '@/lib/resourceIcons';
import cardPlayIcon from '@/assets/card-game/extra-play.webp';
import GameTextureButton from './GameTextureButton';
import PaymentMethodPicker from './PaymentMethodPicker';
import Friday13Pet from './Friday13Pet';
import './resourcePacks.css';
export default function ResourcePackModal({language='uk',initialPack=0,onClose,onRefreshProfile,onOpenPet}){
 const [nearUsd,setNearUsd]=useState(0),[payment,setPayment]=useState(false),[success,setSuccess]=useState(false);
 useEffect(()=>{if(!isWebPlatform)return;let active=true;getPaymentRates().then(r=>{const rate=Number(r?.nearUsd);if(active&&rate>0)setNearUsd(rate)}).catch(()=>{});return()=>{active=false}},[]);
 const base=RESOURCE_PACKS[initialPack],pack=applyFriday13SaleToProduct(base);
 if(!pack)return null;
 const lang=language==='ua'?'uk':language;
 const t=lang==='en'?{normal:'Boobs',improved:'Booba-Shmooba',premium:'Cosmol',spins:'Spins',energy:'Energy',small:'Small poison',medium:'Medium poison',large:'Large poison',cards:'Card plays',buy:'BUY',close:'Close',done:'Pet and cards credited. Resources delivered to in-game mail.'}:lang==='ru'?{normal:'Бубс',improved:'Буба-Шмуба',premium:'Космол',spins:'Спины',energy:'Энергия',small:'Малый яд',medium:'Средний яд',large:'Большой яд',cards:'Карточная игра',buy:'КУПИТЬ',close:'Закрыть',done:'Пет и карты начислены. Ресурсы — на игровой почте.'}:{normal:'Бубс',improved:'Буба-Шмуба',premium:'Космол',spins:'Спіни',energy:'Енергія',small:'Мала отрута',medium:'Середня отрута',large:'Велика отрута',cards:'Карткова гра',buy:'КУПИТИ',close:'Закрити',done:'Пет і карти нараховані. Ресурси — на ігровій пошті.'};
 const name=pack.names[lang]||pack.names.uk;
 const rewards=[['small-poison',pack.poisons[0],t.small],['medium-poison',pack.poisons[1],t.medium],['large-poison',pack.poisons[2],t.large],...['normal','improved','premium'].map(k=>[k,pack.gums[k],t[k]]),['spin',pack.spins,t.spins],['cards',pack.cardPlays||0,t.cards],['energy',pack.energy||0,t.energy]].filter(([,q])=>q>0);
 return createPortal(<div className="resource-pack-overlay" onClick={e=>{if(e.target===e.currentTarget&&!payment)onClose()}} role="dialog" aria-modal="true" aria-label={name}><section className={`resource-pack-modal${pack.petId?' friday13-promo-modal':''}`} style={{'--pack-art':`url('${pack.petId?'/friday13/arena.webp':pack.art}')`}}><button className="resource-pack-close" type="button" aria-label={t.close} onClick={onClose}>×</button><header className="resource-pack-top-title"><p className="resource-pack-number">{pack.title}</p><h2>{name}</h2></header>{pack.petId?<div className="friday13-promo-showcase"><Friday13Pet label={name}/><button type="button" className="friday13-pet-info-button" aria-label={lang==='en'?'Pet details':lang==='ru'?'Информация о пете':'Інформація про пета'} onClick={()=>onOpenPet?.(pack.petId)}>?</button></div>:<div className="resource-pack-art" aria-hidden="true"/>}<div className="resource-pack-content"><div className="resource-pack-rewards">{rewards.map(([key,qty,title])=><div key={key}><div className="resource-pack-reward-art">{['normal','improved','premium'].includes(key)?<i className="resource-pack-gum" style={{backgroundPosition:({normal:0,improved:50,premium:100})[key]+'% center'}}/>:<img src={key==='cards'?cardPlayIcon:getResourceIcon(key)} alt=""/>}</div><strong>×{qty.toLocaleString()}</strong><span>{title}</span></div>)}</div><GameTextureButton type="button" tone="yellow" onClick={()=>setPayment(true)}><span className="relative z-10">{t.buy} · {isWebPlatform?(nearUsd?<><del className="mr-2 text-xs opacity-60">{(base.usd/nearUsd).toFixed(3)}</del>{(pack.usd/nearUsd).toFixed(3)} NEAR</>:'NEAR · …'):<><del className="mr-2 text-xs opacity-60">{base.stars}</del>{pack.stars} ★</>}</span></GameTextureButton>{success&&<p role="status" className="resource-pack-success">{t.done}</p>}</div></section>{payment&&<PaymentMethodPicker pack={{...base,title:name,icon:pack.art}} paymentMethods={isWebPlatform?[{id:'near',title:'NEAR'}]:[{id:'telegram_stars',title:'Stars'}]} initialMethodId={isWebPlatform?'near':'telegram_stars'} onClose={()=>setPayment(false)} onSuccess={async()=>{setPayment(false);setSuccess(true);await onRefreshProfile?.();onClose()}}/>}</div>,document.body);
}
