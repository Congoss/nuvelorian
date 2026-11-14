import fs from 'node:fs/promises';
const file = 'src/components/game/HalloweenEventScene.jsx';
let text = await fs.readFile(file, 'utf8');
const replacements = [
 ['players who have 200+ activity pumpkins', 'players with at least 200 pumpkins in their balance at the snapshot'],
 ['players with 200+ activity pumpkins', 'players with at least 200 pumpkins in their balance at the snapshot'],
 ['All received pumpkins count toward the 200+ raffle.', 'Spent pumpkins do not count toward this minimum. Keep at least 200 pumpkins until the snapshot.'],
 ['игроков с 200+ тыквами активности', 'игроков, у которых на момент снимка не меньше 200 тыкв на балансе'],
 ['Для розыгрыша 200+ учитываются все полученные тыквы.', 'Потраченные тыквы не учитываются в этом минимуме. Сохраните на балансе не меньше 200 тыкв до снимка.'],
 ['гравців із 200+ гарбузами активності', 'гравців, у яких на момент знімка щонайменше 200 гарбузів на балансі'],
 ['Для розіграшу 200+ враховуються всі отримані гарбузи.', 'Витрачені гарбузи не враховуються в цьому мінімумі. Збережіть на балансі щонайменше 200 гарбузів до знімка.'],
 ['200+ pumpkins — entry into the raffle for 10 TG Gifts.', 'Keep 200+ pumpkins in your balance at the snapshot to enter the raffle for 10 TG Gifts.'],
 ['200+ тыкв — участие в розыгрыше 10 TG Gifts.', '200+ тыкв на балансе в момент снимка — участие в розыгрыше 10 TG Gifts.'],
 ['200+ гарбузів — участь у розіграші 10 TG Gifts.', '200+ гарбузів на балансі на момент знімка — участь у розіграші 10 TG Gifts.'],
 ['function HalloweenPrizeList({language,activityEarned=0})', 'function HalloweenPrizeList({language,pumpkinBalance=0})'],
 ['Math.min(200,activityEarned)', 'Math.min(200,pumpkinBalance)'],
 ["activityEarned>=200?'✓'", "pumpkinBalance>=200?'✓'"],
 ['<HalloweenPrizeList language={profile.language} activityEarned={state.activityTotal||0}/>', '<HalloweenPrizeList language={profile.language} pumpkinBalance={state.balance||0}/>'],
];
for (const [before, after] of replacements) {
 if (!text.includes(before)) throw new Error(`Missing expected copy: ${before}`);
 text = text.replaceAll(before, after);
}
await fs.writeFile(file, text);
