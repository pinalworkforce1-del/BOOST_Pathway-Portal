(()=>{
'use strict';if(window.__PinalDependencyFreshnessV1)return;window.__PinalDependencyFreshnessV1=true;
const JK='pinal_boost_journey_v1',SK='pinal_boost_career_exploration_v1',DK='pinal_boost_dependency_freshness_v1';
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'{}')||{}}catch(_){return{}}},write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const arr=v=>Array.isArray(v)?v:[],soc=v=>String(v??'').replace(/[^0-9-]/g,''),uniq=a=>[...new Set(a.filter(Boolean))].sort(),ts=v=>{const n=Date.parse(v||'');return Number.isFinite(n)?n:0};
function stores(){return{j:read(JK),s:read(SK)}}
function mod(id){const {j,s}=stores(),a=s[id]||{},b=j?.modules?.[id]||{};return ts(a.updatedAt||a.completedAt)>=ts(b.updatedAt||b.completedAt)?a:b}
function m1(){return mod('module1')}
function careers(x=m1()){return arr(x.selected).length?arr(x.selected):arr(x.careers)}
function socs(x=m1()){return uniq(careers(x).map(c=>soc(c.soc)))}
function module2Socs(x=mod('module2')){const fromCareers=uniq(arr(x?.careers).map(c=>soc(c?.soc)));if(fromCareers.length)return fromCareers;const rows=x?.validationBySoc&&typeof x.validationBySoc==='object'?Object.keys(x.validationBySoc):[];if(rows.length)return uniq(rows.map(soc));const {j,s}=stores();const candidates=[s?.module2,j?.modules?.module2];for(const c of candidates){const cs=uniq(arr(c?.careers).map(v=>soc(v?.soc)));if(cs.length)return cs;const keys=c?.validationBySoc&&typeof c.validationBySoc==='object'?uniq(Object.keys(c.validationBySoc).map(soc)):[];if(keys.length)return keys}return[]}
function drivers(x=m1()){return uniq(arr(x?.alignmentProfile?.validatedWorkDrivers).map(v=>typeof v==='string'?v:(v?.key||'')))}
function scoreBits(x=m1()){const r=x.scores||x.interestScores||{};return ['R','I','A','S','E','C'].map(k=>`${k}:${r[k]??''}`)}
function module1Scores(){const {j,s}=stores(),candidates=[s?.module1?.scores,s?.module1?.interestScores,j?.modules?.module1?.interestScores,j?.modules?.module1?.scores];for(const r of candidates){if(r&&typeof r==='object'&&['R','I','A','S','E','C'].some(k=>r[k]!==undefined&&r[k]!==null&&String(r[k]).trim()!==''))return r}return{}}
function sig(){return JSON.stringify({careers:socs(),scores:scoreBits(),drivers:drivers()})}
function state(){const d=read(DK);d.review=d.review||{};return d}
function mark(d,id,reason){if(!d.review[id])d.review[id]={since:new Date().toISOString(),reason}}
function status(id){const d=state();if(!d.review[id])return'fresh';if(id==='module2')return'review';if(id==='module3')return d.review.module2?'blocked':'review';if(id==='module4')return(d.review.module2||d.review.module3)?'blocked':'review';return'fresh'}
function meaningful(o){if(!o||typeof o!=='object')return false;return Object.keys(o).some(k=>!['updatedAt','updated_at','createdAt','created_at','region','participant'].includes(k))}
function hasLaterWork(){const {j,s}=stores(),mods=j?.modules||{},progress=j?.progress||{};return ['module2','module3','module4'].some(id=>meaningful(s[id])||meaningful(mods[id])||!!progress[id])}
function moduleComplete(id){const {j,s}=stores();return j?.progress?.[id]==='complete'||!!j?.modules?.[id]?.completedAt||!!s?.[id]?.completedAt}
function mirrorModule2ForResume(){
  try{
    const {j,s}=stores(),jm=j?.modules?.module2||{},sm=s?.module2||{};
    let rows=sm.validationBySoc&&Object.keys(sm.validationBySoc).length?sm.validationBySoc:null;
    if(!rows&&jm.validationBySoc&&Object.keys(jm.validationBySoc).length)rows=jm.validationBySoc;
    if(!rows&&arr(jm.careers).length){rows={};jm.careers.forEach(c=>{if(!c?.soc)return;rows[c.soc]=Object.assign({},c.validation||{},{jobs:c.jobsInterpretation||c.validation?.jobs||'',wages:c.wagesInterpretation||c.validation?.wages||'',prep:c.preparationReadiness||c.validation?.prep||'',employerSupport:c.employerSupport||c.validation?.employerSupport||'',life:c.lifeInterpretation||c.validation?.life||'',future:c.future||c.validation?.future||''})})}
    if(!rows||!Object.keys(rows).length)return;
    if(!sm.validationBySoc||!Object.keys(sm.validationBySoc).length){s.module2=Object.assign({},sm,{validationBySoc:rows,careers:arr(sm.careers).length?sm.careers:arr(jm.careers).map(c=>({title:c.title||'',soc:c.soc||''})),completedAt:sm.completedAt||jm.completedAt||jm.originalModule2CompletedAt||jm.capturedAt||new Date().toISOString()});s.updatedAt=new Date().toISOString();write(SK,s)}
    const p=new URLSearchParams(location.search);if(p.get('m')!=='module2')return;const frame=document.getElementById('activityFrame'),d=frame?.contentDocument;if(!d)return;
    const wage=Number(s?.module2?.currentHourlyWage||s?.module2?.wageBaseline?.hourly||jm.currentHourlyWage||jm.wageBaseline?.hourly||j?.participant?.currentHourlyWage||0);const wageEl=d.getElementById('currentHourlyWage');if(wageEl&&wage>0&&!wageEl.value){wageEl.value=String(wage);wageEl.dispatchEvent(new Event('input',{bubbles:true}));wageEl.dispatchEvent(new Event('change',{bubbles:true}))}
    d.querySelectorAll('.career[data-soc]').forEach(card=>{const r=rows[card.dataset.soc]||{};card.querySelectorAll('[data-field]').forEach(el=>{const v=r[el.dataset.field];if(v!=null&&String(v)!==''&&!String(el.value||'').trim()){el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}})})
  }catch(e){console.warn('BOOST Module 2 saved-answer resume unavailable',e)}
}
function mirrorModule3Interests(){
  try{
    const p=new URLSearchParams(location.search);if(p.get('m')!=='module3')return;
    const frame=document.getElementById('activityFrame'),d=frame?.contentDocument;if(!d)return;
    const scores=module1Scores(),keys=['R','I','A','S','E','C'];
    if(!keys.some(k=>scores[k]!==undefined&&scores[k]!==null&&String(scores[k]).trim()!==''))return;
    let filled=0;
    keys.forEach(k=>{const el=d.getElementById(k),v=scores[k];if(!el||v===undefined||v===null||String(v).trim()==='')return;if(!String(el.value||'').trim()){el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}el.readOnly=true;el.setAttribute('aria-readonly','true');el.title='Carried forward from your Module 1 O*NET Interest Profiler';filled++});
    if(!filled)return;
    const grid=d.querySelector('.g6');if(grid&&!d.getElementById('boostModule1InterestCarryNote')){const note=d.createElement('div');note.id='boostModule1InterestCarryNote';note.style.cssText='grid-column:1/-1;margin:4px 0 8px;padding:10px 12px;border-radius:10px;background:#eaf6f4;border-left:5px solid #2a9d8f;color:#17324d;font:800 13px/1.4 Arial,sans-serif';note.textContent='✓ Your O*NET Interest Profiler scores were carried forward from Discover. You do not need to enter them again.';grid.insertAdjacentElement('afterend',note)}
  }catch(e){console.warn('BOOST Module 3 interest carry-forward unavailable',e)}
}
function reconcile(){
  const d=state(),now=sig(),laterWork=hasLaterWork(),m2=mod('module2'),currentSocs=socs(),m2s=module2Socs(m2),m2Matches=m2s.length&&JSON.stringify(m2s)===JSON.stringify(currentSocs);
  if(!laterWork){
    delete d.review.module2;delete d.review.module3;delete d.review.module4;d.signature=now;
  }else if(!d.signature){
    d.signature=now;
  }else if(d.signature!==now){
    d.signature=now;
    mark(d,'module2','Something you selected in Discover changed. Review Reality Check so it reflects your current career exploration.');
    mark(d,'module3','Your Discover choices changed. Refresh Reality Check first, then review Career Mobility.');
    mark(d,'module4','Your earlier career evidence changed. Review the highlighted steps before refreshing Decide.');
  }
  if(m2Matches&&moduleComplete('module2')){
    const completed=ts(m2.completedAt||m2.originalModule2CompletedAt||m2.capturedAt);
    if(d.review.module2&&completed>ts(d.review.module2.since)){delete d.review.module2}else if(!d.review.module2){d.module2AcceptedSignature=now}
  }
  const st=stores(),m3=mod('module3'),hasM3=meaningful(st.s?.module3)||meaningful(st.j?.modules?.module3)||!!st.j?.progress?.module3;if(d.review.module3&&!hasM3)delete d.review.module3;else if(d.review.module3&&!d.review.module2&&ts(m3.completedAt||m3.finalizedAt)>ts(d.review.module3.since))delete d.review.module3;
  const m4=mod('module4'),hasM4=meaningful(st.s?.module4)||meaningful(st.j?.modules?.module4)||!!st.j?.progress?.module4;if(d.review.module4&&!hasM4)delete d.review.module4;else if(d.review.module4&&!d.review.module2&&!d.review.module3&&ts(m4.completedAt)>ts(d.review.module4.since))delete d.review.module4;
  write(DK,d);mirrorModule2ForResume();mirrorModule3Interests();decorate();return d
}
function css(){if(document.getElementById('pinalFreshCss'))return;const s=document.createElement('style');s.id='pinalFreshCss';s.textContent=`.pinalNeedsReview{outline:4px solid #e0a52f!important;box-shadow:0 0 0 7px #fff3cdcc!important;background:rgba(255,220,105,.10)!important}.pinalNeedsReview .complete-badge{display:none!important}.pinalReviewBadge{position:absolute;right:5px;top:5px;z-index:40;display:flex;align-items:center;gap:4px;padding:5px 7px;border-radius:999px;background:#9a6700;color:#fff;border:1px solid #ffe19a;box-shadow:0 3px 9px rgba(0,0,0,.25);font:900 9px/1.1 system-ui;white-space:nowrap}.pinalReviewBadge:before{content:'↻';font-size:13px;line-height:1}.pinalWaiting .pinalReviewBadge{background:#7b6331}.pinalReviewBanner{margin:12px auto;padding:14px 16px;border-radius:13px;background:#fff7dc;border:1px solid #e0b653;border-left:6px solid #d69a18;color:#4d3c13;max-width:1120px;font:600 14px/1.45 system-ui}.pinalReviewBanner a{font-weight:900;color:#174e70}.pinalUpdateGuide{margin:10px auto 18px;padding:14px 16px;max-width:1120px;border:1px solid #bdd6e1;border-left:6px solid #1d6f96;border-radius:13px;background:#f7fbfd;color:#294c60}.pinalUpdateGuide b{color:#173e57}`;document.head.appendChild(s)}
function map(){['module2','module3','module4'].forEach(id=>{const el=document.querySelector(`[data-module-id="${id}"], [data-core="${id}"]`);if(!el)return;const st=status(id);el.classList.toggle('pinalNeedsReview',st!=='fresh');el.classList.toggle('pinalWaiting',st==='blocked');let b=el.querySelector('.pinalReviewBadge');if(st!=='fresh'){if(!b){b=document.createElement('span');b.className='pinalReviewBadge';el.appendChild(b)}b.textContent=st==='review'?'REVIEW':'WAITING';const label=el.querySelector('.hotspot-label');if(label)label.textContent=st==='review'?'Review this module — something you selected earlier changed':'Waiting — update the highlighted module first'}else{b?.remove();el.classList.remove('pinalWaiting')}})}
function helper(){const p=new URLSearchParams(location.search),id=p.get('m'),st=status(id);let b=document.getElementById('pinalReviewBanner');if(!['module2','module3','module4'].includes(id||'')||st==='fresh'){b?.remove();return}if(!b){b=document.createElement('div');b.id='pinalReviewBanner';b.className='pinalReviewBanner';(document.querySelector('main')||document.body).insertAdjacentElement('afterbegin',b)}const names=careers().map(c=>c.title).filter(Boolean).join(', ')||'your current career choices';if(id==='module2')b.innerHTML=`<b>Something you selected in Discover changed.</b><br>Your current career exploration includes <b>${names}</b>. Your previous work is still saved. Only update the career evidence that no longer matches your current choices.`;else if(id==='module3'&&st==='blocked')b.innerHTML=`<b>Career Mobility is waiting for a refreshed Reality Check.</b><br>Your previous work is still saved. Update Module 2 first so Career Mobility can use your current career choices.`;else if(id==='module3')b.innerHTML=`<b>Reality Check is current again.</b><br>Review the career comparison affected by your changes. You do not need to redo skill or experience work that still applies.`;else if(id==='module4'&&st==='blocked')b.innerHTML=`<b>Decide is waiting for the highlighted review step.</b><br>Your previous decision work is still saved. Finish the earlier review so Decide uses your current career evidence.`;else b.innerHTML=`<b>Your career evidence changed.</b><br>Revisit your final direction using the refreshed Discover, Reality Check, and Career Mobility evidence. You do not need to restart the module.`}
function decorate(){css();map();helper()}
window.addEventListener('storage',()=>setTimeout(reconcile,40));document.addEventListener('boostprogress',()=>setTimeout(reconcile,40));const frame=document.getElementById('activityFrame');frame?.addEventListener('load',()=>{setTimeout(mirrorModule2ForResume,450);setTimeout(mirrorModule2ForResume,1200);setTimeout(mirrorModule3Interests,450);setTimeout(mirrorModule3Interests,1200)});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{reconcile();setTimeout(reconcile,800)},{once:true});else reconcile();setInterval(reconcile,1800);window.PinalBOOSTDependencies={status,reconcile,state};
})();