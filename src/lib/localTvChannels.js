export const LOCAL_TV_CHANNELS = [
  { id: 'monster-toons', title: 'MONSTER TOONS · Справжні монстри', src: `${SHKRABAN_ROOT}/channels/channel-monster-toons-cartoon.webp` },
  ...[
  ['fort', 'FORT TV · Форт Буаярд'],
  ['shop', 'BUY TV · Телемагазин'],
  ['weather', 'REKT WEATHER · Прогноз погоди'],
  ['pepe', 'NO SIGNAL · Pepe'],
  ['horror', 'MIDNIGHT · Нічний хорор'],
  ['breaking', 'BREAKING BAGS · LET HIM COOK'],
  ['titanic', 'TITANIC TRADING · STILL HOLDING'],
  ['matrix', 'MATRIX MARKET · BUY OR SELL'],
  ['gollum', 'GOLLUM WALLET · MY PRECIOUS'],
  ].map(([id, title]) => ({ id, title, src: `${SHKRABAN_ROOT}/channels/channel-${id}${['fort', 'shop', 'weather', 'pepe', 'horror'].includes(id) ? '-cartoon' : ''}.webp` })),
];

export const LOCAL_TV_CAPTIONS = {
  fort: { lines: ['FORGET', 'THE SEED.'], color: '#caff00', background: '#21152feF', size: .145, top: .65 },
  shop: { lines: ['BUY THE DIP!'], color: '#eeff00', background: '#7718a8', size: .15, top: .78 },
  weather: { lines: ['REKT: 99%'], color: '#080808', background: '#beff16', size: .17, top: .78 },
  pepe: { lines: ['NO SIGNAL'], color: '#fff', background: '#050505', size: .16, top: .78 },
};

export function nextTvChannel(current, random = Math.random) {
  return (current + 1 + Math.floor(random() * (LOCAL_TV_CHANNELS.length - 1))) % LOCAL_TV_CHANNELS.length;
}
import { SHKRABAN_ROOT } from './shkrabanContent.js';
