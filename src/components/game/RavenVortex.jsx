import { FEATHER, FEATHERED_WING } from './ravenAuraShapes';
const BIRDS = [
  {x:398,y:139,s:.78,r:-31,v:1,d:17,delay:-4,dx:-22,dy:32},
  {x:90,y:261,s:.49,r:16,v:0,d:21,delay:-14,dx:20,dy:-31},
  {x:418,y:344,s:.63,r:-16,v:0,d:23,delay:-8,dx:-23,dy:29},
  {x:62,y:432,s:.77,r:33,v:1,d:19,delay:-12,dx:27,dy:-24},
  {x:395,y:546,s:.47,r:17,v:0,d:26,delay:-20,dx:19,dy:36},
  {x:104,y:646,s:.64,r:-29,v:1,d:22,delay:-6,dx:-21,dy:-29},
  {x:395,y:711,s:.85,r:-47,v:0,d:25,delay:-18,dx:-27,dy:-24},
  {x:156,y:797,s:.36,r:28,v:1,d:18,delay:-9,dx:25,dy:-21},
];
const TRAILS = [
 'M395 95 C476 177 364 210 400 285 C427 341 465 349 419 406 L435 369 411 379 425 353 C348 247 437 211 395 95 Z',
 'M93 204 C31 281 120 316 74 401 C26 475 97 516 91 589 L76 555 65 576 66 543 C8 434 109 348 93 204 Z',
 'M407 430 C447 482 366 541 420 613 C457 677 373 743 382 805 L396 776 402 791 408 755 C480 668 386 605 407 430 Z',
 'M121 545 C24 622 88 664 59 745 C40 791 106 816 155 836 L121 814 128 817 101 795 C45 755 136 664 121 545 Z',
];
export default function RavenVortex() {
 return <svg viewBox="0 0 500 896" className="bp-set-layer bp-set-raven-vortex" aria-hidden="true">
  <g className="bp-set-ink-streams">{TRAILS.map((d,i)=><path key={i} d={d} className="bp-set-ink-stream" style={{animationDelay:(-i*3.1)+'s',animationDuration:(16+i*2.7)+'s'}}/>)}</g>
  <g fill="none" stroke="#80778e" strokeWidth="1.2" opacity=".22">
   <path d="M410 98 C470 228 339 230 427 380 C471 467 359 552 417 660 C451 736 380 784 372 826"/>
   <path d="M85 206 C11 333 130 353 64 474 C9 610 147 650 51 744 C14 793 88 822 154 837"/>
  </g>
  {BIRDS.map((b,i)=><g key={i} transform={'translate('+b.x+' '+b.y+') rotate('+b.r+') scale('+b.s+')'}>
   <g className="bp-set-crow-fade" style={{animationDuration:(8.7+i%4*2.3)+'s',animationDelay:(-i*3.17-2)+'s'}}>
   <g className="bp-set-vortex-bird" style={{'--arc-x':b.dx+'px','--arc-y':b.dy+'px','--arc-mid-x':b.dx*.25+'px','--arc-mid-y':b.dy*1.4+'px','--arc-end-x':b.dx*-.3+'px','--arc-end-y':b.dy*.55+'px',animationDuration:b.d+'s',animationDelay:b.delay+'s'}}>
     <g transform={'rotate('+(b.v===1?-24:8)+')'}><g className="bp-set-crow-wing bp-set-crow-wing-left" style={{animationDuration:(4.2+i*.37)+'s',animationDelay:(-i*.83)+'s'}}><path d={FEATHERED_WING} transform="scale(.15) translate(-489 -428)" strokeWidth="5"/></g></g>
     <g transform={'scale(-1 1) rotate('+(b.v===1?28:-7)+')'}><g className="bp-set-crow-wing bp-set-crow-wing-right" style={{animationDuration:(4.2+i*.37)+'s',animationDelay:(-i*.83-.18)+'s'}}><path d={FEATHERED_WING} transform="scale(.15) translate(-489 -428)" strokeWidth="5"/></g></g>
     <path d="M-6 0 Q-9-11-2-18 Q6-26 13-20 L24-16 12-13 Q8-5 9 6 L4 24 9 35-1 30-10 34-5 20 Z" className="bp-set-crow-body"/>
   </g>
   </g>
  </g>)}
  {Array.from({length:22},(_,i)=>{
   const x=i%2?373+(i*29)%78:37+(i*17)%81,y=180+(i*43)%626;
   return <g key={'feather'+i} opacity=".35" transform={'translate('+x+' '+y+') rotate('+(i*41%160-80)+') scale('+(.35+(i%4)*.13)+')'}><g className="bp-set-vortex-feather" style={{animationDelay:(-i*.71)+'s',animationDuration:(9+i%5*1.6)+'s'}}><path d={FEATHER} transform="rotate(-43) scale(.085) translate(-50 -490)" fill="#bec0cc" stroke="#dedee744" strokeWidth="5"/></g></g>;
  })}
  {Array.from({length:34},(_,i)=><circle key={'dust'+i} cx={i%2?366+(i*19)%101:27+(i*31)%119} cy={120+(i*47)%721} r={.8+i%3*.55} fill={i%3?'#777183':'#26212e'} className="bp-set-vortex-dust" style={{animationDelay:(-i*.63)+'s',animationDuration:(7+i%6*1.3)+'s'}}/>)}
 </svg>;
}
