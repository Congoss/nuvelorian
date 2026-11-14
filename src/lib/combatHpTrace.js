import { reportClientDiagnostic } from './diagnosticReporter.js';

let events=[];
let timer=null;

export function combatResponseMeta(value){return value?.__combat_response_meta || null;}

export function recordCombatHpTransition(source,previous,next,{accepted=true,reason='',meta=null}={}){
 const before=previous?.fight || previous || null,after=next?.fight || next || null;
 if(!before&&!after)return;
 events.push({at:Date.now(),source,accepted,reason,request_id:meta?.request_id||'',path:meta?.path||'',
  before_id:before?.id||null,before_revision:before?.combat_revision??null,before_hp:before?.current_hp??null,before_status:before?.status||null,
  after_id:after?.id||null,after_revision:after?.combat_revision??null,after_hp:after?.current_hp??null,after_status:after?.status||null});
 if(events.length>60)events=events.slice(-60);
 if(timer)return;
 timer=setTimeout(()=>{timer=null;const batch=events;events=[];reportClientDiagnostic('COMBAT_HP_TRACE','Combat HP transitions','',{transitions:batch});},1200);
}
