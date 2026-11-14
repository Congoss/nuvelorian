import { useAnimationsEnabled } from '@/lib/animationPreference';
import './friday13Pet.css';
export default function Friday13Pet({className='',label='Little Thirteen'}) {
 const animated=useAnimationsEnabled();
 return <div className={`friday13-pet${animated?' is-animated':''} ${className}`} role="img" aria-label={label}>
  <img className="friday13-pet-body" src="/friday13/promo-pet-body-v5.webp" alt=""/>
  <img className="friday13-pet-arm" src="/friday13/promo-pet-arm-v5.webp" alt=""/>
  <div className="friday13-pet-head"><img src="/friday13/promo-pet-head-v5.webp" alt=""/>{animated&&<><i className="friday13-tear left"/><i className="friday13-tear right"/></>}</div>
 </div>;
}
