import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { APP_VERSION } from '../../src/lib/appVersion.js';
import { getPostgresSql } from '../data/postgres.js';
import { cleanupLegacyPatchFiles } from '../utils/legacyPatchFiles.js';
import {createReadCache} from '../utils/readCache.js';

const appRoot = fileURLToPath(new URL('../../', import.meta.url));
export function readInstalledRelease(root, version) {
  const file = path.join(root, 'releases/installed.json');
  if (!fs.existsSync(file)) return null;
  const release = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (release.version !== version || !Array.isArray(release.files) || !release.files.length || !Array.isArray(release.fixes)) return null;
  const required = ['dist/index.html', 'dist/release-version.json', 'src/lib/appVersion.js', 'server/index.js'];
  if (!required.every(name => release.files.some(f => f.path === name))) return null;
  for (const item of release.files) {
    const absolute = path.resolve(root, item.path);
    if (!absolute.startsWith(path.resolve(root) + path.sep) || !fs.existsSync(absolute)) return null;
    if (createHash('sha256').update(fs.readFileSync(absolute)).digest('hex') !== item.sha256) return null;
  }
  if (JSON.parse(fs.readFileSync(path.join(root, 'dist/release-version.json'), 'utf8')).version !== version) return null;
  return release;
}

// Yield between files/chunks so startup verification cannot stall live combat.
export async function readInstalledReleaseAsync(root,version){
 let release;
 try{release=JSON.parse(await fs.promises.readFile(path.join(root,'releases/installed.json'),'utf8'));}
 catch(error){if(error.code==='ENOENT')return null;throw error;}
 if(release.version!==version || !Array.isArray(release.files) || !release.files.length || !Array.isArray(release.fixes))return null;
 const required=['dist/index.html','dist/release-version.json','src/lib/appVersion.js','server/index.js'];
 if(!required.every(name=>release.files.some(f=>f.path===name)))return null;
 for(const item of release.files){
  const absolute=path.resolve(root,item.path);
  if(!absolute.startsWith(path.resolve(root)+path.sep))return null;
  const hash=createHash('sha256');
  try{for await(const chunk of fs.createReadStream(absolute))hash.update(chunk);}
  catch(error){if(error.code==='ENOENT')return null;throw error;}
  if(hash.digest('hex')!==item.sha256)return null;
 }
 if(JSON.parse(await fs.promises.readFile(path.join(root,'dist/release-version.json'),'utf8')).version!==version)return null;
 return release;
}

export function releaseMessage(release, now = new Date()) {
  if (release.announce === false) return null;
  const fixes = release.fixes.filter(f => f.scope !== 'admin');
  if (!fixes.length) return null;
  const localizedText = {};
  for (const language of ['uk', 'ru', 'en']) {
    const lines = fixes.map(f => {
      if (typeof f[language] !== 'string' || !f[language].trim()) throw new Error(`Missing release translation: ${language}`);
      return '• ' + f[language].trim();
    });
    localizedText[language] = `PLANET4 · ${release.version}\n` + lines.join('\n');
    if (localizedText[language].length > 4000) throw new Error('Release announcement too long');
  }
  return { id: 'release:' + release.version, kind: 'release_announcement', channel: 'world', author: 'PLANET4', role: 'PLANET4', releaseVersion: release.version, reward: {field:'medium_poison',amount:fixes.length,...(release.cardGamePlays===5?{cardGamePlays:5}:{})}, localizedText, text: localizedText.uk, created_at: now.toISOString() };
}

export function createReleaseAnnouncements({ root = appRoot, version = APP_VERSION, production = process.env.NODE_ENV === 'production', sql = getPostgresSql } = {}) {
  let ready, publishing, published = false;
  const messagesCache=createReadCache({ttl:15000,max:1});
  const claimsCache=createReadCache({ttl:5000,max:2000});
  const chatCache=createReadCache({ttl:5000,max:2000});
  const database = () => sql();
  const schema = () => ready ||= (async()=>{
    await database()`CREATE TABLE IF NOT EXISTS release_announcements (version TEXT PRIMARY KEY, message JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
    await database()`CREATE TABLE IF NOT EXISTS release_reward_claims (version TEXT NOT NULL REFERENCES release_announcements(version), player_id TEXT NOT NULL, amount INTEGER NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(version,player_id))`;
  })().catch(error => { ready = null; throw error; });
  return {
    async publish() {
      if (!production || published) return false;
      if(publishing)return publishing;
      publishing=(async()=>{
      const release = await readInstalledReleaseAsync(root, version);
      if (!release) return false;
      const message = releaseMessage(release);
      await schema();
      // The unique version is both the publication receipt and the chat record.
      const rows = message ? await database()`INSERT INTO release_announcements (version,message) VALUES (${version},${JSON.stringify(message)}::jsonb) ON CONFLICT (version) DO NOTHING RETURNING version` : [];
      cleanupLegacyPatchFiles(root);
      published = true;
      messagesCache.clear();
      chatCache.clear();
      return rows.length > 0;
      })();
      try{return await publishing;}finally{publishing=null;}
    },
    async list(playerId) {
      if (!production) return [];
      await schema();
      const [rows,claims] = await Promise.all([
        messagesCache.get('messages',()=>database()`SELECT message FROM release_announcements ORDER BY created_at DESC LIMIT 50`),
        playerId ? claimsCache.get(String(playerId),()=>database()`SELECT version FROM release_reward_claims WHERE player_id=${String(playerId)}`) : Promise.resolve([]),
      ]);
      const claimed=new Set(claims.map(row=>row.version));
      return rows.map(row => ({...row.message,rewardClaimed:claimed.has(row.message.releaseVersion)}));
    },
    listForChat(playerId) {
      if (!production) return [];
      const key=String(playerId || 'guest');
      const messages=chatCache.peek(key) || [];
      void chatCache.get(key,()=>this.list(playerId)).catch(error=>console.warn('[release] background chat lookup failed',{message:error.message}));
      return messages;
    },
    invalidateClaims(playerId,releaseVersion=version){
      const key=String(playerId);claimsCache.invalidate(key);
      const messages=chatCache.peek(key);
      if(messages)chatCache.set(key,messages.map(message=>message.releaseVersion===releaseVersion?{...message,rewardClaimed:true}:message));
    },
  };
}

export const releaseAnnouncements = createReleaseAnnouncements();
