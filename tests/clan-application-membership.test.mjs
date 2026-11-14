import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync('server/app.js', 'utf8');
const start = source.indexOf("    if (action === 'application') {");
const end = source.indexOf("    } else if (action === 'kick')", start);
const handler = source.slice(start, end) + '\n    }';
function accept(applicant) {
  const clan = {id:'new', name:'New', applications:[{id:'request',player_id:applicant.id}]};
  let error;
  vm.runInNewContext('(function(){' + handler + '})()', {
    action:'application',body:{applicationId:'request',decision:'accept'},clan,store:{players:[applicant]},
    response:{},sendError:(_r,status,_m,code)=>{error={status,code};},members:()=>[],capacity:()=>25,
    addClanActivity(){},player:{id:'leader'},clanActorName:p=>p.id,
  });
  return {clan,error};
}
test('old applications cannot transfer an existing clan member', () => {
  for (const membership of [{clan_id:'old'}, {clan_name:'Old'}]) {
    const applicant = {id:'player',...membership};
    const original = {...applicant};
    const result = accept(applicant);
    assert.deepEqual(result.error,{status:409,code:'CLAN_ALREADY_JOINED'});
    assert.deepEqual(applicant,original);
    assert.equal(result.clan.applications.length,1);
  }
});
test('accepting a clanless applicant still works', () => {
  const applicant={id:'player'};
  assert.equal(accept(applicant).error,undefined);
  assert.equal(applicant.clan_id,'new');
});
