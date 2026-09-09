(function(){
'use strict';
const SHARED_KEY='pinal_boost_career_exploration_v1';
const LAB_MESSAGE='BOOST_M3_SKILL_LAB_RESULT';
const NAMES={R:'Realistic',I:'Investigative',A:'Artistic',S:'Social',E:'Enterprising',C:'Conventional'};
let moduleFrame=null;
function readShared(){try{return JSON.parse(localStorage.getItem(SHARED_KEY)||'{}')||{}}catch(_){return{}}}
function writeShared(s){s.updatedAt=new Date().toISOString();localStorage.setItem(SHARED_KEY,JSON.stringify(s));try{const j=window.PinalBOOST?.get?.()||{};j.modules=j.modules||{};j.modules.module3=Object.assign({},j.modules.module3||{},s.module3||{});window.PinalBOOST?.put?.(j)}catch(e){console.warn('BOOST O*NET lab score cloud mirror unavailable',e)}}
function scoreMap(s){const raw=s?.module1?.scores||{};const out={};Object.keys(NAMES).forEach(k=>{const n=Number(raw[k]);if(Number.isFinite(n))out[k]=n});return out}
function topCodes(s,scores){const top=(s?.module1?.topInterests||[]).map(x=>x.code).filter(Boolean);if(top.length>=3)return top.slice(0,3);return Object.entries(scores).sort((a,b)=>b[1]-a[1]).map(([k])=>k).slice(0,3)}
function interestEvidence(s){const scores=scoreMap(s),codes=topCodes(s,scores);return{scores,topInterests:codes.map(code=>({code,label:NAMES[code],score:scores[code]??null}))}}
function decorateLab(labFrame){
 try{
  const d=labFrame.contentDocument;if(!d?.body)return;
  const s=readShared(),ev=interestEvidence(s);if(!ev.topInterests.length)return;
  const banner=d.getElementById('boostM3LabCarry');
  if(banner){banner.innerHTML='<b>Carried from Discover:</b> '+ev.topInterests.map(x=>`${x.code} — ${x.label}${x.score!=null?' • '+x.score:''}`).join(' &nbsp; • &nbsp; ')+'<br><span style="font-weight:500">Your numeric O*NET scores remain attached to this Module 3 evidence. The lab uses your top interest families to choose situations, then compares those preferences with the strength of your original interest scores.</span>'}
  ev.topInterests.forEach((x,i)=>{const el=d.getElementById('top'+(i+1));if(el){el.value=x.code;el.dispatchEvent(new Event('change',{bubbles:true}))}});
  if(!d.getElementById('boostM3NumericScorePanel')){
   const setup=d.getElementById('setup');if(setup){const box=d.createElement('div');box.id='boostM3NumericScorePanel';box.style.cssText='margin:12px 0;padding:12px 14px;border:1px solid #4b6a82;border-radius:12px;background:#10263a;color:#eef5fa;font:700 13px/1.5 Arial,sans-serif';box.innerHTML='<b>Your O*NET scores from Discover</b><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">'+ev.topInterests.map(x=>`<span style="padding:6px 9px;border-radius:999px;background:#294b67">${x.code} — ${x.label}: ${x.score??'score unavailable'}</span>`).join('')+'</div><div style="margin-top:7px;color:#b8c9d6;font-weight:500">You do not need to enter these again.</div>';const first=setup.querySelector('.hero>div')||setup;first.appendChild(box)}
  }
 }catch(e){console.warn('BOOST lab score display unavailable',e)}
}
function bindNestedLab(){
 try{
  const d=moduleFrame?.contentDocument;if(!d)return;
  const lab=d.getElementById('boostM3LabFrame');if(!lab||lab.dataset.scoreCarryBound)return;
  lab.dataset.scoreCarryBound='1';lab.addEventListener('load',()=>setTimeout(()=>decorateLab(lab),180));if(lab.contentDocument?.readyState==='complete')setTimeout(()=>decorateLab(lab),180)
 }catch(e){console.warn('BOOST nested lab score binding unavailable',e)}
}
function watchModule(frame){moduleFrame=frame;const bind=()=>setTimeout(()=>{bindNestedLab();try{const d=frame.contentDocument;if(!d||d.__boostLabScoreObserver)return;d.__boostLabScoreObserver=true;new d.defaultView.MutationObserver(bindNestedLab).observe(d.body,{childList:true,subtree:true})}catch(_){ }},450);frame.addEventListener('load',bind);if(frame.contentDocument?.readyState==='complete')bind()}
window.addEventListener('message',e=>{
 if(e.origin!==location.origin||e.data?.type!==LAB_MESSAGE||!e.data.payload)return;
 const s=readShared(),ev=interestEvidence(s);s.module3=s.module3||{};
 const current=s.module3.skillLab||e.data.payload;
 s.module3.skillLab=Object.assign({},current,{onetScores:ev.scores,onetInterestEvidence:ev.topInterests});
 s.module3.onetInterestEvidence=ev.topInterests;s.module3.onetScores=ev.scores;writeShared(s);
 try{const d=moduleFrame?.contentDocument,summary=d?.getElementById('boostM3LabSummary');if(summary&&ev.topInterests.length){let row=summary.querySelector('.boostM3OnetScores');if(!row){row=d.createElement('div');row.className='boostM3OnetScores';row.style.cssText='margin-top:9px;font-size:12px;color:#45616f';summary.appendChild(row)}row.innerHTML='<b>O*NET evidence carried:</b> '+ev.topInterests.map(x=>`${x.code} ${x.label} ${x.score??''}`).join(' • ')}}catch(_){ }
},true);
function init(){const p=new URLSearchParams(location.search);if(!/activity\.html$/i.test(location.pathname)||p.get('m')!=='module3')return;const frame=document.getElementById('activityFrame');if(frame)watchModule(frame)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();