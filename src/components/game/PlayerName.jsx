import { cn } from '@/lib/utils';

export function hasBattlePassName(player) {
  return ['epic', 'legendary'].includes(
    player?.battle_pass_view?.tier || player?.battle_pass?.tier || player?.battle_pass_tier || '',
  );
}

export default function PlayerName({ player = null, name = '', className = '', fallback = 'Player' }) {
  // `name` can be a denormalized snapshot from chat or a combat log.
  // Prefer the current profile nickname so renames update every shared row.
  const label = String(player?.nickname || name || player?.username || player?.player_name || fallback);
  const battlePass = hasBattlePassName(player);
  const tier = player?.battle_pass_view?.tier || player?.battle_pass?.tier || player?.battle_pass_tier;
  return (
    <span
      data-keepcase="true"
      data-name={battlePass ? label : undefined}
      className={cn(className, battlePass && 'battle-pass-name', battlePass && tier === 'epic' && 'battle-pass-name-silver')}
    >
      {label}
    </span>
  );
}
