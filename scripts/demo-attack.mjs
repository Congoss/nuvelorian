// npm run demo:attack — tries to drain the AI merchants and bend prices, then prints what happened.
// In-memory only: no blockchain transactions, keys, network or saved game. Exit code 1 if anything got through.
import {mkdirSync,writeFileSync} from 'node:fs';
import {runAttackDemo} from '../server/services/market-attack-demo.js';

const report=await runAttackDemo();
console.log('MARKET ATTACK REHEARSAL · local simulation · real market service and merchant rules · no LLM, no network\n');
for(const [index,r] of report.results.entries()){
  console.log(`${String(index+1).padStart(2)}. ${r.title}  →  ${r.result.toUpperCase()}`);
  console.log(`    ${r.control?'Trade ':'Attack'}: ${r.attack}`);
  console.log(`    Rule:   ${r.rule}`);
  console.log(`    Result: ${r.detail}\n`);
}
console.log(`${report.blocked} of ${report.attacks} attacks blocked; honest trade ${report.results.find(r=>r.control)?.ok?'still works':'BROKEN'}; across all attacks the merchants spent ${report.merchantSpend}, every purchase inside the limits above (one replacement per real sale, shared daily cap).`);
mkdirSync('.local/hackathon',{recursive:true});
writeFileSync('.local/hackathon/attack-demo.json',JSON.stringify(report,null,2));
console.log('Report: .local/hackathon/attack-demo.json');
process.exit(report.passed?0:1);
