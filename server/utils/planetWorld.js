import { initialWorld, createWorldMap, hexDistance, hexKey, BUILDINGS, buildingCost } from '../../src/lib/planetWorld.js';
function fail(code) { const error = new Error(code); error.code=code; error.statusCode=400; throw error; }
export function applyWorldAction(player, action) {
  const state=structuredClone(player.planet_world || initialWorld(player.id));
  const map=createWorldMap(state.seed);
  if(action.type==='world-move') {
    const target=map.find(c=>c.q===action.q && c.r===action.r);
    if(!target || hexDistance(state,target)!==1 || !state.discovered.includes(target.key)) fail('WORLD_INVALID_MOVE');
    const fresh=!state.cleared.includes(target.key);
    const cost=target.kind==='guardian' && fresh?3:1;
    if(state.moves<cost) fail('WORLD_NO_MOVES');
    state.moves-=cost; state.q=target.q; state.r=target.r;
    if(fresh) {
      state.crystals+=({crystal:8,guardian:12,ruins:6})[target.kind]||0;
      state.cleared.push(target.key);
      if(target.kind==='portal') { state.q=0; state.r=0; }
    }
    const sight=2+Math.floor(state.buildings.observatory/2);
    state.discovered=[...new Set([...state.discovered,...map.filter(c=>hexDistance(c,state)<=sight).map(c=>c.key)])];
  } else if(action.type==='world-build') {
    if(hexKey(state.q,state.r)!=='0,0') fail('WORLD_RETURN_HOME');
    if(!BUILDINGS.includes(action.building)) fail('WORLD_INVALID_BUILDING');
    const level=state.buildings[action.building];
    if(level>=5) fail('WORLD_MAX_LEVEL');
    const cost=buildingCost(level);
    if(state.crystals<cost) fail('WORLD_NO_CRYSTALS');
    state.crystals-=cost; state.buildings[action.building]++;
    if(action.building==='observatory') state.discovered=[...new Set([...state.discovered,...map.filter(c=>hexDistance(c,state)<=2+Math.floor(state.buildings.observatory/2)).map(c=>c.key)])];
  } else if(action.type==='world-return') {
    if(state.q===0 && state.r===0) fail('WORLD_ALREADY_HOME');
    state.q=0;state.r=0;state.moves=0;
  } else if(action.type==='world-rest') {
    if(state.q!==0 || state.r!==0) fail('WORLD_RETURN_HOME');
    if(state.moves===18+state.buildings.citadel*2) fail('WORLD_ALREADY_RESTED');
    state.day++; state.moves=18+state.buildings.citadel*2;
    state.crystals+=state.buildings.mine*3;
  } else fail('WORLD_INVALID_ACTION');
  player.planet_world=state;
  return {};
}
