// Checks the AI market players' NEAR accounts (read-only, no keys).
// Usage: MARKET_AGENT_SMITH_NEAR=tor.you.tg MARKET_AGENT_HUNTER_NEAR=grym.you.tg node scripts/check-agent-wallets.mjs
// or put the two variables in .env.local and run: npm run check:agent-wallets
import {agentWalletConfig, checkAgentWallets} from '../server/services/agent-wallets.js';
import {readFileSync, existsSync} from 'node:fs';

if (existsSync('.env.local')) for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const match = line.match(/^\s*(MARKET_AGENT_[A-Z]+_NEAR|NEAR_NETWORK)\s*=\s*"?([^"#\s]+)"?/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
}
const config = agentWalletConfig();
if (!config.length) {
  console.log('No agent accounts set. Add MARKET_AGENT_SMITH_NEAR and MARKET_AGENT_HUNTER_NEAR to .env.local.');
  process.exit(1);
}
const results = await checkAgentWallets();
let failed = 0;
for (const {key} of config) {
  const r = results[key];
  if (r.ok) console.log(`OK   ${key.padEnd(7)} ${r.account}  ${r.near.toFixed(3)} NEAR  ${Math.round(r.pl4).toLocaleString('en-US')} PL4`);
  else { failed++; console.log(`FAIL ${key.padEnd(7)} ${r.account}  ${r.error || r.issues.join('; ')}${r.exists ? `  (${r.near.toFixed(3)} NEAR, ${Math.round(r.pl4 || 0).toLocaleString('en-US')} PL4)` : ''}`); }
}
process.exit(failed ? 1 : 0);
