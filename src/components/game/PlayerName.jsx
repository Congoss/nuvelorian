import {getPlayerPassTier} from '@/lib/playerPassTier';
import { cn } from '@/lib/utils';

export function hasBattlePassName(player) {
  return ['epic', 'legendary'].includes(
    getPlayerPassTier(player),
  );
}

export default function PlayerName({ player = null, name = '', className = '', fallback = 'Player' }) {
  // `name` can be a denormalized snapshot from chat or a combat log.
  // Prefer the current profile nickname so renames update every shared row.
  const label = String(player?.nickname || name || player?.username || player?.player_name || fallback);
  const battlePass = hasBattlePassName(player);
  const tier = getPlayerPassTier(player);
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
