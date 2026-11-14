import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {withPostgresTransaction} from '../data/postgres.js';
import {playerDb,savePlayerSnapshot} from '../data/player-db.js';
import {createMainnetBook,marketBookCommand} from './market-mainnet-book.js';
// Uses the running application's configured pool, never reads credentials from
// another process. Every table shadows production only on this connection and
// is dropped at commit/rollback. No real player or token is modified.
export async function auditMainnetMarketDatabase(){
 await withPostgresTransaction(async sql=>{
  await sql`CREATE TEMP TABLE players(id text PRIMARY KEY,username text,level integer,xp bigint,coins bigint,data jsonb,created_at timestamp) ON COMMIT DROP`;
  await sql`CREATE TEMP TABLE player_progress(player_id text PRIMARY KEY,progress jsonb,updated_at timestamptz) ON COMMIT DROP`;
  await sql`CREATE TEMP TABLE market_audit_book(id text PRIMARY KEY,state jsonb) ON COMMIT DROP`;
  const base={username:'market-self-check',level:100,xp:0,coins:0,created_at:new Date().toISOString(),near_wallet_verified:true,equipped_items:{}};
  const seller={...base,id:'market-audit-seller',near_wallet_id:'seller.near',inventory_items:[{id:'night_disinfector_weapon',type:'equipment',slot:'weapon',count:1}]};
  const buyer={...base,id:'market-audit-buyer',near_wallet_id:'buyer.near',inventory_items:[]};
  const book=createMainnetBook({decimals:18,capHundredths:1000});
  async function save(player){await savePlayerSnapshot(sql,playerDb.toDbPlayerRecord(player),JSON.stringify(playerDb.buildPlayerProgress(player)));}
  await save(seller);await save(buyer);
  await sql`INSERT INTO market_audit_book VALUES('test',${JSON.stringify(book)}::jsonb)`;
  await sql`SAVEPOINT market_audit_rollback`;
  const failedSeller=structuredClone(seller),failedBook=structuredClone(book);
  marketBookCommand(failedBook,[failedSeller],failedSeller,{action:'list',itemId:'night_disinfector_weapon',price:100,requestId:randomUUID()});
  await save(failedSeller);await sql`UPDATE market_audit_book SET state=${JSON.stringify(failedBook)}::jsonb WHERE id='test'`;
  await sql`ROLLBACK TO SAVEPOINT market_audit_rollback`;
  const [original]=await sql`SELECT data FROM players WHERE id=${seller.id}`;assert.equal(original.data.inventory_items.length,1);
  const [unchanged]=await sql`SELECT state FROM market_audit_book WHERE id='test'`;assert.equal(unchanged.state.lots.length,0);
  const {lotId}=marketBookCommand(book,[seller,buyer],seller,{action:'list',itemId:'night_disinfector_weapon',price:100,requestId:randomUUID()});
  const {orderId}=marketBookCommand(book,[seller,buyer],buyer,{action:'reserve',lotId,requestId:randomUUID()});
  const proof={network:'mainnet',token:book.token,orderId,txHash:'self-check-not-a-chain-payment',final:true};
  const body={action:'confirm',orderId,txHash:proof.txHash,requestId:randomUUID()};
  marketBookCommand(book,[seller,buyer],buyer,body,{proof});marketBookCommand(book,[seller,buyer],buyer,body,{proof});
  await save(seller);await save(buyer);await sql`UPDATE market_audit_book SET state=${JSON.stringify(book)}::jsonb WHERE id='test'`;
  const [delivered]=await sql`SELECT data FROM players WHERE id=${buyer.id}`;assert.equal(delivered.data.inventory_items.length,1);
  const [final]=await sql`SELECT state FROM market_audit_book WHERE id='test'`;assert.equal(final.state.orders[0].status,'completed');assert.equal(final.state.journal.filter(e=>e.action==='confirm').length,1);
 });
 return true;
}
