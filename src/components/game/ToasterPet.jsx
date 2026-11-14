import { useRef } from 'react';
import { useSceneAnimationsEnabled } from '@/lib/animationPreference';
import LocalToasterPet from './LocalToasterPet';
import './localTvHead.css';
export default function ToasterPet({ className = '' }) {
  const root = useRef(null), active = useSceneAnimationsEnabled(root);
  return <div ref={root} className={className}><svg viewBox="300 630 240 265" className="h-full w-full overflow-visible"><LocalToasterPet active={active} /></svg></div>;
}
