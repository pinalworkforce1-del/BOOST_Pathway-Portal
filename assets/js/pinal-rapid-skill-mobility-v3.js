(()=>{
'use strict';
const CAREER_KEY='pinal_boost_career_exploration_v1';
const STORE_KEY='pinal_boost_rapid_skill_mobility_v2';
const OLD_STORE_KEY='pinal_boost_rapid_skill_mobility_v1';
const SKILLS=[
{id:'customer',label:'Customer communication',words:['customer','client','patient','guest','service','support','resolve','complaint','return']},
{id:'problem',label:'Problem solving / troubleshooting',words:['troubleshoot','problem','resolve','diagnos','issue','solution','repair','correct']},
{id:'detail',label:'Accuracy / quality checking',words:['accuracy','accurate','quality','inspect','verify','check','audit','detail','inventory']},
{id:'document',label:'Documentation / recordkeeping',words:['document','record','report','log','paperwork','data entry','filing','documentation']},
{id:'coordinate',label:'Coordination / scheduling',words:['coordinate','schedule','dispatch','organize','plan','route','appointment','workflow']},
{id:'lead',label:'Leadership / coaching',words:['supervis','lead','train','mentor','coach','managed','manager','team lead']},
{id:'safety',label:'Safety / equipment monitoring',words:['safety','inspect','equipment','machine','vehicle','hazard','ppe','maintenance']},
{id:'digital',label:'Digital systems / technology',words:['software','computer','system','pos','excel','microsoft','database','technology','technical']},
{id:'adapt',label:'Adaptability / working under pressure',words:['fast-paced','deadline','pressure','adapt','changing','multiple priorities','multitask','urgent']},
{id:'numbers',label:'Numbers / transactions / measurement',words:['cash','payment','budget','invoice','measure','calculate','financial','sales','reconcile']},
{id:'hands',label:'Hands-on / material handling',words:['warehouse','stock','material','load','unload','forklift','tools','assemble','construction','install']},
{id:'people',label:'Teamwork / collaboration',words:['team','coworker','collaborat','partner','crew','cross-functional','assist','helped']}
];
const ALIASES={
'cna':['31-1131'],'certified nursing assistant':['31-1131'],'nursing assistant':['31-1131'],
'rn':['29-1141'],'registered nurse':['29-1141'],'lpn':['29-2061'],'lvn':['29-2061'],
'cdl':['53-3032'],'truck driver':['53-3032'],'class a':['53-3032'],
'help desk':['15-1232'],'it support':['15-1232'],'computer support':['15-1232'],
'hvac':['49-9021'],'air conditioning':['49-9021'],'refrigeration':['49-9021'],
'pharmacy tech':['29-2052'],'medical assistant':['31-9092'],'welder':['51-4121'],
'electrician':['47-2111'],'plumber':['47-2152'],'cybersecurity':['15-1212'],'cyber security':['15-1212'],
'forklift':['53-7062'],'warehouse':['53-7062'],'retail manager':['41-1011'],'store manager':['41-1011']
};
const OCC_HINTS={
customer:['43-4051','43-4171','41-2031','41-1011','15-1232','13-1071','31-1131'],
problem:['15-1232','49-9071','49-1011','51-1011','43-5032','31-1131'],
detail:['43-5071','51-9061','43-3031','29-2052','53-3032','31-1131'],
document:['43-3031','43-6014','43-5071','53-3032','13-1071','31-1131'],
coordinate:['43-5032','43-5061','53-1047','11-3071','13-1081'],
lead:['41-1011','43-1011','51-1011','53-1047','11-1021'],
safety:['53-3032','49-9071','51-1011','47-1011','49-1011','31-1131'],
digital:['15-1232','43-4051','43-3031','43-5061','13-1071'],
adapt:['43-4051','41-1011','53-1047','35-1012','11-1021','31-1131'],
numbers:['43-3031','43-4051','41-1011','43-5071','13-1081'],
hands:['53-7062','53-3032','49-9071','47-2061','51-2098','31-1131'],
people:['43-4051','41-1011','43-1011','53-1047','13-1071','31-1131']
};
let occs=[], targets=[], currentOccupation=null;
let occupationSkillIds=new Set(), resumeSkillIds=new Set(), confirmedSkills=new Set(), rejectedSkillIds=new Set();
let selectedResearchSocs=new Set(), compared=false;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const money=n=>Number.isFinite(Number(n))?'$'+Number(n).toFixed(2):'—';
const num=n=>Number.isFinite(Number(n))?Math.round(Number(n)).toLocaleString():'—';
function read(k){try{return JSON.parse(localStorage.getItem(k)||'{}')||{}}catch{return{}}}
function skillLabel(id){return SKILLS.find(s=>s.id===id)?.label||id}
function careerState(){return read(CAREER_KEY)}
function setStatus(id,text,kind=''){const el=$(id);if(!el)return;el.className='status'+(kind?` ${kind}`:'');el.textContent=text||''}
async function loadOccs(){
 try{
  const b64=window.BOOST_DATA_B64||'';
  if(!b64||!('DecompressionStream'in window))throw new Error('Regional career data unavailable');
  const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
  const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  const rows=JSON.parse(await new Response(stream).text());
  occs=rows.map(r=>({soc:String(r[0]),title:r[1],sector:r[2],jobs:r[3],openings:r[4],growth:r[5],p25:r[6],median:r[7],gate:!!r[8],tier:r[9],education:r[10],experience:r[11],ojt:r[12]}));
  return true;
 }catch(e){
  $('careerCards').innerHTML='<div class="empty"><b>Regional occupation evidence could not load.</b><br>Refresh the page before continuing.</div>';
  return false;
 }
}
function loadDiscover(){
 const m=careerState().module1||{}, top=m.topInterests||[];
 $('interestBox').innerHTML=top.length
  ? `<b>Carried from Discover:</b> ${top.map(x=>esc(x.label||x.code)).join(' • ')}<br><small>Interests are a preference signal, not a qualification test.</small>`
  : '<b>No saved Discover interests were found on this device.</b><br><small>You can still use Skill Mobility, but completing Discover first gives the strongest comparison.</small>';
 targets=(m.selected||[]).map(c=>{
  const live=occs.find(o=>o.soc===String(c.soc));
  if(live)return live;
  return {soc:String(c.soc||''),title:c.title||'Saved career',sector:c.sector||'',jobs:c.regional?.jobs26??c.regional?.jobs??null,openings:c.regional?.annualOpenings??null,p25:c.regional?.p25Hourly??null,median:c.regional?.medianHourly??null,tier:c.regional?.tier||'',education:c.preparation?.education||'',experience:c.preparation?.experience||'',ojt:c.preparation?.ojt||''};
 }).filter(x=>x.title).slice(0,3);
 renderDiscoverCards();
}
function renderDiscoverCards(){
 $('careerCards').innerHTML=targets.length?targets.map((o,i)=>`<article class="job"><small>Discover career ${i+1} • SOC ${esc(o.soc)}</small><h3>${esc(o.title)}</h3><div class="badges"><span class="badge green">${esc(o.tier||'Regional evidence')}</span>${o.sector?`<span class="badge">${esc(o.sector)}</span>`:''}</div><div class="metrics"><div class="metric"><small>Regional jobs</small><b>${num(o.jobs)}</b></div><div class="metric"><small>Annual openings</small><b>${num(o.openings)}</b></div><div class="metric"><small>Point-of-entry estimate</small><b>${money(o.p25)}/hr</b></div></div></article>`).join(''):'<div class="empty"><b>No saved Discover careers were found.</b><br>Return to Discover and save at least one career, then come back.</div>';
 updateReadiness();
}
function resolveOccupation(q){
 q=norm(q); if(!q)return null;
 const aliasSocs=new Set();
 Object.entries(ALIASES).forEach(([a,socs])=>{if(a===q||a.includes(q)||q.includes(a))socs.forEach(s=>aliasSocs.add(String(s)))});
 return occs.map(o=>{const t=norm(o.title);let score=aliasSocs.has(o.soc)?120:0;if(t===q)score=Math.max(score,100);else if(t.startsWith(q))score=Math.max(score,80);else if(t.includes(q)||q.includes(t))score=Math.max(score,60);return{o,score}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||Number(b.o.openings)-Number(a.o.openings))[0]?.o||null;
}
function skillsForOccupation(o){
 if(!o)return[]; const ids=new Set(),title=norm(o.title),soc=String(o.soc||'');
 for(const s of SKILLS)if((OCC_HINTS[s.id]||[]).includes(soc))ids.add(s.id);
 if(/cashier|retail|sales|customer service|reception/.test(title))['customer','numbers','people','detail','adapt'].forEach(x=>ids.add(x));
 if(/truck|driver|transport|material mover|warehouse/.test(title))['safety','document','detail','hands','adapt'].forEach(x=>ids.add(x));
 if(/nurs|medical|health|patient/.test(title))['customer','detail','document','problem','people','adapt','safety'].forEach(x=>ids.add(x));
 if(/computer|information technology|support|software/.test(title))['digital','problem','customer','document','detail'].forEach(x=>ids.add(x));
 if(/supervisor|manager/.test(title))['lead','coordinate','people','problem','adapt'].forEach(x=>ids.add(x));
 if(/maintenance|mechanic|repair|electric|construction|production/.test(title))['hands','safety','problem','detail'].forEach(x=>ids.add(x));
 return [...ids];
}
function applySuggestions(){
 const suggested=new Set([...occupationSkillIds,...resumeSkillIds]);
 for(const id of suggested)if(!rejectedSkillIds.has(id))confirmedSkills.add(id);
 renderSkills();
}
function renderSkills(){
 const suggested=new Set([...occupationSkillIds,...resumeSkillIds]);
 $('skillGrid').innerHTML=SKILLS.map(s=>{
  const sources=[];if(occupationSkillIds.has(s.id))sources.push('current occupation');if(resumeSkillIds.has(s.id))sources.push('résumé');
  return `<label class="skill ${suggested.has(s.id)?'suggested':''}"><input class="skillCheck" type="checkbox" data-skill="${s.id}" ${confirmedSkills.has(s.id)?'checked':''}><span>${esc(s.label)}${sources.length?`<small>Suggested from ${esc(sources.join(' + '))} — confirm if accurate.</small>`:''}</span></label>`;
 }).join('');
 document.querySelectorAll('.skillCheck').forEach(el=>el.addEventListener('change',()=>{
  const id=el.dataset.skill;
  if(el.checked){confirmedSkills.add(id);rejectedSkillIds.delete(id)}else{confirmedSkills.delete(id);rejectedSkillIds.add(id)}
  updateSkillEvidenceStatus();updateReadiness();
 }));
 renderLabSkills();updateSkillEvidenceStatus();updateReadiness();
}
function updateSkillEvidenceStatus(){
 const bits=[];if(currentOccupation)bits.push(`Occupation: ${currentOccupation.title}`);if(resumeSkillIds.size)bits.push(`Résumé signals: ${resumeSkillIds.size} skill area${resumeSkillIds.size===1?'':'s'}`);
 setStatus('skillEvidenceStatus',bits.length?bits.join(' • '):'No occupation or résumé evidence has been added yet. You can still confirm skills manually.');
}
function renderLabSkills(){
 $('labSkills').innerHTML=SKILLS.slice(0,10).map(s=>`<label class="skill"><input class="labCheck" type="checkbox" data-skill="${s.id}"><span>${esc(s.label)}</span></label>`).join('');
}
function applyCurrentOccupation(){
 const q=$('currentRole').value.trim();
 for(const id of occupationSkillIds){if(!resumeSkillIds.has(id)&&!rejectedSkillIds.has(id))confirmedSkills.delete(id)}
 if(!q){currentOccupation=null;occupationSkillIds=new Set();setStatus('roleStatus','');applySuggestions();return}
 const o=resolveOccupation(q);
 if(!o){currentOccupation=null;occupationSkillIds=new Set();setStatus('roleStatus','I could not confidently match that occupation. Try a common job title or acronym such as CDL, CNA, cashier, help desk, or warehouse.');applySuggestions();return}
 currentOccupation=o;occupationSkillIds=new Set(skillsForOccupation(o));setStatus('roleStatus',`Matched to ${o.title} • SOC ${o.soc}. Suggested skills appear in Step 3.`);applySuggestions();
}
async function readResumeFile(file){
 if(!file)return'';const name=file.name.toLowerCase();
 if(name.endsWith('.txt')||file.type.startsWith('text/'))return file.text();
 if(name.endsWith('.pdf')){if(!window.pdfjsLib)throw new Error('The PDF reader did not load. Try pasting the résumé text or use DOCX/TXT.');const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;let out='';for(let i=1;i<=pdf.numPages;i++){const p=await pdf.getPage(i),c=await p.getTextContent();out+=' '+c.items.map(x=>x.str).join(' ')}return out}
 if(name.endsWith('.docx')){if(!window.mammoth)throw new Error('The DOCX reader did not load. Try pasting the résumé text or use PDF/TXT.');return(await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()})).value||''}
 throw new Error('Use PDF, DOCX, or TXT. Older .doc files are not supported in this browser test.');
}
function resumeSkills(text){
 const lower=String(text||'').toLowerCase(),ids=new Set(),signals=[];
 for(const s of SKILLS){const hits=s.words.filter(w=>lower.includes(w));if(hits.length){ids.add(s.id);signals.push({id:s.id,hits:hits.slice(0,4)})}}
 return{ids,signals};
}
async function extractResume(){
 try{
  setStatus('resumeStatus','Reading your experience evidence…');
  let text=$('resumeText').value.trim(),file=$('resumeFile').files[0];if(file)text+=' '+await readResumeFile(file);
  if(!text.trim()){setStatus('resumeStatus','Choose a résumé file or paste experience text first.');return}
  if(file&&text.trim().length<40){throw new Error('Very little readable text was found in this file. If it is a scanned/image PDF, paste the résumé text or use a text-based PDF/DOCX.')}
  for(const id of resumeSkillIds){if(!occupationSkillIds.has(id)&&!rejectedSkillIds.has(id))confirmedSkills.delete(id)}
  const r=resumeSkills(text);resumeSkillIds=r.ids;
  $('signals').innerHTML=r.signals.length?r.signals.map(x=>`<div class="signal"><b>${esc(skillLabel(x.id))}</b> — language found: ${x.hits.map(esc).join(', ')}</div>`).join(''):'<div class="signal">No strong keyword signals were found. That does not mean the skills are absent; confirm your experience manually below.</div>';
  setStatus('resumeStatus',`Read ${text.trim().length.toLocaleString()} characters${file?` from ${file.name}`:''} and surfaced ${r.ids.size} possible skill area${r.ids.size===1?'':'s'}.`);
  applySuggestions();
 }catch(e){setStatus('resumeStatus',e.message||'The résumé could not be read. Paste the text instead.')}
}
function comparisonData(o){const need=skillsForOccupation(o),transfer=need.filter(id=>confirmedSkills.has(id)),gaps=need.filter(id=>!confirmedSkills.has(id));return{need,transfer,gaps}}
function renderComparison(o){
 const d=comparisonData(o),added=selectedResearchSocs.has(o.soc);
 return `<article class="job"><small>Carried from Discover • SOC ${esc(o.soc)}</small><h3>${esc(o.title)}</h3><div class="badges"><span class="badge green">${esc(o.tier||'Regional evidence')}</span>${o.sector?`<span class="badge">${esc(o.sector)}</span>`:''}</div><div class="metrics"><div class="metric"><small>Regional jobs</small><b>${num(o.jobs)}</b></div><div class="metric"><small>Annual openings</small><b>${num(o.openings)}</b></div><div class="metric"><small>Point-of-entry estimate</small><b>${money(o.p25)}/hr</b></div></div><div class="why"><b>Transferable evidence:</b> ${d.transfer.length?esc(d.transfer.map(skillLabel).join(', ')):'No overlap confirmed yet.'}<br><b>Typical preparation:</b> ${esc([o.education,o.experience,o.ojt].filter(Boolean).join(' • ')||'Varies by employer')}</div><div class="gapBox"><b>Potential skill-gap evidence:</b> ${d.gaps.length?esc(d.gaps.map(skillLabel).join(', ')):'No broad skill-area gap surfaced from this lightweight comparison.'}<br><small>A gap means BOOST has not found evidence of it yet. Verify it before deciding whether skill-gap closure is needed.</small></div><button class="btn ${added?'green':'ghost'} researchTarget" data-soc="${esc(o.soc)}" ${added?'disabled':''} style="margin-top:10px">${added?'✓ Added to Research':'Use as a target to research'}</button></article>`;
}
function renderComparisons({scroll=false}={}){
 if(!targets.length){$('matches').innerHTML='<div class="empty">No Discover careers are available to compare.</div>';return false}
 if(!confirmedSkills.size){$('matches').innerHTML='<div class="empty">Confirm at least one existing skill in Step 3 before comparing careers.</div>';if(scroll)$('skillsPanel').scrollIntoView({behavior:'smooth',block:'start'});return false}
 compared=true;$('matches').innerHTML=targets.map(renderComparison).join('');bindResearchButtons();$('matchBtn').textContent='✓ Careers Compared';updateReadiness();if(scroll)$('comparePanel').scrollIntoView({behavior:'smooth',block:'start'});return true;
}
function bindResearchButtons(){
 document.querySelectorAll('.researchTarget').forEach(b=>b.addEventListener('click',()=>{
  const o=targets.find(x=>x.soc===b.dataset.soc);if(!o)return;
  selectedResearchSocs.add(o.soc);if(!researchEntries().some(r=>r.soc===o.soc))addResearchRow({soc:o.soc,title:o.title});
  b.textContent='✓ Added to Research';b.classList.remove('ghost');b.classList.add('green');b.disabled=true;
  updateResearchGuide();updateReadiness();$('researchPanel').scrollIntoView({behavior:'smooth',block:'start'});
 }))
}
function addResearchRow(data={}){
 const d=document.createElement('div');d.className='researchEntry';d.dataset.soc=data.soc||'';
 d.innerHTML=`<input class="rTitle" placeholder="Employer / job title" value="${esc(data.title||'')}"><input class="rPay" placeholder="$ / hr" value="${esc(data.pay||'')}"><input class="rReq" placeholder="Requirements / skills" value="${esc(data.req||'')}"><input class="rSource" placeholder="Link or source" value="${esc(data.source||'')}">`;
 $('researchRows').appendChild(d);d.addEventListener('input',()=>{updateResearchGuide();updateReadiness()});d.addEventListener('change',()=>{updateResearchGuide();updateReadiness()});
}
function researchEntries(){return[...document.querySelectorAll('#researchRows .researchEntry')].map(r=>({soc:r.dataset.soc||'',title:r.querySelector('.rTitle')?.value.trim()||'',pay:r.querySelector('.rPay')?.value.trim()||'',req:r.querySelector('.rReq')?.value.trim()||'',source:r.querySelector('.rSource')?.value.trim()||''})).filter(x=>x.title||x.pay||x.req||x.source)}
function validResearch(){return researchEntries().filter(x=>x.title&&x.pay&&x.req&&x.source)}
function updateResearchGuide(){
 const posts=validResearch(),guide=$('researchGuide');
 if(posts.length){guide.className='notice';guide.innerHTML=`<b>✓ Employer evidence recorded.</b> ${posts.length} complete posting${posts.length===1?'':'s'} added. <button type="button" class="btn green" id="continueSnapshot" style="margin-left:10px">Continue to Mobility Snapshot ↓</button>`;$('continueSnapshot').onclick=()=>$('planPanel').scrollIntoView({behavior:'smooth',block:'start'});return}
 const selected=targets.filter(o=>selectedResearchSocs.has(o.soc));guide.className='notice warning';guide.innerHTML=selected.length?`<b>Next:</b> Complete all four fields for at least one real posting for <b>${esc(selected.map(x=>x.title).join(' or '))}</b>.`:'<b>Next:</b> compare your careers, then choose <b>Use as a target to research</b> — or enter a real posting below.';
}
function readiness(){
 return[
  {ok:targets.length>0,text:'Discover careers are loaded.',fix:'Return to Discover and save at least one career.'},
  {ok:confirmedSkills.size>0,text:'At least one existing transferable skill is confirmed.',fix:'In Step 3, confirm at least one skill from your occupation, résumé, or experience.'},
  {ok:compared,text:'Your Discover careers have been compared.',fix:'In Step 3, choose Compare My Three Careers.'},
  {ok:validResearch().length>0,text:'At least one complete employer posting is recorded.',fix:'In Step 5, complete employer/job title, base pay, requirements/skills, and source for one posting.'}
 ];
}
function updateReadiness(){
 const items=readiness(),missing=items.filter(x=>!x.ok),ready=!missing.length;
 $('snapshotChecklist').innerHTML=ready?'<div class="checkItem">✓ All required evidence is complete.</div>':missing.map(x=>`<div class="checkItem"><b>○ ${esc(x.text)}</b><br><span style="margin-left:20px">${esc(x.fix)}</span></div>`).join('');
 $('snapshotReadiness').className='notice '+(ready?'':'warning');$('snapshotReadiness').querySelector('b').textContent=ready?'✓ Mobility Snapshot ready.':`Mobility Snapshot locked — ${missing.length} required item${missing.length===1?' is':'s are'} still missing:`;$('saveBtn').disabled=!ready;
}
function labSkillIds(){return[...document.querySelectorAll('.labCheck:checked')].map(x=>x.dataset.skill)}
function reportData(){
 const top=careerState().module1?.topInterests||[],posts=validResearch();
 return{version:3,region:'Pinal',updatedAt:new Date().toISOString(),interests:top.map(x=>x.label||x.code),currentOccupation:currentOccupation?{soc:currentOccupation.soc,title:currentOccupation.title}:null,currentWage:Number($('currentWage').value)||null,minimumWage:Number($('minimumWage').value)||null,confirmedSkills:[...confirmedSkills].map(id=>({id,label:skillLabel(id)})),resumeSignals:[...resumeSkillIds].map(id=>({id,label:skillLabel(id)})),comparedCareers:targets.map(o=>{const d=comparisonData(o);return{soc:o.soc,title:o.title,sector:o.sector||'',regional:{jobs:o.jobs,annualOpenings:o.openings,p25Hourly:o.p25,medianHourly:o.median,tier:o.tier},transferableSkills:d.transfer.map(skillLabel),potentialGaps:d.gaps.map(skillLabel),preparation:[o.education,o.experience,o.ojt].filter(Boolean)}}),research:posts,skillLab:{completed:$('labComplete').checked,reinforcedSkills:labSkillIds().map(id=>({id,label:skillLabel(id)}))}};
}
function generateSnapshot(){
 const missing=readiness().filter(x=>!x.ok);if(missing.length){updateReadiness();$('snapshotReadiness').scrollIntoView({behavior:'smooth',block:'center'});return}
 const d=reportData();localStorage.setItem(STORE_KEY,JSON.stringify(d));renderSnapshot(d);setStatus('saveStatus','✓ Mobility Snapshot generated and saved locally for this standalone test.');$('snapshot').scrollIntoView({behavior:'smooth',block:'start'});
}
function renderSnapshot(d){
 const careerHtml=(d.comparedCareers||[]).map(c=>`<div class="snapBlock"><h3>${esc(c.title)}</h3><b>${esc(c.regional.tier||'Regional evidence')}</b><br>${num(c.regional.jobs)} regional jobs • ${num(c.regional.annualOpenings)} annual openings • ${money(c.regional.p25Hourly)}/hr point-of-entry<br><br><b>Transfers:</b> ${esc(c.transferableSkills.join(', ')||'No overlap confirmed yet.')}<br><b>Potential gaps:</b> ${esc(c.potentialGaps.join(', ')||'No broad skill-area gap surfaced.')}<br><b>Preparation to verify:</b> ${esc(c.preparation.join(' • ')||'Varies by employer')}</div>`).join('');
 const researchHtml=(d.research||[]).map(p=>`<div><b>${esc(p.title)}</b> • Pay: ${esc(p.pay)} • ${esc(p.req)} • ${esc(p.source)}</div>`).join('');
 $('snapshot').innerHTML=`<div class="snapBlock"><h3>Your starting evidence</h3><b>${esc(d.currentOccupation?.title||'Experience profile')}</b><br>Interests: ${esc((d.interests||[]).join(' • ')||'Not available')}<br>Current/most recent wage: ${d.currentWage?money(d.currentWage)+'/hr':'Not entered'}<br>Minimum considered: ${d.minimumWage?money(d.minimumWage)+'/hr':'Not entered'}</div><div class="snapBlock"><h3>Confirmed transferable skills</h3>${(d.confirmedSkills||[]).map(x=>'• '+esc(x.label)).join('<br>')||'No skills confirmed.'}</div>${careerHtml}<div class="snapBlock"><h3>Employer reality check</h3>${researchHtml||'No complete postings recorded.'}</div><div class="snapBlock"><h3>What to do with this evidence</h3>Use the strongest immediate-fit careers for résumé targeting, Interview Coach, employer outreach, or Career Coach discussion. If a career is viable but meaningful gaps remain, explore the lightest appropriate skill-gap closure option before assuming a full training pathway is needed.<br><br>Pizza Lab: ${d.skillLab?.completed?'Optional reflection added':'Not used — optional'}</div>`;
}
function restore(){
 const d=read(STORE_KEY).version?read(STORE_KEY):read(OLD_STORE_KEY);if(!d||!Object.keys(d).length)return;
 if(d.currentOccupation?.title){$('currentRole').value=d.currentOccupation.title;currentOccupation=occs.find(o=>o.soc===String(d.currentOccupation.soc))||d.currentOccupation;occupationSkillIds=new Set(skillsForOccupation(currentOccupation))}
 if(d.currentWage)$('currentWage').value=d.currentWage;if(d.minimumWage)$('minimumWage').value=d.minimumWage;
 confirmedSkills=new Set((d.confirmedSkills||[]).map(x=>x.id));resumeSkillIds=new Set((d.resumeSignals||[]).map(x=>x.id));
 $('researchRows').innerHTML='';(d.research||[]).forEach(r=>{if(r.soc)selectedResearchSocs.add(String(r.soc));addResearchRow(r)});if(!(d.research||[]).length)addResearchRow();
 if(d.skillLab?.completed)$('labComplete').checked=true;renderSkills();
 if(d.version>=2&&d.comparedCareers?.length){compared=true;renderComparisons({scroll:false});renderSnapshot(d)}
 updateResearchGuide();updateReadiness();
}
async function init(){
 renderSkills();addResearchRow();const ok=await loadOccs();if(!ok){updateReadiness();return}
 loadDiscover();restore();
 let timer;$('currentRole').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(applyCurrentOccupation,350)});$('currentRole').addEventListener('change',applyCurrentOccupation);
 $('extractBtn').onclick=extractResume;$('skipResume').onclick=()=>{setStatus('resumeStatus','Continuing without résumé evidence. Use your occupation suggestions or confirm skills manually.');$('skillsPanel').scrollIntoView({behavior:'smooth',block:'start'})};
 $('matchBtn').onclick=()=>renderComparisons({scroll:true});$('addResearch').onclick=()=>{addResearchRow();updateResearchGuide();updateReadiness()};$('saveBtn').onclick=generateSnapshot;$('printBtn').onclick=()=>window.print();
 updateResearchGuide();updateReadiness();
 window.__RAPID_SKILL_MOBILITY_DEBUG=()=>({targets:targets.map(x=>x.title),currentOccupation:currentOccupation?.title||null,confirmedSkills:[...confirmedSkills],compared,validResearch:validResearch(),readiness:readiness()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();