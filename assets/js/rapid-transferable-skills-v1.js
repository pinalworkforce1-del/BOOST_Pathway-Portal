(()=>{'use strict';
const $=id=>document.getElementById(id),STORE='pinal_boost_rapid_transferable_skills_v1',DISCOVER='pinal_boost_rapid_discover_v1';
const ITEMS=[
{id:'safety',name:'Safety & equipment monitoring',prompt:'In your previous work, how often did you inspect equipment, recognize risks, follow safety procedures, or address unsafe conditions?',example:'Tell us about a safety check, a hazard you addressed, or equipment you monitored.'},
{id:'document',name:'Documentation & recordkeeping',prompt:'How independently did you maintain accurate logs, reports, records, or other work documentation?',example:'What records did you keep, and how did others rely on their accuracy?'},
{id:'coordinate',name:'Coordination & scheduling',prompt:'How independently did you organize work, plan routes or schedules, coordinate tasks, or adjust priorities?',example:'Describe a time you managed timing, resources or competing priorities.'},
{id:'customer',name:'Customer & client communication',prompt:'How independently did you explain information, support customers or clients, or resolve concerns?',example:'Describe a situation in which your communication improved an outcome.'},
{id:'problem',name:'Problem solving & troubleshooting',prompt:'How independently did you diagnose an unexpected problem, compare options, or find a workable solution?',example:'What went wrong and what steps did you take to resolve it?'},
{id:'detail',name:'Quality, accuracy & inspection',prompt:'How independently did you check work for accuracy, identify defects, or maintain standards?',example:'Describe something you checked or corrected to avoid an error.'},
{id:'hands',name:'Hands-on work & equipment',prompt:'How independently did you operate tools, machinery or vehicles, handle materials, or complete physical work?',example:'What tools or equipment have you used, and in what conditions?'},
{id:'people',name:'Teamwork & collaboration',prompt:'How independently did you coordinate with coworkers, partners or other teams to accomplish a result?',example:'Describe your role in a group effort.'},
{id:'adapt',name:'Adaptability under pressure',prompt:'How independently did you respond to urgent deadlines, shifting demands or changing work conditions?',example:'What changed unexpectedly and how did you adapt?'},
{id:'lead',name:'Leadership, training & coaching',prompt:'How independently did you guide others, teach a process, supervise work or provide feedback?',example:'Give an example of helping another person improve their performance.'},
{id:'digital',name:'Digital tools & technology',prompt:'How independently did you use work software, electronic systems, data or technology to complete tasks?',example:'Name systems or technologies you used and what you accomplished with them.'},
{id:'numbers',name:'Measurements, calculations & transactions',prompt:'How independently did you calculate quantities, reconcile transactions, interpret measurements or manage numerical information?',example:'What kinds of numbers or calculations mattered in your work?'}
];
const aliases={truck:['safety','document','coordinate','hands','detail','adapt','problem'],driver:['safety','document','coordinate','hands','adapt'],warehouse:['hands','detail','safety','coordinate','adapt'],nurse:['people','customer','detail','document','problem','adapt'],retail:['customer','people','numbers','adapt','detail'],supervisor:['lead','coordinate','people','problem','adapt'],manager:['lead','coordinate','problem','digital'],manufactur:['hands','detail','safety','problem'],electric:['hands','safety','problem','detail'],computer:['digital','problem','customer','detail'],service:['customer','people','problem','adapt']};
let current=[],answers={},accepted=false,rosieSuggestion='',lastSignature='';
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
function source(){const d=read(DISCOVER)||{};return {d,occupation:d.priorOccupation||d.role||'',soc:d.occupationSoc||d.occupation?.soc||'',duties:d.duties||'',onetScores:d.onetScores||null,preferences:d.workPreferences||d.preferences||[],avoid:d.avoid||''}}
function candidates(){
 const d=source(),all=window.BOOST_RAPID_OCCUPATIONS||[],o=all.find(x=>String(x.soc)===String(d.soc))||all.find(x=>x.title?.toLowerCase()===d.occupation.toLowerCase());
 const ids=new Set(window.BOOST_RAPID_INFER_SKILLS?.(o)||[]);
 const text=(d.occupation+' '+d.duties).toLowerCase();
 Object.entries(aliases).forEach(([k,v])=>{if(text.includes(k))v.forEach(id=>ids.add(id))});
 // Always offer core cross-sector skills as questions, never as verified claims.
 ['problem','people','adapt'].forEach(id=>ids.add(id));
 if(ids.size<6)['detail','document','coordinate','hands','customer','safety'].forEach(id=>ids.add(id));
 return [...ids].slice(0,10).map(id=>ITEMS.find(x=>x.id===id)).filter(Boolean);
}
function persist(){localStorage.setItem(STORE,JSON.stringify({version:1,sourceOccupation:source().occupation,sourceSoc:source().soc,answers,accepted,updatedAt:new Date().toISOString()}))}
function resetConfirmation(){accepted=false;const s=$('rapidSkillsSummary');if(s)s.textContent='Your answers have changed. Confirm the skills again to update the occupation matches.';}
function render(){
 const s=source(),signature=JSON.stringify([s.occupation,s.soc,s.duties]),prior=read(STORE);
 if(signature===lastSignature)return;lastSignature=signature;
 if(prior?.sourceOccupation===s.occupation&&prior?.sourceSoc===s.soc){answers=prior.answers||{};accepted=!!prior.accepted}else{answers={};accepted=false}
 current=candidates();const target=$('rapidSkillQuestions');
 if(!target)return;
 const preface=document.createElement('div');preface.className='notice';preface.innerHTML='<b>Carried from Rapid Discover:</b> '+escape(s.occupation||'Occupation not yet available')+'<br><small>Work preferences: '+escape(s.preferences.join(', ')||'Not recorded')+'. O*NET interests are used in the later occupation comparison. Check your actual experience before confirming skill ratings.</small>';
 target.replaceChildren(preface);
 current.forEach((item,i)=>{
 const a=answers[item.id]||{rating:'',example:''};
 const article=document.createElement('div');article.className='result';article.dataset.skill=item.id;
 article.innerHTML='<b>'+escape(item.name)+'</b><p>'+escape(item.prompt)+'</p><label>My experience level<select class="skillRating" data-id="'+escape(item.id)+'"><option value="">Choose your experience</option><option value="0">0 — I have not performed this work</option><option value="1">1 — I have observed or assisted</option><option value="2">2 — I have performed it independently</option><option value="3">3 — I have performed it independently and improved, coached or led this work</option></select></label><label>My example (recommended for ratings 2–3)<textarea class="skillExample" data-id="'+escape(item.id)+'" placeholder="'+escape(item.example)+'"></textarea></label>';
 article.querySelector('select').value=String(a.rating??'');article.querySelector('textarea').value=a.example||'';
 target.append(article);
 });
 $('rapidSkillsSummary').textContent=accepted?'Previously confirmed assessment loaded. You can update it at any time.':'Rate each skill based on what you personally did, then confirm your transferable-skill profile.';
 if(accepted)apply();
}
function update(){
 const newA={};
 document.querySelectorAll('#rapidSkillQuestions .skillRating').forEach(el=>{const id=el.dataset.id;newA[id]={rating:el.value,example:document.querySelector('.skillExample[data-id="'+id+'"]')?.value.trim()||''}});
 answers=newA;resetConfirmation();persist();
}
function measured(){return current.filter(x=>answers[x.id]?.rating!==undefined&&answers[x.id]?.rating!=='').map(x=>({...x,rating:Number(answers[x.id].rating),example:answers[x.id].example||''}))}
function confirm(){
 const rated=measured();
 if(rated.length!==current.length){$('rapidSkillsSummary').textContent='Please rate every question, including 0 if you have not performed that work.';return}
 const confirmed=rated.filter(x=>x.rating>=2);
 if(!confirmed.length){$('rapidSkillsSummary').textContent='No independently demonstrated skill was confirmed yet. Add experience or discuss next steps with your coach.';return}
 accepted=true;persist();apply();
 $('rapidSkillsSummary').innerHTML='<b>✓ Skills confirmed:</b> '+confirmed.length+' independently demonstrated areas. '+rated.filter(x=>x.rating===1).length+' emerging areas. Ratings and examples are saved locally; these are not credentials or employer-verified proficiency.';
 $('skillStatus').textContent='Only confirmed skills are being used for your occupation comparison.';
}
function apply(){
 if(!accepted)return;
 const demonstrated=new Set(measured().filter(x=>x.rating>=2).map(x=>x.id));
 document.querySelectorAll('#skillGrid input[type=checkbox]').forEach(el=>{el.checked=demonstrated.has(el.id.replace(/^skill_/,''))});
}
async function rosie(){
 const box=$('rapidRosieSkillsResponse'),btn=$('rapidAskRosieSkills');if(!box||!btn)return;
 const s=source(),rated=measured();btn.disabled=true;box.textContent='Rosie is reviewing your occupation and examples…';
 try{
 const cfg=window.BOOST_CONFIG;if(!window.supabase?.createClient||!cfg)throw Error('Sign into BOOST to use Rosie.');
 const c=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
 const session=(await c.auth.getSession()).data?.session;if(!session?.access_token)throw Error('An authenticated BOOST sign-in is required.');
 const question='You are Rosie, supporting a dislocated worker in a Rapid Reemployment transferable-skills assessment. Using ONLY their described actual duties and self-ratings, suggest up to four relevant follow-up reflection questions to uncover additional transferable skills. Ask for concrete examples; distinguish independently performed tasks from observed work. Explain that typical O*NET occupation profiles are not proof of individual competency. Do not assign skill ratings, claim qualifications, or suggest that training is approved. Avoid inventing job duties or wages. Keep the response concise, with clear questions. Here is the participant-controlled assessment context: '+JSON.stringify({previousOccupation:s.occupation,occupationSoc:s.soc,duties:s.duties,preferences:s.preferences,onetInterests:s.onetScores,skillRatings:rated.map(x=>({skill:x.name,rating:x.rating,example:x.example}))});
 const response=await fetch(cfg.supabaseUrl+'/functions/v1/boost-ask-rosie-boost2-staging',{method:'POST',headers:{'Content-Type':'application/json',apikey:cfg.supabaseAnonKey,Authorization:'Bearer '+session.access_token},body:JSON.stringify({question,journey:{rapidMobilityAssessment:{occupation:s.occupation,assessmentStage:'evidence_reflection',confirmedSkills:accepted?measured().filter(x=>x.rating>=2).map(x=>x.name):[]}},page:'BOOST Rapid Reemployment · Transferable Skills',history:[]})});
 const data=await response.json();if(!response.ok||!data.answer)throw Error(data.error||'No response available');
 rosieSuggestion=data.answer;box.replaceChildren();const heading=document.createElement('b');heading.textContent='Rosie · Additional reflection questions';const paragraph=document.createElement('p');paragraph.style.whiteSpace='pre-wrap';paragraph.textContent=rosieSuggestion;box.append(heading,paragraph);
 }catch(e){box.textContent='Rosie is unavailable: '+e.message+'. You can still complete the skill questions yourself.'}finally{btn.disabled=false}
}
window.BOOST_RAPID_SKILLS_ASSESSED=()=>accepted&&measured().length===current.length&&measured().some(x=>x.rating>=2);
window.BOOST_RAPID_SKILL_RESULTS=()=>({version:1,sourceOccupation:source().occupation,sourceSoc:source().soc,confirmedAt:accepted?(read(STORE)?.updatedAt||null):null,skills:measured().map(x=>({id:x.id,label:x.name,proficiency:x.rating,example:x.example,demonstrated:x.rating>=2})),onetScores:source().onetScores,preferences:source().preferences,rosieSupportRequested:!!rosieSuggestion});
function init(){
 $('rapidSkillQuestions')?.addEventListener('input',update);
 $('rapidSkillQuestions')?.addEventListener('change',update);
 $('rapidConfirmSkills')?.addEventListener('click',confirm);
 $('rapidAskRosieSkills')?.addEventListener('click',rosie);
 window.addEventListener('boost-rapid-occupations-ready',()=>{lastSignature='';render()});
 render();setTimeout(render,300);
 const old=read(STORE);if(old?.accepted&&old?.sourceOccupation===source().occupation){answers=old.answers||{};accepted=true;lastSignature='';render()}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();