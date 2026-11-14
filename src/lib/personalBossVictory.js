export function hasPersonalBossVictory(fightId,damageLog,boxes=[]){return Number(damageLog?.damage)>0||boxes.some(box=>String(box?.fightId||box?.fight_id||'')===String(fightId));}
