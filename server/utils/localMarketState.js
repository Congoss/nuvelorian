// These fields belong to the isolated market save, never the production world.
export const LOCAL_MARKET_STATE_KEYS = [
  'local_market_agent_ledger','local_market_agents_paused','local_market_treasury_start',
  'local_market_fee_recipient','local_market_fee_income','local_market_burned',
  'local_market_pl4_usd','local_market_feed','local_market_journal','local_market_agent_wallets',
  'local_market_pilot_budget',
];
export function restoreLocalMarketState(target,saved) {
  for(const key of LOCAL_MARKET_STATE_KEYS)if(Object.hasOwn(saved,key))target[key]=JSON.parse(JSON.stringify(saved[key]));
}
