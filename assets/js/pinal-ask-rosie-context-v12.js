(()=>{
'use strict';
if(window.__PINAL_ASK_ROSIE_CONTEXT_V13__)return;window.__PINAL_ASK_ROSIE_CONTEXT_V13__=true;
const nativeFetch=window.fetch.bind(window);
const ENDPOINT='/functions/v1/boost-ask-rosie';
let lastFocus=null;
function text(v){return String(v||'').toLowerCase().trim()}
function read(key){try{return JSON.parse(localStorage.getItem(key)||'{}')||{}}catch(_){return{}}}
function broadQuestion(q){q=text(q);return /priority sector|big three|big 3|healthcare careers|manufacturing careers|skilled trades|what careers|which careers|other careers|alternatives|compare|versus|\bvs\b/.test(q)}
function looksLikeFollowup(q){q=text(q);if(broadQuestion(q))return false;return /\b(it|that|this|those|these|them)\b|that occupation|that career|from there|go from there|next step|move up|advance|advancement|career path|pay cut|afford|worth it|better than what i make|what does it pay|how much|training|school|education|openings|growth|demand/.test(q)}
function fullFocus(body){const occs=Array.isArray(body?.occupations)?body.occupations:[],focus=body?.focusOccupation;if(focus?.soc){return occs.find(o=>String(o?.soc||'')===String(focus.soc))||focus}return null}
function decisionValue(v){if(v&&typeof v==='object')v=v.decision||v.status||v.value||'';v=text(v);if(['pause','paused','remove','removed','hold','held'].includes(v))return'paused';if(['keep','active','continue','selected'].includes(v))return'active';return v||'unknown'}
function industryFor(soc,title){const p=String(soc||'').slice(0,2),t=text(title);if(p==='15'||/computer|software|cyber|network|information technology|user support|help desk/.test(t))return{id:'it',label:'Information Technology Workplace Skills Challenge'};if(['29','31'].includes(p)||/nurs|medical|health|clinical|patient|pharmacy|dental/.test(t))return{id:'healthcare',label:'Healthcare Workplace Skills Challenge'};if(p==='51'||/manufactur|production|cnc|machinist|fabricat/.test(t))return{id:'manufacturing',label:'Advanced Manufacturing Workplace Skills Challenge'};if(['47','49'].includes(p)||/electric|plumb|hvac|weld|construction|carpent|maintenance|repair|solar/.test(t))return{id:'trades',label:'Skilled Trades Workplace Skills Challenge'};if(p==='53'||/truck|cdl|transport|logistic|warehouse/.test(t))return{id:'cdl',label:'Transportation & Logistics Workplace Skills Challenge'};return null}
function rosiePathwayPlan(j){
  const mods=j?.modules||{},progress=j?.progress||{},stale=j?.staleModules||{};
  const raw=String(j?.selectedPathway||j?.portal?.pathway||j?.selected_pathway||'').toLowerCase();
  const pathway=raw.includes('rapid')?'rapid':raw.includes('ready')?'ready':raw==='explore'||raw.includes('career')?'explore':'unknown';
  const names={explore:'Career Exploration & Development',rapid:'Rapid Reemployment',ready:'Employment Ready',unknown:'Not yet verified'};
  const completed=id=>progress[id]==='complete'&&!stale[id]||(!stale[id]&&!!mods[id]?.completedAt&&progress[id]!=='stale');
  const step=(id,label)=>({id,label,status:stale[id]||progress[id]==='stale'?'review':'open'});
  let pre=[],future=[],phase='unknown',handoff='',requiredBeforeCoach=[];
  const direction=mods.module4||{},targetSoc=String(direction.selectedSoc||direction.career?.soc||''),targetTitle=String(direction.careerTitle||direction.career?.title||'').toLowerCase();
  let industry='';
  if(targetSoc.startsWith('15')||/computer|software|cyber|network|support/.test(targetTitle))industry='it';
  else if(targetSoc.startsWith('29')||targetSoc.startsWith('31')||/nurs|medical|health|clinical|dental/.test(targetTitle))industry='healthcare';
  else if(targetSoc.startsWith('51')||/machin|manufactur|production/.test(targetTitle))industry='manufacturing';
  else if(targetSoc.startsWith('47')||targetSoc.startsWith('49')||/electric|plumb|hvac|weld|construction/.test(targetTitle))industry='trades';
  else if(targetSoc.startsWith('53')||/truck|cdl|transport|warehouse/.test(targetTitle))industry='cdl';
  if(pathway==='explore'){
    pre=[step('module1','Discover — Module 1'),step('module2','Validate — Module 2'),step('module3','Career Mobility — Module 3'),step('module4','Decide — Module 4')];
    if(industry)pre.push(step('industry-'+industry,{it:'Information Technology',healthcare:'Healthcare',manufacturing:'Advanced Manufacturing',trades:'Skilled Trades',cdl:'Transportation & Logistics'}[industry]+' Workplace Skills Challenge (aligned industry)'));
    pre.push(step('module5','Career Investment Explorer — Module 5'));
    requiredBeforeCoach=pre.map(x=>x.id);
    handoff='Coach Conversation Brief and appointment preparation, followed by local-team intake and eligibility review';
    future=[step('financial','Build Strong Financial Habits'),step('ai','AI & You'),step('r2w','Ready 2 Work (subject to enrollment access)')];
  }else if(pathway==='rapid'){
    pre=[step('rapid-discover','Discover — Rapid Reemployment')];
    const dir=String(mods['rapid-discover']?.direction||'').toLowerCase();
    if(dir!=='return')pre.push(step('skillmobility','Skill Mobility'));
    pre.push(step('jobsearch','48-Hour Job Search'));
    requiredBeforeCoach=pre.map(x=>x.id);
    handoff='Coach Appointment Preparation and local-team intake/eligibility review';
    future=[step('financial','Build Strong Financial Habits'),step('ai','AI & You'),step('r2w','Ready 2 Work (subject to TalentSync enrollment confirmation)')];
  }else if(pathway==='ready'){
    pre=[step('financial','Build Strong Financial Habits'),step('ai','AI & You'),step('r2w','Ready 2 Work (after TalentSync enrollment confirmation)')];
    requiredBeforeCoach=[];
    handoff='Employment Ready is primarily post-enrollment; Ready 2 Work requires confirmed TalentSync enrollment';
  }
  const nextSteps=pre.filter(x=>!completed(x.id));
  const missingPrior=nextSteps.length>0;
  if(pathway==='ready')phase='employment-ready';
  else if(pathway==='unknown')phase='pathway-unverified';
  else phase=missingPrior?'pre-enrollment-career-development':'coach-intake-handoff';
  if(!missingPrior&&pathway!=='ready'&&pathway!=='unknown')
    nextSteps.push({id:'coach-handoff',label:handoff,status:'next'});
  if(pathway==='ready'&&!missingPrior)phase='employment-ready-track-complete';
  return {pathway,pathwayLabel:names[pathway],currentPhase:phase,immediateNextStep:nextSteps[0]||null,nextSteps,requiredBeforeCoach,postEnrollmentSteps:future,coachHandoff:handoff,hasRequiredPreEnrollmentWork:missingPrior&&pathway!=='ready',pathwayVerified:pathway!=='unknown',completionSource:'Authenticated Pinal BOOST journey progress and selected pathway. A future task cannot supersede an incomplete prerequisite. Review-needed flags are separate from unfinished tasks.'};
}
function coachingState(body){
 const j=body?.journey||{},mods=j.modules||{},shared=read('pinal_boost_career_exploration_v1'),rawJourney=read('pinal_boost_journey_v1');
 const m3=mods.module3||shared.module3||{},m4=mods.module4||shared.module4||{};
 const selectedSoc=String(m4.selectedSoc||m4.career?.soc||m4.careerTarget?.soc||''),selectedTitle=m4.careerTitle||m4.career?.title||m4.careerTarget?.title||'',route=m4.route||m4.participantDirection||m4.decision?.code||'';
 const occs=Array.isArray(body?.occupations)?body.occupations:[],selectedOcc=occs.find(o=>String(o?.soc||'')===selectedSoc)||null;
 const currentDirection=selectedSoc?{soc:selectedSoc,title:selectedTitle||selectedOcc?.title||selectedSoc,route:String(route||'').toUpperCase()}:null;
 const decisions=m3.careerDecisionsBySoc||{},careerStatuses=[],seen=new Set(),candidates=[...(Array.isArray(shared?.module1?.selected)?shared.module1.selected:[]),...(Array.isArray(m3.careers)?m3.careers:[]),...occs];
 for(const c of candidates){const soc=String(c?.soc||'');if(!soc||seen.has(soc))continue;seen.add(soc);let status=decisionValue(c?.decision||decisions?.[soc]);if(soc===selectedSoc)status='selected';careerStatuses.push({soc,title:c?.title||occs.find(o=>String(o?.soc||'')===soc)?.title||soc,status})}
 if(selectedSoc&&!seen.has(selectedSoc))careerStatuses.unshift({soc:selectedSoc,title:currentDirection?.title||selectedSoc,status:'selected'});
 const authoritative=(rawJourney&&Object.keys(rawJourney).length?rawJourney:j)||{};
 const plan=rosiePathwayPlan({
   ...authoritative,...j,
   selectedPathway:j.selectedPathway||authoritative?.portal?.pathway||authoritative?.selectedPathway||'',
   progress:authoritative.progress||j.progress||{},
   staleModules:authoritative.staleModules||{},
   modules:{...(authoritative.modules||{}),...(j.modules||{})}
 });
 return {currentDirection,careerStatuses,staleModules:authoritative.staleModules||{},progress:authoritative.progress||j.progress||{},...plan};
}
window.fetch=async function(input,init){
 let requestedQuestion='',verifiedPlan=null,rosieRequest=false;
 try{
  const url=typeof input==='string'?input:(input?.url||'');
  if(String(url).includes(ENDPOINT)&&init?.body){
   const body=JSON.parse(init.body);body.journey=body.journey&&typeof body.journey==='object'?body.journey:{};body.journey.coachingState=coachingState(body);verifiedPlan=body.journey.coachingState;requestedQuestion=String(body?.question||'');rosieRequest=true;
   const q=String(body?.question||''),occs=Array.isArray(body?.occupations)?body.occupations:[],explicit=fullFocus(body);
   if(explicit){body.focusOccupation=explicit;lastFocus=explicit}else if(lastFocus&&looksLikeFollowup(q)){body.focusOccupation=lastFocus;body.occupations=[lastFocus,...occs.filter(o=>String(o?.soc||'')!==String(lastFocus.soc))].slice(0,24)}else if(!broadQuestion(q)&&occs.length===1){body.focusOccupation=occs[0];lastFocus=occs[0]}
   init={...init,body:JSON.stringify(body)};
  }
 }catch(e){console.warn('Ask Rosie context continuity patch skipped',e)}
 const response=await nativeFetch(input,init);
 if(!rosieRequest||!verifiedPlan||!response.ok||!/(what('?s| is) next|next step|what should i do|where do i go|what.*(pathway|module)|what.*(required|complete)|remaining.*(work|module)|ready for intake)/i.test(requestedQuestion))return response;
 try{
   const data=await response.clone().json();
   if(data?.mode==='wellbeing-safety'||typeof data?.answer!=='string')return response;
   const p=verifiedPlan;
   if(!p.pathwayVerified)return response;
   const next=p.immediateNextStep;
   const queue=p.nextSteps.filter(x=>x.id!=='coach-handoff');
   let answer='Your assigned BOOST pathway is **'+p.pathwayLabel+'**. ';
   if(p.pathway==='ready'){
     answer+='Employment Ready starts with **Financial Habits**, then **AI & You**. **Ready 2 Work** follows only after those activities and verified TalentSync enrollment access. ';
   }else if(p.hasRequiredPreEnrollmentWork){
     answer+='Your next step is **'+next.label+'**'+(next.status==='review'?' (review required because earlier evidence changed)':'')+'. ';
     const later=queue.slice(1,4).map(x=>x.label);
     if(later.length)answer+='After that, your remaining pathway activities include '+later.join(', ')+'. ';
     answer+='Financial Habits and AI & You belong to the post-enrollment portion of this pathway; they are not the next steps right now. ';
   }else{
     answer+='Your pre-enrollment career pathway activities are recorded as complete. Your next step is **'+p.coachHandoff+'**. ';
   }
   answer+='Your existing BOOST answers carry forward. Your local team determines eligibility, enrollment, and available services; Rosie does not make those decisions.';
   return new Response(JSON.stringify({...data,answer,pathway_guidance_source:'verified-boost-pathway-sequence'}),{status:response.status,statusText:response.statusText,headers:response.headers});
 }catch(err){console.warn('BOOST pathway response guard unavailable',err);return response}
};
})();
