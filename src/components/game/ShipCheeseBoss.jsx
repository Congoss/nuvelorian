import { memo, useEffect, useRef, useState } from 'react';
import './shipCheeseBoss.css';

const base = '/ship-cheese-boss/';
const eyes = [
  { left: '45%', top: '1%', width: '18%' },
  { left: '30%', top: '16.5%', width: '14%' },
  { left: '64%', top: '27%', width: '22%' },
  { left: '13%', top: '40%', width: '21%' },
];
function Part({ cell, className = '', style }) {
  return <span aria-hidden="true" className={`cheese-part ${className}`} style={{ ...style, backgroundPosition: `${cell % 2 * 100}% ${Math.floor(cell / 2) * 100}%` }}/>;
}
function ShipCheeseBoss({ hp, hitToken = 0, language = 'uk', fullScene = false }) {
  const rig = useRef(null);
  useEffect(() => {
    if (!hitToken || document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const animation = rig.current?.animate?.([{transform:'translateX(0)'},{transform:'translateX(-1%)',offset:.35},{transform:'translateX(1%)',offset:.65},{transform:'translateX(0)'}],{duration:180,easing:'ease-out'});
    return () => animation?.cancel();
  }, [hitToken]);
  const [active, setActive] = useState(true);
  useEffect(() => {
    const update = () => setActive(!document.hidden);
    update(); document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  const label = { uk: 'Сирний паразит у сирному цеху корабля', ru: 'Сырный паразит в сырном цехе корабля', en: 'Cheese parasite in the spaceship cheese workshop' }[language] || 'Cheese parasite';
  return <div className={`cheese-arena ${fullScene ? 'is-fullscene' : ''} ${active && hp > 0 ? 'is-animated' : ''} ${hp === 0 ? 'is-defeated' : ''}`} role="img" aria-label={label}>
    <img className="cheese-arena-background" src={base + 'cheese-workshop-v3.webp'} alt=""/>
    <div className="cheese-workshop-props" aria-hidden="true">
      <img className="cheese-workshop-paddle" src={base+'workshop-paddle-v1.webp'} alt=""/>
      <i className="cheese-workshop-nozzle"/>
      <img className="cheese-workshop-wheel" src={base+'workshop-wheel-v1.webp'} alt=""/>
      <img className="cheese-workshop-lamp" src={base+'workshop-lamp-v1.webp'} alt=""/>
      <i className="cheese-workshop-drop"/>
      <i className="cheese-reactor-steam cheese-reactor-steam-left"/>
      <i className="cheese-reactor-steam cheese-reactor-steam-right"/>
    </div>
    <div className="cheese-boss-rig" ref={rig}>
      <div className="cheese-boss-breathe">
        <img className="cheese-body" src={base + 'body.webp'} alt=""/>
        {eyes.map((style, index) => <span key={index} aria-hidden="true" className={`cheese-eye cheese-eye-${index}`} style={style}><img src={base + 'eye-blank-v1.webp'} alt=""/><span className="cheese-eye-surface"><i className="cheese-pupil"/><i className="cheese-eyelid"/></span></span>)}
        <Part cell={1} className="cheese-tongue"/>
      </div>
    </div>
    <img aria-hidden="true" alt="" className="cheese-part cheese-rat cheese-rat-floor-left cheese-alien-rat" src={base + 'alien-mouse-left-v2.webp'}/>
    <img aria-hidden="true" alt="" className="cheese-part cheese-rat cheese-rat-floor-right cheese-alien-rat" src={base + 'alien-mouse-right-v3.webp'}/>
    <div className="cheese-arena-vignette"/>
  </div>;
}
export default memo(ShipCheeseBoss);
