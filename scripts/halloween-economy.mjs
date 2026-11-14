import {HALLOWEEN} from '../src/lib/halloweenEvent.js';
function source(key, attempts, eligibleChance=1){
 const c=HALLOWEEN.sources[key];let states=new Map([['0,0',1]]);
 for(let n=0;n<attempts;n++){
  const next=new Map();const add=(wins,misses,p)=>{const k=wins+','+misses;next.set(k,(next.get(k)||0)+p);};
  for(const [key,p] of states){const [wins,misses]=key.split(',').map(Number);
   if(wins>=c.cap){add(wins,misses,p);continue;}
   const chance=misses+1>=c.pity?1:c.chance;
   add(wins,misses,p*(1-eligibleChance));add(wins+1,0,p*eligibleChance*chance);add(wins,misses+1,p*eligibleChance*(1-chance));
  }states=next;
 }
 let expected=0,positive=0;for(const [key,p]of states){const wins=Number(key.split(',')[0]);expected+=wins*p;if(wins>0)positive+=p;}return {expected,positive};
}
const scenarios=[{name:'Casual',boss:5,quest:1,fishing:3,daily:5},{name:'Active',boss:10,quest:3,fishing:6,daily:6},{name:'Very active',boss:20,quest:6,fishing:12,daily:6}];
for(const x of scenarios){const b=source('boss',x.boss),q=source('quest',x.quest),f=source('fishing',x.fishing,.8);const activity=b.expected+q.expected+f.expected+x.daily;console.log(JSON.stringify({...x,activity:Number(activity.toFixed(2)),withExchange:Number((activity+15).toFixed(2)),activity15days:Number((activity*15).toFixed(1))}));}
console.log('Technical daily cap',Object.values(HALLOWEEN.sources).reduce((n,s)=>n+s.cap,0)+15);
console.log('Daily cap with banked exchange',Object.values(HALLOWEEN.sources).reduce((n,s)=>n+s.cap,0)+45);
