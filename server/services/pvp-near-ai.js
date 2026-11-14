import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { agentSecrets } from './market-mainnet-signer.js';
import { recordDiagnosticEvent } from '../data/diagnostics.js';

const policies = new Map(), pending = new Set(), attempted = new Map();
let day = '', calls = 0;
function config() {
  let file = {}; try { file = JSON.parse(readFileSync(resolve('.pvp-ai.json'),'utf8')); } catch { /* Optional deployment settings. */ }
  return { enabled: process.env.PVP_NEAR_AI_ENABLED === '1' || file.enabled === true, cap: Math.max(0,Math.min(100,Number(file.maxCallsPerDay ?? 24)||0)) };
}
function key() {
  if (process.env.PVP_NEAR_AI_KEY || process.env.MARKET_AGENT_LLM_KEY) return process.env.PVP_NEAR_AI_KEY || process.env.MARKET_AGENT_LLM_KEY;
  try { return agentSecrets()?.llmKey || ''; } catch { return ''; }
}
export function chooseCachedPvpAiMove(matchId, random = Math.random) {
  const policy = policies.get(matchId);
  if (!policy || Date.now() - policy.at > 15 * 60_000) return null;
  const n = random(); let sum = 0;
  for (const [i, action] of ['finger','pencil','poison'].entries()) { sum += policy.weights[i]; if (n <= sum) return action; }
  return 'poison';
}
export async function requestPvpAiPolicy(history, { fetchImpl = fetch, apiKey = '', model = 'Qwen/Qwen3.6-35B-A3B-FP8' } = {}) {
  if (!apiKey) return null;
  try {
    const response = await fetchImpl('https://cloud-api.near.ai/v1/chat/completions', {
      method:'POST', signal:AbortSignal.timeout(8000), headers:{'Content-Type':'application/json',Authorization:`Bearer ${apiKey}`},
      body:JSON.stringify({model,max_tokens:90,temperature:.4,response_format:{type:'json_object'},chat_template_kwargs:{enable_thinking:false},messages:[
        {role:'system',content:'You coach an NPC in a finger/pencil/poison duel. Finger beats pencil; pencil beats poison; poison beats finger. Use ONLY completed history to recommend probabilities for future NPC moves. Return JSON {"finger":number,"pencil":number,"poison":number}. You cannot see or change a pending move. No prose.'},
        {role:'user',content:JSON.stringify({completedRounds:history.slice(-8).map(h=>({player:h.playerChoice,npc:h.opponentChoice,result:h.winner}))})},
      ]}),
    });
    if (!response.ok) return null;
    const data = await response.json(), parsed = JSON.parse(data?.choices?.[0]?.message?.content || 'null');
    const weights = ['finger','pencil','poison'].map(a=>Number(parsed?.[a]));
    if (weights.some(n=>!Number.isFinite(n)||n<0) || weights.reduce((s,n)=>s+n,0)<=0) return null;
    const sum = weights.reduce((s,n)=>s+n,0);
    // Mix with uniform play: a model cannot force certainty or an invalid action.
    return weights.map(n=>.15+.55*n/sum);
  } catch { return null; }
}
export function schedulePvpAiCoaching(match) {
  if (match?.opponent?.kind !== 'ai' || match.status !== 'active') return;
  const settings = config(); if (!settings.enabled) return;
  const apiKey = key(); if (!apiKey) return;
  const now = Date.now(), today = new Date(now).toISOString().slice(0,10);
  if (day !== today) { day = today; calls = 0; }
  const prior = policies.get(match.id);
  if (pending.has(match.id) || calls >= settings.cap || (prior && now-prior.at<60_000) || now-(attempted.get(match.id)||0)<60_000) return;
  calls++; pending.add(match.id); attempted.set(match.id,now);
  void requestPvpAiPolicy(match.history,{apiKey}).then(weights=>{
    if(weights)policies.set(match.id,{weights,at:Date.now()});
    return recordDiagnosticEvent({source:'api',path:'/pvp/online',code:weights?'PVP_NEAR_AI_POLICY':'PVP_NEAR_AI_FALLBACK',status:200,message:weights?'NEAR AI coaching policy ready for future committed moves':'NEAR AI unavailable; local pilot retained'}).catch(()=>{});
  }).finally(()=>pending.delete(match.id));
  if (policies.size>500) for (const [id,p] of policies) if(now-p.at>15*60_000)policies.delete(id);
  if (attempted.size>500) for (const [id,at] of attempted) if(now-at>15*60_000)attempted.delete(id);
}
