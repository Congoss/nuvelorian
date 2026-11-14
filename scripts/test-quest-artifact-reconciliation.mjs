import assert from 'node:assert/strict';
import { reconcileGuaranteedQuestArtifacts, grantQuestArtifact } from '../server/utils/questArtifactRewards.js';
import { getQuestMission } from '../src/lib/questMissionCatalog.js';

const mission = getQuestMission('p4-u00-scout');
const player = { task_completions: { [mission.id]: mission.target * 2 }, collection_item_counts: {}, collection_rewards_claimed: {} };
assert.equal(reconcileGuaranteedQuestArtifacts(player), true);
assert.equal(player.collection_item_counts[mission.artifactId], 2);
assert.equal(reconcileGuaranteedQuestArtifacts(player), false);
player.collection_rewards_claimed[mission.locationId] = 1;
player.collection_item_counts[mission.artifactId] = 1;
assert.equal(reconcileGuaranteedQuestArtifacts(player), false);
player.task_completions[mission.id] += mission.target;
assert.equal(reconcileGuaranteedQuestArtifacts(player), true);
assert.equal(player.collection_item_counts[mission.artifactId], 2);
player.task_completions[mission.id] += mission.target;
assert.equal(grantQuestArtifact(player, mission, true, () => 1)?.guaranteed, 1);
assert.equal(player.collection_item_counts[mission.artifactId], 3);
console.log('Quest artifact reconciliation checks passed');
