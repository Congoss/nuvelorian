import soldierBackground from '@/assets/ui/soldier-profile-strip-v2.webp';
import kangarooBackground from '@/assets/ui/kangaroo-profile-strip-v1.webp';
import gumQueenBackground from '@/assets/ui/gumqueen-profile-strip-v2.webp';
import shkrabanProfileBackground from '@/assets/ui/shkraban-profile-strip-v1.webp';
import './bossProfileFrame.css';
import mothProfileBackground from '@/assets/ui/moth-profile-bg-v1.png';
import shorkProfileBackground from '@/assets/ui/shork-profile-bg-v5.png';
import wormProfileBackground from '@/assets/ui/worm-profile-bg-v2.png';
import sporgolProfileBackground from '@/assets/ui/sporgol-profile-strip-v3.png';
import suckholeProfileBackground from '@/assets/ui/suckhole-profile-strip-v1.png';
import cleopatrashProfileBackground from '@/assets/ui/cleopatrash-profile-sunny-v1.png';
import cheeseProfileBackground from '@/assets/ui/cheese-profile-bg-v1.png';

const paths={
  'ship-engine':'M6 21 24 4H976l18 17v58l-18 17H24L6 79Z',
  'ship-hangar':'M8 8H992V92H8Z',
  'ship-portal':'M28 6H337C351 6 357 12 368 12C379 12 384 6 397 6H972Q994 6 994 28V73Q994 94 972 94H699C682 94 681 87 666 87C651 87 646 94 630 94H28Q6 94 6 73V28Q6 6 28 6Z',

  cheese:'M6 8Q90 3 155 7L318 5Q326 16 335 7L605 6Q610 15 617 11Q625 23 633 9L817 6Q900 3 994 8L993 91Q948 98 900 92L715 94Q708 83 700 92L377 94Q369 82 360 88Q350 78 343 93L157 94Q80 99 6 93Z',
  tank:'M6 8Q95 3 180 8T360 7Q490 3 595 7Q617 8 628 4Q640 0 649 7Q655 12 661 12Q668 12 675 6Q685 0 695 7Q703 12 711 10Q722 7 735 7Q850 3 994 8L994 94Q860 98 740 94Q721 93 711 97Q700 101 690 94Q681 88 674 88Q666 88 657 95Q646 102 637 95Q628 89 617 91Q548 96 480 94H424Q413 94 413 87Q413 83 409 83Q405 83 405 88Q405 95 393 95Q220 98 6 94Z',
  chinook:'M5 8 128 6 136 3 249 7 258 11 386 8 397 4 523 6 532 10 662 7 671 3 794 7 805 11 995 6 994 94 841 92 830 88 686 92 675 97 526 92 515 88 380 93 371 97 218 92 207 88 5 95Z',
  boss4:'M6 8Q180 3 350 8T700 8Q850 3 994 8L994 92Q800 98 600 92T200 92Q80 98 6 92Z',
  boss5:'M6 9Q25 1 42 8L180 6Q200 0 217 8L400 6Q420 0 440 8L650 6Q670 0 690 8L860 6Q880 0 900 8H994V94L830 92Q800 99 780 92L550 94Q530 100 510 92L290 94Q270 100 250 92H6Z',
  boss6:'M8 10Q210-3 400 7T700 8Q900-2 992 10Q976 50 992 90Q800 103 600 93T300 92Q100 102 8 90Q24 50 8 10Z',
  boss7:'M5 5H160l12 5h250l10-5h140l10 5h250l10-5h153v90H840l-10-5H580l-10 5H430l-10-5H170l-10 5H5Z',
  boss8:'M18 7Q110 0 220 4L777 4Q904 0 981 8Q994 10 994 26L993 76Q992 92 978 94Q896 100 779 96L220 96Q103 100 19 93Q6 91 6 76L6 25Q6 10 18 7Z',
};
const colors={'ship-engine':['#70754a','#bdb787'],'ship-hangar':['#9d5543','#dbaf7f'],'ship-portal':['#56344f','#f2b8d1'],tank:['#b67ac9','#f0c3ec'],chinook:['#a46d43','#e2b26a'],boss4:['#ae7e70','#e6bc98'],boss5:['#8f9d50','#c8dc8b'],boss6:['#815da5','#c3a0ee'],boss7:['#c39a48','#f2d084'],boss8:['#627a79','#b0c6ad']};
export default function BossProfileFrame({bossId}){
  const eventFrame = bossId.startsWith('friday13_');
  const eventRank = Number(bossId.slice(-1));
  const [base,light]=eventFrame ? [['#a90c19','#f54b48'],['#85101c','#d73942'],['#620e19','#b82a35']][eventRank-1] : bossId==='cheese'?['#d5a442','#f7dc8a']:colors[bossId]||colors.tank;
  return <div aria-hidden="true" className={`boss-profile-frame theme-${bossId}`}>
    {eventFrame&&<img className="boss-profile-art" src={`/friday13/${bossId}.webp`} alt=""/>}
    {bossId==='ship-engine'&&<img className="boss-profile-art" src={soldierBackground} alt=""/>}
    {bossId==='ship-hangar'&&<img className="boss-profile-art" src={kangarooBackground} alt=""/>}
    {bossId==='ship-portal'&&<img className="boss-profile-art" src={gumQueenBackground} alt=""/>}
    <div className="boss-profile-scene">
      {bossId==='boss7'&&<svg className="boss-profile-pyramids" viewBox="0 0 1000 100" preserveAspectRatio="none">
        <path d="M325 85 377 46 432 85 476 85 527 26 594 85 632 85 673 51 732 85Z" fill="#646555" opacity=".58"/>
        <path d="m377 46 14 39h41Zm150-20 19 59h48Zm146 25 14 34h45Z" fill="#303d3a" opacity=".9"/>
        <path d="m477 84 50-58 18 57m-219 1 51-38 13 37m243 1 40-33 13 32" fill="none" stroke="#92917a" strokeOpacity=".25" strokeWidth="1"/>
        <path d="M265 88q93-15 186 0t183-1 169 3v10H265Z" fill="#4a5247" opacity=".55"/>
        <path d="M292 92q101-9 199-1t199-1" fill="none" stroke="#979178" strokeOpacity=".18" strokeWidth="2"/>
      </svg>}
    </div>
    {bossId==='tank'&&<img className="boss-profile-art" src={mothProfileBackground} alt=""/>}
    {bossId==='chinook'&&<img className="boss-profile-art" src={shorkProfileBackground} alt=""/>}
    {bossId==='boss4'&&<img className="boss-profile-art" src={wormProfileBackground} alt=""/>}
    {bossId==='boss5'&&<img className="boss-profile-art" src={sporgolProfileBackground} alt=""/>}
    {bossId==='boss6'&&<img className="boss-profile-art" src={suckholeProfileBackground} alt=""/>}
    {bossId==='boss7'&&<img className="boss-profile-art" src={cleopatrashProfileBackground} alt=""/>}
    {bossId==='boss8'&&<img className="boss-profile-art" src={shkrabanProfileBackground} alt=""/>}
    {bossId==='cheese'&&<img className="boss-profile-art" src={cheeseProfileBackground} alt=""/>}
    {bossId==='chinook'&&<svg className="boss-profile-junk-scene" viewBox="0 0 1000 100" preserveAspectRatio="none">
      <path d="M0 0h1000v100H0Z" fill="#27322e"/>
      <path d="M0 4 191 0l-12 100H0Zm1000-4H823l22 100h155Z" fill="#48605b"/>
      <path d="m0 7 190-3-2 12L0 20Zm1000-3H825l3 15 172-7Z" fill="#71847a"/>
      <path d="m191 0-12 100m644-100 22 100" stroke="#111c18" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
      <path d="m198 0-12 100m630-100 22 100" stroke="#9da082" strokeOpacity=".2" vectorEffect="non-scaling-stroke"/>
      <path d="m5 62 98-7 9 45H0Zm995-33-87 8 5 55 82-3Z" fill="#a16c48" stroke="#1a241e" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
      <path d="m12 69 83-6m-78 13 80-6m-75 13 78-6m-76 12 79-6m819-38 70-7m-69 16 68-7m-67 16 66-7" stroke="#d4a063" strokeOpacity=".28" vectorEffect="non-scaling-stroke"/>
      <path d="m386 1 121 1 10 18-118 5Z" fill="#43544c" stroke="#16221c" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
      <path d="m410 3 18 0-11 19-17 2m44-21h16l-11 18-17 1m45-19h16l-11 17-17 1" fill="#b7985055"/>
      <path d="m500 81 146 4-3 15H488Z" fill="#6d775f" stroke="#17211a" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
      <path d="m519 86 25 2m26 1 25 1m27 1 12 1" stroke="#b4ae81" strokeOpacity=".45" strokeWidth="1.4" vectorEffect="non-scaling-stroke"/>
      <path d="m28 30 7 3m-4-7v12m922-15 7 3m-4-7v12m-768 39 6 2m-3-6v10" stroke="#14201b" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
    </svg>}
    <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="boss-profile-border">
      <path d={paths[bossId]||(eventFrame?'M6 9 85 5 95 9 270 5 283 10 454 5 468 8 658 4 674 9 842 5 857 8 992 5 995 32 990 44 994 91 889 96 873 91 690 96 674 92 458 96 442 91 241 96 225 92 8 96 4 67 9 53Z':paths.tank)} fill="none" stroke="#10130f" strokeWidth="8" vectorEffect="non-scaling-stroke"/>
      <path d={paths[bossId]||(eventFrame?'M6 9 85 5 95 9 270 5 283 10 454 5 468 8 658 4 674 9 842 5 857 8 992 5 995 32 990 44 994 91 889 96 873 91 690 96 674 92 458 96 442 91 241 96 225 92 8 96 4 67 9 53Z':paths.tank)} fill="none" stroke={base} strokeWidth="5" vectorEffect="non-scaling-stroke"/>
      <path d={paths[bossId]||(eventFrame?'M6 9 85 5 95 9 270 5 283 10 454 5 468 8 658 4 674 9 842 5 857 8 992 5 995 32 990 44 994 91 889 96 873 91 690 96 674 92 458 96 442 91 241 96 225 92 8 96 4 67 9 53Z':paths.tank)} fill="none" stroke={light} strokeWidth="1" vectorEffect="non-scaling-stroke"/>
      {bossId==='ship-engine'&&<g strokeLinejoin="round">
        <path d="M8 22 26 6h74v8H30L16 28v43l14 15h70v8H26L8 78ZM900 6h74l18 16v56l-18 16h-74v-8h70l14-15V28l-14-14h-70Z" fill="#535b43" stroke="#252f28" strokeWidth="1.2" vectorEffect="non-scaling-stroke"/>
        {[{x:36,y:10},{x:964,y:10},{x:36,y:90},{x:964,y:90}].map(({x,y})=><g key={`${x}-${y}`}><circle cx={x} cy={y} r="3" fill="#a0a18a" stroke="#28312b" strokeWidth="1" vectorEffect="non-scaling-stroke"/><path d={`M${x-1.5} ${y}h3`} stroke="#344036" strokeWidth="1" vectorEffect="non-scaling-stroke"/></g>)}
        <path d="M270 4h69l-8 6h-69Zm18 0-8 6m24-6-8 6m24-6-8 6" fill="#b2a369" stroke="#3a4030" strokeWidth="1.6" vectorEffect="non-scaling-stroke"/>
        <path d="M640 94h60m-60-2h18m8 0h12" stroke="#c6bea0" strokeWidth="1" vectorEffect="non-scaling-stroke"/>
      </g>}
      {bossId==='ship-hangar'&&<g strokeLinejoin="round">
        <path d="M17 12H983M17 88H983" fill="none" stroke="#e0b58a" strokeWidth="1" vectorEffect="non-scaling-stroke"/>
        <path d="M8 28V8h30v8H17v12ZM962 8h30v20h-9V16h-21ZM8 72v20h30v-8H17V72ZM962 92h30V72h-9v12h-21Z" fill="#a44b3c" stroke="#402b29" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
        <path d="M12 11h20m936 0h19M12 89h20m936 0h19" stroke="#e8a181" strokeWidth="1" vectorEffect="non-scaling-stroke"/>
        <path d="M187 5h27v11h-27ZM780 84h27v11h-27Z" fill="#c8b994" stroke="#4b3d34" strokeWidth="1" vectorEffect="non-scaling-stroke"/>
        <path d="M193 6v9m6-9v9m6-9v9m581 70v9m6-9v9m6-9v9" stroke="#897c62" strokeWidth=".8" vectorEffect="non-scaling-stroke"/>
      </g>}
      {bossId==='ship-portal'&&<g strokeLinecap="round" strokeLinejoin="round">
        <path d={paths['ship-portal']} fill="none" stroke="#59334f" strokeWidth="7" vectorEffect="non-scaling-stroke"/>
        <path d={paths['ship-portal']} fill="none" stroke="#b27a96" strokeWidth="3.5" vectorEffect="non-scaling-stroke"/>
        <path d="M28 4H337C351 4 357 10 368 10C379 10 384 4 397 4H967Q990 4 992 26M14 29v15" fill="none" stroke="#ffd1e3" strokeWidth="1.3" vectorEffect="non-scaling-stroke"/>
        <path d="M29 96H630C646 96 651 89 666 89C681 89 682 96 699 96H970" fill="none" stroke="#d59ab5" strokeWidth="1.1" vectorEffect="non-scaling-stroke"/>
      </g>}
      {bossId==='cheese'&&<g fill="#926326" stroke="#503b1c" strokeWidth="1" vectorEffect="non-scaling-stroke">
        <ellipse cx="146" cy="7" rx="7" ry="2.4"/><ellipse cx="435" cy="94" rx="9" ry="2.1"/><ellipse cx="811" cy="6" rx="6" ry="2.2"/><ellipse cx="970" cy="93" rx="5" ry="2.1"/>
        <path d="m186 5 18 1m269 88 25 0m351-88 19-1" fill="none" stroke="#fff0b0" strokeWidth="1.4"/>
      </g>}
      {bossId==='chinook'&&<><path d="m139 5 105 3m13 2 126-2m14-3 126 2m16 3 124-3m18-4 120 3m-620 85 145 1m13 2 130-3m15 0 132 3m16 2 133-3" fill="none" stroke="#e5b66a" strokeWidth="1.4" vectorEffect="non-scaling-stroke"/><path d="m110 6 9 4m4-8 10 8m570 78 10 4m-2-10 9 5m-410-79 7 5m2 68 8 5" stroke="#392c22" strokeWidth="2.2" strokeLinecap="round" vectorEffect="non-scaling-stroke"/></>}
      {bossId==='chinook'&&<g className="scrap-rivets">
        {[{x:420,y:8},{x:970,y:92}].map(({x,y})=><g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
          <path d="M-7-3.5 0-7 7-3.5 7 3.5 0 7-7 3.5Z" fill="#aeb9bc" stroke="#263238" strokeWidth="1.8" vectorEffect="non-scaling-stroke"/>
          <path d="m-4-3 4-2 4 2v6L0 5l-4-2Z" fill="#49575c" stroke="#d4dcda" strokeWidth=".8" vectorEffect="non-scaling-stroke"/>
          <circle r="1.8" fill="#182126" stroke="#7b898c" strokeWidth=".7" vectorEffect="non-scaling-stroke"/>
        </g>)}
      </g>}
      {bossId==='boss5'&&<><path d="M140 7q10 12 26 5m-10-5 14 8m480 78q-10-13-25-6m13 6-16-10" fill="none" stroke="#b9cd8b" strokeWidth="2" vectorEffect="non-scaling-stroke"/><path d="m675 7 20 2 6 5m-8-6 10-4m-9 87 16-4 9 5m-9-5 3-6" fill="none" stroke="#d0d6a5" strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke"/></>}
      {bossId==='boss6'&&<><path d="M70 8q170 8 240-3m380 89q150-9 240-1" fill="none" stroke="#debbf3" strokeWidth="2" vectorEffect="non-scaling-stroke"/><path d="m340 4 13 4-7 5m310 81-10-5 9-5" fill="none" stroke="#30213e" strokeWidth="2" vectorEffect="non-scaling-stroke"/></>}
      {bossId==='boss7'&&<><path d="M180 6h620M180 94h620" stroke="#315f66" strokeWidth="2" strokeDasharray="15 5" vectorEffect="non-scaling-stroke"/><path d="m475 5 25 8 25-8m-50 90 25-8 25 8" fill="#e6bd60" stroke="#31291a" vectorEffect="non-scaling-stroke"/></>}
      {bossId==='boss8'&&<g strokeLinejoin="round" strokeLinecap="round">
        <path d="M18 9Q88 3 140 6L133 13Q75 10 19 17L17 83Q75 90 133 87L140 94Q72 98 18 91Q10 90 10 78V22Q10 12 18 9Z" fill="#34484a" stroke="#15282b" strokeWidth="1.2" vectorEffect="non-scaling-stroke"/>
        <path d="M860 6Q930 3 981 10L983 89Q933 98 860 94L868 87Q925 91 976 83V18Q922 10 868 13Z" fill="#34484a" stroke="#15282b" strokeWidth="1.2" vectorEffect="non-scaling-stroke"/>
        <path d="M143 9Q480 5 855 9M143 91Q480 95 855 91" fill="none" stroke="#1a3035" strokeWidth="3" vectorEffect="non-scaling-stroke"/>
        <path d="M149 10Q482 7 850 10" fill="none" stroke="#d1ddbb" strokeOpacity=".6" strokeWidth="1" vectorEffect="non-scaling-stroke"/>
        <path d="m28 8 28-1m6 0 20-1m833 88 24-1m6 0 18-2" stroke="#15282b" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
        <path d="m31 8 20-1m13 0 15-1m839 88 18-1m12-1 12-1" stroke="#93aaa0" strokeWidth=".7" vectorEffect="non-scaling-stroke"/>
        <path d="m420 5 5 6h38l5-6" fill="#364d4e" stroke="#172a2b" strokeWidth="1" vectorEffect="non-scaling-stroke"/>
        <path d="M430 7h6m3 0h6m3 0h6" stroke="#d8bd6e" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
        <path d="m520 94 4-5h39l5 5" fill="#283d40" stroke="#172a2b" strokeWidth="1" vectorEffect="non-scaling-stroke"/>
        <circle cx="551" cy="92" r="1.5" fill="#91c56e"/>
      </g>}
      {eventFrame&&<g strokeLinejoin="round">
        <path d="M38 8q6 3 11 0l5 17q2 7 5 0l2-15 24-2 2 26q1 12 5 12t4-12l1-23 58-3 5 12q2 5 4-1l1-10M688 8l4 14q2 8 5 0l2-13 21-1 2 31q1 10 4 10t4-11l1-29 22-1 3 15q2 6 5-1l2-14M954 8l3 18q1 5 3 0l3-19M104 94l-2-17q-1-8-4-8t-3 9l-1 17M808 94l-2-23q-1-8-4-8t-3 8l-1 22" fill={base} stroke="#21070b" strokeWidth="1" vectorEffect="non-scaling-stroke"/>
        <path d="m13 15 57-2m96-2 93-1m252 0 128-2m127 2 72-2m-777 79 82 2m159 1 91-1m301 0 94 1" fill="none" stroke={light} strokeWidth="1.2" vectorEffect="non-scaling-stroke"/>
        <g fill={base}><circle cx="186" cy="15" r="2"/><circle cx="190" cy="21" r="1"/><circle cx="616" cy="85" r="3"/><circle cx="625" cy="89" r="1.5"/></g>
      </g>}
    </svg>
    <div className="boss-profile-readability"/>
    {eventFrame&&<div className="friday13-profile-title"><b className="friday13-blood-number">13<sup>th</sup></b><span className="friday13-rank-number">#{eventRank}</span></div>}
    
  </div>;
}
