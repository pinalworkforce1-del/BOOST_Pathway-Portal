(()=>{
'use strict';
const params=new URLSearchParams(location.search);
if(!/activity\.html$/i.test(location.pathname)||params.get('m')!=='module4')return;
const frame=document.getElementById('activityFrame');
const finish=document.getElementById('finishBtn');
if(!frame)return;
const SHARED_KEY='pinal_boost_career_exploration_v1';
const JOURNEY_KEY='pinal_boost_journey_v1';
const REPORT_URL='https://pinalworkforce1-del.github.io/BOOST-Decide/career-decision-report.html';
const ROUTES={
 READY:{name:'WORK NOW',className:'ready',why:'The evidence suggests you are prepared to compete for this role now, and the wage and life fit are workable enough to act.'},
 BRIDGE:{name:'EARN WHILE YOU LEARN',className:'bridge',why:'A preparation gap exists and Module 2 contains verified employer-supported evidence that may allow you to close that gap while earning.'},
 BUILD:{name:'TRAINING INVESTMENT CONVERSATION',className:'build',why:'The evidence points to an occupation-specific preparation gap that may need a targeted credential, license, or formal preparation before entry.'},
 RECONSIDER:{name:'EXPLORE BEFORE COMMITTING',className:'reconsider',why:'The wage, life fit, confidence, preparation evidence, or missing employer-supported evidence suggests another step of exploration would be useful before committing.'}
};
const read=key=>{try{return JSON.parse(localStorage.getItem(key)||'{}')||{}}catch(_){return{}}};
function getJourney(){try{return window.PinalBOOST?.get?.()||read(JOURNEY_KEY)}catch(_){return read(JOURNEY_KEY)}}
function putJourney(j){try{if(window.PinalBOOST?.put)return window.PinalBOOST.put(j)}catch(_){}j=j||{};j.region='Pinal County';j.updated_at=new Date().toISOString();localStorage.setItem(JOURNEY_KEY,JSON.stringify(j));return j}
function writeShared(s){s=s||{};s.updatedAt=new Date().toISOString();localStorage.setItem(SHARED_KEY,JSON.stringify(s));return s}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function money(n){return Number.isFinite(Number(n))?'$'+Number(n).toFixed(2):'Not available'}
function annual(n){return Number.isFinite(Number(n))?'$'+Math.round(Number(n)).toLocaleString():'Not available'}
function snapshotFromShared(){const s=read(SHARED_KEY),m=s.module4||{};if(!m||!Object.keys(m.answers||{}).length)return null;return{...m,resultSnapshotVersion:'module4-v1'}}
function snapshotFromJourney(){
 const j=getJourney(),m=j?.modules?.module4||{};
 if(m?.resultSnapshot?.answers)return{...m.resultSnapshot,resultSnapshotVersion:'module4-v1'};
 if(m?.answers&&Object.keys(m.answers).length)return{...m,resultSnapshotVersion:'module4-v1'};
 const dec=m?.decision||{};
 if(dec?.answers&&Object.keys(dec.answers).length){return{
   selectedSoc:dec?.career?.soc||m?.career?.soc||m?.selectedSoc||'',careerTitle:dec?.career?.title||m?.careerTitle||m?.career?.title||'',career:dec?.career||m?.career||null,
   answers:dec.answers,route:dec.route||dec?.decision?.code||dec?.participant?.direction||m?.participantDirection||'',participantDirection:dec?.participant?.direction||dec.route||m?.participantDirection||'',
   decision:{code:dec?.decision?.code||dec.route||m?.participantDirection||''},employerBridgeEvidence:dec.employerBridgeEvidence??m.employerBridgeEvidence,
   entryWage:m.entryWage||null,preparationIntel:m.preparationIntel||null,evidenceSource:m.evidenceSource||'',wageComparison:m.wageComparison||null,
   completedAt:m.completedAt||dec.completedAt||m.capturedAt||new Date().toISOString(),resultSnapshotVersion:'module4-v1'
 }}
 return null;
}
function savedSnapshot(){return snapshotFromShared()||snapshotFromJourney()}
function normalizeSnapshot(raw){
 if(!raw)return null;const route=raw.route||raw.participantDirection||raw?.decision?.code||raw?.participant?.direction||'';
 const answers=raw.answers||raw?.decision?.answers||{};if(!route||Object.keys(answers).length<5)return null;
 const career=raw.career||raw?.decision?.career||{};
 return{...raw,selectedSoc:String(raw.selectedSoc||career.soc||''),careerTitle:raw.careerTitle||career.title||'',career:{title:raw.careerTitle||career.title||'',soc:String(raw.selectedSoc||career.soc||'')},answers,route,participantDirection:route,decision:{...(raw.decision||{}),code:route},completedAt:raw.completedAt||new Date().toISOString(),resultSnapshotVersion:'module4-v1'};
}
function persistSnapshot(raw){
 const snap=normalizeSnapshot(raw);if(!snap)return null;
 const s=read(SHARED_KEY);s.module4={...(s.module4||{}),...snap};writeShared(s);
 const j=getJourney();j.modules=j.modules||{};j.modules.module4={...(j.modules.module4||{}),...snap,resultSnapshot:snap};putJourney(j);
 setTimeout(()=>{try{window.PinalBOOSTCloud?.saveNow?.()}catch(_){}},100);
 return snap;
}
function captureLive(){
 try{
   const w=frame.contentWindow,s=read(SHARED_KEY),m=s.module4||{},live=w?.BOOST_MODULE4||{};
   const answers=live.answers||m.answers||{};if(Object.keys(answers).length<5)return null;
   return persistSnapshot({...m,...live,
     selectedSoc:m.selectedSoc||live?.career?.soc||'',careerTitle:m.careerTitle||live?.career?.title||'',career:m.career||live.career||null,
     answers,route:m.route||live.route||live?.decision?.code||live?.participant?.direction||'',participantDirection:m.participantDirection||live?.participant?.direction||live.route||'',
     entryWage:m.entryWage||null,preparationIntel:m.preparationIntel||null,evidenceSource:m.evidenceSource||'',wageComparison:m.wageComparison||null,
     completedAt:m.completedAt||new Date().toISOString()
   });
 }catch(e){console.warn('BOOST Module 4 live result capture unavailable',e);return null}
}
function renderSaved(snap){
 let d;try{d=frame.contentDocument}catch(_){return false}if(!d?.body)return false;
 snap=normalizeSnapshot(snap);if(!snap)return false;
 const careerBtn=[...d.querySelectorAll('.career[data-soc]')].find(b=>String(b.dataset.soc)===String(snap.selectedSoc));
 if(!careerBtn)return false;
 if(!careerBtn.classList.contains('sel'))careerBtn.click();
 Object.entries(snap.answers||{}).forEach(([name,value])=>{const input=d.querySelector(`input[name="${CSS.escape(name)}"][value="${CSS.escape(String(value))}"]`);if(input)input.checked=true});
 const route=ROUTES[snap.route]||ROUTES.RECONSIDER;
 const result=d.getElementById('result'),hero=d.getElementById('routeHero');if(!result||!hero)return false;
 hero.className='routeHero '+route.className;
 const big=d.getElementById('routeBig'),name=d.getElementById('routeName'),why=d.getElementById('routeWhy'),grid=d.getElementById('routeGrid');
 if(big)big.textContent=snap.route;if(name)name.textContent=route.name;
 let detail=`<h3>Your saved decision</h3><p>${route.why}</p><p><b>Career:</b> ${esc(snap.careerTitle||snap?.career?.title||'')}</p>`;
 if(snap?.entryWage?.hourly)detail+=`<p><b>Point-of-entry wage used:</b> ${money(snap.entryWage.hourly)}/hr, about ${annual(snap.entryWage.annual||snap.entryWage.hourly*2080)}/yr at 40 hours/week.</p>`;
 if(snap?.preparationIntel?.label)detail+=`<p><b>Preparation evidence:</b> ${esc(snap.preparationIntel.label)}. ${esc(snap.preparationIntel.summary||'')}</p>`;
 detail+=snap.employerBridgeEvidence?'<p><b>Employer-supported evidence:</b> Verified in Module 2.</p>':'<p><b>Employer-supported evidence:</b> No verified route was carried forward. BRIDGE was not created from participant preference.</p>';
 if(why)why.innerHTML=detail;
 if(grid)grid.innerHTML=Object.entries(ROUTES).map(([k,v])=>`<div class="routeCard ${k===snap.route?'active':''}"><b>${k}</b><br><small>${v.name}</small></div>`).join('');
 result.classList.add('show');const native=d.getElementById('nativeFinish');if(native)native.disabled=false;
 let note=d.getElementById('boostSavedDecisionNotice');
 if(!note){note=d.createElement('div');note.id='boostSavedDecisionNotice';note.style.cssText='margin:14px 0;padding:12px 14px;border-radius:12px;background:#eef8f6;border-left:5px solid #2a9d8f;color:#355966;font:700 13px/1.45 Arial,sans-serif';result.insertBefore(note,result.firstChild)}
 note.innerHTML='<b>✓ Saved BOOST decision restored.</b> Your five answers and evidence-based direction are saved with your BOOST journey. You can review them here or reopen your Career Decision Report.';
 const report=d.getElementById('openReport');if(report){report.textContent='OPEN SAVED CAREER DECISION REPORT ↗';report.onclick=null;report.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();persistSnapshot(snap);window.open(REPORT_URL,'_blank','noopener')},{capture:true,once:false})}
 return true;
}
function restore(){const snap=savedSnapshot();if(!snap)return false;persistSnapshot(snap);return renderSaved(snap)}
function bindFrame(){
 let d;try{d=frame.contentDocument}catch(_){return false}if(!d?.body||d.__boostM4ResumeBound)return !!d?.body;d.__boostM4ResumeBound=true;
 d.addEventListener('click',e=>{if(e.target?.closest?.('#decide'))setTimeout(captureLive,120)},true);
 d.addEventListener('click',e=>{if(e.target?.closest?.('#openReport')){const snap=captureLive()||savedSnapshot();if(snap)persistSnapshot(snap)}},true);
 return true;
}
if(finish)finish.addEventListener('click',()=>captureLive(),true);
function run(){let n=0;const t=setInterval(()=>{bindFrame();const ok=restore();if(ok||++n>=80)clearInterval(t)},250)}
frame.addEventListener('load',run);run();
})();
