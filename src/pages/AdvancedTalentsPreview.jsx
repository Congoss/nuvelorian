import { useEffect, useState } from 'react';
import i18n from '@/i18n';
import BossPanel from '@/components/game/BossPanel';
import SkillsPanel from '@/components/game/SkillsPanel';
import { GAME_CONFIG } from '@/lib/gameConfig';
import { BASE_TALENT_DEFS, applyTalentUpgrade } from '@/lib/talents';
import { setAdvancedAttack } from '@/lib/advancedTalents';
import { resolveTalentBatch } from '@/lib/talentCombat';

const boss = GAME_CONFIG.BOSSES.find(item => item.id === 'boss8');
const initialFight = {
  id: 'advanced-preview-fight', boss_id: boss.id, boss_name: 'Шкрябан',
  status: 'active', current_hp: boss.maxHp, max_hp: boss.maxHp,
  created_at: new Date().toISOString(),
};
const initialProfile = {
  id: 'advanced-preview', nickname: 'Тест', language: 'uk', talent_tree_version: 2,
  talent_levels: { ...Object.fromEntries(BASE_TALENT_DEFS.map(t => [t.id, 10])), a01: 1, a02: 1 },
  available_talent_points: 2231, talent_points: 2231, level: 100,
  max_energy: 1000, energy: 1000, premium: 0,
  weapon_inventory: { 'small-poison': 1000, 'medium-poison': 1000, 'large-poison': 1000 },
};
const damageLog = {};

export default function AdvancedTalentsPreview() {
  const [profile, setProfile] = useState(initialProfile);
  const [fight, setFight] = useState(initialFight);
  const [showBoss, setShowBoss] = useState(true);
  const [armorPreviewImpact, setArmorPreviewImpact] = useState(null);
  const [introKey, setIntroKey] = useState(0);
  const [translationsReady, setTranslationsReady] = useState(i18n.hasResourceBundle('uk', 'translation'));

  useEffect(() => {
    i18n.loadLanguages('uk').then(() => setTranslationsReady(true));
  }, []);

  const update = async action => {
    if (action.talentUpgrade) {
      const patch = applyTalentUpgrade(profile, action.talentUpgrade.id);
      if (!patch) throw new Error('Upgrade denied');
      setProfile(current => ({ ...current, ...patch }));
    }
    if (action.advancedAttack) {
      const next = { ...profile };
      setAdvancedAttack(next, action.advancedAttack.id, action.advancedAttack.enabled);
      setProfile(next);
    }
    if (action.armorIntroSeen) setProfile(current => ({ ...current, boss_armor_intro_seen: true }));
  };

  const setCombatState = state => setProfile(current => ({
    ...current, talent_combat_state: { ...current.talent_combat_state, [fight.id]: state },
  }));

  const adapter = {
    fight, damageLog, onClose: () => setShowBoss(false),
    attack: async ({ weapon, multiplier }) => {
      const hit = resolveTalentBatch({
        weapon, count: multiplier, fight, levels: profile.talent_levels,
        state: profile.talent_combat_state?.[fight.id],
      });
      const nextFight = { ...fight, current_hp: Math.max(1, fight.current_hp - hit.damage - hit.bleedDamage) };
      setCombatState(hit.state);
      setFight(nextFight);
      return { fight: nextFight, hit, playerDamageLog: damageLog };
    },
  };

  const previewArmor = breached => {
    setCombatState({
      ...profile.talent_combat_state?.[fight.id],
      breachUntil: breached ? Date.now() + 20000 : 0,
    });
    setArmorPreviewImpact({ id: performance.now(), blocked: !breached, breached });
  };

  const replayIntro = () => {
    localStorage.removeItem('boss-armor-intro-v1:advanced-preview');
    setProfile(current => ({ ...current, boss_armor_intro_seen: false }));
    setIntroKey(key => key + 1);
  };

  if (!translationsReady) return null;

  return <main className="game-app mx-auto flex h-dvh max-w-[520px] flex-col overflow-hidden bg-[#070c08] text-white">
    <nav className="flex shrink-0 flex-wrap gap-3 bg-[#14251d] p-3 text-xs font-bold">
      <button onClick={() => setShowBoss(true)}>Шкрябан</button>
      <button onClick={() => setShowBoss(false)}>Таланти</button>
      {showBoss && <>
        <button onClick={replayIntro}>Попередження</button>
        <button onClick={() => previewArmor(false)}>Показати блок</button>
        <button onClick={() => previewArmor(true)}>Пробити на 20 с</button>
      </>}
    </nav>
    <div className="relative min-h-0 flex-1">
      {showBoss
        ? <BossPanel key={introKey} profile={profile} fightAdapter={adapter} armorPreviewImpact={armorPreviewImpact} onUpdateProfile={update} />
        : <SkillsPanel profile={profile} onUpdateProfile={update} />}
    </div>
  </main>;
}
