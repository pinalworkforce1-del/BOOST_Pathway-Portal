(()=>{'use strict';
const STORE='pinal_boost_rapid_skill_mobility_v1',CAREER='pinal_boost_career_exploration_v1',RAPID='pinal_boost_rapid_discover_v1';
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
const OCC_HINTS={
customer:['43-4051','43-4171','41-2031','41-1011','15-1232','13-1071'],problem:['15-1232','49-9071','49-1011','51-1011','43-5032'],detail:['43-5071','51-9061','43-3031','29-2052','53-3032'],document:['43-3031','43-6014','43-5071','53-3032','13-1071'],coordinate:['43-5032','43-5061','53-1047','11-3071','13-1081'],lead:['41-1011','43-1011','51-1011','53-1047','11-1021'],safety:['53-3032','49-9071','51-1011','47-1011','49-1011'],digital:['15-1232','43-4051','43-3031','43-5061','13-1071'],adapt:['43-4051','41-1011','53-1047','35-1012','11-1021'],numbers:['43-3031','43-4051','41-1011','43-5071','13-1081'],hands:['53-7062','53-3032','49-9071','47-2061','51-2098'],people:['43-4051','41-1011','43-1011','53-1047','13-1071']};
let occs=[],detected=new Set(),chosenTarget=null;
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])),money=n=>Number.isFinite(Number(n))?'$'+Number(n).toFixed(2):'—',num=n=>Number.isFinite(Number(n))?Math.round(Number(n)).toLocaleString():'—';
function read(k){try{return JSON.parse(localStorage.getItem(k)||'{}')||{}}catch{return{}}}
function checked(){return SKILLS.filter(s=>$('skill_'+s.id)?.checked).map(s=>s.id)}
function skillLabel(id){return SKILLS.find(s=>s.id===id)?.label||id}
function renderSkills(){ $('skillGrid').innerHTML=SKILLS.map(s=>'<label class="skill '+(detected.has(s.id)?'detected':'')+'"><input id="skill_'+s.id+'" type="checkbox" '+(detected.has(s.id)?'checked':'')+'><span>'+esc(s.label)+(detected.has(s.id)?'<br><small>Found in your experience text — confirm if accurate.</small>':'')+'</span></label>').join(''); $('labSkills').innerHTML=SKILLS.slice(0,10).map(s=>'<label class="skill"><input id="lab_'+s.id+'" type="checkbox"><span>'+esc(s.label)+'</span></label>').join('')}
function interests(){
 const rapid=read(RAPID),scores=rapid?.onetScores||{},labels=Object.entries(scores).filter(([k])=>['R','I','A','S','E','C'].includes(k)).sort((a,b)=>Number(b[1])-Number(a[1])).slice(0,3).map(([k])=>({R:'Realistic',I:'Investigative',A:'Artistic',S:'Social',E:'Enterprising',C:'Conventional'}[k]));
 $('interestBox').innerHTML=labels.length?'<b>Carried from Rapid Discover:</b> '+labels.map(esc).join(' • ')+'<br><small>These are interest preferences, not proof of skills or eligibility.</small>':'<b>No saved Rapid Discover O*NET scores found on this device.</b><br><small>Return to Rapid Discover to confirm your results. Skill Mobility will not silently use Career Exploration selections instead.</small>';
}
async function loadOccs(){try{const b64=window.BOOST_DATA_B64||'';if(!b64||!('DecompressionStream'in window))throw 0;const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));const rows=JSON.parse(await new Response(stream).text());occs=rows.map(r=>({soc:r[0],title:r[1],sector:r[2],jobs:r[3],openings:r[4],growth:r[5],p25:r[6],median:r[7],gate:!!r[8],tier:r[9],education:r[10],experience:r[11],ojt:r[12],ria:r[16]==null?null:{R:r[16],I:r[17],A:r[18],S:r[19],E:r[20],C:r[21]}}));window.BOOST_RAPID_OCCUPATIONS=occs;window.BOOST_RAPID_INFER_SKILLS=(o)=>inferSkillsFromOccupation(o);window.BOOST_RAPID_SKILL_LABELS=Object.fromEntries(SKILLS.map(s=>[s.id,s.label]));window.dispatchEvent(new CustomEvent('boost-rapid-occupations-ready',{detail:{count:occs.length}}));$('skillStatus').textContent='Pinal regional occupation evidence loaded: '+occs.length+' occupations.'}catch(e){$('skillStatus').textContent='Regional occupation evidence could not load. Refresh before using job matches.'}}
async function fileText(file){if(!file)return'';const name=file.name.toLowerCase();if(name.endsWith('.txt')||file.type.startsWith('text/'))return file.text();if(name.endsWith('.pdf')&&window.pdfjsLib){const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;let out='';for(let i=1;i<=pdf.numPages;i++){const p=await pdf.getPage(i),c=await p.getTextContent();out+=' '+c.items.map(x=>x.str).join(' ')}return out}if(name.endsWith('.docx')&&window.mammoth){const r=await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});return r.value||''}throw new Error('That file type could not be read in this browser. Paste the résumé text instead.')}
function extract(text){const prior=new Set(detected);detected=new Set(prior);const lower=text.toLowerCase();const signals=[];for(const s of SKILLS){const hits=s.words.filter(w=>lower.includes(w));if(hits.length){detected.add(s.id);signals.push('<div class="signal"><b>'+esc(s.label)+'</b> — language found: '+hits.slice(0,4).map(esc).join(', ')+'</div>')}}renderSkills();$('signals').innerHTML=signals.length?signals.join(''):'<div class="signal">No strong keyword signals were found. That does not mean you lack transferable skills — choose the skills you recognize below.</div>';return detected.size}
function norm(s){return String(s||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\\s+/g,' ').trim()}
function findStartingOccupation(q){q=norm(q);if(!q||q.length<2)return null;const aliases={cashier:['cashier'],cdl:['heavy and tractor trailer truck drivers','truck drivers'],truck:['heavy and tractor trailer truck drivers'],nurse:['registered nurses','licensed practical'],nursing:['registered nurses','licensed practical'],retail:['retail salespersons'],warehouse:['laborers and freight stock and material movers'],customer:['customer service representatives'],it:['computer user support specialists']};let terms=(aliases[q]&&aliases[q].length)?aliases[q]:[q];let ranked=occs.map(o=>{let t=norm(o.title),s=0;for(const x of terms){if(t===x)s=Math.max(s,100);else if(t.startsWith(x))s=Math.max(s,80);else if(t.includes(x))s=Math.max(s,60);else if(x.includes(t)&&t.length>4)s=Math.max(s,40)}return{o,s}}).filter(x=>x.s).sort((a,b)=>b.s-a.s);return ranked[0]?.o||null}
function inferSkillsFromOccupation(o){if(!o)return[];const ids=new Set();const soc=String(o.soc||'');const title=norm(o.title);
for(const s of SKILLS)if((OCC_HINTS[s.id]||[]).includes(soc))ids.add(s.id);
if(/cashier|retail|sales|customer service|reception/.test(title)){ids.add('customer');ids.add('numbers');ids.add('people');ids.add('detail');ids.add('adapt')}
if(/truck|driver|transport|material mover|warehouse/.test(title)){ids.add('safety');ids.add('document');ids.add('detail');ids.add('hands');ids.add('adapt')}
if(/nurs|medical|health|patient/.test(title)){ids.add('customer');ids.add('detail');ids.add('document');ids.add('problem');ids.add('people');ids.add('adapt')}
if(/computer|information technology|support|software/.test(title)){ids.add('digital');ids.add('problem');ids.add('customer');ids.add('document');ids.add('detail')}
if(/supervisor|manager/.test(title)){ids.add('lead');ids.add('coordinate');ids.add('people');ids.add('problem');ids.add('adapt')}
if(/maintenance|mechanic|repair|electric|construction|production/.test(title)){ids.add('hands');ids.add('safety');ids.add('problem');ids.add('detail')}
return [...ids]}
function applyStartingOccupation(){const q=$('currentRole').value.trim(),o=findStartingOccupation(q);if(!o){$('skillStatus').textContent='I could not confidently match that job title yet. Try a common title such as Cashier, CDL, Truck Driver, Registered Nurse, Warehouse Worker, or IT Support.';return;}const ids=inferSkillsFromOccupation(o);detected=new Set(ids);renderSkills();ids.forEach(id=>{const e=$('skill_'+id);if(e)e.checked=true});$('skillStatus').innerHTML='<b>Starting occupation matched:</b> '+esc(o.title)+'. BOOST prefilled likely transferable skill areas from the occupation. Confirm or change them before matching.';if(ids.length){ $('skillStatus').innerHTML+='<br><small>Review the suggested skills below, then choose Show Jobs when you are ready.</small>'; }}

function collectExploredCareers(){
 const roots=[read(CAREER),read('pinal_boost_journey_v1')], found=[];
 const titleKeys=['title','occupationTitle','careerTitle','name'], socKeys=['soc','socCode','code'];
 function walk(v,path='',depth=0){if(depth>7||v==null)return;if(Array.isArray(v)){v.forEach((x,i)=>walk(x,path+'['+i+']',depth+1));return}if(typeof v!=='object')return;
  const low=path.toLowerCase(), looksCareer=/module1|discover|career|explor|occupation|selected|saved|target/.test(low);
  let title=titleKeys.map(k=>v[k]).find(x=>typeof x==='string'&&x.length>2),soc=socKeys.map(k=>v[k]).find(x=>typeof x==='string'&&/^\\d{2}-?\\d{4}/.test(x));
  if(looksCareer&&(title||soc)){let o=soc?occs.find(x=>String(x.soc)===String(soc)):null;if(!o&&title){const q=norm(title);o=occs.find(x=>norm(x.title)===q)||occs.find(x=>norm(x.title).includes(q)||q.includes(norm(x.title)))}if(o&&!found.some(x=>String(x.soc)===String(o.soc)))found.push(o)}
  Object.entries(v).forEach(([k,x])=>walk(x,path+'.'+k,depth+1));
 }
 roots.forEach(r=>walk(r,'root',0));return found.slice(0,3)
}
function occupationSkillIds(o){return inferSkillsFromOccupation(o)}
function renderDiscoverCareers(){
 const rapid=read(RAPID),isRapid=rapid?.direction==='pivot'||rapid?.direction==='return';
 if(isRapid){
   window.__rapidDiscoverCareers=[];
   const role=rapid.priorOccupation||rapid.role||'Occupation not recorded';
   const soc=rapid.occupationSoc||rapid.occupation?.soc||'';
   const previous=occs.find(o=>String(o.soc)===String(soc))||occs.find(o=>norm(o.title)===norm(role));
   $('careerCards').innerHTML='<article class="job"><small>Rapid Discover · Previous occupation</small><h3>'+esc(role)+'</h3><div class="why"><b>Your employment direction:</b> '+(rapid.direction==='pivot'?'Explore other occupations':'Return to prior occupation')+'<br><b>What carries forward:</b> your confirmed duties, work preferences, O*NET interest scores and most recent wage.<br><b>Next:</b> rate your demonstrated transferable skills before new occupations are surfaced. No earlier Career Exploration shortlist is reused.</div>'+(previous?'<div class="metrics"><div class="metric"><small>Regional jobs</small><b>'+num(previous.jobs)+'</b></div><div class="metric"><small>Annual openings</small><b>'+num(previous.openings)+'</b></div><div class="metric"><small>Entry wage estimate</small><b>'+money(previous.p25)+'/hr</b></div></div>':'')+'</article>';
   if(rapid.priorWage&&!$('currentWage').value)$('currentWage').value=rapid.priorWage;
   $('skillStatus').textContent='Rapid Discover is the source of your starting profile. Skills must be rated and confirmed before occupation matching.';
   return;
 }
 window.__rapidDiscoverCareers=[];
 $('careerCards').innerHTML='<div class="empty"><b>Rapid Discover has not yet been saved on this device.</b><br>Open Rapid Discover from the BOOST Rapid Reemployment map and choose Pivot to carry the correct profile into Skill Mobility. Existing Career Exploration selections are not substituted.</div>';
}
function gapFor(o,ids){
 const need=occupationSkillIds(o),missing=need.filter(id=>!ids.includes(id)).map(skillLabel);
 const prep=[o.education,o.ojt].filter(Boolean);
 return {missing,prep}
}
const RIA_LABELS={R:'Realistic',I:'Investigative',A:'Artistic',S:'Social',E:'Enterprising',C:'Conventional'};
function topInterestProfile(values){
 if(!values||typeof values!=='object')return [];
 return Object.keys(RIA_LABELS).filter(k=>Number.isFinite(Number(values[k]))&&Number(values[k])>0).sort((a,b)=>Number(values[b])-Number(values[a])).slice(0,3);
}
function interestFit(user,occupation){
 const career=topInterestProfile(occupation?.ria),person=topInterestProfile(user);
 if(!career.length||!person.length)return {career,person,shared:[],level:'Not established'};
 const shared=person.filter(k=>career.includes(k));
 // Ordinal overlap of the top three interest types, not a psychometric fit percentage.
 const weighted=shared.reduce((sum,k)=>sum+(4-person.indexOf(k))*(4-career.indexOf(k)),0);
 const level=weighted>=12?'Strong overlap':weighted>=6?'Some overlap':'Limited overlap';
 return {career,person,shared,level};
}
function preferenceFit(prefs,o){
 if(!prefs.length)return {matched:[],level:'Not assessed'};
 const matched=prefs.filter(id=>(OCC_HINTS[id]||[]).includes(o.soc));
 // This is a narrow BOOST occupation crosswalk, not an official O*NET work-context rating.
 const level=matched.length>=2?'Multiple preference signals':matched.length===1?'One preference signal':'Not yet mapped';
 return {matched,level};
}
function compareDiscoverCareers(){
 if(read(RAPID)?.direction==='pivot'&&!window.BOOST_RAPID_SKILLS_ASSESSED?.()){$('matches').innerHTML='<div class="empty">Complete and confirm the transferable-skills questions first. Only demonstrated skills can be used for occupational matching.</div>';$('rapidSkillsAssessment')?.scrollIntoView({behavior:'smooth',block:'start'});return;}
 const ids=checked(),arr=window.__rapidDiscoverCareers||[],prefs=[...document.querySelectorAll('.rapidPref:checked')].map(x=>x.value);
 const btn=$('matchBtn');if(btn){btn.textContent='Comparing…';btn.disabled=true}
 if(!ids.length){$('matches').innerHTML='<div class="empty">First confirm the transferable skills you use at work.</div>';if(btn){btn.textContent='Explore occupations that match my skills';btn.disabled=false}return}
 const rapid=read(RAPID),scores=rapid?.onetScores||{};
 const ranked=occs.map(o=>{
  const matched=ids.filter(id=>(OCC_HINTS[id]||[]).includes(o.soc));
  const fit=interestFit(scores,o.ria?o:null),preferences=preferenceFit(prefs,o);
  const interestPoints=fit.shared.reduce((sum,k)=>sum+(4-fit.person.indexOf(k))*(4-fit.career.indexOf(k)),0);
  const score=matched.length*4+preferences.matched.length*2+interestPoints*.35+(o.gate?1:0)+(Number(o.openings)>0?.5:0);
  return {o,score,reasons:matched.map(skillLabel),fit,preferences};
 }).filter(x=>x.reasons.length&&x.o.gate).sort((a,b)=>b.score-a.score||Number(b.o.openings)-Number(a.o.openings)).slice(0,12);
 const existing=new Set(ranked.map(x=>x.o.soc));
 for(const o of arr)if(!existing.has(o.soc))ranked.push({o,score:0,reasons:ids.filter(id=>(OCC_HINTS[id]||[]).includes(o.soc)).map(skillLabel),fit:interestFit(scores,o),preferences:preferenceFit(prefs,o)});
 $('matches').innerHTML=ranked.length?ranked.map(x=>{
 let card=renderJob(x.o,x.reasons,'Transferable skills + occupation evidence');
 const g=gapFor(x.o,ids);
 const occupationProfile=x.fit.career.length?x.fit.career.map(k=>RIA_LABELS[k]+' ('+k+')').join(' · '):'O*NET occupation interest profile unavailable';
 const interestText=x.fit.shared.length?x.fit.shared.map(k=>RIA_LABELS[k]).join(', '):'No shared leading interest types';
 const workText=x.preferences.matched.length?x.preferences.matched.map(id=>({hands:'Hands-on / equipment',people:'Working with people',problem:'Problem solving',detail:'Detail-focused work',lead:'Leadership / coordinating',digital:'Technology'}[id]||id)).join(', '):'No supported occupation-specific work-preference crosswalk found';
 const why='<div class="notice" style="margin-top:10px"><b>Transferable skill evidence:</b> '+esc(x.reasons.length?x.reasons.join(', '):'Review actual duties with your coach')+'<br><b>Potential skill evidence to investigate:</b> '+esc(g.missing.length?g.missing.join(', '):'No additional signal surfaced in this quick comparison')+'<br><b>This occupation’s O*NET interest profile:</b> '+esc(occupationProfile)+'<br><b>Interest match strength:</b> '+esc(x.fit.level)+(x.fit.career.length?' — '+esc(interestText):'')+'<br><b>Work preference match:</b> '+esc(x.preferences.level)+' — '+esc(workText)+'<br><small>Interest match is based on leading RIASEC types, not a qualification score. Work-preference signals use a limited BOOST occupation crosswalk, not validated O*NET work-context ratings. “Not yet mapped” does not mean poor fit. Confirm requirements, wages, openings, location, and scheduling with employers.</small></div>';
 return card.replace('</article>',why+'</article>');
 }).join(''):'<div class="empty">No automatic suggestions were identified from the selected skills. Add more experience evidence, revisit the skills, or work with your coach to search other occupations.</div>';
 bindTargets($('matches'));if(btn){btn.textContent='Update occupational matches';btn.disabled=false}updateReadiness();$('matches').scrollIntoView({behavior:'smooth',block:'start'});
}
function scoreOcc(o,ids){let score=0,reasons=[];ids.forEach(id=>{if((OCC_HINTS[id]||[]).includes(o.soc)){score+=3;reasons.push(skillLabel(id))}});if(o.gate)score+=1.2;if(Number(o.openings)>500)score+=.5;if(Number(o.jobs)>5000)score+=.3;return{score,reasons:[...new Set(reasons)]}}
function renderJob(o,reasons,origin='BOOST surfaced'){const wage=Number($('currentWage').value),delta=Number.isFinite(wage)&&wage>0&&Number.isFinite(Number(o.p25))?Number(o.p25)-wage:null;return '<article class="job"><small>'+esc(origin)+' • SOC '+esc(o.soc)+'</small><h3>'+esc(o.title)+'</h3><div class="badges"><span class="badge green">'+esc(o.tier||'Regional evidence')+'</span><span class="badge">'+esc(o.sector||'Career')+'</span></div><div class="metrics"><div class="metric"><small>Regional jobs</small><b>'+num(o.jobs)+'</b></div><div class="metric"><small>Annual openings</small><b>'+num(o.openings)+'</b></div><div class="metric"><small>Point-of-entry estimate</small><b>'+money(o.p25)+'/hr</b></div></div><div class="why"><b>Why this surfaced:</b> '+(reasons.length?'Your confirmed experience overlaps with '+esc(reasons.slice(0,4).join(', '))+'.':'You chose this occupation directly.')+(delta==null?'':' Its point-of-entry estimate is '+(delta>=0?money(delta)+' above':money(Math.abs(delta))+' below')+' your current/most recent wage.')+'<br><b>Typical preparation:</b> '+esc([o.education,o.ojt].filter(Boolean).join(' • ')||'Varies by employer')+'</div><button type="button" class="btn rapidConsider" data-soc="'+esc(o.soc)+'" data-title="'+esc(o.title)+'" style="margin-top:10px">+ Add to My Career Considerations</button></article>'}
const RESEARCH_DRAFT='pinal_boost_rapid_research_by_occupation_v1';
function getSelections(){const x=read('pinal_boost_rapid_skill_mobility_decision_v2');return Array.isArray(x.considerations)?x.considerations.slice(0,3):[]}
function researchDraft(){return read(RESEARCH_DRAFT)}
function captureResearch(){
 const d={...researchDraft()};
 for(const group of document.querySelectorAll('.researchGroup')){
  d[group.dataset.soc]=[...group.querySelectorAll('.researchRow')].map(row=>({title:row.querySelector('.rTitle').value,pay:row.querySelector('.rPay').value,req:row.querySelector('.rReq').value,source:row.querySelector('.rSource').value}))
 }
 localStorage.setItem(RESEARCH_DRAFT,JSON.stringify(d));
}
function newResearchGroup(x,prior=[]){
 const group=document.createElement('section');group.className='researchGroup';group.dataset.soc=x.soc;group.style.cssText='padding:16px;margin:14px 0;border:1px solid #c0d4e1;border-radius:14px;background:#f6fafc';
 const heading=document.createElement('h3');heading.textContent=x.title;heading.className='researchGroupHeading';heading.style.margin='0 0 8px';
 const rows=document.createElement('div');rows.className='researchGroupRows';
 const add=document.createElement('button');add.type='button';add.className='btn ghost';add.textContent='+ Add Another Posting';
 add.onclick=()=>{addResearch({},rows);captureResearch();updateReadiness()};
 group.append(heading,rows,add);
 $('researchRows').append(group);
 (prior.length?prior:[{}]).forEach(d=>addResearch(d,rows));
}
function syncResearchGroups(){
 const root=$('researchRows'),selection=getSelections();
 if(!root)return;
 captureResearch();const draft=researchDraft();
 for(const empty of root.querySelectorAll(':scope > .notice'))empty.remove();
 for(const group of [...root.querySelectorAll('.researchGroup')])if(!selection.some(x=>String(x.soc)===group.dataset.soc))group.remove();
 for(const x of selection)if(![...root.querySelectorAll('.researchGroup')].some(g=>g.dataset.soc===String(x.soc)))newResearchGroup(x,draft[x.soc]||[]);
 [...root.querySelectorAll('.researchGroup')].sort((a,b)=>selection.findIndex(x=>String(x.soc)===a.dataset.soc)-selection.findIndex(x=>String(x.soc)===b.dataset.soc)).forEach((g,i)=>{root.append(g);const x=selection.find(x=>String(x.soc)===g.dataset.soc);g.querySelector('h3').textContent='Option '+(i+1)+' · '+(x?.title||'Occupation')});
 if(selection.length){const x=selection[0];chosenTarget=occs.find(o=>String(o.soc)===String(x.soc))||{soc:x.soc,title:x.title}}
 else chosenTarget=null;
 updateReadiness();
}
window.BOOST_RAPID_SYNC_RESEARCH=syncResearchGroups;
window.BOOST_RAPID_ADD_RESEARCH_OCCUPATION=syncResearchGroups;
window.BOOST_RAPID_REMOVE_RESEARCH_OCCUPATION=syncResearchGroups;
function bindTargets(root=document){root.querySelectorAll('.chooseTarget').forEach(b=>{b.onclick=()=>{const o=occs.find(x=>String(x.soc)===String(b.dataset.soc))||null;if(!o){b.textContent='Could not add — refresh';return;}chosenTarget=o;const existing=[...document.querySelectorAll('.researchRow')].some(r=>norm(r.querySelector('.rTitle')?.value||'')===norm(o.title));if(!existing)addResearch({title:o.title});b.textContent='✓ Added to Research';b.classList.remove('ghost');b.classList.add('green');b.setAttribute('aria-pressed','true');b.disabled=true;updateReadiness();const p=$('researchPanel');if(p)p.scrollIntoView({behavior:'smooth',block:'start'});};});}
function match(){const ids=checked();if(!ids.length){$('skillStatus').textContent='Choose at least one skill first.';return}const ranked=occs.map(o=>({o,...scoreOcc(o,ids)})).filter(x=>x.score>0&&x.o.gate).sort((a,b)=>b.score-a.score||Number(b.o.openings)-Number(a.o.openings)).slice(0,6);$('matches').innerHTML=ranked.length?ranked.map(x=>renderJob(x.o,x.reasons)).join(''):'<div class="empty">No strong automatic matches were found. Use the occupation search below to explore directly.</div>';bindTargets($('matches'));$('matches').scrollIntoView({behavior:'smooth',block:'start'})}
function search(){const q=$('jobSearch').value.trim().toLowerCase();const box=$('searchResults');if(!q){box.innerHTML='';return}const arr=occs.filter(o=>o.title.toLowerCase().includes(q)||o.soc.includes(q)).sort((a,b)=>Number(b.openings)-Number(a.openings)).slice(0,12);box.innerHTML=arr.map(o=>'<button class="searchPick" data-soc="'+esc(o.soc)+'"><b>'+esc(o.title)+'</b><br><small>'+esc(o.soc)+' • '+esc(o.tier||'Regional evidence')+' • '+num(o.openings)+' annual openings</small></button>').join('');box.querySelectorAll('button').forEach(b=>b.onclick=()=>{chosenTarget=occs.find(o=>o.soc===b.dataset.soc);box.innerHTML='';$('jobSearch').value=chosenTarget?.title||'';renderTarget()})}
function renderTarget(){if(!chosenTarget)return;$('chosenTarget').innerHTML='<h3>Target to validate</h3>'+renderJob(chosenTarget,[],'I chose to explore');bindTargets($('chosenTarget'))}
function addResearch(data={},holder=null){const d=document.createElement('div');d.className='researchRow';d.innerHTML='<input class="rTitle" placeholder="Employer / job" value="'+esc(data.title||'')+'"><input class="rPay" placeholder="$ / hr" value="'+esc(data.pay||'')+'"><input class="rReq" placeholder="Requirements / skills" value="'+esc(data.req||'')+'"><input class="rSource" placeholder="Link or source" value="'+esc(data.source||'')+'">';(holder||$('researchRows')).appendChild(d);d.addEventListener('input',()=>{captureResearch();try{updateReadiness()}catch(e){}});d.addEventListener('change',()=>{captureResearch();try{updateReadiness()}catch(e){}})}
function research(){return [...document.querySelectorAll('.researchGroup')].flatMap(g=>[...g.querySelectorAll('.researchRow')].map(r=>({soc:g.dataset.soc,occupation:getSelections().find(x=>String(x.soc)===g.dataset.soc)?.title||'',title:r.querySelector('.rTitle').value.trim(),pay:r.querySelector('.rPay').value.trim(),req:r.querySelector('.rReq').value.trim(),source:r.querySelector('.rSource').value.trim()})).filter(x=>x.title||x.pay||x.req||x.source))}
function labIds(){return SKILLS.filter(s=>$('lab_'+s.id)?.checked).map(s=>s.id)}
function validResearchPosts(){return research().filter(p=>p.title&&p.pay&&p.req&&p.source)}
function selectedResearchCareer(){const posts=validResearchPosts(),arr=window.__rapidDiscoverCareers||[];if(chosenTarget)return chosenTarget;for(const p of posts){const q=norm(p.title);const o=arr.find(x=>q.includes(norm(x.title))||norm(x.title).includes(q));if(o)return o}return posts.length?{title:posts[0].title,soc:''}:null}
function updateReadiness(){const careers=window.__rapidDiscoverCareers||[],ids=checked(),posts=validResearchPosts(),target=selectedResearchCareer();if(!chosenTarget&&target)chosenTarget=target;const selection=getSelections(),covered=new Set(posts.map(p=>p.soc)),needs=selection.filter(x=>!covered.has(String(x.soc)));const items=[{ok:ids.length>0,text:'At least one transferable skill is confirmed.',fix:'In Step 3, check at least one skill you recognize from your experience.'},{ok:!!target,text:'A career has been selected for employer research.',fix:'In Step 4, click “Add to My Career Considerations” on the career you want to investigate.'},{ok:selection.length>0&&needs.length===0,text:'A complete employer posting is recorded for each selected career.',fix:'In Step 5, complete the employer/job title, base pay, requirements and source for '+(needs.length?needs.map(x=>x.title).join(', '):'each selected occupation')+'.'}],missing=items.filter(x=>!x.ok),ready=!missing.length,box=$('snapshotChecklist'),wrap=$('snapshotReadiness'),btn=$('saveBtn');if(box)box.innerHTML=ready?'<div style="margin:4px 0">✓ All required evidence is complete.</div>':missing.map((x,i)=>'<div style="margin:7px 0"><b>○ '+esc(x.text)+'</b><br><span style="margin-left:20px">'+esc(x.fix)+'</span></div>').join('');if(wrap){wrap.className='notice '+(ready?'success':'warning');wrap.querySelector('b').textContent=ready?'✓ Mobility Snapshot ready.':'Mobility Snapshot locked — '+missing.length+' required item'+(missing.length===1?' is':'s are')+' still missing:'}if(btn){btn.disabled=!ready;btn.style.opacity=ready?'1':'.55';btn.style.cursor=ready?'pointer':'not-allowed'}const guide=$('researchGuide');if(guide){guide.className='notice '+(posts.length?'success':'warning');guide.innerHTML=posts.length?'<b>✓ Employer evidence recorded.</b> '+posts.length+' complete posting'+(posts.length===1?'':'s')+' added. <button type="button" class="btn green" id="continueSnapshot" style="margin-left:10px">Continue to Mobility Snapshot ↓</button>':target?'<b>Next:</b> Complete all four fields for at least one real posting for <b>'+esc(target.title)+'</b>.':'<b>Next:</b> choose a career above with <b>Add to My Career Considerations</b>, then record at least one real employer posting.';const go=$('continueSnapshot');if(go)go.onclick=()=>{$('snapshotReadiness')?.scrollIntoView({behavior:'smooth',block:'center'})}}}
function validateSnapshot(){const issues=[];if(read(RAPID)?.direction==='pivot'&&!window.BOOST_RAPID_SKILLS_ASSESSED?.())issues.push('Complete the transferable-skills questions and confirm at least one demonstrated skill.');const ids=checked(),posts=research(),careers=window.__rapidDiscoverCareers||[];if(!ids.length)issues.push('Confirm at least one transferable skill.');if(!selectedResearchCareer())issues.push('Choose a career for employer research.');const selected=getSelections(),covered=new Set(validResearchPosts().map(p=>p.soc));for(const x of selected)if(!covered.has(String(x.soc)))issues.push('Complete at least one employer posting for '+x.title+' (employer/job title, pay, requirements and source).');return issues}
function showSaveIssues(issues){$('saveStatus').innerHTML='<div class="notice warning"><b>Your Mobility Snapshot needs a little more evidence:</b><ul style="margin:8px 0 0 20px">'+issues.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><small>Pizza Lab is optional and is not required to generate the snapshot.</small></div>';$('saveStatus').scrollIntoView({behavior:'smooth',block:'center'})}
function save(){const issues=validateSnapshot();if(issues.length){showSaveIssues(issues);return}const ids=checked(),posts=research(),lab=labIds(),d={version:2,region:'Pinal',assessment:window.BOOST_RAPID_SKILL_RESULTS?.()||null,updatedAt:new Date().toISOString(),currentRole:'Experience carried from Discover',currentWage:Number($('currentWage').value)||null,minimumWage:Number($('minimumWage').value)||null,confirmedSkills:ids.map(id=>({id,label:skillLabel(id)})),resumeSignals:[...detected].map(id=>({id,label:skillLabel(id)})),target:(()=>{const x=selectedResearchCareer();if(!x)return null;return {soc:x.soc||'',title:x.title||'',regional:{jobs:x.jobs??null,annualOpenings:x.openings??null,p25Hourly:x.p25??null,medianHourly:x.median??null,tier:x.tier??null}}})(),research:posts,skillLab:{completed:$('labComplete').checked,reinforcedSkills:lab.map(id=>({id,label:skillLabel(id)}))}};localStorage.setItem(STORE,JSON.stringify(d));renderSnapshot(d);updateReadiness();$('saveStatus').innerHTML='<div class="notice success"><b>✓ Mobility Snapshot generated.</b> Review it above, then print or save it if you want a copy.</div>';$('snapshot').scrollIntoView({behavior:'smooth',block:'start'})}
function renderSnapshot(d){
 const wage=d.currentWage?money(d.currentWage)+'/hr':'Not entered',min=d.minimumWage?money(d.minimumWage)+'/hr':'Not entered';
 const options=getSelections(),evidence=d.research||[];
 const optionHtml=options.length?options.map((x,i)=>{
  const o=occs.find(o=>String(o.soc)===String(x.soc));
  const posts=evidence.filter(p=>String(p.soc)===String(x.soc));
  return '<div class="snapBlock"><h3>Career consideration '+(i+1)+': '+esc(x.title)+'</h3>'+
   (o?'<b>Regional evidence:</b> '+num(o.jobs)+' jobs · '+num(o.openings)+' annual openings · Point-of-entry '+money(o.p25)+'/hr<br>':'')+
   '<b>Employer postings recorded:</b> '+posts.length+posts.map(p=>'<br>• '+esc(p.title)+' — '+esc(p.pay)+' · '+esc(p.source)).join('')+'</div>';
 }).join(''):'<div class="snapBlock">Choose at least one career consideration.</div>';
 $('snapshot').innerHTML='<div class="snapBlock"><h3>Your starting point</h3>Previous occupation: '+esc(read(RAPID)?.priorOccupation||'Recorded in Rapid Discover')+'<br>Current/most recent wage: '+wage+'<br>Minimum considered: '+min+'</div>'+
 '<div class="snapBlock"><h3>Transferable skill evidence</h3>'+(d.confirmedSkills.length?d.confirmedSkills.map(x=>'• '+esc(x.label)).join('<br>'):'No skills confirmed yet.')+'</div>'+
 optionHtml+'<div class="snapBlock"><h3>Additional evidence</h3>Pizza Lab: '+(d.skillLab.completed?'Completed — reflection evidence added':'Not marked complete (optional)')+'</div>';
}
function restore(){const d=read(STORE);if(!d?.version)return;const rapid=read(RAPID);if(rapid?.direction==='pivot'&&!d.assessment?.sourceSoc)return;if(rapid?.direction&&d.assessment?.sourceSoc&&rapid.occupationSoc&&String(d.assessment.sourceSoc)!==String(rapid.occupationSoc))return;if(d.currentWage)$('currentWage').value=d.currentWage;if(d.minimumWage)$('minimumWage').value=d.minimumWage;detected=new Set((d.resumeSignals||[]).map(x=>x.id));renderSkills();(d.confirmedSkills||[]).forEach(x=>{const el=$('skill_'+x.id);if(el)el.checked=true});if(d.target?.soc)chosenTarget=occs.find(o=>String(o.soc)===String(d.target.soc))||d.target;if(d.skillLab?.completed)$('labComplete').checked=true;(d.skillLab?.reinforcedSkills||[]).forEach(x=>{const el=$('lab_'+x.id);if(el)el.checked=true});$('researchRows').innerHTML='';if(d.research?.length){const prior=researchDraft();for(const p of d.research){const soc=p.soc||d.target?.soc;if(soc&&!prior[soc]?.length){(prior[soc]||=[]).push(p)}}localStorage.setItem(RESEARCH_DRAFT,JSON.stringify(prior))}syncResearchGroups();renderSnapshot(d);}
async function init(){try{updateReadiness()}catch(e){const b=$('snapshotChecklist');if(b)b.innerHTML='○ Finish the steps above to unlock your snapshot.'}document.addEventListener('click',e=>{if(e.target.closest?.('#matchBtn')){e.preventDefault();compareDiscoverCareers();return;}const b=e.target.closest?.('.chooseTarget');if(!b||b.disabled)return;const o=occs.find(x=>String(x.soc)===String(b.dataset.soc));if(!o)return;chosenTarget=o;const existing=[...document.querySelectorAll('.researchRow')].some(r=>norm(r.querySelector('.rTitle')?.value||'')===norm(o.title));if(!existing)addResearch({title:o.title});b.textContent='✓ Added to Research';b.classList.remove('ghost');b.classList.add('green');b.disabled=true;updateReadiness();$('researchPanel')?.scrollIntoView({behavior:'smooth',block:'start'});});interests();renderSkills();await loadOccs();try{restore()}catch(e){console.warn('Rapid restore skipped',e)}try{renderDiscoverCareers()}catch(e){console.warn('Discover render issue',e)}syncResearchGroups();updateReadiness();$('extractBtn').onclick=async()=>{try{$('resumeStatus').textContent='Reading experience evidence…';let text=$('resumeText').value.trim(),file=$('resumeFile').files[0];if(file)text+=' '+await fileText(file);if(!text.trim()){ $('resumeStatus').textContent='Paste experience text or choose a file first.';return}const n=extract(text);updateReadiness();$('resumeStatus').textContent='Found '+n+' possible transferable-skill signals. Confirm or change them below.'}catch(e){$('resumeStatus').textContent=e.message||'The résumé could not be read. Paste the text instead.'}};$('matchBtn').onclick=compareDiscoverCareers;document.querySelectorAll('.rapidPref').forEach(el=>el.addEventListener('change',()=>{if(checked().length)compareDiscoverCareers()}));if($('jobSearch'))$('jobSearch').oninput=search;if($('addResearch'))$('addResearch').onclick=()=>{const box=$('researchRows').querySelector('.researchGroupRows');if(box)addResearch({},box);captureResearch();updateReadiness()};$('researchRows').addEventListener('input',updateReadiness);$('researchRows').addEventListener('change',updateReadiness);$('skillGrid').addEventListener('change',updateReadiness);$('saveBtn').onclick=save;$('printBtn').onclick=()=>window.print()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();