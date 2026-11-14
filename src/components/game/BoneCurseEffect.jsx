import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import smoke from '@/assets/boss/poision.gif';
import skull from '@/assets/buffs/bone-curse-skull-v3.webp';
import { useAnimationsEnabled } from '@/lib/animationPreference';
import './boneCurseEffect.css';

export default function BoneCurseEffect({ onComplete, language = 'uk' }) {
  const reduced = useReducedMotion();
  const enabled = useAnimationsEnabled();
  const animate = enabled && !reduced;
  useEffect(() => {
    const timer = setTimeout(() => onComplete?.(), 1450);
    return () => clearTimeout(timer);
  }, [onComplete]);
  return <motion.div aria-hidden="true" className="bone-curse-burst" initial={animate ? { opacity: 0, scale: .45 } : false} animate={animate ? { opacity: [0, 1, 1, 0], scale: [.45, 1.12, 1, 1.2] } : { opacity: 1 }} transition={{ duration: 1.4, times: [0, .2, .7, 1], ease: 'easeOut' }}>
    <div className="bone-curse-burst-inner">
      {animate && <img className="bone-curse-smoke" src={smoke} alt="" />}
      <div className="bone-curse-aura" />
      <motion.img className="bone-curse-skull" src={skull} alt="" initial={animate ? { scale: .3, rotate: -8 } : false} animate={animate ? { scale: [.3, 1.16, 1, 1.05], rotate: [-8, 3, 0, 0] } : { scale: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }} />
      <span>{language === 'en' ? 'BONE CURSE' : language === 'ru' ? 'КОСТЯНОЕ ПРОКЛЯТИЕ' : 'КІСТЯНЕ ПРОКЛЯТТЯ'}</span>
    </div>
  </motion.div>;
}
