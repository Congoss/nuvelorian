import { SKELETON_SEASON_TEXT, skeletonLanguage } from '@/lib/skeletonSeasonText';
import { describeEquipmentBonuses } from './equipmentData';
import { useState } from 'react';
import BoneCurseEffect from './BoneCurseEffect';
import { SKELETON_BP_EQUIPMENT, SKELETON_BP_SET_BONUSES } from '@/lib/skeletonBattlePassSet';

export default function SkeletonSetDetails({ slot, curseIcon, language = 'uk' }) {
  const [effectId, setEffectId] = useState(0);
  const lang = skeletonLanguage(language);
  const copy = SKELETON_SEASON_TEXT[lang];
  const item = SKELETON_BP_EQUIPMENT[slot];
  if (!item) return null;
  return <div className="bp-skeleton-details">
    {effectId > 0 && <BoneCurseEffect key={effectId} language={lang} onComplete={() => setEffectId(0)} />}
    <button type="button" onClick={() => setEffectId(Date.now())} className="my-2 w-full rounded-lg border border-teal-600 bg-teal-950 px-3 py-2 text-xs text-teal-100">{copy.show}</button>
    <small>{copy.set}</small>
    {describeEquipmentBonuses(item, lang).map(line => <p className="bp-skeleton-stat" key={line}>{line}</p>)}
    <h4>{copy.bonuses}</h4>
    {SKELETON_BP_SET_BONUSES.map(bonus => <p key={bonus.pieces}><b>{bonus.pieces} {copy.pieces}:</b> {describeEquipmentBonuses({ bonuses: [bonus] }, lang).join(', ')}</p>)}
    <section className="bp-curse-description"><img src={curseIcon} alt={copy.curse} /><div><h4>{copy.curse}</h4><small>{copy.full}</small></div><p>{copy.effect}</p><p>{copy.cooldown}</p></section>
  </div>;
}
