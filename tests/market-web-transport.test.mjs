import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
for(const file of ['src/services/gameApi/remoteGameApi.js','deploy/market-mainnet-build/src/services/gameApi/remoteGameApi.js'])test(`market platform header reaches fetch: ${file}`,async()=>{
 const source=readFileSync(file,'utf8'),start=source.indexOf('async function sendRemoteRequest('),end=source.indexOf('  const fetchDuration',start);
 const snippet=source.slice(start,end)+'return response;\n}';
 let captured;
 const request=Function('ensureApiBaseUrl','buildQuery','buildHeaders','rateLimitedFetch','normalizePayload','recordPerformanceRequest','reportClientDiagnostic','displayReads',snippet+';return sendRemoteRequest;')(()=>'/api',()=>'',h=>({Accept:'application/json',...h}),async(url,options)=>{captured=options;return {};},JSON.stringify,()=>{},()=>{}, {clear(){}});
 await request('/market-pilot',{method:'POST',headers:{'X-Local-Market-Platform':'web'},body:{action:'list'}});
 assert.equal(captured.headers['X-Local-Market-Platform'],'web');assert.equal(captured.headers['Content-Type'],'application/json');assert.deepEqual(JSON.parse(captured.body),{action:'list'});
 await request('/market-pilot',{headers:{'X-Local-Market-Platform':'telegram'}});assert.equal(captured.headers['X-Local-Market-Platform'],'telegram');
});
test('listing error never suggests a payment was sent; uncertain purchase still does',()=>{
 const s=readFileSync('src/components/game/MarketPanel.jsx','utf8');const part=s.slice(s.indexOf('const paymentErrors='),s.indexOf('function Currency('));
 const describe=Function('isWalletRejection',part+';return paymentError;')(()=>false);
 assert.doesNotMatch(describe({code:'UNKNOWN'},'uk','list'),/хеш|оплату/);
 assert.match(describe({code:'UNKNOWN'},'uk','buy'),/хеш/);
 assert.match(describe({code:'WEB_ONLY'},'uk','list'),/вебверсії/);
});
