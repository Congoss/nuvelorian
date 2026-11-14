import test from 'node:test';
import assert from 'node:assert/strict';
import {TALENT_DEFS,getTalentUnlockRequirements,isTalentUnlocked} from '../src/lib/talents.js';

test('T51 explains sector gating even though it has no individual prerequisites', () => {
  const requirements=getTalentUnlockRequirements({talent_tree_version:2,talent_levels:{}},'t51');
  assert.deepEqual(requirements.map(({type,id,required,met})=>({type,id,required,met})),[
    {type:'talent',id:'t50',required:10,met:false},
    {type:'spent',id:undefined,required:240,met:false},
  ]);
});

test('displayed requirements agree with actual unlock rules for every talent', () => {
  const profiles=[{}, {talent_tree_version:2,talent_levels:{}}, ...Array.from({length:60},(_,count)=>({
    talent_tree_version:2,talent_levels:Object.fromEntries(TALENT_DEFS.map((talent,index)=>[talent.id,index<count?10:0])),
  }))];
  for(const profile of profiles)for(const talent of TALENT_DEFS){
    assert.equal(getTalentUnlockRequirements(profile,talent.id).every(item=>item.met),isTalentUnlocked(profile,talent.id),talent.id);
  }
});
