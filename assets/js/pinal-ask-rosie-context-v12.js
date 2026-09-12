(()=>{
'use strict';
if(window.__PINAL_ASK_ROSIE_CONTEXT_V12__)return;window.__PINAL_ASK_ROSIE_CONTEXT_V12__=true;
const nativeFetch=window.fetch.bind(window);
const ENDPOINT='/functions/v1/boost-ask-rosie';
let lastFocus=null;

function text(v){return String(v||'').toLowerCase().trim()}
function broadQuestion(q){
 q=text(q);
 return /priority sector|big three|big 3|healthcare careers|manufacturing careers|skilled trades|what careers|which careers|other careers|alternatives|compare|versus|\bvs\b/.test(q);
}
function looksLikeFollowup(q){
 q=text(q);
 if(broadQuestion(q))return false;
 return /\b(it|that|this|those|these|them)\b|from there|go from there|next step|move up|advance|advancement|career path|pay cut|afford|worth it|better than what i make|what does it pay|how much|training|school|education|openings|growth|demand/.test(q);
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

window.fetch=async function(input,init){
 try{
   const url=typeof input==='string'?input:(input?.url||'');
   if(String(url).includes(ENDPOINT)&&init?.body){
     const body=JSON.parse(init.body);
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
