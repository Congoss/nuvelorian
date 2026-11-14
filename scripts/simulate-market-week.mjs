import {mkdirSync,writeFileSync} from 'node:fs';
import {runMarketSimulation} from '../server/services/market-simulation.js';
const report=await runMarketSimulation();
mkdirSync('.local/hackathon',{recursive:true});
writeFileSync('.local/hackathon/week-simulation.json',JSON.stringify(report,null,2));
console.table(report.rows.map(r=>({day:r.day,cashP4:(r.cash/100).toFixed(2),stockP4:(r.stockAtCost/100).toFixed(2),treasuryChangeP4:(r.treasuryChange/100).toFixed(2),activeLots:r.activeLots,paused:r.paused})));
console.log('Offline 7-day simulation complete. Report: .local/hackathon/week-simulation.json; no real payments.');
