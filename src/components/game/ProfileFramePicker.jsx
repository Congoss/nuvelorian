import { useState } from 'react';
import { PROFILE_HEADER_THEMES } from '@/lib/profileHeaderThemes';
import { getDossierChapters, dossierChapterUnlocked } from '@/lib/bossDossier';
import ProfileHeaderSkinPreview from './ProfileHeaderSkinPreview';

export default function ProfileFramePicker({ profile, onUpdateProfile }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lang = profile?.language === 'ru' ? 'ru' : profile?.language === 'en' ? 'en' : 'uk';
  const text = (uk, ru, en) => lang === 'ru' ? ru : lang === 'en' ? en : uk;
  const frames = Object.keys(PROFILE_HEADER_THEMES).filter(id => {
    if (id.startsWith('friday13_guild_')) return false;
    const gold = getDossierChapters(id).find(chapter => chapter.tier === 'gold');
    return (profile?.unlocked_profile_banners || []).includes(id) || (gold && dossierChapterUnlocked(profile, gold));
  });
  async function equip(id) {
    if (busy) return;
    setBusy(true); setError('');
    try { await onUpdateProfile({ equipProfileHeaderTheme: profile.profile_header_theme === id ? null : id }); }
    catch { setError(text('Не вдалося змінити рамку', 'Не удалось сменить рамку', 'Could not change frame')); }
    finally { setBusy(false); }
  }
  return <details className="mt-3 rounded border border-[#28ee90] bg-[#0b1009] p-2">
    <summary className="min-h-10 cursor-pointer content-center font-mono text-xs font-black text-[#d8ff86]">{text('Рамки профілю', 'Рамки профиля', 'Profile frames')} · {frames.length}</summary>
    {error && <p role="alert" className="py-2 text-xs text-[#ff8978]">{error}</p>}
    {!frames.length && <p className="py-2 text-xs text-[#a5c4a4]">{text('Поки немає доступних рамок', 'Пока нет доступных рамок', 'No frames unlocked yet')}</p>}
    <div className="space-y-2">{frames.map(id => <div key={id} className="rounded border border-[#28ee90]/40 p-2">
      <div role="img" aria-label={PROFILE_HEADER_THEMES[id][lang]} className="relative h-14 w-full"><ProfileHeaderSkinPreview bossId={id}/></div>
      <div className="mt-2 flex items-center justify-between gap-2"><span className="text-xs text-[#eff7d1]">{PROFILE_HEADER_THEMES[id][lang]}</span><button type="button" disabled={busy} aria-pressed={profile.profile_header_theme === id} onClick={() => equip(id)} className="min-h-10 shrink-0 rounded border border-[#28ee90] px-3 text-xs font-bold text-[#d8ff86] disabled:opacity-50">{profile.profile_header_theme === id ? text('Зняти', 'Снять', 'Unequip') : text('Надягнути', 'Надеть', 'Equip')}</button></div>
    </div>)}</div>
  </details>;
}
