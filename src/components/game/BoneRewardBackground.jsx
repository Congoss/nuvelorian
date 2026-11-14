import { useAnimationsEnabled } from '@/lib/animationPreference';

export default function BoneRewardBackground({ animated }) {
  const enabled = useAnimationsEnabled() && animated;
  return <div aria-hidden="true" className={`bp-bone-effect ${enabled ? '' : 'bp-effect-static'}`}>
    <svg className="bp-bone-sigil" viewBox="0 0 120 120" fill="none"><path d="M60 10 104 35 104 85 60 110 16 85 16 35Z" /><path d="M60 23 93 42 93 78 60 97 27 78 27 42Z M60 10V23 M104 35 93 42 M104 85 93 78 M60 110V97 M16 85 27 78 M16 35 27 42" /><path d="m45 34 5 6-5 6m30-12-5 6 5 6M36 65h7m34 0h7M54 91l6-8 6 8" /></svg>
    <div className="bp-bone-mist"><i /><i /><i /></div>
    <div className="bp-bone-embers">{Array.from({ length: 5 }, (_, i) => <i key={i} style={{ '--i': i }} />)}</div>
  </div>;
}
