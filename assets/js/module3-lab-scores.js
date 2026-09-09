(function(){
'use strict';
const KEY='pinal_boost_career_exploration_v1';
const LAB_MESSAGE='BOOST_M3_SKILL_LAB_RESULT';
const NAMES={R:'Realistic',I:'Investigative',A:'Artistic',S:'Social',E:'Enterprising',C:'Conventional'};
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(_){return{}}}
function write(s){
  s.updatedAt=new Date().toISOString();
  localStorage.setItem(KEY,JSON.stringify(s));
  try{
    const j=window.PinalBOOST?.get?.()||{};
    j.modules=j.modules||{};
    j.modules.module3=Object.assign({},j.modules.module3||{},s.module3||{});
    window.PinalBOOST?.put?.(j);
  }catch(_){}
}
function evidence(s){
  const raw=s?.module1?.scores||{},scores={};
  Object.keys(NAMES).forEach(k=>{const n=Number(raw[k]);if(Number.isFinite(n))scores[k]=n});
  const top=(s?.module1?.topInterests||[]).map(x=>x.code).filter(Boolean);
  const codes=top.length>=3?top.slice(0,3):Object.entries(scores).sort((a,b)=>b[1]-a[1]).map(([k])=>k).slice(0,3);
  return{scores,top:codes.map(code=>({code,label:NAMES[code],score:scores[code]??null}))};
}
window.addEventListener('message',e=>{
  if(e.origin!==location.origin||e.data?.type!==LAB_MESSAGE||!e.data.payload)return;
  const s=read(),ev=evidence(s);
  s.module3=s.module3||{};
  const current=s.module3.skillLab||e.data.payload;
  s.module3.skillLab=Object.assign({},current,{onetScores:ev.scores,onetInterestEvidence:ev.top});
  s.module3.onetScores=ev.scores;
  s.module3.onetInterestEvidence=ev.top;
  write(s);
},true);
})();
