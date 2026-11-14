import { getQuestMission } from '../../src/lib/questMissionCatalog.js';
import { grantXpToPlayer } from './progression.js';
export function grantTutorialArtifactStarter(player) {
 if(player.tutorial_auto_quests_completed||player.tutorial_disabled||player.tutorial_level_eight_reward_claimed)return false;
 if(Number(player.task_completions?.['p4-u00-scout']||0)<4)return false;
 const missions=['loot','repair','trade','fight','cache','final'].map(slug=>getQuestMission('p4-u00-'+slug));
 let xp=0,energy=0;
 const tasks={...player.task_completions},counts={...player.collection_item_counts};
 const alreadyClaimed=Number(player.collection_rewards_claimed?.['p4-u00']||0)>0;
 for(const mission of missions){
  const missing=Math.max(0,mission.target-Number(tasks[mission.id]||0));
  xp+=missing*mission.xp;energy+=missing*mission.energy;
  player.tentacles=Number(player.tentacles||0)+missing*mission.tentacles;
  player.stat_strength=Number(player.stat_strength||1)+missing*mission.strength;
  tasks[mission.id]=Math.max(mission.target,Number(tasks[mission.id]||0));
  if(!alreadyClaimed)counts[mission.artifactId]=Math.max(1,Number(counts[mission.artifactId]||0));
 }
 // Tutorial assistance completes the remaining first cycle without extra taps.
 player.energy=Math.max(0,Number(player.energy||0)-energy);
 player.energy_spent_total=Number(player.energy_spent_total||0)+energy;
 player.energy_spent_today=Number(player.energy_spent_today||0)+energy;
 player.total_tasks_today=Number(player.total_tasks_today||0)+missions.reduce((sum,m)=>sum+Math.max(0,m.target-Number(player.task_completions?.[m.id]||0)),0);
 player.task_completions=tasks;player.collection_item_counts=counts;player.collection_items=Object.keys(counts).filter(id=>counts[id]>0);
 grantXpToPlayer(player,xp);
 player.tutorial_artifact_starter_granted=true;player.tutorial_auto_quests_completed=true;
 return true;
}
