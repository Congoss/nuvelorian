import art from '@/assets/hero/pet-1-full.png';
import './JunkSkunkPet.css';
export default function JunkSkunkPet({ className = '', closeUp = false }) {
 return <svg viewBox={closeUp ? '-25 610 390 280' : '0 0 500 896'} className={`junk-skunk-pet pointer-events-none ${className}`} role="img" aria-label="Junk Skunk">
  <g className="junk-skunk-gas" aria-hidden="true">{[0,1,2,3,4].map(i=><g key={i} className="junk-skunk-puff" style={{'--puff-delay': i*.16+'s','--puff-y': (i%2?-15:12)+'px'}}><circle cx={192+i*7} cy={791+(i%3-1)*7} r={13+i*2} fill={i%2?'#87b84a':'#a6c867'} opacity=".55"/><circle cx={202+i*7} cy={784+(i%3-1)*7} r={9+i} fill="#c4dc80" opacity=".28"/></g>)}</g>
  <g className="junk-skunk-breathe"><image href={art} width="500" height="896"/>
   <g className="junk-skunk-eyes"><ellipse cx="15" cy="747" rx="10" ry="12" fill="#ebe8ce"/><ellipse cx="60" cy="750" rx="14" ry="15" fill="#ebe8ce"/><g className="junk-skunk-pupils" fill="#171b16"><ellipse cx="12" cy="746" rx="2.5" ry="3.5"/><ellipse cx="64" cy="748" rx="3" ry="4"/></g></g>
  </g>
 </svg>;
}
