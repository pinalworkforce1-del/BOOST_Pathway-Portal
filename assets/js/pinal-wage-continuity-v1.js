(()=>{
'use strict';

const params=new URLSearchParams(location.search);
if(!/activity\.html$/i.test(location.pathname))return;
const moduleId=params.get('m')||'';
if(!['module2','module3','module4'].includes(moduleId))return;

const SHARED_KEY='pinal_boost_career_exploration_v1';
const JOURNEY_KEY='pinal_boost_journey_v1';
const REPORT_V2='https://pinalworkforce1-del.github.io/BOOST-Decide/career-decision-report-v2.html';
const frame=document.getElementById('activityFrame');
const finish=document.getElementById('finishBtn');
if(!frame)return;

const read=key=>{try{return JSON.parse(localStorage.getItem(key)||'{}')||{}}catch(_){return{}}};
const writeShared=s=>{s=s||{};s.updatedAt=new Date().toISOString();localStorage.setItem(SHARED_KEY,JSON.stringify(s));return s};
function getJourney(){try{return window.PinalBOOST?.get?.()||read(JOURNEY_KEY)}catch(_){return read(JOURNEY_KEY)}}
function putJourney(j){
  try{if(window.PinalBOOST?.put)return window.PinalBOOST.put(j)}catch(_){}
  j=j||{};j.region='Pinal County';j.updated_at=new Date().toISOString();localStorage.setItem(JOURNEY_KEY,JSON.stringify(j));return j;
}
function validWage(v){const n=Number(v);return Number.isFinite(n)&&n>0&&n<=250?n:null}
function module2Wage(){
  let live=null;
  try{live=validWage(frame.contentDocument?.getElementById('currentHourlyWage')?.value)}catch(_){}
  if(live)return live;
  const s=read(SHARED_KEY),j=getJourney(),m2=j?.modules?.module2||{},p=s.participant||{},sm2=s.module2||{};
  const values=[sm2.currentHourlyWage,sm2.wageBaseline?.hourly,p.currentHourlyWage,p.currentWageHourly,p.lastHourlyWage,m2.currentHourlyWage,m2.wageBaseline?.hourly,m2.fields?.currentHourlyWage,j?.participant?.currentHourlyWage];
  for(const value of values){const wage=validWage(value);if(wage)return wage}
  return null;
}
function baselineObject(wage){return{hourly:wage,annual:wage*2080,annualHours:2080,source:'Participant current or most recent hourly wage',required:true,updatedAt:new Date().toISOString()}}
function syncModule2Baseline(wage){
  wage=validWage(wage);if(!wage)return false;
  const now=new Date().toISOString(),s=read(SHARED_KEY);
  s.participant=s.participant||{};s.participant.currentHourlyWage=wage;
  s.module2=s.module2||{};s.module2.currentHourlyWage=wage;s.module2.wageBaseline={...baselineObject(wage),updatedAt:now};
  writeShared(s);
  const j=getJourney();j.modules=j.modules||{};j.modules.module2=j.modules.module2||{};
  j.modules.module2.currentHourlyWage=wage;j.modules.module2.wageBaseline={...baselineObject(wage),updatedAt:now};
  putJourney(j);
  return true;
}
function persistModule3Wage(wage){
  wage=validWage(wage);if(!wage)return;
  const now=new Date().toISOString(),s=read(SHARED_KEY);
  s.module3=s.module3||{};
  s.module3.currentWage=wage;s.module3.currentWageSource='module2';s.module3.currentWageCarriedAt=now;
  writeShared(s);
  const j=getJourney();j.modules=j.modules||{};j.modules.module3=j.modules.module3||{};
  j.modules.module3.currentWage=wage;j.modules.module3.currentWageSource='module2';j.modules.module3.currentWageCarriedAt=now;
  putJourney(j);
}
function syncCloudSoon(){setTimeout(()=>{try{window.PinalBOOSTCloud?.saveNow?.()}catch(_){}},150)}
function toast(message){
  try{if(window.BOOSTPortal?.toast)return window.BOOSTPortal.toast(message)}catch(_){}
  const t=document.querySelector('.toast');if(t){t.textContent=message;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3200)}
}

function wireModule2(){
  function bindInput(){
    let d;try{d=frame.contentDocument}catch(_){return false}if(!d)return false;
    const input=d.getElementById('currentHourlyWage');if(!input||input.dataset.boostWageContinuity)return !!input;
    input.dataset.boostWageContinuity='1';
    const sync=()=>{const wage=validWage(input.value);if(wage){syncModule2Baseline(wage);syncCloudSoon()}};
    input.addEventListener('change',sync);input.addEventListener('blur',sync);
    return true;
  }
  document.addEventListener('click',e=>{
    if(!finish||!e.target.closest?.('#finishBtn'))return;
    const wage=module2Wage();
    if(wage){syncModule2Baseline(wage);return}
    e.preventDefault();e.stopImmediatePropagation();
    toast('Enter your current or most recent hourly wage before completing Module 2.');
    try{const d=frame.contentDocument,p=d?.getElementById('wageBaselinePanel'),input=d?.getElementById('currentHourlyWage');p?.scrollIntoView({behavior:'smooth',block:'center'});input?.focus()}catch(_){}
  },true);
  frame.addEventListener('load',()=>setTimeout(bindInput,200));
  if(frame.contentDocument?.readyState==='complete')setTimeout(bindInput,200);
  let tries=0;const timer=setInterval(()=>{bindInput();if(++tries>=40)clearInterval(timer)},250);
}

function wireModule3(){
  let last=null;
  function carry(){
    const wage=module2Wage();if(!wage)return false;
    let d;try{d=frame.contentDocument}catch(_){return false}if(!d?.body)return false;
    const input=d.getElementById('currentWage');if(!input)return false;
    input.value=wage.toFixed(2);input.readOnly=true;input.setAttribute('aria-readonly','true');input.dataset.boostWageSource='module2';
    input.title='Carried forward from Module 2 Reality Check';input.style.background='#f3f7f8';input.style.cursor='default';
    const label=[...d.querySelectorAll('#setup label,label')].find(el=>el.htmlFor==='currentWage'||/current or last hourly wage/i.test(el.textContent||''));
    if(label)label.innerHTML='Current or last hourly wage <span class="muted">— carried forward from Module 2</span>';
    let note=d.getElementById('boostPinalModule2WageCarryNote');
    if(!note){note=d.createElement('div');note.id='boostPinalModule2WageCarryNote';note.className='muted';note.style.cssText='margin-top:6px;font-size:.78rem;';input.insertAdjacentElement('afterend',note)}
    note.textContent=`Using $${wage.toFixed(2)}/hr from your Module 2 Reality Check.`;
    if(last!==wage){persistModule3Wage(wage);syncCloudSoon();last=wage}
    return true;
  }
  frame.addEventListener('load',()=>{let n=0;const t=setInterval(()=>{carry();if(++n>=40)clearInterval(t)},250)});
  window.addEventListener('storage',carry);
  let n=0;const t=setInterval(()=>{carry();if(++n>=40)clearInterval(t)},250);
  document.addEventListener('click',e=>{if(finish&&e.target.closest?.('#finishBtn'))carry()},true);
}

function entryWageForSelected(d,s){
  const selected=d?.querySelector('.career.sel[data-soc]');const soc=selected?.dataset?.soc||s?.module4?.selectedSoc||'';
  if(!soc)return null;
  const validation=s?.module2?.validationBySoc?.[soc]||{};
  const career=(s?.module1?.selected||[]).find(x=>String(x?.soc||'')===String(soc))||{};
  const n=Number(validation?.entryWage?.hourly??career?.regional?.p25Hourly??career?.wage25);
  return Number.isFinite(n)&&n>0?n:null;
}
function persistModule4Comparison(wage,entry){
  if(!wage)return;
  const s=read(SHARED_KEY);s.module4=s.module4||{};
  const existing=s.module4.wageComparison||{};
  if(Number(existing.baselineHourly)===wage&&Number(existing.entryHourly||0)===Number(entry||0))return;
  s.module4.wageComparison={...existing,baselineHourly:wage,entryHourly:entry||null,annualHours:2080,source:'Module 2 required wage baseline',updatedAt:new Date().toISOString()};
  writeShared(s);
  const j=getJourney();j.modules=j.modules||{};j.modules.module4=j.modules.module4||{};j.modules.module4.wageComparison=s.module4.wageComparison;putJourney(j);syncCloudSoon();
}
function wireModule4(){
  function enhance(){
    const wage=module2Wage();if(!wage)return false;
    let d;try{d=frame.contentDocument}catch(_){return false}if(!d?.body)return false;
    const s=read(SHARED_KEY),entry=entryWageForSelected(d,s);
    const evidence=d.getElementById('evidence');
    if(evidence&&!d.getElementById('boostModule2CurrentWage')){
      const card=d.createElement('div');card.id='boostModule2CurrentWage';card.className='ev';
      card.innerHTML=`<small>CURRENT / MOST RECENT WAGE</small><b>$${wage.toFixed(2)}/hr • about $${Math.round(wage*2080).toLocaleString()}/yr</b><span style="display:block;margin-top:4px;color:#61717e;font-size:.78rem">Carried forward from Module 2 Reality Check.</span>`;
      evidence.prepend(card);
    }
    const wageAnswer=d.querySelector('input[name="wagefit"]')?.closest('.q');
    const context=wageAnswer?.querySelector('.context');
    if(context&&context.dataset.boostWageBaseline!=='1'){
      const delta=entry?entry-wage:null;
      const comparison=entry?` The point-of-entry estimate is ${delta>=0?'$'+delta.toFixed(2)+'/hr above':'$'+Math.abs(delta).toFixed(2)+'/hr below'} your current/most recent wage.`:'';
      context.insertAdjacentHTML('afterbegin',`<div style="margin-bottom:7px;padding-bottom:7px;border-bottom:1px solid #d7e4eb"><strong>Your Module 2 wage baseline:</strong> $${wage.toFixed(2)}/hr.${comparison}</div>`);
      context.dataset.boostWageBaseline='1';
    }
    persistModule4Comparison(wage,entry);
    const report=d.getElementById('openReport');
    if(report&&!report.dataset.boostWageReport){
      report.dataset.boostWageReport='1';
      report.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();window.open(REPORT_V2,'_blank','noopener')},true);
    }
    return true;
  }
  frame.addEventListener('load',()=>{let n=0;const t=setInterval(()=>{enhance();if(++n>=80)clearInterval(t)},250)});
  let n=0;const t=setInterval(()=>{enhance();if(++n>=80)clearInterval(t)},250);
  window.addEventListener('storage',enhance);
}

if(moduleId==='module2')wireModule2();
if(moduleId==='module3')wireModule3();
if(moduleId==='module4')wireModule4();
})();
