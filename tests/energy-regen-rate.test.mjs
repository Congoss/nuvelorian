import test from 'node:test';
import assert from 'node:assert/strict';
import {getBaseEnergyRegenRate, calculateEnergy} from '../src/lib/gameConfig.js';
test('new and existing accounts regenerate at least one energy per 30 seconds',()=>{
 for(const player of [{},{energy_regen_rate:1},{energy_regen_base_rate:1/3},{energy_regen_rate:.4,equipment_energy_regen_pct:.2}]) assert.equal(getBaseEnergyRegenRate(player),2);
 assert.ok(Math.abs(calculateEnergy(new Date(Date.now()-30000).toISOString(),0,100,2)-1)<.02);
});
test('higher custom rates and equipment bonuses remain intact',()=>{
 assert.equal(getBaseEnergyRegenRate({energy_regen_base_rate:3}),3);
 assert.equal(getBaseEnergyRegenRate({energy_regen_rate:3.6,equipment_energy_regen_pct:.2}),3);
 assert.equal(getBaseEnergyRegenRate({energy_regen_base_rate:2})*1.3,2.6);
});
