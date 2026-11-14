export function completedPlayerClanQuests(quests,playerId){
 return (Array.isArray(quests)?quests:[]).filter(quest=>quest.status==='COMPLETED'&&quest.rewards_granted_at&&[quest.owner_id,...(quest.participants||[])].map(String).includes(String(playerId)));
}
export function clanQuestCompletionMessage(language='uk'){
 if(language.startsWith('ru'))return {title:'Клановый квест выполнен!',description:'Награда уже начислена автоматически.'};
 if(language.startsWith('en'))return {title:'Clan quest completed!',description:'Your reward has been credited automatically.'};
 return {title:'Клановий квест виконано!',description:'Нагороду вже зараховано автоматично.'};
}
