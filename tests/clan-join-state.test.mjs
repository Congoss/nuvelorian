import test from 'node:test';
import assert from 'node:assert/strict';
import { getClanJoinState } from '../src/lib/clanJoinState.js';
test('joining is blocked in own or another clan, but enabled for unassigned players, with localized labels', () => {
  for (const lang of ['uk','ru','en']) {
    assert.equal(getClanJoinState({ clan_id: 'a' }, { id: 'a' }, lang).disabled, true);
    assert.equal(getClanJoinState({ clan_id: 'a' }, { id: 'b' }, lang).disabled, true);
    assert.equal(getClanJoinState({}, { id: 'b' }, lang).disabled, false);
    assert.equal(getClanJoinState({}, { join_type: 'invite' }, lang).disabled, true);
  }
  assert.equal(getClanJoinState({clan_name:'Rabbit'}, {name:'Rabbit'}, 'ru').label, 'ВЫ В ЭТОМ КЛАНЕ');
  assert.equal(getClanJoinState({}, {}, 'ru').label, 'ВСТУПИТЬ');
});
