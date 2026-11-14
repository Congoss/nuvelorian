export function getPlayerPassTier(player) {
 const view = player?.battle_pass_view;
 if (view?.active === false) return 'free';
 return view?.tier ?? player?.battle_pass_tier ?? 'free';
}
