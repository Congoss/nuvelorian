import assert from 'node:assert/strict';
import {PGlite} from '../.local/performance-tests/node_modules/@electric-sql/pglite/dist/index.js';
import {saveShipCombatBatch} from '../server/data/ship-combat-write.js';
const db=await PGlite.create();let calls=0;
const sql=async(strings,...values)=>{calls++;return (await db.sql(strings,...values)).rows;};
try{
 await db.exec(`CREATE TABLE players(id TEXT PRIMARY KEY,username TEXT,level INT,xp INT,coins INT CHECK(coins>=0),data JSONB);
 CREATE TABLE player_progress(player_id TEXT PRIMARY KEY REFERENCES players(id),progress JSONB,updated_at TIMESTAMPTZ);
 CREATE TABLE clan_ship_state(clan_id TEXT PRIMARY KEY,state JSONB NOT NULL,updated_at TIMESTAMPTZ DEFAULT now());
 INSERT INTO players VALUES('a','A',10,0,100,'{}'),('b','B',10,0,100,'{}');
 INSERT INTO clan_ship_state VALUES('c','{"hp":1000}',now());`);
 const player=(id,coins)=>({id,username:id.toUpperCase(),level:10,xp:1,coins,data:{weapon_inventory:{'large-poison':coins}},progress:{coins}});
 await saveShipCombatBatch(sql,{clanId:'c',state:{hp:700},shipChanged:true,players:[player('a',90),player('b',80)]});
 assert.equal(calls,1);
 assert.deepEqual((await db.query('SELECT id,coins FROM players ORDER BY id')).rows,[{id:'a',coins:90},{id:'b',coins:80}]);
 assert.equal((await db.query('SELECT * FROM player_progress')).rows.length,2);
 assert.equal((await db.query('SELECT state FROM clan_ship_state')).rows[0].state.hp,700);
 await saveShipCombatBatch(sql,{clanId:'c',state:null,shipChanged:false,players:[player('a',85)]});
 assert.equal((await db.query('SELECT state FROM clan_ship_state')).rows[0].state.hp,700);
 await assert.rejects(saveShipCombatBatch(sql,{clanId:'c',state:{hp:0},shipChanged:true,players:[player('a',1),player('b',-1)]}));
 assert.deepEqual((await db.query('SELECT id,coins FROM players ORDER BY id')).rows,[{id:'a',coins:85},{id:'b',coins:80}]);
 assert.equal((await db.query('SELECT state FROM clan_ship_state')).rows[0].state.hp,700);
 await assert.rejects(db.transaction(async tx=>{
  await saveShipCombatBatch(async(strings,...values)=>(await tx.sql(strings,...values)).rows,{clanId:'c',state:{hp:1},shipChanged:true,players:[player('a',2)]});
  throw Error('simulated commit failure');
 }));
 assert.equal((await db.query("SELECT coins FROM players WHERE id='a'")).rows[0].coins,85);
 assert.equal((await db.query('SELECT state FROM clan_ship_state')).rows[0].state.hp,700);
 console.log('PostgreSQL engine: multi-player batch, progress, ship-only guard and rollback verified. One write statement per batch.');
}finally{await db.close();}
