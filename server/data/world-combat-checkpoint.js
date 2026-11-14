export async function saveWorldSnapshot(sql, stateKey, snapshot) {
  await sql`
    INSERT INTO game_state (key,state,updated_at)
    VALUES (${stateKey},${JSON.stringify(snapshot)}::jsonb,now())
    ON CONFLICT (key) DO UPDATE
      SET state=game_state.state || EXCLUDED.state,updated_at=EXCLUDED.updated_at
  `;
}

export function mergeWorldCombatSnapshot(state, combat) {
  const indexes = new Map();
  for (const entry of combat) {
    if (entry.entity_type === 'raidBoss') { state.raidBoss = entry.state; continue; }
    if (!['clans','bossFights','bossDamageLogs'].includes(entry.entity_type)) continue;
    const list = state[entry.entity_type] ||= [];
    const damage = entry.entity_type === 'bossDamageLogs';
    const naturalKey = row => row.fight_id && row.player_email ? JSON.stringify([row.fight_id, row.player_email]) : null;
    const key = damage ? naturalKey(entry.state) : String(entry.entity_id);
    if (key == null) {
      const position = list.findIndex(row => String(row.id) === entry.entity_id);
      if (position < 0) list.push(entry.state); else list[position] = entry.state;
      indexes.delete(entry.entity_type);
      continue;
    }
    let index = indexes.get(entry.entity_type);
    if (!index) {
      index = new Map();
      for (const [position, row] of list.entries()) {
        const rowKey = damage ? naturalKey(row) : String(row.id);
        if (rowKey != null && !index.has(rowKey)) index.set(rowKey, position);
      }
      indexes.set(entry.entity_type, index);
    }
    const position = index.get(key);
    if (position !== undefined) list[position] = entry.state;
    else {
      index.set(key, list.length);
      list.push(entry.state);
    }
    if (!damage && String(entry.state.id) !== key) indexes.delete(entry.entity_type);
  }
  return state;
}
