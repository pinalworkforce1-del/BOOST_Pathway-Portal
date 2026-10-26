(()=>{'use strict';
const TOKEN_KEY='boost-coach-staff-token-v1';
const cfg=window.PINAL_BOOST_CONFIG||{};
const SUPABASE_URL=cfg.url||cfg.supabaseUrl||'';
const ANON=cfg.key||cfg.supabaseAnonKey||'';
const ENDPOINT=SUPABASE_URL?SUPABASE_URL+'/functions/v1/boost-staff-access':'';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=v=>String(v||'').replace(/^industry-/,'').replace(/[_-]+/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
const money=v=>Number.isFinite(Number(v))?'$'+Number(v).toLocaleString('en-US',{maximumFractionDigits:0}):'—';

function addStyles(){if(document.getElementById('tsBoostStatusStyles'))return;const s=document.createElement('style');s.id='tsBoostStatusStyles';s.textContent=`
.ts-boost-wrap{margin-top:18px}.ts-boost-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}.ts-boost-head h4{margin:0;color:#14344d;font-size:15px}.ts-boost-head p{margin:3px 0 0;color:#6b7e89;font-size:11px;line-height:1.4}.ts-boost-live{font-size:9px;font-weight:900;border-radius:999px;padding:5px 8px;background:#e9f7ef;color:#276a46;white-space:nowrap}.ts-boost-card{border:1px solid #d7e3e8;border-radius:14px;background:#f9fbfc;overflow:hidden}.ts-boost-row{padding:12px 13px;border-top:1px solid #e2eaee}.ts-boost-row:first-child{border-top:0}.ts-boost-top{display:flex;justify-content:space-between;align-items:center;gap:10px}.ts-boost-name{font-weight:900;color:#294a59;font-size:12px}.ts-boost-state{font-size:9px;font-weight:950;border-radius:999px;padding:5px 8px}.ts-boost-state.complete{background:#e8f5ee;color:#276a46}.ts-boost-state.stale{background:#fff2d5;color:#7a5a0b}.ts-boost-state.open{background:#edf2f5;color:#667985}.ts-boost-detail{margin-top:7px;color:#526975;font-size:10.5px;line-height:1.45}.ts-boost-detail b{color:#355665}.ts-boost-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.ts-boost-link{display:inline-flex;align-items:center;text-decoration:none;border-radius:999px;padding:8px 11px;background:#102d49;color:#fff;font-size:10px;font-weight:900}.ts-boost-link.secondary{background:#e8eef1;color:#294a59}.ts-boost-loading,.ts-boost-error{padding:14px;border:1px solid #d7e3e8;border-radius:12px;background:#f7fafb;color:#607681;font-size:11px}.ts-boost-error{background:#fff4f4;color:#8a4650}
`;document.head.appendChild(s)}
function stateInfo(v){if(v==='complete')return{label:'Complete',cls:'complete'};if(v==='stale')return{label:'Needs Review',cls:'stale'};return{label:'Not Complete',cls:'open'}}
function moduleStatus(progress,key){if(key==='ai')return progress.ai||progress.careerAi||'';return progress[key]||''}
function firstIndustry(progress){const keys=Object.keys(progress||{}).filter(k=>k.startsWith('industry-'));if(!keys.length)return null;const complete=keys.find(k=>progress[k]==='complete');const stale=keys.find(k=>progress[k]==='stale');return complete||stale||keys[0]}
function certificateReady(progress){const required=['module1','module2','module3','module4','module5','financial','ai'];if(!required.every(k=>moduleStatus(progress,k)==='complete'))return false;const industryKeys=Object.keys(progress||{}).filter(k=>k.startsWith('industry-'));return !industryKeys.length||industryKeys.some(k=>progress[k]==='complete')}
function detailLine(labelText,value){if(value===null||value===undefined||String(value).trim()==='')return'';return '<div><b>'+esc(labelText)+':</b> '+esc(value)+'</div>'}
function moduleDetails(j,key){const mods=j.modules||j||{},m4=mods.module4||{},m5=mods.module5||{},fin=mods.financial||{},ai=mods.ai||mods.careerAi||{};
 if(key==='module4')return detailLine('Direction',m4.route||m4.participantDirection||m4.decision?.code)+detailLine('Career',m4.careerTitle||m4.careerTarget?.title||m4.career?.title);
 if(key&&key.startsWith('industry-')){const x=mods[key]||{};return detailLine('Experience',label(key))+detailLine('Result',x.result||x.outcome||x.status||x.reflection||'Saved BOOST evidence available');}
 if(key==='module5')return detailLine('Gap',m5.specificGap)+detailLine('Training', [m5.provider,m5.programName].filter(Boolean).join(' — '))+detailLine('Listed cost',m5.listedCost!=null?money(m5.listedCost):'')+detailLine('Target wage',m5.targetHourlyReference!=null?'$'+Number(m5.targetHourlyReference).toFixed(2)+'/hr':'')+detailLine('115% benchmark',m5.roiBenchmarkMet===true?'Met':m5.roiBenchmarkMet===false?'Not met':'');
 if(key==='financial')return detailLine('Priority',fin.priority||fin.topPriority)+detailLine('Support need',fin.supportNeed||fin.supportNeeded);
 if(key==='ai')return detailLine('Badges',Array.isArray(ai.badges)?ai.badges.join(', '):'')+detailLine('Reflection',ai.reflection);
 return'';
}
async function coachReport(journeyId){if(!ENDPOINT)throw new Error('BOOST cloud configuration is unavailable.');const token=localStorage.getItem(TOKEN_KEY)||'';if(!token)throw new Error('Your BOOST staff session has expired.');const res=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','apikey':ANON,'Authorization':'Bearer '+ANON,'X-BOOST-Staff-Token':token},body:JSON.stringify({action:'coach_report',area:'pinal',journey_id:journeyId})});const data=await res.json();if(!res.ok)throw new Error(data?.error||'BOOST status unavailable.');return data.report||{}}
function ensureHost(){const body=document.querySelector('#modalBody');if(!body)return null;body.innerHTML='<section id="talentSyncBoostStatus" class="ts-boost-wrap"></section>';return document.getElementById('talentSyncBoostStatus')}
function row(name,status,details){const st=stateInfo(status);return `<div class="ts-boost-row"><div class="ts-boost-top"><div class="ts-boost-name">${esc(name)}</div><span class="ts-boost-state ${st.cls}">${st.label}</span></div>${details?`<div class="ts-boost-detail">${details}</div>`:''}</div>`}
async function renderBoostStatus(p){const title=document.querySelector('#modalTitle'),overlay=document.querySelector('#modalOverlay');if(title)title.textContent='BOOST Development';if(overlay)overlay.classList.add('open');const host=ensureHost();if(!host)return;host.innerHTML='<div class="ts-boost-head"><div><h4>BOOST Development Status</h4><p>Live, read-only learning evidence from BOOST.</p></div><span class="ts-boost-live">LIVE BOOST</span></div><div class="ts-boost-loading">Loading current BOOST progress…</div>';
 if(!p?.sourceJourneyId){host.innerHTML+='<div class="ts-boost-error">No BOOST source journey is linked to this participant.</div>';return}
 try{const report=await coachReport(p.sourceJourneyId),j=report.journey||{},progress=j.progress||{};const industryKey=firstIndustry(progress),cert=certificateReady(progress);let html='<div class="ts-boost-head"><div><h4>BOOST Development Status</h4><p>Live, read-only learning evidence from BOOST. TalentSync does not edit these results.</p></div><span class="ts-boost-live">LIVE BOOST</span></div><div class="ts-boost-card">';
 html+=row('Career Exploration',moduleStatus(progress,'module4'),moduleDetails(j,'module4'));
 html+=industryKey?row('Applied Career Experience',moduleStatus(progress,industryKey),moduleDetails(j,industryKey)):row('Applied Career Experience','',detailLine('Status','No industry experience recorded'));
 html+=row('Skill Investment',moduleStatus(progress,'module5'),moduleDetails(j,'module5'));
 html+=row('Financial Literacy',moduleStatus(progress,'financial'),moduleDetails(j,'financial'));
 html+=row('AI & You',moduleStatus(progress,'ai'),moduleDetails(j,'ai'));
 html+=row('BOOST Certificate',cert?'complete':'',cert?'<div><b>Available:</b> Full BOOST pathway requirements are complete.</div>':'<div>Certificate remains unavailable until the full BOOST pathway is complete and current.</div>');
 html+='</div><div class="ts-boost-actions"><a class="ts-boost-link secondary" href="staff-dashboard.html">Open BOOST Coach View</a>'+(cert?'<a class="ts-boost-link" href="staff-dashboard.html">View / Download Certificate</a>':'')+'</div>';host.innerHTML=html
 }catch(e){host.innerHTML='<div class="ts-boost-head"><div><h4>BOOST Development Status</h4><p>Live, read-only learning evidence from BOOST.</p></div><span class="ts-boost-live">LIVE BOOST</span></div><div class="ts-boost-error">'+esc(e.message||'BOOST status unavailable.')+'</div>'}}
async function renderReady2Work(journeyId){
 const overlay=document.querySelector('#modalOverlay'),title=document.querySelector('#modalTitle');
 if(title)title.textContent='BOOST Ready 2 Work Results';
 if(overlay)overlay.classList.add('open');
 const host=ensureHost();if(!host)return;
 host.innerHTML='<div class="ts-boost-loading">Retrieving verified Ready 2 Work evidence…</div>';
 try{
  if(!journeyId)throw Error('No BOOST participant link was found.');
  const token=localStorage.getItem(TOKEN_KEY)||'';
  if(!token)throw Error('BOOST staff sign-in required.');
  const response=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json',apikey:ANON,Authorization:'Bearer '+ANON,'X-BOOST-Staff-Token':token},body:JSON.stringify({action:'coach_board',area:'pinal'})});
  const data=await response.json();
  if(!response.ok)throw Error(data.error||'Unable to retrieve BOOST results');
  const record=(data.records||[]).find(r=>String(r.journey_id)===String(journeyId));
  if(!record)throw Error('Participant is not available in authorized Coach View.');
  const p=record.ready2work;
  if(!p){host.innerHTML='<div class="ts-boost-error">No Ready 2 Work results have been saved for this participant.</div>';return}
  const defs=[['COM','Communication',27],['PRO','Professionalism & Integrity',25],['PSA','Problem Solving & Adaptability',14],['TEAM','Teamwork & Collaboration',9],['TIME','Planning & Time Management',11],['QUAL','Quality & Attention to Detail',9]];
  const skillRows=defs.map(([key,name,max])=>{const raw=Number(p.skill_scores?.[key]||0),pct=Math.round(Math.max(0,raw)/max*100);const level=pct>=85?'Advanced':pct>=68?'Strong':pct>=48?'Demonstrated':'Developing';return '<div class="ts-boost-row"><div class="ts-boost-top"><b>'+esc(name)+'</b><span>'+raw+'/'+max+' · '+pct+'% · '+level+'</span></div></div>'}).join('');
  const resume=p.resume||{};
  host.innerHTML='<div class="ts-boost-head"><div><h4>BOOST Ready 2 Work</h4><p>Read-only evidence from the participant’s BOOST record.</p></div><span class="ts-boost-live">LIVE BOOST</span></div>'+
   '<div class="ts-boost-card">'+row('Soft Skills',p.scenario_count===22?'complete':'',esc(p.scenario_count||0)+'/22 scenarios complete')+
   '<div class="ts-boost-row"><b>Six Employability Competencies</b><div class="ts-boost-detail">Advanced ≥85% · Strong ≥68% · Demonstrated ≥48% · Developing below 48%</div></div>'+skillRows+
   row('Résumé Studio',p.resume_complete?'complete':'',p.resume_complete?'<b>Target:</b> '+esc(resume.target||'Recorded')+'<br><b>Summary:</b> '+esc(resume.summary||'Saved'):'Not yet complete')+
   row('Jacqueline Mock Interview',p.interview_complete?'complete':'',p.interview_complete?'Verified completion recorded':'Completion pending')+
   row('BOOST Work Ready Certificate',p.certificate_earned?'complete':'',p.certificate_earned?'Earned; all required elements verified':'Not yet earned')+'</div>';
 }catch(e){host.innerHTML='<div class="ts-boost-error">'+esc(e.message||'Ready 2 Work unavailable')+'</div>'}
}
addStyles();
document.addEventListener('click',e=>{const btn=e.target.closest?.('[data-ready2work-inline]');if(!btn)return;e.preventDefault();e.stopImmediatePropagation();void renderReady2Work(btn.dataset.ready2workInline)},true);
document.addEventListener('click',e=>{const btn=e.target.closest?.('[data-boost-status]');if(!btn)return;e.preventDefault();e.stopImmediatePropagation();renderBoostStatus({sourceJourneyId:btn.dataset.boostJourney||''})},true);
window.TalentSyncBoostStatus={render:renderBoostStatus};
})();