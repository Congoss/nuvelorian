import { bossDefeatNotice } from '@/lib/bossDefeatNotice';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { claimBossBox, claimGiftMail } from '@/services/gameApi';
import GameTextureButton from './GameTextureButton';
import LootBoxModal from './LootBoxModal';
import { BOX_SENDER_TEXTS } from '@/i18n/boxSenderTexts';
import { BOX_TYPES } from '@/lib/lootBoxes';
import heroIcon from '@/assets/optimized/nav-hero.webp';
import grayBox from '@/assets/box/gray-box.png';
import greenBox from '@/assets/box/green-box.png';
import blueBox from '@/assets/box/blue-box.png';
import yellowBox from '@/assets/box/yellow-box.png';
import redBox from '@/assets/box/red-box.png';
import inviteBoxArt from '@/assets/box/invite-box.png';
import mailBanner from '@/assets/ui/mail-banner.webp';

const BOX_IMAGE_BY_TYPE = {
  standard_boss: grayBox,
  damage_box_1: grayBox,
  damage_box_2: greenBox,
  damage_box_3: blueBox,
  damage_box_4: yellowBox,
  damage_box_5: redBox,
  top_small: grayBox,
  top_bronze: greenBox,
  top_silver: blueBox,
  top_gold: yellowBox,
  boss_part: grayBox,
  activity: grayBox,
  boss_top100: grayBox,
  collection: greenBox,
  boss_top10: greenBox,
  resource: blueBox,
  boss_top1: yellowBox,
  weapon: redBox,
  boss_damage_pack: grayBox,
  poison_pack: greenBox,
  weekly_progress_pack: blueBox,
  starter_offer: greenBox,
  first_boss_offer: blueBox,
  weekly_offer: yellowBox,
  daily_toxic_pack: greenBox,
  invite_box: inviteBoxArt,
  big_invite_box: inviteBoxArt,
  rare_invite_box: inviteBoxArt,
  epic_invite_box: inviteBoxArt,
};

function getBoxImage(boxType) {
  return BOX_IMAGE_BY_TYPE[boxType] || grayBox;
}

function clanRoleLabel(role, t) {
  const value = String(role || '').toLowerCase();
  const key = value.includes('leader') || value.includes('космобат') || value.includes('глава')
    ? 'leader'
    : value.includes('deputy') || value.includes('супут') || value.includes('заступ')
      ? 'deputy'
      : value.includes('elder') || value.includes('космод')
        ? 'elder'
        : 'member';
  return t(`clan_panel.role_${key}`);
}

function giftRewardLabel(field, language) {
  const labels = {
    tentacles: ['Щупальця', 'Tentacles', 'Щупальца'], xp: ['Досвід', 'XP', 'Опыт'],
    energy: ['Енергія', 'Energy', 'Энергия'], stat_strength: ['CA', 'CA', 'CA'],
    premium: ['T-Pape', 'T-Pape', 'T-Pape'], small_poison: ['Малий яд', 'Small poison', 'Малый яд'],
    medium_poison: ['Середній яд', 'Medium poison', 'Средний яд'], large_poison: ['Великий яд', 'Large poison', 'Большой яд'],
  };
  const index = language === 'uk' ? 0 : language === 'ru' ? 2 : 1;
  return labels[field]?.[index] || String(field || '').replaceAll('_', ' ');
}

function localizedGiftText(value, language, fallback = '', depth = 0) {
  if (depth > 3) return fallback;
  if (typeof value === 'string' || typeof value === 'number') {
    const text = String(value).trim();
    return /^\[object\s+object\]$/i.test(text) ? fallback : text || fallback;
  }
  if (!value || typeof value !== 'object') return fallback;
  const rawLang = String(language || 'en').toLowerCase().split(/[-_]/)[0];
  const lang = rawLang === 'uk' || rawLang === 'ua' ? 'uk' : rawLang === 'ru' ? 'ru' : 'en';
  for (const localized of [value[lang], value.en, value.uk, value.ru]) {
    const text = localizedGiftText(localized, lang, '', depth + 1);
    if (text) return text;
  }
  return fallback;
}

function buildMailItems(profile, t) {
  const lang = profile?.language === 'en' || profile?.language === 'ru' ? profile.language : 'en';
  const senderTexts = BOX_SENDER_TEXTS[lang] || BOX_SENDER_TEXTS.ua;
  const boxes = Array.isArray(profile?.pending_boss_boxes) ? profile.pending_boss_boxes : [];
  const boxMails = boxes.map((box, index) => ({
    displayTitle:
      (typeof box?.label === 'string' && /[ _]/.test(box.label) ? null : box?.label)
      || BOX_TYPES?.[box?.boxType]?.name
      || senderTexts.title,
    id: box.instanceId || `mail-box-${index}`,
    type: 'box',
    defeatNotice: bossDefeatNotice(box, profile?.language),
    title: box.label || senderTexts.title,
    subtitle: senderTexts.subtitle,
    senderName: senderTexts.senderName,
    senderLink: 'https://t.me/planet4_game',
    boxType: box.boxType,
    bossId: box.bossId || null,
    fightId: box.fightId || null,
    instanceId: box.instanceId || null,
  }));
  const clanMails = Array.isArray(profile?.clan_mail) ? profile.clan_mail.map((mail, index) => ({
    id: mail.id || `clan-mail-${index}`, type: 'clan', displayTitle: mail.title || t('chat_panel.clan_tab'), title: mail.title || t('chat_panel.clan_tab'), subtitle: `${mail.author || t('chat_panel.clan_tab')} · ${clanRoleLabel(mail.author_role, t)}`, senderName: t('chat_panel.clan_tab'), text: mail.text || '', tag: t('chat_panel.clan_tab'), created_at: mail.created_at,
  })) : [];
  const giftMails = (profile?.gift_mail || []).map(mail => {
    const title = localizedGiftText(mail.title, profile?.language, 'Bonus');
    return {
      id: mail.id, type: 'gift', displayTitle: title, title,
      subtitle: mail.collectionName || title, senderName: mail.senderName || 'PLANET4', senderIconUrl: mail.senderIconUrl || '', text: localizedGiftText(mail.text, profile?.language), rewards: Array.isArray(mail.rewards) ? mail.rewards : [], tag: 'GIFT', created_at: mail.created_at,
    };
  });
  return [...giftMails, ...clanMails, ...boxMails];
}

export default function MailPanel({ profile, onUpdateProfile, onSyncProfile, onRefreshProfile, onClose }) {
  const { t } = useTranslation();
  const [openingMail, setOpeningMail] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [claimingGiftId, setClaimingGiftId] = useState('');
  const [updatingMailId, setUpdatingMailId] = useState('');
  const readRequest = useRef('');

  const mails = useMemo(() => buildMailItems(profile, t), [profile, t]);
  useEffect(() => {
    const giftIds = [...new Set((profile?.gift_mail || []).map((mail) => String(mail?.id || '')).filter(Boolean))].slice(-200);
    const existing = new Set((profile?.gift_mail_read_ids || []).map(String));
    const missing = giftIds.filter((id) => !existing.has(id));
    const key = JSON.stringify([profile?.id, giftIds]);
    if (!missing.length || !onUpdateProfile || readRequest.current === key) return;
    readRequest.current = key;
    Promise.resolve().then(() => onUpdateProfile({ gift_mail_read_ids: [...existing, ...missing].slice(-200) }))
      .catch(() => setErrorMessage(t('mail_panel.action_error')));
  }, [onUpdateProfile, profile?.id, profile?.gift_mail, profile?.gift_mail_read_ids, t]);

  const handleClanMailAction = async (mailItem, action) => {
    if (!mailItem?.id || updatingMailId) return;
    setUpdatingMailId(mailItem.id);
    setErrorMessage('');
    try {
      await onUpdateProfile?.({ mailAction: { type: action, mailType: 'clan', mailId: mailItem.id } });
    } catch {
      setErrorMessage(t('mail_panel.action_error'));
      await onRefreshProfile?.();
    } finally {
      setUpdatingMailId('');
    }
  };

  const handleOpenBox = async ({ boxType, bossId, fightId, instanceId }) => {
    if (!openingMail?.instanceId && !instanceId) return [];
    setErrorMessage('');
    try {
      const result = await claimBossBox({
        profile,
        boxType,
        bossId,
        fightId,
        instanceId: instanceId || openingMail.instanceId,
      });
      if (result?.player && onSyncProfile) onSyncProfile(result.player);
      else await onRefreshProfile?.();
      return Array.isArray(result?.drops) ? result.drops : [];
    } catch (error) {
      if (['LOOT_ALREADY_CLAIMED', 'BOX_NOT_FOUND', 'INVALID_LOOT_BOX'].includes(error?.code)) {
        await onRefreshProfile?.();
        setOpeningMail(null);
        throw error;
      }
      setErrorMessage(t('mail_panel.open_error'));
      throw error;
    } finally {
      // Keep modal open so LootBoxModal can show result drops/animation.
    }
  };

  const handleClaimGiftMail = async (mailId) => {
    if (!mailId || claimingGiftId) return;
    setClaimingGiftId(mailId);
    setErrorMessage('');
    try {
      const result = await claimGiftMail({ mailId });
      if (result?.player && onSyncProfile) onSyncProfile(result.player);
      else await onRefreshProfile?.();
    } catch {
      setErrorMessage(t('mail_panel.open_error'));
    } finally {
      setClaimingGiftId('');
    }
  };

  return (
    <div className="relative w-full">
      {openingMail ? (
        <LootBoxModal
          instanceId={openingMail.instanceId}
          boxType={openingMail.boxType}
          bossId={openingMail.bossId}
          fightId={openingMail.fightId}
          lang={profile?.language || 'en'}
          onClose={() => setOpeningMail(null)}
          onOpenBox={handleOpenBox}
        />
      ) : null}

      <div className="w-full overflow-hidden rounded-[12px] bg-[#081009] p-2 shadow-[0_12px_36px_rgba(0,0,0,.62)]">
        <div className="relative h-[76px] overflow-hidden rounded-[9px] sm:h-[88px]">
          <img src={mailBanner} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-[center_47%]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#071009]/85 via-[#071009]/25 to-[#071009]/45" />
          <p className="absolute bottom-2 left-3 font-mono text-[18px] font-black uppercase tracking-[0.1em] text-[#eaffc1] drop-shadow-[0_2px_3px_rgba(0,0,0,.9)]">{t('mail_panel.title')}</p>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="absolute right-2 top-2 rounded-md bg-black/55 px-2 py-1 font-mono text-[16px] font-black leading-none text-white hover:bg-black/80"
            aria-label="Close mail"
          >
            ×
          </button>
        </div>

        {errorMessage ? <p className="mt-2 font-mono text-[11px] text-[#ff8f7f]">{errorMessage}</p> : null}

        <div className="mt-2 max-h-[52dvh] space-y-2 overflow-y-auto px-0.5 py-0.5">
          {mails.length === 0 ? (
            <div className="flex min-h-[150px] items-center justify-center p-2 text-center font-mono text-[11px] text-[#9bb37f]">
              {t('mail_panel.empty')}
            </div>
          ) : (
            mails.map((mailItem) => (
              <div key={mailItem.id} className="rounded-[10px] border border-[#28ee90]/70 bg-[#0f1b0e] px-2.5 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <img src={mailItem.senderIconUrl || heroIcon} alt="" aria-hidden="true" className="h-8 w-8 rounded-full object-cover" />
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[11px] font-black text-[#e6f6cd]">{mailItem.senderName}</p>
                      {mailItem.senderLink ? <a href={mailItem.senderLink} target="_blank" rel="noreferrer" className="truncate font-mono text-[11px] text-white no-underline">{mailItem.subtitle}</a> : <p className="truncate font-mono text-[11px] font-bold text-[#d8ff84]">{mailItem.subtitle}</p>}
                    </div>
                  </div>
                  {mailItem.type === 'gift' ? <GameTextureButton type="button" disabled={Boolean(claimingGiftId)} onClick={() => void handleClaimGiftMail(mailItem.id)} className="h-8 min-w-[72px] px-2"><span className="relative z-10 font-mono text-[10px] font-black uppercase text-[#172016]">{claimingGiftId === mailItem.id ? '…' : t('mail_panel.claim')}</span></GameTextureButton> : mailItem.type === 'clan' ? <span className="font-mono text-[9px] font-black text-[#9af0fb]">{mailItem.tag}</span> : <img src={getBoxImage(mailItem.boxType)} alt={mailItem.displayTitle} className="h-10 w-10 object-contain" />}
                </div>
                {mailItem.defeatNotice ? <p className="mt-2 font-mono text-[11px] font-bold leading-relaxed text-[#d8ff84]">{mailItem.defeatNotice}</p> : null}
                {['clan','gift'].includes(mailItem.type) ? <p className="mt-2 whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-[#d9e7cd]">{mailItem.text}</p> : <button
                  type="button"
                  onClick={() => setOpeningMail(mailItem)}
                  className="mt-2 h-8 w-full rounded-[8px] border border-[#28ee90] bg-[#1f3014] px-3 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#ddf9b7] hover:brightness-110"
                >
                  {t('mail_panel.claim')}
                </button>}
                {mailItem.type === 'clan' ? <div className="mt-2">
                  <button type="button" disabled={Boolean(updatingMailId)} onClick={() => void handleClanMailAction(mailItem, 'delete')} className="min-h-8 w-full rounded-[8px] border border-[#9d4a3c] bg-[#301712] px-2 font-mono text-[10px] font-black uppercase text-[#ffb0a3] disabled:opacity-60">
                    {updatingMailId === mailItem.id ? '…' : t('mail_panel.delete')}
                  </button>
                </div> : null}
                {mailItem.type === 'gift' && mailItem.rewards?.length > 0 ? <p className="mt-2 font-mono text-[10px] font-bold text-[#d8ff84]">{mailItem.rewards.map((reward) => `${giftRewardLabel(reward.field, profile?.language)} ×${Number(reward.amount || 0).toLocaleString()}`).join(' · ')}</p> : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
