import { useRef } from 'react';
import { useSceneAnimationsEnabled } from '@/lib/animationPreference';
export default function CleopatraCampBackground() {
  const root=useRef(null);
  const enabled=useSceneAnimationsEnabled(root);
  return <div ref={root} className="absolute inset-0 pointer-events-none" aria-hidden="true">
    {enabled ? <iframe title="Cleopatrash temple" src="/boss7-scene/background.html" className="h-full w-full border-0" tabIndex={-1} /> : <img src="/boss7-scene/arena.webp" alt="" className="h-full w-full object-cover" />}
  </div>;
}
