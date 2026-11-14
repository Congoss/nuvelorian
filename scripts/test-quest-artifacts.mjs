import assert from 'node:assert/strict';
import { getQuestMission } from '../src/lib/questMissionCatalog.js';
import { grantQuestArtifact } from '../server/utils/questArtifactRewards.js';

const mission = getQuestMission('p4-u00-scout');
assert.equal(mission.artifactId, 'p4-u00-artifact-1');

const player = {
  task_completions: { [mission.id]: mission.target - 1 },
  collection_item_counts: {},
  collection_items: [],
};
assert.equal(grantQuestArtifact(player, mission, true, () => 0.9), null);
assert.deepEqual(player.collection_item_counts, {});

player.task_completions[mission.id] = mission.target;
assert.deepEqual(grantQuestArtifact(player, mission, true, () => 0.9), {
  id: mission.artifactId, count: 1, guaranteed: 1, bonus: 0,
});
assert.equal(player.collection_item_counts[mission.artifactId], 1);

assert.deepEqual(grantQuestArtifact(player, mission, true, () => 0), {
  id: mission.artifactId, count: 2, guaranteed: 1, bonus: 1,
});
assert.equal(player.collection_item_counts[mission.artifactId], 3);
assert.deepEqual(player.collection_items, [mission.artifactId]);

assert.equal(grantQuestArtifact(player, mission, false, () => 0), null);
assert.equal(player.collection_item_counts[mission.artifactId], 3);
console.log('Quest artifact rewards: OK');
