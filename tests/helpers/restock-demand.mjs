// Historical completed agent sales, independent of the seller under test.
import {TRADABLE_SETS,TRADABLE_PETS,usdToHundredths} from '../../src/lib/marketPricing.js';
export function seedRestockDemand(store,agent){
 const buyer={id:'historical-retail-buyer',inventory_items:[],local_market_p4:0};store.players.push(buyer);
 const ids=[...Object.keys(TRADABLE_SETS).flatMap(prefix=>['weapon','head','hands','armor','legs','boots'].map(slot=>prefix+'_'+slot)),...Object.keys(TRADABLE_PETS)];
 agent.local_market_lots=ids.flatMap(id=>[0,1].map(n=>({id:`retail-${id}-${n}`,status:'sold',buyerId:buyer.id,price:usdToHundredths(100),fee:usdToHundredths(3),restockVersion:1,item:{id,type:'equipment',count:1,enhancementLevel:0}})));
}
