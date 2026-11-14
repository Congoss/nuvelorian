import { getQuestMission } from '../../src/lib/questMissionCatalog.js';

const BONUS_ARTIFACT_DROP_CHANCE = 0.05;

export function reconcileGuaranteedQuestArtifacts(player) {
  const counts = { ...(player.collection_item_counts || {}) };
  let changed = false;
  for (const [missionId, rawRuns] of Object.entries(player.task_completions || {})) {
    const mission = getQuestMission(missionId);
    if (!mission) continue;
    const earned = Math.floor(Math.max(0, Number(rawRuns) || 0) / mission.target);
    const redeemed = Math.max(0, Number(player.collection_rewards_claimed?.[mission.locationId] || 0));
    const minimumOwned = Math.max(0, earned - redeemed);
    if (Number(counts[mission.artifactId] || 0) >= minimumOwned) continue;
    counts[mission.artifactId] = minimumOwned;
    changed = true;
  }
  if (changed) {
    player.collection_item_counts = counts;
    player.collection_items = Object.keys(counts).filter((id) => Number(counts[id]) > 0);
  }
  return changed;
}

export function grantQuestArtifact(player, mission, success, random = Math.random) {
  if (!success || !mission?.artifactId) return null;

  const runs = Number(player.task_completions?.[mission.id] || 0);
  const target = Math.max(1, Number(mission.target) || 1);
  const guaranteed = runs > 0 && runs % target === 0 ? 1 : 0;
  const bonus = random() < BONUS_ARTIFACT_DROP_CHANCE ? 1 : 0;
  const count = guaranteed + bonus;
  if (!count) return null;

  const id = mission.artifactId;
  player.collection_item_counts = {
    ...(player.collection_item_counts || {}),
    [id]: Number(player.collection_item_counts?.[id] || 0) + count,
  };
  player.collection_items = [...new Set([...(player.collection_items || []), id])];
  return { id, count, guaranteed, bonus };
}
