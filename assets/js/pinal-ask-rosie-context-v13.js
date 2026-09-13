(()=>{
'use strict';
if(window.__PINAL_ASK_ROSIE_CONTEXT_V13__)return;window.__PINAL_ASK_ROSIE_CONTEXT_V13__=true;
const nativeFetch=window.fetch.bind(window);
const ENDPOINT='/functions/v1/boost-ask-rosie';
let lastFocus=null;

function text(v){return String(v||'').toLowerCase().trim()}
function read(key){try{return JSON.parse(localStorage.getItem(key)||'{}')||{}}catch(_){return{}}}
function broadQuestion(q){
 q=text(q);
 return /priority sector|big three|big 3|healthcare careers|manufacturing careers|skilled trades|what careers|which careers|other careers|alternatives|compare|versus|\bvs\b/.test(q);
}
function looksLikeFollowup(q){
 q=text(q);
 if(broadQuestion(q))return false;
 return /\b(it|that|this|those|these|them)\b|that occupation|that career|from there|go from there|next step|move up|advance|advancement|career path|pay cut|afford|worth it|better than what i make|what does it pay|how much|training|school|education|openings|growth|demand/.test(q);
}
function fullFocus(body){
 const occs=Array.isArray(body?.occupations)?body.occupations:[];
 const focus=body?.focusOccupation;
 if(focus?.soc){
   const found=occs.find(o=>String(o?.soc||'')===String(focus.soc));
   return found||focus;
 }
 return null;
}
function decisionValue(v){
 if(v&&typeof v==='object')v=v.decision||v.status||v.value||'';
 v=text(v);
 if(['pause','paused','remove','removed','hold','held'].includes(v))return'paused';
 if(['keep','active','continue','selected'].includes(v))return'active';
 return v||'unknown';
}
function industryFor(soc,title){
 const p=String(soc||'').slice(0,2),t=text(title);
 if(p==='15'||/computer|software|cyber|network|information technology|user support|help desk/.test(t))return{id:'it',label:'Information Technology Workplace Skills Challenge'};
 if(['29','31'].includes(p)||/nurs|medical|health|clinical|patient|pharmacy|dental/.test(t))return{id:'healthcare',label:'Healthcare Workplace Skills Challenge'};
 if(p==='51'||/manufactur|production|cnc|machinist|fabricat/.test(t))return{id:'manufacturing',label:'Advanced Manufacturing Workplace Skills Challenge'};
 if(['47','49'].includes(p)||/electric|plumb|hvac|weld|construction|carpent|maintenance|repair|solar/.test(t))return{id:'trades',label:'Skilled Trades Workplace Skills Challenge'};
 if(p==='53'||/truck|cdl|transport|logistic|warehouse/.test(t))return{id:'cdl',label:'Transportation & Logistics Workplace Skills Challenge'};
 return null;
}
function coachingState(body){
 const j=body?.journey||{},mods=j.modules||{},shared=read('pinal_boost_career_exploration_v1'),rawJourney=read('pinal_boost_journey_v1');
 const m3=mods.module3||shared.module3||{},m4=mods.module4||shared.module4||{};
 const selectedSoc=String(m4.selectedSoc||m4.career?.soc||m4.careerTarget?.soc||'');
 const selectedTitle=m4.careerTitle||m4.career?.title||m4.careerTarget?.title||'';
 const route=m4.route||m4.participantDirection||m4.decision?.code||'';
 const occs=Array.isArray(body?.occupations)?body.occupations:[];
 const selectedOcc=occs.find(o=>String(o?.soc||'')===selectedSoc)||null;
 const currentDirection=selectedSoc?{soc:selectedSoc,title:selectedTitle||selectedOcc?.title||selectedSoc,route:String(route||'').toUpperCase()}:null;

 const decisions=m3.careerDecisionsBySoc||{};
 const careerStatuses=[];
 const seen=new Set();
 const candidates=[...(Array.isArray(shared?.module1?.selected)?shared.module1.selected:[]),...(Array.isArray(m3.careers)?m3.careers:[]),...occs];
 for(const c of candidates){
   const soc=String(c?.soc||'');if(!soc||seen.has(soc))continue;seen.add(soc);
   let status=decisionValue(c?.decision||decisions?.[soc]);
   if(soc===selectedSoc)status='selected';
   careerStatuses.push({soc,title:c?.title||occs.find(o=>String(o?.soc||'')===soc)?.title||soc,status});
 }
 if(selectedSoc&&!seen.has(selectedSoc))careerStatuses.unshift({soc:selectedSoc,title:currentDirection?.title||selectedSoc,status:'selected'});

 const map=rawJourney?.portal?.map||read('boostPathwaysV29')||{};
 const complete=map?.complete||{};
 const nextSteps=[];
 if(currentDirection){
   const ind=industryFor(currentDirection.soc,currentDirection.title);
   const industryDone=ind?!!complete[`i:${ind.id}`]:['trades','manufacturing','healthcare','it','cdl'].some(id=>!!complete[`i:${id}`]);
   if(!industryDone)nextSteps.push({id:'industry',label:ind?.label||'Industry Workplace Skills Challenge',status:'open',reason:'Build occupation-specific workplace evidence after Decide.'});
 }
 if(!complete['m:financial'])nextSteps.push({id:'financial',label:'Build Strong Financial Habits',status:'open',reason:'Connect the career direction to real-life financial needs and stability.'});
 if(!complete['m:ai'])nextSteps.push({id:'ai',label:'AI & You',status:'open',reason:'Build practical AI literacy for work and career development.'});

 return{
   currentDirection,
   careerStatuses,
   nextSteps,
   portalPathway:map?.pathway||rawJourney?.portal?.pathway||j?.selectedPathway||'',
   completionSource:'BOOST map completion state; treat missing completion as “not currently marked complete,” not proof the participant never did the activity.'
 };
}

window.fetch=async function(input,init){
 try{
   const url=typeof input==='string'?input:(input?.url||'');
   if(String(url).includes(ENDPOINT)&&init?.body){
     const body=JSON.parse(init.body);
     body.journey=body.journey&&typeof body.journey==='object'?body.journey:{};
     body.journey.coachingState=coachingState(body);
     const q=String(body?.question||'');
     const occs=Array.isArray(body?.occupations)?body.occupations:[];
     const explicit=fullFocus(body);
     if(explicit){
       body.focusOccupation=explicit;
       lastFocus=explicit;
     }else if(lastFocus&&looksLikeFollowup(q)){
       body.focusOccupation=lastFocus;
       body.occupations=[lastFocus,...occs.filter(o=>String(o?.soc||'')!==String(lastFocus.soc))].slice(0,24);
     }else if(!broadQuestion(q)&&occs.length===1){
       body.focusOccupation=occs[0];
       lastFocus=occs[0];
     }
     init={...init,body:JSON.stringify(body)};
   }
 }catch(e){console.warn('Ask Rosie context continuity patch skipped',e)}
 return nativeFetch(input,init);
};
})();
