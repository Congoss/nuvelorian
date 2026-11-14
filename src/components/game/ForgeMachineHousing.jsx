import {useId} from 'react';
// Stationary housing. Slots, gauge values and rams remain interactive layers.
export default function ForgeMachineHousing(){
 const id=useId().replace(/:/g,'');
 return <svg className="forge-machine-housing" viewBox="0 0 600 350" aria-hidden="true">
 <defs><linearGradient id={id+'metal'} x2=".8" y2="1"><stop stopColor="#51483a"/><stop offset=".5" stopColor="#292823"/><stop offset="1" stopColor="#151719"/></linearGradient></defs>
 <g stroke="#100f0d" strokeWidth="5" strokeLinejoin="round">
 <path d="M23 321V151Q14 80 61 56L111 54M513 65Q578 62 575 136V307" fill="none" stroke="#302a22" strokeWidth="18"/>
 <path d="M23 321V151Q14 80 61 56M533 68Q578 62 575 136" fill="none" stroke="#80613d" strokeWidth="5"/>
 <path d="M50 305L35 293V142L51 108H171L194 140V301L177 321H57Z" fill={'url(#'+id+'metal)'}/>
 <path d="M411 307L400 285V144L423 111H548L565 142V301L545 322Z" fill={'url(#'+id+'metal)'}/>
 <path d="M67 105V79L78 69H116L129 81V106Z" fill="#4e3b29"/><path d="M79 94V80H113V94Z" fill="#ff861e"/>
 <path d="M463 109V81L477 70H513L524 84V109Z" fill="#4e3b29"/><path d="M476 96V82H509V96Z" fill="#ff861e"/>
 <path d="M46 157L58 141H165L178 156V266L165 281H59L46 268Z" fill="#ae4c1b"/>
 <path d="M57 160L65 151H158L168 160V262L159 271H66L57 261Z" fill="#f08425" strokeWidth="3"/>
 <rect x="67" y="169" width="91" height="91" rx="3" fill="#080c0e" stroke="#51321d"/>
 <path d="M74 133V111H149V133Z" fill="#151717" stroke="#746148" strokeWidth="4"/>
 <circle cx="487" cy="210" r="76" fill="#9e461c"/>
 <circle cx="487" cy="210" r="66" fill="#eb8b31" strokeWidth="3"/>
 <circle cx="487" cy="210" r="56" fill="#e9d8ae" stroke="#372a20" strokeWidth="3"/>
 <path d="M47 291H177M426 300H550" stroke="#8d7250" strokeWidth="3"/>
 <path d="M30 320L61 300H184L202 315H398L414 301H549L574 320L584 339H17Z" fill={'url(#'+id+'metal)'}/>
 <path d="M192 317H405L392 330H205Z" fill="#be5920" strokeWidth="3"/>
 <path d="M221 306H375L384 318H211Z" fill="#211f1b" stroke="#786044" strokeWidth="3"/>
 <path d="M229 307L237 317M252 307L260 317M275 307L283 317M298 307L306 317M321 307L329 317M344 307L352 317" stroke="#c35c22" strokeWidth="3"/>
 <path d="M42 192H26V237H43M565 174H580V229H564" fill="#a54a1e" strokeWidth="4"/>
 </g>
 <g fill="#171714" stroke="#8d7954" strokeWidth="2">{[[53,152],[173,152],[53,272],[173,272],[421,146],[548,147],[420,293],[551,294],[47,326],[180,322],[421,323],[555,328]].map(([x,y])=><circle key={x+','+y} cx={x} cy={y} r="4"/>)}</g>
 <g stroke="#c9ad78" strokeWidth="2" opacity=".45"><path d="M61 148L76 146M49 249L56 244M149 274L159 270M433 126L448 123M539 289L548 285M71 314L82 311M493 324L510 321"/></g>
 <g stroke="#181714" strokeWidth="3">{Array.from({length:13},(_,i)=>{const a=(-150+i*25)*Math.PI/180;return <path key={i} d={`M${487+46*Math.cos(a)} ${210+46*Math.sin(a)}L${487+51*Math.cos(a)} ${210+51*Math.sin(a)}`}/>})}</g>
 <g stroke="#131412" strokeWidth="3"><path d="M70 292H104M117 292H151M448 309H481M502 310H531"/></g>
 </svg>;
}
