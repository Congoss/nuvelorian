import {getChatMessageAvatar} from '@/lib/chatMessageAvatar';
import {getShipBossPortrait} from '@/lib/shipBossPresentation';
import extraCardPlayIcon from '@/assets/card-game/extra-play.webp';
import ChatBeacon from './ChatBeacon';
import {markChatRead,markReleaseRead} from '@/lib/chatReadState';
import { openShipBattle } from '@/lib/openShipBattle';
import { gameApi } from '@/services/gameApi';
import mediumPoisonIcon from '@/assets/optimized/all/skills/medium-poison.webp';
import { SHIP_MODULES } from '@/lib/clanShipPreview';
import { getShipBossName } from '@/lib/shipBattleText';
import { localizeClanActivityText } from '@/lib/clanActivityText';
import { ClanPreviewModal } from './LeaderboardPanel';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, MessageSquare, Users, X, Zap } from 'lucide-react';
import MarkerFrame from '@/components/game/MarkerFrame';
import { createClanEnergyRequest, helpClanEnergyRequest, joinBossFightInvite, listChatMessages, listClanEnergyRequests, sendChatMessage } from '@/services/gameApi';
import GameTextureButton from './GameTextureButton';
import heroIcon from '@/assets/optimized/nav-hero.webp';
import { DEFAULT_GUILD_LOGO, GUILD_LOGO_BY_ID } from '@/lib/clanLogos';
import { GAME_CONFIG } from '@/lib/gameConfig';
import PlayerName from './PlayerName';
import AvatarWithFrame from './AvatarWithFrame';
import underweightBossAvatar from '@/assets/optimized/boss-mobile/3c5eca0b6d15.webp';
import mothBossAvatar from '@/assets/optimized/boss-mobile/7130af0068f1.webp';
import shorkBossAvatar from '@/assets/optimized/boss-mobile/12258247a0bd.webp';
import wormBossAvatar from '@/assets/optimized/boss-mobile/0b48d455dd8d.webp';
import sporgolBossAvatar from '@/assets/optimized/boss-mobile/36e3f2fb4fd8.webp';
import suckholeBossAvatar from '@/assets/optimized/boss-mobile/327d35f24334.webp';
import shkrabanBossAvatar from '@/assets/optimized/boss-mobile/1d413d7b9e7a.webp';
import cleopatraBossAvatar from '@/assets/boss/avatars/cleopatrash.png';
import finalBossAvatar from '@/assets/optimized/all/boss/boss-ico.webp';

const ServerShipBossBattle = lazy(() => import('./ServerShipBossBattle'));
const BOSS_INVITE_ART = {
  heli: underweightBossAvatar,
  tank: mothBossAvatar,
  chinook: shorkBossAvatar,
  boss4: wormBossAvatar,
  boss5: sporgolBossAvatar,
  boss6: suckholeBossAvatar,
  boss7: cleopatraBossAvatar,
  boss8: shkrabanBossAvatar,
  boss9: finalBossAvatar,
};

const CHANNELS = {
  clan: {
    id: 'clan',
    labelKey: 'chat_panel.clan_tab',
    titleKey: 'chat_panel.clan_chat_title',
    subtitleKey: 'chat_panel.clan_tab',
    online: 8,
    icon: Users,
  },
  world: {
    id: 'world',
    labelKey: 'chat_panel.world_tab',
    titleKey: 'chat_panel.world_chat_title',
    subtitleKey: 'chat_panel.world_tab',
    online: 18,
    icon: MessageSquare,
  },
};

function formatName(profile) {
  return profile?.nickname || profile?.username || 'local_tester';
}

function formatCountdown(endsAt, now) {
  const remaining = Math.max(0, Date.parse(endsAt || '') - now);
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function ChannelButton({ channel, active, onClick, t, indicator = {} }) {
  return (
    <GameTextureButton
      type="button"
      onClick={onClick}
      className={`h-[48px] min-w-0 flex-1 ${
        active || indicator.patch ? 'brightness-110' : 'opacity-70 grayscale-[0.25]'
      }`}
    >
      <div className="relative z-10 flex h-full items-center justify-center gap-2 px-3">
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2"><ChatBeacon patch={indicator.patch} unread={indicator.unread}/></span>
        <channel.icon className={`h-4 w-4 ${active ? 'text-[#18220d]' : 'text-[#d9dfcc]'}`} />
        <span className={`font-mono text-[11px] font-bold uppercase tracking-[0.18em] ${active ? 'text-[#18220d]' : 'text-[#d9dfcc]'}`}>
          {t(channel.labelKey)}
        </span>
      </div>
    </GameTextureButton>
  );
}

function ChatMessage({ message, t, onReply, onOpenClan, onJoinBossInvite, joiningInvite, copy, onClaimRelease, claimingRelease, viewerId }) {
  const releaseEnd=useRef(null);
  useEffect(()=>{
    if(message.releaseVersion&&message.rewardClaimed){markReleaseRead(viewerId,message.releaseVersion);return;}
    if(!message.releaseVersion||!releaseEnd.current||typeof IntersectionObserver==='undefined')return;
    let timer;
    const observer=new IntersectionObserver(([entry])=>{
      clearTimeout(timer);
      if(entry.isIntersecting&&entry.intersectionRatio>=0.1)timer=setTimeout(()=>{if(!document.hidden)markReleaseRead(viewerId,message.releaseVersion);},1000);
    },{threshold:0.1});
    observer.observe(releaseEnd.current);
    return()=>{clearTimeout(timer);observer.disconnect();};
  },[message.releaseVersion,message.rewardClaimed,viewerId]);
  const isSelf = message.side === 'right';
  if(message.releaseVersion){
    const language=message.language,claimed=message.rewardClaimed,busy=claimingRelease===message.releaseVersion;
    const text=language==='ru'?{claim:'Забрать награду',done:'Получено'}:language==='en'?{claim:'Claim reward',done:'Claimed'}:{claim:'Забрати нагороду',done:'Отримано'};
    const changes=message.text.split(/\r?\n/).filter(line=>line.trim().startsWith('•')).map(line=>line.trim().slice(1).trim());
    const title=language==='ru'?'Обновление':language==='en'?'Update':'Оновлення';
    return <article ref={releaseEnd} data-release-version={message.releaseVersion} className="rounded-[20px] bg-[linear-gradient(135deg,#2a202d,#211d2b_65%,#1d1a25)] p-4 font-sans text-[#f2d2a3] normal-case [&_*]:!normal-case">
      <header className="mb-4 border-b border-[#d5bfed]/10 pb-3">
        <p className="mb-1 text-[10px] font-semibold tracking-wider text-[#b9a9c4]">PLANET4</p>
        <h3 className="text-[17px] font-bold leading-tight">{title} {message.releaseVersion}</h3>
      </header>
      {changes.length ? <ul className="list-disc space-y-3 pl-4 text-[13px] font-normal leading-[1.6] text-[#c5b9ce] marker:text-[#eac18a]">{changes.map((change,index)=><li key={index} className="break-words pl-1">{change}</li>)}</ul> : <p className="whitespace-pre-wrap break-words text-[13px] font-normal leading-[1.6] text-[#c5b9ce]">{message.text}</p>}
      {message.reward?.amount>0 && <div className="mt-4 border-t border-[#d5bfed]/10 pt-3"><GameTextureButton type="button" disabled={claimed||busy} onClick={()=>onClaimRelease(message.releaseVersion)} tone={claimed?'gray':'yellow'} className="h-11 w-full"><span className="relative z-10 flex items-center justify-center gap-2 text-xs font-bold text-[#172016]"><img src={mediumPoisonIcon} alt="" className="h-7 w-7 object-contain"/>×{message.reward.amount}{message.reward.cardGamePlays===5&&<><span>+</span><img src={extraCardPlayIcon} alt={language==='en'?'Card plays':language==='ru'?'Карточные попытки':'Карткові спроби'} className="h-7 w-7 object-contain"/><span>×5</span></>} · {busy?'…':claimed?text.done:text.claim}</span></GameTextureButton></div>}

    </article>;
  }
  if (message.system) {
    const tones = { green: 'border-[#4f9d55] text-[#bff3b2]', red: 'border-[#a74d4b] text-[#ffb0a8]', yellow: 'border-[#c69d45] text-[#ffe08a]', blue: 'border-[#4c9eb2] text-[#afeafa]' };
    const tone = tones[message.tone] || tones.blue;
    return <div className="flex justify-center"><div className={`max-w-[92%] border bg-black/45 px-3 py-1.5 text-center font-mono text-[9px] ${tone}`}>◈ {localizeClanActivityText(message, t)}</div></div>;
  }

  if (message.clanInvite) return <div className="flex w-full items-center gap-2">
    <AvatarWithFrame src={message.avatar || heroIcon} frameId={message.avatar_frame_id || message.selected_avatar_frame} className={`h-9 w-9 shrink-0 rounded border border-[#28ee90] ${isSelf ? 'order-2' : ''}`} />
    <div className="flex min-w-0 flex-1 items-center gap-2 border border-[#28ee90] bg-[#081007]/95 p-2">
      <img src={GUILD_LOGO_BY_ID[message.clanInvite.logoId] || DEFAULT_GUILD_LOGO} alt="" className="h-11 w-11 shrink-0 object-contain" />
      <div className="min-w-0 flex-1"><strong className="block truncate text-[13px]">{message.clanInvite.name}</strong><p className="mt-1 whitespace-pre-wrap break-words text-[11px] leading-snug text-[#b9d58d]">{message.text !== message.clanInvite.name ? message.text : (copy.view === 'Посмотреть' ? 'Приглашаем в клан!' : copy.view === 'View' ? 'Join our clan!' : 'Запрошуємо до клану!')}</p></div>
      <GameTextureButton type="button" tone="yellow" onClick={() => onOpenClan(message.clanInvite)} className="h-10 shrink-0 px-3"><span className="relative z-10 text-[11px] font-black text-[#13200e]">{copy.view}</span></GameTextureButton>
    </div>
  </div>;

  if (message.bossFightInvite) {
    const language = message.language === 'ru' || message.language === 'en' ? message.language : 'ua';
    const boss = GAME_CONFIG.BOSSES.find((entry) => entry.id === message.bossFightInvite.bossId);
    const bossName = message.bossFightInvite.ship ? getShipBossName(message.bossFightInvite.moduleId,language) : boss?.names?.[language] || boss?.name || message.bossFightInvite.bossName || 'Boss';
    const attackVerb = language === 'en' ? 'attacks' : language === 'ru' ? 'атакует' : 'атакує';
    return (
      <div className="flex w-full min-w-0 items-center gap-2 border border-[#28ee90] bg-[#081007]/95 px-2 py-2 text-[#f2f5df]">
        <img src={GUILD_LOGO_BY_ID[message.bossFightInvite.clanLogoId] || DEFAULT_GUILD_LOGO} alt="" className="h-8 w-8 shrink-0 object-contain" />
        <img src={message.bossFightInvite.ship ? (getShipBossPortrait(message.bossFightInvite.moduleId)) : BOSS_INVITE_ART[message.bossFightInvite.bossId] || finalBossAvatar} alt="" className="h-11 w-10 shrink-0 object-contain" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-sans text-[12px] font-black leading-tight"><PlayerName player={message} name={message.name} /> {attackVerb} {bossName}</p>
          <p className="mt-1 truncate font-sans text-[10px] font-semibold text-[#b9d58d]">{message.bossFightInvite.ship ? (language==='en'?'Shared clan boss — join the fight!':language==='ru'?'Общий босс клана — присоединяйся!':'Спільний бос клану — приєднуйся!') : copy.bossInviteCall}</p>
        </div>
        <GameTextureButton type="button" tone="yellow" disabled={joiningInvite === message.bossFightInvite.fightId} onClick={() => onJoinBossInvite(message.bossFightInvite)} className="h-10 w-11 shrink-0 px-1"><span className="relative z-10 font-mono text-[10px] font-black text-[#13200e]">{joiningInvite === message.bossFightInvite.fightId ? '…' : 'GO'}</span></GameTextureButton>
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2 ${isSelf ? 'justify-end' : 'justify-start'}`}>
      {!isSelf ? (
        <AvatarWithFrame
          src={message.avatar || message.photoUrl || message.photo_url || heroIcon}
          frameId={message.avatar_frame_id || message.selected_avatar_frame}
          className="h-9 w-9 shrink-0 rounded-[8px] border border-[#28ee90] object-cover shadow-[0_0_10px_rgba(160,230,90,0.12)]"
        />
      ) : null}

      <div className={`min-w-0 max-w-[calc(100%-44px)] ${isSelf ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`relative w-fit max-w-full rounded-[11px] border px-2.5 py-1.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] before:absolute before:bottom-2 before:h-0 before:w-0 before:border-y-[6px] before:border-y-transparent after:absolute after:bottom-[9px] after:h-0 after:w-0 after:border-y-[4px] after:border-y-transparent ${
            isSelf
              ? 'border-[#5f8d50] bg-[#26351f] text-[#f6f2df] before:-right-[9px] before:border-l-[10px] before:border-l-[#5f8d50] after:-right-[7px] after:border-l-[8px] after:border-l-[#26351f]'
              : 'border-[#426345] bg-[#151b16] text-[#f7f7ea] before:-left-[9px] before:border-r-[10px] before:border-r-[#426345] after:-left-[7px] after:border-r-[8px] after:border-r-[#151b16]'
          }`}
        >
          <div className="mb-0.5 flex min-w-0 items-center gap-1.5">
            <PlayerName player={message} name={message.name} className="font-mono text-[10px] font-black uppercase tracking-[0.1em] text-[#d5f58c]" />
            <span className="font-mono text-[7px] uppercase tracking-[0.08em] text-[#b9d58d]">
              {message.roleKey ? t(message.roleKey) : message.role}
            </span>
            <span className="ml-auto shrink-0 pl-2 font-mono text-[8px] text-[#a5bf7f]">{message.time}</span>
          </div>
          {message.reply ? <div className="mb-2 border-l-2 border-[#9dff43] bg-black/30 px-2 py-1 text-[11px]"><strong>{message.reply.author}</strong><p className="line-clamp-2">{message.reply.text}</p></div> : null}
          {message.clanInvite ? <div className="my-2 flex items-center gap-2 border border-[#28ee90] bg-[#081007] p-2"><img src={GUILD_LOGO_BY_ID[message.clanInvite.logoId] || DEFAULT_GUILD_LOGO} alt="" className="h-10 w-10 object-contain" /><div className="min-w-0 flex-1"><strong className="text-sm">{message.clanInvite.name}</strong><p className="text-[10px]">LVL {message.clanInvite.level}</p></div><GameTextureButton onClick={() => onOpenClan(message.clanInvite)} className="h-9 px-3"><span className="relative z-10 text-xs font-black text-[#13200e]">{copy.view}</span></GameTextureButton></div> : null}

          <p className="break-words whitespace-pre-wrap [overflow-wrap:anywhere] font-sans text-[12px] font-semibold leading-[1.4]">{message.text}</p>
          <div className="mt-1 flex items-center justify-end gap-3">
            <button type="button" onClick={() => onReply(message)} className="text-[10px] text-[#b9d58d]">↩ {copy.reply}</button>
          </div>
        </div>
      </div>

      {isSelf ? (
        <AvatarWithFrame
          src={message.avatar || message.photoUrl || message.photo_url || heroIcon}
          frameId={message.avatar_frame_id || message.selected_avatar_frame}
          className="h-9 w-9 shrink-0 rounded-[8px] border border-[#28ee90] object-cover shadow-[0_0_10px_rgba(160,230,90,0.12)]"
        />
      ) : null}
    </div>
  );
}

function EnergyRequestMessage({ request, viewerId, viewerName, now, disabled, onHelp, t }) {
  const own = String(request.owner_id) === String(viewerId);
  const helped = request.viewer_has_helped || (request.helpers || []).map(String).includes(String(viewerId));
  const requested = Math.max(1, Number(request.amount_requested || 50));
  const received = Math.min(requested, Math.max(0, Number(request.amount_helped || 0)));
  const canHelp = !own && !helped && !disabled;
  const ownerName = own ? viewerName : request.owner_name || 'player';
  const time = new Date(request.created_at || Date.now()).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  const card = <div className="w-full rounded-[10px_8px_11px_7px] border border-[#477a45] bg-[#191914] p-2 text-[#fff0d5] shadow-[inset_0_0_18px_rgba(255,187,57,0.05)]"><div className="flex items-center gap-2"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[#806c35] bg-[#29261a] text-[#f0c54d]"><Zap className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate font-sans text-[11px] font-black uppercase">{t('chat_panel.energy_request')}</p><span className="font-mono text-[8px] font-black text-[#d7b96b]">{received}/{requested} ⚡</span></div><div role="progressbar" aria-label={t('chat_panel.energy_request')} aria-valuemin={0} aria-valuemax={requested} aria-valuenow={received} className="mt-1.5 h-1.5 overflow-hidden rounded-sm bg-[#393427]"><span className="block h-full bg-[#dfad37]" style={{width: `${received / requested * 100}%`}} /></div></div><GameTextureButton type="button" tone={canHelp ? 'yellow' : 'gray'} disabled={!canHelp} onClick={() => onHelp(request.id)} className="h-8 shrink-0 px-2"><span className="relative z-10 font-mono text-[9px] font-black uppercase text-[#18220d]">{own ? t('chat_panel.energy_requested') : helped ? t('chat_panel.energy_helped') : t('clan_panel.help')}</span></GameTextureButton></div></div>;
  return <div className={`flex w-full items-end gap-2 ${own ? 'justify-end' : 'justify-start'}`}>{!own ? <AvatarWithFrame src={request.owner_avatar || heroIcon} className="h-9 w-9 shrink-0 border border-[#28ee90]" /> : null}<div className={`min-w-0 flex-1 ${own ? 'items-end' : 'items-start'} flex flex-col`}><div className={`mb-1 flex items-center gap-2 ${own ? 'justify-end' : 'justify-start'}`}><p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#f0f0d8]">{ownerName}</p><span className="font-mono text-[8px] text-[#8aa46b]">{time}</span></div>{card}</div>{own ? <AvatarWithFrame src={request.owner_avatar || heroIcon} className="h-9 w-9 shrink-0 border border-[#28ee90]" /> : null}</div>;
}

export default function ChatPanel({ profile, onClose, onRefreshProfile = null, onJoinBossInvite = null, onNavigate = null, indicators = {} }) {
  const { t } = useTranslation();
  const hasClan = Boolean(profile?.clan_id || String(profile?.clan_name || '').trim());
  const [channel, setChannel] = useState(() => (hasClan ? 'clan' : 'world'));
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [openedClan, setOpenedClan] = useState(null);
  const [sendError, setSendError] = useState('');
  const [joiningInvite, setJoiningInvite] = useState('');
  const [hiddenBossInviteFightIds, setHiddenBossInviteFightIds] = useState([]);
  const copy = profile?.language === 'ru' ? { reply: 'Ответить', view: 'Посмотреть', bossInviteCall: 'Вали сюда! Тут полный космический трэш!' } : profile?.language === 'en' ? { reply: 'Reply', view: 'View', bossInviteCall: 'Get your ass over here!' } : { reply: 'Відповісти', view: 'Переглянути', bossInviteCall: 'Вали сюди! Тут повна космічна срака!' };
  const [claimingRelease,setClaimingRelease]=useState('');
  const releaseClaimBusy=useRef(false);
  const claimRelease=async version=>{
    if(releaseClaimBusy.current)return;
    releaseClaimBusy.current=true;setClaimingRelease(version);setSendError('');
    try{
      await gameApi.claimReleaseReward(version);
      markReleaseRead(profile.id,version);
      setMessagesByChannel(current=>({...current,world:(current.world||[]).map(m=>m.releaseVersion===version?{...m,rewardClaimed:true}:m)}));
      await Promise.resolve(onRefreshProfile?.()).catch(()=>{});
    }catch(error){setSendError(error.message||'Claim failed');}
    finally{releaseClaimBusy.current=false;setClaimingRelease('');}
  };
  const [shipInvite,setShipInvite]=useState(null);
  const joinBossInvite = async (invite) => {
    if(invite?.ship){
      if(joiningInvite)return;
      setJoiningInvite(invite.fightId);setSendError('');
      try{
        const initialData=await openShipBattle(gameApi,{playerId:profile.id,clanId:invite.clanId,moduleId:invite.moduleId,expectedFightId:invite.fightId});
        setShipInvite({...invite,initialData});
      }catch(error){setSendError(error.message);}
      finally{setJoiningInvite('');}
      return;
    }
    if (!invite?.fightId || joiningInvite) return;
    setJoiningInvite(invite.fightId);
    setSendError('');
    try {
      const fight = await joinBossFightInvite(invite.fightId);
      onJoinBossInvite?.(fight);
    } catch (error) {
      if (['BOSS_FIGHT_INVITE_REQUIRED','BOSS_FIGHT_NOT_ACTIVE'].includes(error?.code)) {
        setHiddenBossInviteFightIds((current) => current.includes(String(invite.fightId)) ? current : [...current, String(invite.fightId)]);
        setMessagesByChannel((current) => ({
          ...current,
          clan: (current.clan || []).filter((message) => String(message.bossFightInvite?.fightId || '') !== String(invite.fightId)),
        }));
      }
      setSendError(error?.message || (profile?.language === 'en' ? 'Could not join this boss fight.' : profile?.language === 'ru' ? 'Не удалось присоединиться к бою.' : 'Не вдалося приєднатися до бою.'));
    } finally {
      setJoiningInvite('');
    }
  };
  useEffect(() => {
    if (!sendError) return undefined;
    const timeoutId = setTimeout(() => setSendError(''), 5000);
    return () => clearTimeout(timeoutId);
  }, [sendError]);
  useEffect(() => { setReplyTo(null); }, [channel]);
  const [messagesByChannel, setMessagesByChannel] = useState({});
  const [sending, setSending] = useState(false);
  const [energyRequests, setEnergyRequests] = useState([]);
  const [energyAction, setEnergyAction] = useState(false);
  const [energyRequestCooldownUntil, setEnergyRequestCooldownUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const scrollerRef = useRef(null);
  const messageLoadsRef = useRef(new Set());
  const name = formatName(profile);

  const activeChannel = CHANNELS[channel];
  const messages = messagesByChannel[channel] || [];
  const selfAvatar = useMemo(() => profile?.avatar || profile?.photoUrl || profile?.photo_url || heroIcon, [profile?.avatar, profile?.photoUrl, profile?.photo_url]);
  const clanName = String(profile?.clan_name || '').trim();
  const clanId = profile?.clan_id || clanName;
  const clanLogo = clanName ? GUILD_LOGO_BY_ID[profile?.clan_logo_id] || DEFAULT_GUILD_LOGO : null;

  useEffect(() => {
    if (!hasClan) setChannel('world');
  }, [hasClan]);

  const loadEnergyRequests = useCallback(async () => {
    if (!clanId) {
      setEnergyRequests([]);
      return;
    }
    try {
      const requests = await listClanEnergyRequests(clanId);
      setEnergyRequests(Array.isArray(requests) ? requests : []);
    } catch {
      // keep the last known request on transient API errors
    }
  }, [clanId]);

  const mapApiMessage = (message, activeChannel = channel) => ({
    id: message?.id || `${activeChannel}-${Date.now()}`,
    side: message?.own ? 'right' : 'left',
    name: message?.author || 'player',
    role: message?.role || message?.clan || (activeChannel === 'clan' ? t('chat_panel.role_warrior') : t('chat_panel.role_wasteland')),
    roleKey: activeChannel === 'clan' ? 'clan_panel.role_fighter' : undefined,
    text: message?.localizedText?.[profile?.language === 'ua' ? 'uk' : profile?.language] || message?.localizedText?.uk || message?.text || '',
    reply: message?.reply,
    clanInvite: message?.clanInvite,
    bossFightInvite: message?.bossFightInvite,
    language: profile?.language,
    releaseVersion:message?.releaseVersion,
    reward:message?.reward,
    rewardClaimed:message?.rewardClaimed,
    time: new Date(message?.created_at || Date.now()).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
    created_at: message?.created_at || new Date().toISOString(),
    avatar: getChatMessageAvatar(message,selfAvatar,heroIcon),
    avatar_frame_id: message?.avatar_frame_id || message?.selected_avatar_frame || '',
    battle_pass_tier: message?.battle_pass_tier || 'free',
    system: Boolean(message?.system),
    tone: message?.tone,
  });

  const loadMessages = async (activeChannel = channel) => {
    if (messageLoadsRef.current.has(activeChannel)) return;
    messageLoadsRef.current.add(activeChannel);
    try {
      const apiMessages = await listChatMessages(activeChannel, 40, {playerId:profile?.id,clanId});
      const clanFiltered =
        activeChannel !== 'clan' || !clanName
          ? apiMessages
          : apiMessages.filter((message) => String(message?.clan || '').trim() === clanName || message?.own);
      const filtered = clanFiltered.filter((message) => !hiddenBossInviteFightIds.includes(String(message?.bossFightInvite?.fightId || '')));

      setMessagesByChannel((current) => ({
        ...current,
        [activeChannel]: filtered.map((message) => mapApiMessage(message, activeChannel)),
      }));
    } catch {
      // keep previous messages on transient API errors
    } finally {
      messageLoadsRef.current.delete(activeChannel);
    }
  };

  useEffect(() => {
    loadMessages(channel);
    const intervalId = setInterval(() => {
      if (document.hidden) return;
      loadMessages(channel);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [channel, clanName, hiddenBossInviteFightIds, t]);

  useEffect(() => {
    if (channel !== 'clan' || !clanId) return undefined;
    loadEnergyRequests();
    const intervalId = setInterval(() => { if (!document.hidden) loadEnergyRequests(); }, 15000);
    return () => clearInterval(intervalId);
  }, [channel, clanId, loadEnergyRequests]);

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTop = scroller.scrollHeight;
  }, [channel, messages.length]);

  const shownPatch=useRef(null);
  useEffect(()=>{
    if(channel!=='world'){shownPatch.current=null;return;}
    if(!indicators.world?.patch)return;
    const patch=messages.filter(m=>m.releaseVersion).at(-1);
    if(!patch||shownPatch.current===patch.releaseVersion)return;
    const element=scrollerRef.current?.querySelector('[data-release-version="'+patch.releaseVersion+'"]');
    if(element){shownPatch.current=patch.releaseVersion;element.scrollIntoView({block:'start',behavior:'instant'});}
  },[channel,messages,indicators.world?.patch]);
  const markVisibleChannelRead=()=>{
    const scroller=scrollerRef.current;
    if(!document.hidden&&scroller&&scroller.scrollHeight-scroller.scrollTop-scroller.clientHeight<32)markChatRead(messages,profile?.id,channel);
  };
  useEffect(()=>{markVisibleChannelRead();},[channel,messages]);
  useEffect(()=>{document.addEventListener('visibilitychange',markVisibleChannelRead);return()=>document.removeEventListener('visibilitychange',markVisibleChannelRead);},[channel,messages]);
  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      const created = await sendChatMessage({ channel, text, replyToId: replyTo?.id });
      setMessagesByChannel((current) => ({
        ...current,
        [channel]: [...(current[channel] || []), mapApiMessage(created, channel)],
      }));
      setDraft('');
      setReplyTo(null);
      setSendError('');
      void loadMessages(channel);
    } catch (error) {
      setSendError(error?.message || 'Message failed');
    } finally {
      setSending(false);
    }
  };

  const requestEnergy = async () => {
    if (!clanId || energyAction || energyRequestCooldownUntil > Date.now()) return;
    setEnergyAction(true);
    setSendError('');
    try {
      const created = await createClanEnergyRequest(clanId);
      const cooldownUntil = Date.parse(created?.expires_at || '');
      if (Number.isFinite(cooldownUntil)) setEnergyRequestCooldownUntil(cooldownUntil);
      await loadEnergyRequests();
    } catch (error) {
      if (error?.code === 'CLAN_ENERGY_COOLDOWN') {
        const cooldownUntil = Date.parse(error?.details?.details?.cooldownUntil || error?.details?.cooldownUntil || '');
        setEnergyRequestCooldownUntil(Number.isFinite(cooldownUntil) ? cooldownUntil : Date.now() + 4 * 60 * 60 * 1000);
        setSendError('');
      } else {
        setSendError(error?.message || (profile?.language === 'en' ? 'Could not request clan energy.' : profile?.language === 'ru' ? 'Не удалось запросить энергию у клана.' : 'Не вдалося попросити енергію в клану.'));
      }
    } finally {
      setEnergyAction(false);
    }
  };

  const helpWithEnergy = async (requestId) => {
    if (!clanId || energyAction) return;
    setEnergyAction(true);
    setSendError('');
    try {
      await helpClanEnergyRequest(clanId, requestId);
      await loadEnergyRequests();
    } catch (error) {
      setSendError(error?.message || (profile?.language === 'en' ? 'Could not help with this request.' : profile?.language === 'ru' ? 'Не удалось помочь с запросом.' : 'Не вдалося допомогти із запитом.'));
    } finally {
      setEnergyAction(false);
    }
  };

  const ownEnergyRequest = energyRequests.find((entry) => String(entry.owner_id) === String(profile?.id)) || null;
  const profileEnergyCooldown = Date.parse(profile?.clan_energy_request_available_at || '') || 0;
  const activeRequestCooldown = Date.parse(ownEnergyRequest?.expires_at || '') || 0;
  const cooldownUntil = Math.max(energyRequestCooldownUntil, profileEnergyCooldown, activeRequestCooldown);
  const energyCooldownLeft = Math.max(0, cooldownUntil - now);
  const timeline = [...messages.map((message) => ({ kind: 'message', value: message, createdAt: message.created_at || '' })), ...(channel === 'clan' ? energyRequests.map((request) => ({ kind: 'energy', value: request, createdAt: request.created_at || '' })) : [])].sort((left, right) => (Date.parse(left.createdAt || '') || 0) - (Date.parse(right.createdAt || '') || 0));

  return (
    <>
    {openedClan ? <ClanPreviewModal clan={openedClan} profile={profile} onClose={() => { setOpenedClan(null); void onRefreshProfile?.(); }} /> : null}
    <MarkerFrame className="flex h-full min-h-0 w-full flex-col bg-[rgba(4,6,5,0.84)] pt-2 backdrop-blur-[10px]" innerClassName="relative flex h-full min-h-0 flex-col gap-2 px-2 pb-2 pt-2" variant="transparent">
      <div className="relative z-10">
        <div className="flex items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex gap-3 px-1">
              {hasClan ? <ChannelButton channel={CHANNELS.clan} active={channel === 'clan'} onClick={() => setChannel('clan')} indicator={indicators.clan} t={t} /> : null}
              <ChannelButton channel={CHANNELS.world} active={channel === 'world'} onClick={() => setChannel('world')} indicator={indicators.world} t={t} />
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-transparent">
                  {channel === 'clan' && clanLogo ? <img src={clanLogo} alt="" aria-hidden="true" className="h-16 w-16 object-contain" /> : activeChannel.icon ? <activeChannel.icon className="h-6 w-6 text-[#d9ff90]" /> : null}
                </div>
                <div className="min-w-0">
                  {channel === 'clan' && clanName ? (
                    <h2 className="truncate font-sans text-[22px] font-black leading-none text-[#f7f5e5]">{clanName}</h2>
                  ) : (
                    <>
                      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#8ca86a]">{t(activeChannel.subtitleKey)}</p>
                      <h2 className="truncate font-sans text-[22px] font-black leading-none text-[#f7f5e5]">{t(activeChannel.titleKey)}</h2>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-[42px] w-[42px] items-center justify-center rounded-[8px] bg-transparent text-[#baf364] transition hover:text-[#dbff9f] active:scale-[0.96]"
                  aria-label={t('chat_panel.chat_history_24h')}
                >
                  <X className="h-5 w-5 stroke-[2.6]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center">
        <div className="rounded-full border border-[#28ee90] bg-[rgba(12,16,10,0.68)] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[#b9d18a]">
          {t('chat_panel.chat_history_24h')}
        </div>
      </div>

      <div
        ref={scrollerRef}
        onScroll={markVisibleChannelRead}
        className="relative z-10 flex min-h-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto rounded-[16px] bg-transparent px-1.5 py-2 pr-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex flex-col gap-3 px-1">
          {timeline.map((entry) => {
            if (entry.kind === 'energy') return <EnergyRequestMessage key={`energy-${entry.value.id}`} request={entry.value} viewerId={profile?.id} viewerName={name} now={now} disabled={energyAction} onHelp={helpWithEnergy} t={t} />;
            const resolvedMessage = entry.value.textKey ? { ...entry.value, text: t(entry.value.textKey) } : entry.value;
            return <ChatMessage key={entry.value.id} message={resolvedMessage} t={t} copy={copy} onReply={setReplyTo} onOpenClan={setOpenedClan} onJoinBossInvite={joinBossInvite} joiningInvite={joiningInvite} onClaimRelease={claimRelease} claimingRelease={claimingRelease} viewerId={profile?.id} />;
          })}
        </div>
      </div>

      <div className="relative z-10 shrink-0 rounded-[18px] bg-transparent px-3 py-2">
        {channel === 'clan' && clanId ? (
          <div className="mb-1 mt-3 flex justify-end">
            <GameTextureButton type="button" tone={energyCooldownLeft > 0 ? 'gray' : 'yellow'} disabled={energyAction || energyCooldownLeft > 0} onClick={requestEnergy} className="h-11 w-[108px]">
              <span className="relative z-10 flex items-center justify-center gap-1 font-mono text-[7px] font-black uppercase text-[#18220d]"><Zap className="h-3.5 w-3.5 shrink-0" />{energyCooldownLeft > 0 ? formatCountdown(new Date(cooldownUntil).toISOString(), now) : t('clan_panel.request_energy')}</span>
            </GameTextureButton>
          </div>
        ) : null}
        <p data-keepcase="true" className="mb-2 truncate pl-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[#7f9f5a]">
          {name}
        </p>
        {sendError ? <p role="alert" className="mb-2 text-xs text-[#ffaaa0]">{sendError}</p> : null}
        {replyTo ? <div className="mb-2 flex items-center gap-2 border-l-2 border-[#9dff43] bg-black/50 p-2 text-xs"><div className="min-w-0 flex-1"><strong>{replyTo.name}</strong><p className="truncate">{replyTo.text}</p></div><button type="button" onClick={() => setReplyTo(null)} aria-label="Cancel reply"><X className="h-4 w-4" /></button></div> : null}
        <div className="flex h-11 items-stretch gap-1">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            rows={2}
            placeholder={t('chat_panel.message_placeholder')}
            className="h-full min-h-0 flex-1 resize-none rounded-[10px_8px_11px_7px] border border-[#28ee90] bg-[rgba(255,255,255,0.88)] px-4 py-2.5 font-sans text-[14px] leading-[1.2] text-[#182012] outline-none placeholder:text-[#7d8970]"
          />

          <GameTextureButton
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="h-11 w-[74px] shrink-0 self-stretch"
            aria-label={t('chat_panel.send_button')}
          >
            <span className="relative z-10 flex h-full w-full items-center justify-center text-[#18220d]">
              <ArrowRight className="h-6 w-6 stroke-[3]" aria-hidden="true" />
            </span>
          </GameTextureButton>
        </div>
        {shipInvite && SHIP_MODULES.some(m=>m.id===shipInvite.moduleId) && <Suspense fallback={<div className="fixed inset-0 z-[400] bg-black/90 p-5 text-white">…</div>}><ServerShipBossBattle initialData={shipInvite.initialData} module={SHIP_MODULES.find(m=>m.id===shipInvite.moduleId)} name={getShipBossName(shipInvite.moduleId,profile?.language)} portrait={getShipBossPortrait(shipInvite.moduleId)} language={profile?.language==='ru'?'ru':profile?.language==='en'?'en':'uk'} clanId={shipInvite.clanId} expectedFightId={shipInvite.fightId} profile={profile} onClose={()=>{setShipInvite(null);void onRefreshProfile?.();}} onNavigate={tab=>{setShipInvite(null);onNavigate?.(tab);}} /></Suspense>}
    </div>
    </MarkerFrame>
    </>
  );
}
