import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createReleaseAnnouncements, readInstalledRelease, readInstalledReleaseAsync, releaseMessage } from '../server/services/release-announcements.js';
import { cleanupLegacyPatchFiles } from '../server/utils/legacyPatchFiles.js';

test('cold announcement SQL never blocks ordinary chat and claimed rewards update the display cache',async()=>{
 let finish;const blocked=new Promise(resolve=>{finish=resolve;});
 const service=createReleaseAnnouncements({production:true,version:'9.99',sql:()=>async(strings)=>{
  const query=strings.join('?');if(!query.startsWith('SELECT'))return [];
  await blocked;
  return query.includes('release_reward_claims')?[]:[{message:{id:'release:9.99',releaseVersion:'9.99',text:'fix'}}];
 }});
 assert.deepEqual(service.listForChat('p'),[]);
 finish();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(service.listForChat('p')[0].rewardClaimed,false);
 service.invalidateClaims('p','9.99');
 assert.equal(service.listForChat('p')[0].rewardClaimed,true);
 assert.deepEqual(service.listForChat('other'),[]);
});

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'planet4-release-test-'));
  t.after(() => { if (path.dirname(root) !== fs.realpathSync(os.tmpdir()) || !path.basename(root).startsWith('planet4-release-test-')) throw Error('Invalid test cleanup target'); fs.rmSync(root, {recursive:true}); });
  const put = (name, text) => { fs.mkdirSync(path.dirname(path.join(root,name)),{recursive:true});fs.writeFileSync(path.join(root,name),text); };
  const content = {'dist/index.html':'built','dist/release-version.json':'{"version":"9.99"}','src/lib/appVersion.js':'9.99','server/index.js':'server'};
  for (const [name,text] of Object.entries(content)) put(name,text);
  const release = {version:'9.99',fixes:[{uk:'Виправлено бій.',ru:'Исправлен бой.',en:'Fixed combat.'},{scope:'admin',uk:'Admin',ru:'Admin',en:'Admin'}],files:Object.entries(content).map(([name,text])=>({path:name,sha256:createHash('sha256').update(text).digest('hex')}))};
  put('releases/installed.json',JSON.stringify(release));
  put('INSTALL-2.52.txt','old'); put('PATCH-2.52-MANIFEST.json','old'); put('PATCH-20261020-2.52.md','old');
  for(const name of ['.env','INSTALL.txt','MANIFEST.json','PATCH_HISTORY.md','package.json','data/state.json','.patch-backups/backup.json'])put(name,'keep');
  return {root,put,release};
}
function database() {
  const rows = new Map(); let fail = false;
  return {rows,setFail(value){fail=value;},sql:()=>async(strings,...values)=>{
    if(fail)throw Error('DB unavailable');
    const query=strings.join('?');
    if(query.startsWith('INSERT')){if(rows.has(values[0]))return [];rows.set(values[0],JSON.parse(values[1]));return [{version:values[0]}];}
    if(query.startsWith('SELECT'))return [...rows.values()].map(message=>({message}));
    return [];
  }};
}

test('streaming verification yields to the event loop and rejects altered files',async t=>{
 const {root,put}=fixture(t);let yielded=false;
 setImmediate(()=>{yielded=true;});
 assert.equal((await readInstalledReleaseAsync(root,'9.99')).version,'9.99');assert(yielded);
 put('server/index.js','changed');assert.equal(await readInstalledReleaseAsync(root,'9.99'),null);
});

test('one localized PLANET4 publication across workers and restarts; cleanup preserves runtime files',async t=>{
  const {root,release}=fixture(t),db=database(),options={root,version:'9.99',production:true,sql:db.sql};
  assert.equal(readInstalledRelease(root,'9.99').version,'9.99');
  const results=await Promise.all([createReleaseAnnouncements(options).publish(),createReleaseAnnouncements(options).publish()]);
  assert.equal(results.filter(Boolean).length,1);
  const restarted=createReleaseAnnouncements(options);assert.equal(await restarted.publish(),false);
  const [message]=await restarted.list();assert.equal(message.author,'PLANET4');assert.equal(message.channel,'world');assert.equal(message.localizedText.en,'PLANET4 · 9.99\n• Fixed combat.');assert(!message.text.includes('Admin'));
  for(const name of ['.env','INSTALL.txt','MANIFEST.json','PATCH_HISTORY.md','package.json','data/state.json','.patch-backups/backup.json'])assert(fs.existsSync(path.join(root,name)),name);
  assert(!fs.existsSync(path.join(root,'INSTALL-2.52.txt')));
  assert.deepEqual(cleanupLegacyPatchFiles(root),[]);
  assert.equal(releaseMessage({...release,fixes:[release.fixes[1]]}),null);
  assert.equal(releaseMessage({...release,announce:false}),null);
});
test('local builds, mismatched versions and partial uploads never publish or clean up',async t=>{
  const {root,put}=fixture(t),db=database();
  assert.equal(await createReleaseAnnouncements({root,version:'9.99',production:false,sql:db.sql}).publish(),false);
  assert.equal(await createReleaseAnnouncements({root,version:'9.98',production:true,sql:db.sql}).publish(),false);
  put('dist/index.html','partial upload');
  assert.equal(await createReleaseAnnouncements({root,version:'9.99',production:true,sql:db.sql}).publish(),false);
  assert.equal(db.rows.size,0);assert(fs.existsSync(path.join(root,'INSTALL-2.52.txt')));
});
test('failed storage can retry without losing the announcement or deleting old files',async t=>{
  const {root}=fixture(t),db=database();db.setFail(true);
  const service=createReleaseAnnouncements({root,version:'9.99',production:true,sql:db.sql});
  await assert.rejects(service.publish(),/DB unavailable/);assert(fs.existsSync(path.join(root,'INSTALL-2.52.txt')));
  db.setFail(false);assert.equal(await service.publish(),true);assert.equal(db.rows.size,1);
});
test('chat display caches release reads and a reward claim immediately invalidates that player',async()=>{
 let selects=0,claimed=false;
 const service=createReleaseAnnouncements({production:true,sql:()=>async strings=>{
  const query=strings.join('?');if(!query.startsWith('SELECT'))return [];
  selects++;return query.includes('release_reward_claims')?(claimed?[{version:'9.99'}]:[]):[{message:{releaseVersion:'9.99',text:'fix'}}];
 }});
 assert.equal((await service.list('p'))[0].rewardClaimed,false);assert.equal(selects,2);
 await service.list('p');assert.equal(selects,2);
 claimed=true;service.invalidateClaims('p');assert.equal((await service.list('p'))[0].rewardClaimed,true);assert.equal(selects,3);
 assert.equal((await service.list('other'))[0].rewardClaimed,true);assert.equal(selects,4);
});
