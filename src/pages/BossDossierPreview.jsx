import { applyLocalDossierFitting } from '@/lib/localProfileHeaderSkin';
import BossDossier from '@/components/game/BossDossier';

const profile = { id: 'local-dossier-preview', boss_kills_by_id: { heli: 100, tank: 100, chinook: 100, boss4: 100, boss5: 100, boss6: 100, boss7: 100, boss8: 100 }, ship_boss_kills: { hull: 100, engine: 100, hangar: 100, portal: 100 }, player_achievements: {} };

export default function BossDossierPreview({ onExit }) {
  const lang = new URLSearchParams(window.location.search).get('lang');
  const language = ['ru', 'en'].includes(lang) ? lang : 'uk';
  const requestedBoss = new URLSearchParams(window.location.search).get('boss');
  const bossId = ['queen','gumqueen','portal','ship-portal'].includes(requestedBoss) ? 'ship-portal' : ['kangaroo','hangar','ship-hangar'].includes(requestedBoss) ? 'ship-hangar' : ['soldier','engine','ship-engine'].includes(requestedBoss) ? 'ship-engine' : ['boss8','shkraban'].includes(requestedBoss) ? 'boss8' : ['cheese','hull','ship-hull'].includes(requestedBoss) ? 'ship-hull' : ['boss6','suckhole'].includes(requestedBoss) ? 'boss6' : ['boss7','cleopatrash'].includes(requestedBoss) ? 'boss7' : ['boss5','sporgol'].includes(requestedBoss) ? 'boss5' : ['boss4','worm'].includes(requestedBoss) ? 'boss4' : ['chinook','shork'].includes(requestedBoss) ? 'chinook' : ['tank','moth'].includes(requestedBoss) ? 'tank' : 'heli';
  const requestedKills = new URLSearchParams(window.location.search).get('kills');
  const previewProfile = requestedKills !== null ? { ...profile, ship_boss_kills: { ...profile.ship_boss_kills, ...(bossId.startsWith('ship-') ? { [bossId.slice(5)]: Math.max(0, Number(requestedKills) || 0) } : {}) }, boss_kills_by_id: { ...profile.boss_kills_by_id, [bossId]: Math.max(0, Number(requestedKills) || 0) } } : profile;
  return <main className="game-app box-border h-[100dvh] overflow-hidden bg-[#07110b] px-2 py-2 font-mono" style={{height:'var(--app-viewport-height, 100dvh)',paddingTop:'calc(var(--app-safe-top, env(safe-area-inset-top, 0px)) + 8px)',paddingBottom:'calc(var(--app-safe-bottom, env(safe-area-inset-bottom, 0px)) + 8px)'}}>
    <div className="mx-auto h-full max-w-[510px]">
      <BossDossier key={bossId} bossId={bossId} profile={previewProfile} language={language} preview onBack={() => { applyLocalDossierFitting(); if(onExit)onExit();else window.location.assign('/'); }} />
    </div>
  </main>;
}
