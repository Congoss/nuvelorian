import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import React from 'react';
import {renderToString} from 'react-dom/server';
const require=createRequire(import.meta.url);
const mocks={
 'react-i18next':`export const useTranslation=()=>({i18n:{language:'en'}});`,
 '@tonconnect/ui-react':`import React from 'react';export const TonConnectUIContext=React.createContext(null);globalThis.__testTonContext=TonConnectUIContext;export function TonConnectUIProvider({children}){globalThis.__testTonCreated++;return React.createElement(TonConnectUIContext.Provider,{value:{}},children);}export function useTonConnectUI(){const value=React.useContext(TonConnectUIContext);if(!value)throw Error('TON provider missing');return [value];}export const useTonAddress=()=>'';export const useTonWallet=()=>null;`,
 '@/lib/platform/config':`export const isWebPlatform=false;`,
 '@/lib/paymentUiText':`export const paymentText=t=>t;`,
 '@/lib/resourceIcons':`export const getResourceIcon=()=>'';`,
 './GameTextureButton':`import React from 'react';export default function Button({children,...p}){return React.createElement('button',p,children);}`,
 '@/services/paymentsApi':`export const confirmPaymentOrder=()=>{};export const createPaymentOrder=()=>{};export const getPaymentOrder=()=>{};export const getPaymentRates=()=>{};`,
 '@/lib/platform/ton':`export const createTonCommentPayload=()=>'';export const getTonChainId=()=>'';export const getTonConnectProviderProps=()=>({});`,
 '@/lib/platform/nearWallet':`export const getActiveNearAccount=()=>'';export const getNearWalletConnector=()=>{};export const openNearWalletModal=()=>{};export const sendNearTransfer=()=>{};`,
};
const result=await build({entryPoints:['src/components/game/PaymentMethodPicker.jsx'],bundle:true,write:false,format:'esm',platform:'node',jsx:'automatic',plugins:[{name:'payment-ui-test',setup(b){b.onResolve({filter:/^react(?:\/.*)?$/},a=>({path:pathToFileURL(require.resolve(a.path)).href,external:true}));b.onResolve({filter:/.*/},a=>{if(a.path in mocks||a.path.startsWith('@/assets/'))return {path:a.path,namespace:'mock'};});b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:mocks[a.path]||`export default '';`,loader:'js'}));}}]});
const {default:Picker}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const pack={id:'card_play_1',title:'Card play',usd:.2,stars:20,paymentMethods:['telegram_stars','ton','near']};
test('card checkout supplies missing TON context without requiring the shop wrapper',()=>{
 globalThis.__testTonCreated=0;
 assert.doesNotThrow(()=>renderToString(React.createElement(Picker,{pack,paymentMethods:[{id:'telegram_stars',title:'Stars'},{id:'ton',title:'TON'}]})));
 assert.equal(globalThis.__testTonCreated,1);
});
test('checkout reuses existing wallet context; NEAR-only checkout never creates TON SDK',()=>{
 globalThis.__testTonCreated=0;
 renderToString(React.createElement(globalThis.__testTonContext.Provider,{value:{}},React.createElement(Picker,{pack,paymentMethods:[{id:'ton',title:'TON'}]})));
 assert.equal(globalThis.__testTonCreated,0);
 renderToString(React.createElement(Picker,{pack,paymentMethods:[{id:'near',title:'NEAR'}]}));
 assert.equal(globalThis.__testTonCreated,0);
});
