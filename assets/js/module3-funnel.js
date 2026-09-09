(function(){
'use strict';
const SHARED_KEY='pinal_boost_career_exploration_v1';
const LAB_URL='https://pinalworkforce1-del.github.io/BOOST-Job_Mobility/';
const LAB_MESSAGE='BOOST_M3_SKILL_LAB_RESULT';
const NAMES={R:'Realistic',I:'Investigative',A:'Artistic',S:'Social',E:'Enterprising',C:'Conventional'};
let activeFrame=null;
let messageBound=false;
const txt=v=>String(v||'').replace(/\s+/g,' ').trim();
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const qa=(r,s)=>{try{return [...r.querySelectorAll(s)]}catch(_){return[]}};
const q=(r,s)=>{try{return r.querySelector(s)}catch(_){return null}};

function state(){try{return JSON.parse(localStorage.getItem(SHARED_KEY)||'{}')||{}}catch(_){return{}}}
function saveState(s){s=s||{};s.updatedAt=new Date().toISOString();localStorage.setItem(SHARED_KEY,JSON.stringify(s));try{const j=window.PinalBOOST?.get?.()||{};j.modules=j.modules||{};j.modules.module3=Object.assign({},j.modules.module3||{},s.module3||{});window.PinalBOOST?.put?.(j)}catch(e){console.warn('Module 3 shared journey mirror unavailable',e)}}
function m2For(s,soc){return s?.module2?.validationBySoc?.[soc]||{}}
function selectedCareers(s){return s?.module1?.selected||[]}
function topCodes(s){
 const fromTop=(s?.module1?.topInterests||[]).map(x=>x.code).filter(Boolean);
 if(fromTop.length>=3)return fromTop.slice(0,3);
 const scores=s?.module1?.scores||{};
 return Object.entries(scores).sort((a,b)=>Number(b[1])-Number(a[1])).map(([k])=>k).filter(k=>NAMES[k]).slice(0,3);
}
function statusFor(v){
 const f=String(v?.future||'').toLowerCase();
 if(f==='no')return{label:'Paused after Reality Check',cls:'paused',active:false};
 if(f==='yes')return{label:'Carrying Forward',cls:'go',active:true};
 if(f==='maybe')return{label:'Still Exploring',cls:'maybe',active:true};
 return{label:'Reality Check evidence connected',cls:'neutral',active:true};
}
function prettyPrep(v){return({'Ready / can apply now':'Ready to apply now','Some preparation gap':'Small / specific gap','Substantial preparation gap':'Significant gap','Requirements vary by employer':'Varies by employer','Need more research':'Needs more research'}[v]||v||'Not recorded')}
function css(d){
 if(d.getElementById('boostM3FunnelCSS'))return;
 const s=d.createElement('style');s.id='boostM3FunnelCSS';s.textContent=`
.boostM3Carry{border:2px solid #b9d8cb!important;background:linear-gradient(135deg,#f6fbf8,#fff)!important}.boostM3CarryLead{font-size:1rem;line-height:1.55;color:#425b70;max-width:920px}.boostM3CareerGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(275px,1fr));gap:12px;margin:14px 0}.boostM3Career{border:1px solid #d6e2e8;border-radius:15px;padding:15px;background:#fff;display:flex;flex-direction:column}.boostM3Career h3{margin:.25rem 0}.boostM3Career small{color:#6b7d8c}.boostM3CareerFacts{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:10px 0}.boostM3CareerFacts div{padding:8px 9px;border-radius:9px;background:#f6f9fb;border:1px solid #e1e8ed}.boostM3CareerFacts span{display:block;font-size:.67rem;text-transform:uppercase;letter-spacing:.05em;color:#728697;font-weight:850}.boostM3CareerFacts b{font-size:.82rem;color:#17324d}.boostM3Status{display:inline-block;width:max-content;padding:5px 8px;border-radius:999px;font-size:.7rem;font-weight:900;margin:3px 0}.boostM3Status.go{background:#dff5ea;color:#176846}.boostM3Status.maybe{background:#fff3cf;color:#765900}.boostM3Status.paused{background:#f3e8e8;color:#8a3d3d}.boostM3Status.neutral{background:#eaf2f8;color:#375d77}.boostM3Use{margin-top:auto;border:0;border-radius:10px;padding:11px 13px;background:#0b3158;color:#fff;font-weight:900;cursor:pointer}.boostM3Use.paused{background:#667785}.boostM3CarryNote{padding:11px 13px;border-radius:10px;background:#eef8f6;border-left:4px solid #2a9d8f;color:#385766;line-height:1.45}
.boostM3Lab{border:2px solid #d7c16c!important;background:linear-gradient(135deg,#fffaf0,#fff)!important}.boostM3LabGrid{display:grid;grid-template-columns:1.3fr .7fr;gap:16px;align-items:center}.boostM3Lab h2{margin:.2rem 0}.boostM3Lab p{line-height:1.55;color:#425b70}.boostM3LabCall{padding:13px;border-radius:12px;background:#fff7db;border-left:5px solid #d9a73c}.boostM3LabBtn{border:0;border-radius:10px;padding:12px 15px;background:#0b3158;color:#fff;font-weight:900;cursor:pointer}.boostM3LabBtn.alt{background:#eaf0f5;color:#17324d}.boostM3LabSummary{margin-top:13px;padding:13px;border-radius:12px;background:#eef8f6;border:1px solid #c9e6df}.boostM3LabSummary b{color:#176e69}.boostM3Pills{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.boostM3Pill{padding:5px 8px;border-radius:999px;background:#fff;border:1px solid #cbdbe3;font-size:.75rem;font-weight:800;color:#315166}
.boostM3LabModal{position:fixed;inset:0;z-index:2147483000;background:#061522df;display:none;flex-direction:column;padding:12px}.boostM3LabModal.open{display:flex}.boostM3LabBar{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:11px 14px;background:#0d2741;color:#fff;border-radius:12px 12px 0 0}.boostM3LabBar b{font-size:.95rem}.boostM3LabClose{border:1px solid #ffffff66;background:#ffffff18;color:#fff;border-radius:999px;padding:7px 11px;font-weight:900;cursor:pointer}.boostM3LabFrame{width:100%;height:calc(100vh - 76px);border:0;background:#fff;border-radius:0 0 12px 12px}
.boostM3NewCareer{margin-top:10px;padding:10px 12px;border-radius:10px;background:#fff5d9;border-left:4px solid #d9a73c;color:#5f522f;font-size:.82rem;line-height:1.45}.boostM3EvidenceOut{margin:14px 0;padding:14px;border-radius:14px;background:#f7fafc;border:1px solid #d6e1e8}.boostM3EvidenceOut h3{margin:.1rem 0}.boostM3EvidenceGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:9px}.boostM3EvidenceGrid div{background:#fff;border:1px solid #e0e7ec;border-radius:10px;padding:10px}.boostM3EvidenceGrid span{display:block;font-size:.68rem;text-transform:uppercase;letter-spacing:.05em;color:#708397;font-weight:900}.boostM3EvidenceGrid b{display:block;margin-top:3px;color:#17324d;font-size:.85rem}
@media(max-width:800px){.boostM3LabGrid,.boostM3EvidenceGrid{grid-template-columns:1fr}.boostM3CareerFacts{grid-template-columns:1fr}}
`;
 d.head.appendChild(s);
}
function findDecision(d){return d.getElementById('decision')||qa(d,'section.panel').find(x=>/How do you want to look at your options/i.test(txt(x.textContent)))||null}
function skillsPanel(d){return d.getElementById('skills')||qa(d,'section.panel').find(x=>/What Do You Already Bring/i.test(txt(x.textContent)))||null}
function ensureSharedScores(d,s){['R','I','A','S','E','C'].forEach(k=>{const el=d.getElementById(k),v=s?.module1?.scores?.[k];if(el&&v!=null&&el.value===''){el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}})}
function captureSelfAssessment(d){
 const cards=qa(d,'#skillgrid .skillcard');if(!cards.length)return;
 const out=cards.map(card=>{const h=txt(q(card,'h3')?.textContent),checked=q(card,'input[type=radio]:checked');return h&&checked?{skill:h,use:checked.value}:null}).filter(Boolean);
 const s=state();s.module3=s.module3||{};s.module3.selfAssessment=out;s.module3.selfAssessmentUpdatedAt=new Date().toISOString();saveState(s);renderEvidence(d,s);
}
function renderCarry(d){
 const dec=findDecision(d);if(!dec)return;let panel=d.getElementById('boostM3Carry');if(!panel){panel=d.createElement('section');panel.id='boostM3Carry';panel.className='panel boostM3Carry';dec.parentNode.insertBefore(panel,dec)}
 const s=state(),careers=selectedCareers(s);
 if(!careers.length){panel.innerHTML='<div class="step">Step 3 • Career Mobility</div><h2>Your validated career list is empty</h2><p class="boostM3CarryLead">BOOST did not find careers carried from Discover and Reality Check. You can still explore below, but any new career should complete a Reality Check before Decide.</p>';return}
 const cards=careers.map(o=>{const v=m2For(s,o.soc),st=statusFor(v),facts=[['Jobs',v.jobs||'Not recorded'],['Wage fit',v.wages||'Not recorded'],['Readiness',prettyPrep(v.prep)],['Life fit',v.life||'Not recorded']];return`<article class="boostM3Career" data-soc="${esc(o.soc)}"><small>${esc(o.soc)}${o.pathway?.name?' • '+esc(o.pathway.name):''}</small><h3>${esc(o.title)}</h3><span class="boostM3Status ${st.cls}">${esc(st.label)}</span><div class="boostM3CareerFacts">${facts.map(([a,b])=>`<div><span>${esc(a)}</span><b>${esc(b)}</b></div>`).join('')}</div><button type="button" class="boostM3Use ${st.active?'':'paused'}" data-soc="${esc(o.soc)}">${st.active?'COMPARE MY EXPERIENCE TO THIS CAREER →':'REOPEN THIS CAREER IN MOBILITY →'}</button></article>`}).join('');
 panel.innerHTML=`<div class="step">Step 3 • Career Mobility</div><h2>Keep building the careers you have already explored.</h2><p class="boostM3CarryLead">These careers came from Discover and your Reality Check. Now compare <b>what you already bring</b> with each career instead of starting over with a random occupation.</p><div class="boostM3CareerGrid">${cards}</div><div class="boostM3CarryNote"><b>Exploration stays open.</b> You can still ask BOOST to show other possibilities or explore a different career below. A brand-new career can be explored here, but it will be marked for a Reality Check before it is used in Decide.</div><div id="boostM3EvidenceOut" class="boostM3EvidenceOut"></div>`;
 qa(panel,'.boostM3Use').forEach(b=>b.addEventListener('click',()=>useCarriedCareer(d,b.dataset.soc)));
 renderEvidence(d,s);
}
function existingTargetControls(d){
 const dec=findDecision(d);if(!dec)return{};
 const choice=qa(dec,'.choice').find(c=>/career in mind|different career/i.test(txt(c.textContent)))||dec;
 const input=q(choice,'input[type=text],input:not([type])');
 const button=qa(choice,'button').find(b=>/CHECK THIS CAREER|CHECK A NEW CAREER/i.test(txt(b.textContent)))||null;
 return{dec,choice,input,button};
}
function useCarriedCareer(d,soc){
 const s=state(),o=selectedCareers(s).find(x=>x.soc===soc);if(!o)return;
 s.module3=s.module3||{};s.module3.lastViewedSoc=soc;s.module3.targets=s.module3.targets||{};s.module3.targets[soc]={title:o.title,source:'carried_from_module2',reviewedAt:new Date().toISOString()};saveState(s);renderEvidence(d,s);
 const {choice,input,button}=existingTargetControls(d);
 if(!input||!button){choice?.scrollIntoView({behavior:'smooth',block:'center'});return}
 input.value=o.title;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
 setTimeout(()=>{
   const candidates=qa(choice,'.suggest button,.suggestion button,[role=option]');
   const exact=candidates.find(x=>txt(x.textContent).toLowerCase().includes(o.title.toLowerCase()));if(exact)exact.click();
   setTimeout(()=>{button.click();setTimeout(()=>{d.getElementById('results')?.scrollIntoView({behavior:'smooth',block:'start'})},250)},120);
 },220);
}
function modifyExploreFurther(d){
 const dec=findDecision(d);if(!dec||dec.dataset.boostFunnel)return;dec.dataset.boostFunnel='1';
 const step=q(dec,'.step');if(step)step.textContent='Explore Further • Optional';
 const h=q(dec,'h2');if(h)h.textContent='Want to look beyond the careers you already researched?';
 const choices=qa(dec,'.choice');
 if(choices[0]){const m=q(choices[0],'.mode'),hh=q(choices[0],'h3'),p=q(choices[0],'p');if(m)m.textContent='OPEN TO POSSIBILITIES';if(hh)hh.textContent='See What Else My Experience Could Support';if(p)p.textContent='Use this when you want BOOST to surface additional occupations based on your transferable experience. New possibilities are exploration—not a replacement for the careers you already validated.'}
 if(choices[1]){const m=q(choices[1],'.mode'),hh=q(choices[1],'h3'),p=q(choices[1],'p');if(m)m.textContent='EXPLORE A DIFFERENT CAREER';if(hh)hh.textContent='Explore a New Career';if(p)p.textContent='You can explore a new career here. Because it did not go through your Reality Check, BOOST will flag it for jobs, wages, preparation, and life-fit research before Decide.';let warn=q(choices[1],'.boostM3NewCareer');if(!warn){warn=d.createElement('div');warn.className='boostM3NewCareer';warn.innerHTML='<b>New career = new evidence needed.</b><br>Exploring is always okay. BOOST simply will not treat a new career as validated until it has completed the Reality Check.';choices[1].appendChild(warn)}const b=qa(choices[1],'button').find(x=>/CHECK THIS CAREER/i.test(txt(x.textContent)));if(b)b.textContent='CHECK A NEW CAREER'}
 const {choice,input,button}=existingTargetControls(d);if(button&&!button.dataset.boostNewWatch){button.dataset.boostNewWatch='1';button.addEventListener('click',()=>{const title=txt(input?.value);if(!title)return;const s=state(),match=selectedCareers(s).find(o=>o.title.toLowerCase()===title.toLowerCase());if(match)return;s.module3=s.module3||{};s.module3.newExplorations=s.module3.newExplorations||[];if(!s.module3.newExplorations.some(x=>x.title.toLowerCase()===title.toLowerCase()))s.module3.newExplorations.push({title,needsRealityCheck:true,addedAt:new Date().toISOString()});saveState(s);renderEvidence(d,s)},true)}
}
function renderLab(d){
 const skills=skillsPanel(d),dec=findDecision(d);if(!skills||!dec)return;let panel=d.getElementById('boostM3Lab');if(!panel){panel=d.createElement('section');panel.id='boostM3Lab';panel.className='panel boostM3Lab';dec.parentNode.insertBefore(panel,dec)}
 const s=state(),lab=s?.module3?.skillLab;
 panel.innerHTML=`<div class="boostM3LabGrid"><div><div class="step">Optional Evidence Check • Workplace Skills Lab</div><h2>Not sure which strengths you want to use more?</h2><p>Your self-assessment tells BOOST how often you have used these skills. The Pizza Workplace Lab gives you a different kind of evidence: how you respond to realistic situations and whether you actually <b>want more work that feels like that</b>.</p><div class="boostM3LabCall"><b>This is not a test of occupational competence.</b><br>The lab adds evidence about workplace judgment and preference. It helps you notice patterns—it does not decide what career you should choose.</div><div style="margin-top:13px"><button class="boostM3LabBtn" type="button" id="boostM3OpenLab">TRY THE WORKPLACE SKILLS LAB →</button> <button class="boostM3LabBtn alt" type="button" id="boostM3SkipLab">SKIP FOR NOW</button></div><div id="boostM3LabSummary" class="boostM3LabSummary" ${lab?'':'style="display:none"'}></div></div><div><div class="boostM3CareerFacts"><div><span>Input</span><b>Your top O*NET interests</b></div><div><span>Evidence</span><b>Workplace choices</b></div><div><span>Reflection</span><b>Want more / maybe / less</b></div><div><span>Output</span><b>Work preferences + skill signals</b></div></div></div></div>`;
 q(panel,'#boostM3OpenLab')?.addEventListener('click',()=>openLab(d));q(panel,'#boostM3SkipLab')?.addEventListener('click',()=>dec.scrollIntoView({behavior:'smooth',block:'start'}));renderLabSummary(d,s);
}
function ensureModal(d){let m=d.getElementById('boostM3LabModal');if(m)return m;m=d.createElement('div');m.id='boostM3LabModal';m.className='boostM3LabModal';m.innerHTML='<div class="boostM3LabBar"><b>BOOST Workplace Skills Lab • Optional Module 3 Evidence</b><button type="button" class="boostM3LabClose">Close Lab</button></div><iframe id="boostM3LabFrame" class="boostM3LabFrame" title="BOOST workplace skills lab"></iframe>';d.body.appendChild(m);q(m,'.boostM3LabClose').addEventListener('click',()=>m.classList.remove('open'));return m}
function openLab(d){const m=ensureModal(d),f=q(m,'#boostM3LabFrame');m.classList.add('open');if(!f.src){f.addEventListener('load',()=>prepareLab(f));f.src=LAB_URL+'?boost_embed=module3'}else prepareLab(f)}
function prepareLab(f){
 try{
   const d=f.contentDocument,w=f.contentWindow;if(!d?.body)return;const s=state(),codes=topCodes(s);
   ['top1','top2','top3'].forEach((id,i)=>{const el=d.getElementById(id);if(el&&codes[i]){el.value=codes[i];el.dispatchEvent(new Event('change',{bubbles:true}))}});
   if(!d.getElementById('boostM3LabCarry')){const b=d.createElement('div');b.id='boostM3LabCarry';b.style.cssText='padding:10px 14px;background:#e8f4f2;color:#123b48;border-bottom:3px solid #d9a73c;font:800 13px/1.45 Arial,sans-serif';b.innerHTML='<b>Carried from Discover:</b> '+(codes.length?codes.map(c=>c+' — '+NAMES[c]).join(' • '):'Your O*NET interest pattern will remain part of this activity.')+'<br><span style="font-weight:500">The Pizza Lab is optional evidence inside Module 3. Complete it if you want a deeper look at workplace preferences.</span>';d.body.insertBefore(b,d.body.firstChild)}
   if(!d.getElementById('boostM3LabBridge')){const script=d.createElement('script');script.id='boostM3LabBridge';script.textContent=`(function(){let sent=false;function snapshot(){try{const skills=SKILLS.filter(s=>skillEvidence[s]&&skillEvidence[s].count).map(s=>{const e=skillEvidence[s],p=skillPreference[s]||{sum:0,count:0};const ev=e.count?e.sum/e.count:0,pref=p.count?p.sum/p.count:0;return{name:s,evidenceScore:Number(ev.toFixed(2)),evidenceLabel:capFor(s),preferenceScore:Number(pref.toFixed(2)),preferenceLabel:pref>=1.25?'Want more of this':pref>=.6?'Still exploring':'Lower preference'}}).sort((a,b)=>b.preferenceScore-a.preferenceScore||b.evidenceScore-a.evidenceScore);const fam=F.map(code=>{const p=familyPreference[code]||{sum:0,count:0},avg=p.count?p.sum/p.count:0;return{code,label:LABELS[code],preferenceScore:Number(avg.toFixed(2)),preferenceLabel:avg>=1.5?'Generally liked':avg>=.75?'Mixed / more exposure':'Generally preferred less'}});const payload={source:'pizza_workplace_lab',completedAt:new Date().toISOString(),scenarioCount:route.length,topInterests:[document.getElementById('top1')?.value,document.getElementById('top2')?.value,document.getElementById('top3')?.value].filter(Boolean),strengthsToCarry:skills.filter(x=>x.evidenceScore>=2).slice(0,5),workPreferences:skills.slice(0,5),familyPreferences:fam};window.parent.parent.postMessage({type:'${LAB_MESSAGE}',payload},location.origin);sent=true}catch(e){console.warn('BOOST Module 3 lab snapshot unavailable',e)}}const stage=document.getElementById('resultsStage');if(stage){new MutationObserver(()=>{if(stage.classList.contains('active')&&!sent)setTimeout(snapshot,60)}).observe(stage,{attributes:true,attributeFilter:['class']});if(stage.classList.contains('active'))snapshot()}})();`;d.body.appendChild(script)}
 }catch(e){console.warn('BOOST Module 3 lab bridge unavailable',e)}
}
function renderLabSummary(d,s){const box=d.getElementById('boostM3LabSummary'),lab=s?.module3?.skillLab;if(!box)return;if(!lab){box.style.display='none';return}box.style.display='block';const prefs=(lab.workPreferences||[]).slice(0,4);box.innerHTML='<b>Workplace Lab evidence added to Module 3 ✓</b><br>Your strongest preference signals from the lab will be included in your Module 3 evidence summary.'+(prefs.length?`<div class="boostM3Pills">${prefs.map(x=>`<span class="boostM3Pill">${esc(x.name)} • ${esc(x.preferenceLabel)}</span>`).join('')}</div>`:'')}
function renderEvidence(d,s){const box=d.getElementById('boostM3EvidenceOut');if(!box)return;s=s||state();const self=(s?.module3?.selfAssessment||[]).filter(x=>/Used Regularly|Used Sometimes/.test(x.use)).slice(0,5),lab=s?.module3?.skillLab,targets=Object.values(s?.module3?.targets||{}),newOnes=s?.module3?.newExplorations||[];box.innerHTML=`<h3>Evidence building in Module 3</h3><div class="boostM3EvidenceGrid"><div><span>Experience toolkit</span><b>${self.length?self.map(x=>esc(x.skill)).join(', '):'Complete your skill-use self-assessment'}</b></div><div><span>Workplace preference evidence</span><b>${lab?.workPreferences?.length?lab.workPreferences.slice(0,3).map(x=>esc(x.name)).join(', '):'Optional Pizza Lab not completed'}</b></div><div><span>Careers compared</span><b>${targets.length?targets.map(x=>esc(x.title)).join(', '):'Choose a carried career above'}</b></div></div>${newOnes.length?`<div class="boostM3NewCareer"><b>New career exploration:</b> ${newOnes.map(x=>esc(x.title)).join(', ')}. Complete a Reality Check before using a new career in Decide.</div>`:''}`}
function bindMessages(){if(messageBound)return;messageBound=true;window.addEventListener('message',e=>{if(e.origin!==location.origin||e.data?.type!==LAB_MESSAGE)return;const payload=e.data.payload;if(!payload)return;const s=state();s.module3=s.module3||{};s.module3.skillLab=payload;s.module3.workPreferences=payload.workPreferences||[];s.module3.skillEvidence=payload.strengthsToCarry||[];s.module3.updatedAt=new Date().toISOString();saveState(s);try{const d=activeFrame?.contentDocument;renderLabSummary(d,s);renderEvidence(d,s);d?.getElementById('boostM3LabModal')?.classList.remove('open');d?.getElementById('boostM3Lab')?.scrollIntoView({behavior:'smooth',block:'center'})}catch(_){};try{window.PinalBOOSTCloud?.saveNow?.()}catch(_){}})}
function enhance(frame){
 const d=frame?.contentDocument;if(!d?.body)return;activeFrame=frame;css(d);const s=state();ensureSharedScores(d,s);captureSelfAssessment(d);renderLab(d);renderCarry(d);modifyExploreFurther(d);renderEvidence(d,s);
 if(!d.body.dataset.boostM3FunnelBound){d.body.dataset.boostM3FunnelBound='1';d.addEventListener('change',e=>{if(e.target?.matches?.('#skillgrid input[type=radio][name^=sk]'))captureSelfAssessment(d)},true)}
}
function init(frame){activeFrame=frame;bindMessages();const apply=()=>setTimeout(()=>enhance(frame),650);frame?.addEventListener('load',apply);if(frame?.contentDocument?.readyState==='complete')apply()}
window.BOOSTModule3Funnel={init,enhance};
})();