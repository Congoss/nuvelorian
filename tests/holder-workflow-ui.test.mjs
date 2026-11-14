import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {build} from 'esbuild';

const result=await build({entryPoints:['src/components/admin/HolderDropWorkflow.jsx'],bundle:true,write:false,format:'cjs',platform:'node',jsx:'automatic',plugins:[{name:'workflow-ui',setup(builder){
  builder.onResolve({filter:/^(react|react\/jsx-runtime|lucide-react|@\/lib\/holderPetRewards)$/},args=>({path:args.path,namespace:'ui-mock'}));
  builder.onLoad({filter:/.*/,namespace:'ui-mock'},({path})=>({contents:path==='react'
    ? 'export const useState=globalThis.ui.useState; export const useRef=value=>({current:value}); export const useEffect=()=>{}; export const useCallback=fn=>fn;'
    :path==='react/jsx-runtime'?'export const jsx=globalThis.ui.jsx; export const jsxs=jsx; export const Fragment="fragment";'
    :path==='lucide-react'?'export const Eye=()=>null,Plus=()=>null,RefreshCw=()=>null,Save=()=>null,Send=()=>null,ShieldCheck=()=>null;'
    :'export const HOLDER_PET_OPTIONS=[];'}));
}}]});
function render({checked=true,running=false}={}){
  const drop={id:'campaign',kind:'nft',enabled:false,contract:'collection.near',name:'Collection',threshold:'2',decimals:0,rewardMode:'per_unit',rewards:[{field:'large_poison',amount:2}],title:{uk:'Нагорода'},text:{uk:'Текст'},lastPreviewAt:checked?'2026-10-21T10:00:00Z':'',holders:[{id:'player',nickname:'Holder',wallet:'holder.near',holding:'7',rewardMultiplier:3}],delivery:{running,status:running?'running':'completed',lastSentAt:'2026-10-21T10:00:00Z'}};
  const seeds=[[drop],drop.id,drop,'','','',[],false,false];let index=0;
  const context=vm.createContext({module:{exports:{}},console,Intl,ui:{useState:value=>[seeds[index++]??value,()=>{}],jsx:(type,props)=>typeof type==='function'?type(props):({type,props})}});
  vm.runInContext(result.outputFiles[0].text,context);
  return context.module.exports.default({api(){},button:'button',primary:'primary',input:'input',card:'card',lang:'uk',doAction(){},busy:false});
}
function nodes(tree){if(tree==null)return[];if(Array.isArray(tree))return tree.flatMap(nodes);if(typeof tree!=='object')return[tree];return[tree,...nodes(tree.props?.children)];}
const text=node=>nodes(node).filter(value=>typeof value==='string'||typeof value==='number').join(' ');

test('holder workflow shows contract, verified holdings and reward setup in that order',()=>{
  const tree=render();const content=text(tree);
  assert.ok(content.indexOf('1. Контракт')<content.indexOf('2. Перевірка холдерів'));
  assert.ok(content.indexOf('2. Перевірка холдерів')<content.indexOf('3. Нагорода й авторозсилка'));
  assert.match(content,/6 Велика отрута/);
  assert.ok(nodes(tree).some(node=>node?.type==='button'&&text(node)==='Увімкнути щоденну розсилку'&&!node.props.disabled));
});
test('automatic delivery cannot enable before a holder scan',()=>{
  const button=nodes(render({checked:false})).find(node=>node?.type==='button'&&text(node)==='Увімкнути щоденну розсилку');
  assert.equal(button.props.disabled,true);
});
test('background checks show a running status and prevent duplicate operations',()=>{
  const tree=render({running:true});
  assert.match(text(tree),/Перевірка й відправлення/);
  const button=nodes(tree).find(node=>node?.type==='button'&&text(node)==='Виконується…');
  assert.equal(button.props.disabled,true);
});
