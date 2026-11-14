import test from 'node:test';import assert from 'node:assert/strict';
import {grantTutorialArtifactStarter} from '../server/utils/tutorialArtifactStarter.js';
import {applyPlayerAction} from '../server/utils/playerActions.js';
test('starter set requires first quest and is granted once without replacing earned extras',()=>{
 const p={task_completions:{'p4-u00-scout':3},collection_item_counts:{'p4-u00-artifact-1':2}};
 assert.equal(grantTutorialArtifactStarter(p),false);p.task_completions['p4-u00-scout']=4;
 applyPlayerAction(p,{type:'tutorial-progress',step:'artifacts'});assert.deepEqual(Object.values(p.collection_item_counts),[2,1,1,1,1,1,1]);
 applyPlayerAction(p,{type:'collection-claim',locationId:'p4-u00',requestId:'starter-test'});
 assert.equal(grantTutorialArtifactStarter(p),false);assert.equal(p.collection_item_counts['p4-u00-artifact-2'],0);
});
