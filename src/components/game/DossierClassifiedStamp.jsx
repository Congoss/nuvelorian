import { useId } from 'react';

export default function DossierClassifiedStamp({ language = 'ru' }) {
  const id = `dossier-ink-${useId().replace(/:/g, '')}`;
  const copy = { uk: ['СЕКРЕТНО', 'АРХІВ P4', 'ДОСТУП ОБМЕЖЕНО'], ru: ['СЕКРЕТНО', 'АРХИВ P4', 'ДОСТУП ОГРАНИЧЕН'], en: ['CLASSIFIED', 'P4 ARCHIVE', 'RESTRICTED ACCESS'] }[language];
  return <svg className="dossier-ink-stamp" viewBox="0 0 280 112" role="img" aria-label={copy[0]}>
    <defs><filter id={id} x="-4%" y="-8%" width="108%" height="116%">
      <feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="3" seed="17" result="noise"/>
      <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  6 0 0 0 -1.9" result="grain"/>
      <feComposite in="SourceGraphic" in2="grain" operator="in" result="ink"/>
      <feDisplacementMap in="ink" in2="noise" scale=".7" xChannelSelector="R" yChannelSelector="G"/>
    </filter></defs>
    <g filter={`url(#${id})`} fill="currentColor" textAnchor="middle" fontFamily="'Courier New', monospace">
      <path d="M12 9 267 11 269 101 10 103Z" fill="none" stroke="currentColor" strokeWidth="3.5"/>
      <path d="M18 16 261 17 261 95 17 96Z" fill="none" stroke="currentColor" strokeWidth="1.2"/>
      <text x="140" y="35" fontSize="11" fontWeight="700" letterSpacing="3">{copy[1]}</text>
      <text x="140" y="70" fontSize={language === 'en' ? '30' : '34'} fontWeight="900" letterSpacing="1.5">{copy[0]}</text>
      <text x="140" y="87" fontSize="9" fontWeight="700" letterSpacing="1.8">{copy[2]}</text>
    </g>
  </svg>;
}
