import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePlayerProgression } from '../server/utils/progression.js';
import { buildPlayerStateSnapshot } from '../server/utils/playerState.js';
import { getWeaponTalentStats } from '../src/lib/talents.js';
import { getEquippedSetCounts } from '../src/lib/equipmentEffects.js';

test('equipped auras accelerate actual regeneration without compounding after normalization', () => {
  for (const [animation, multiplier] of [['bp_epic_animation',1.2],['bp_legendary_animation',1.3],[null,1]]) {
    const player = { level:1,energy:0,max_energy:100,energy_regen_rate:1,last_energy_update:new Date(Date.now()-600000).toISOString(),equipped_items:{animation} };
    const normalized = normalizePlayerProgression(player);
    assert.equal(normalized.energy_regen_rate,multiplier);
    assert.equal(normalizePlayerProgression(normalized).energy_regen_rate,multiplier);
    assert.equal(normalizePlayerProgression({...normalized,equipped_items:{animation:null}}).energy_regen_rate,1);
    const energy = buildPlayerStateSnapshot(player).energy;
    assert.ok(energy >= 10*multiplier && energy < 10*multiplier+.02);
  }
});

test('crowns give 5/3/2 percent poison preservation and add to the pet without losing the helmet set', () => {
  const gear = Object.fromEntries(['head','hands','armor','legs','boots','weapon'].map(slot=>[slot,`bp_legendary_${slot}`]));
  for (const [accessory, chance] of [['raidboss2_crown_accessory',.05],['raidboss2_crown2_accessory',.03],['raidboss2_crown3_accessory',.02]]) {
    const profile = { equipped_items:{...gear,accessory,pet:'raidboss2_pet'} };
    assert.equal(getEquippedSetCounts(profile).bp_legendary,6);
    for(const id of ['satchel','f4','c4']) assert.ok(Math.abs(getWeaponTalentStats({id,damage:100,cooldownMin:0},profile).saveChance-(chance+.02))<1e-12);
  }
});
