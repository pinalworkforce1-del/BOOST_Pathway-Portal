(function(){
'use strict';
const KEY='pinal_boost_career_exploration_v1',JOURNEY_KEY='pinal_boost_journey_v1';
const txt=v=>String(v||'').replace(/\s+/g,' ').trim();
const qa=(r,s)=>{try{return [...r.querySelectorAll(s)]}catch(_){return[]}};
const q=(r,s)=>{try{return r.querySelector(s)}catch(_){return null}};
const byText=(r,s,re)=>qa(r,s).find(x=>re.test(txt(x.textContent)))||null;
const set=(el,value)=>{if(el&&txt(el.textContent)!==txt(value))el.textContent=value};
function readShared(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(_){return{}}}
function readJourney(){try{return window.PinalBOOST?.get?.()||JSON.parse(localStorage.getItem(JOURNEY_KEY)||'{}')||{}}catch(_){return{}}}
function saveShared(s){
  try{
    s=s||{};s.updatedAt=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(s));
    const j=readJourney();j.modules=j.modules||{};j.modules.module3=Object.assign({},j.modules.module3||{},s.module3||{});j.updated_at=new Date().toISOString();
    if(window.PinalBOOST?.put)window.PinalBOOST.put(j);else localStorage.setItem(JOURNEY_KEY,JSON.stringify(j));
  }catch(e){console.warn('BOOST Module 3 safe state save unavailable',e)}
}
function carriedCareers(s){return s?.module1?.selected||[]}
function decisionComplete(s){const list=carriedCareers(s),dec=s?.module3?.careerDecisionsBySoc||{};return list.length>0&&list.every(o=>/^(keep|pause)$/.test(dec[o.soc]||''))}

function injectCSS(d){
  if(d.getElementById('boostM3SafePolishCSS'))return;
  const st=d.createElement('style');
  st.id='boostM3SafePolishCSS';
  st.textContent=`
    #occupationalValue{display:none!important}
    .boostM3SafeIntro h2{font-size:clamp(1.7rem,3vw,2.4rem);color:#0b3158}
    .boostM3SafeIntro>p{font-size:1.04rem;line-height:1.62;max-width:920px;color:#425b70}
    .boostM3Eyebrow{font-size:.74rem;font-weight:900;letter-spacing:.11em;text-transform:uppercase;color:#2a9d8f}
    .boostM3Questions{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:19px 0}
    .boostM3Question{border:1px solid #d7e4eb;background:#f8fbfd;border-radius:14px;padding:14px;min-height:108px}
    .boostM3Question b{display:block;color:#0b3158;margin-bottom:5px}.boostM3Question span{font-size:.84rem;color:#617589}
    #boostStrengths{margin:13px 0 16px;padding:14px;border-radius:14px;background:#f7fafc;border:1px solid #d8e3ec}
    .boostStrengthHead{display:flex;justify-content:space-between;gap:12px;font-weight:900;color:#0b3158}
    .boostStrengthTrack{height:8px;margin-top:9px;background:#e1e9ef;border-radius:99px;overflow:hidden}
    .boostStrengthFill{height:100%;background:#2a9d8f;transition:width .2s}.boostStrengthMsg{font-size:.84rem;color:#60778a;margin-top:7px}
    @media(max-width:850px){.boostM3Questions{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:560px){.boostM3Questions{grid-template-columns:1fr}.boostStrengthHead{flex-direction:column}}
  `;
  d.head.appendChild(st);
}

function plainLanguage(d){
  const replacements=[
    [/WORK NOW \/ occupationally adjacent/gi,'WORK NOW'],[/Occupationally Adjacent/g,'Similar Work'],[/occupationally adjacent/gi,'similar work'],[/occupational similarity/gi,'how much of your experience transfers'],[/occupational value/gi,'what your experience already gives you'],[/Immediate Mobility/g,'What You Already Bring'],[/Career Fit/g,'Overall Fit'],[/Interest Alignment/g,'Matches Your Interests'],[/interest alignment/g,'match to your interests'],[/Transferable Skill Alignment/g,'What You Already Bring'],[/transferable-skill alignment/g,'what you already bring'],[/preference signal/gi,'interest match'],[/Preparation Distance/g,'What You May Need to Build'],[/preparation distance/gi,'what you may need to build'],[/Preparation signal/g,'Preparation'],[/Regional jobs/g,'Jobs in this region'],[/Projected growth/g,'Future outlook'],[/25th percentile/g,'Typical starting wage'],[/CREATE MY CAREER MOBILITY PLAN/g,'CREATE MY MOBILITY STORY'],[/UPDATE MY CAREER MOBILITY/g,'UPDATE MY OPTIONS'],[/BACK TO EXPLORATION CHOICES/g,'BACK TO MY OPTIONS']
  ];
  const w=d.defaultView,walker=d.createTreeWalker(d.body,w.NodeFilter.SHOW_TEXT);let n;
  while((n=walker.nextNode())){if(!n.parentElement||/^(SCRIPT|STYLE|TEXTAREA|OPTION)$/.test(n.parentElement.tagName))continue;let v=n.nodeValue;replacements.forEach(([re,to])=>v=v.replace(re,to));n.nodeValue=v}
}
function cleanRawH(d){qa(d,'.badge,.chip,.valueTag').forEach(el=>{const t=txt(el.textContent);if(/^(3H|H3|2H|H2|\+H|-H)$/i.test(t)){el.style.display='none';el.setAttribute('aria-hidden','true')}})}
function hero(d){const h=q(d,'.hero');if(!h)return;set(q(h,'.brand'),'BOOST • Module 3 • Career Mobility');set(q(h,'h1'),'Where Can My Experience Take Me?');set(q(h,'p'),'You may already have more career options than you realize. BOOST will help you see what you already bring, where those strengths may have value now, and what you may want to build next.')}
function intro(d){const panel=qa(d,'section.panel.noPrint').find(x=>/career can grow like a honeycomb/i.test(txt(x.textContent)));if(!panel||panel.dataset.boostSafeIntro==='1')return;panel.dataset.boostSafeIntro='1';panel.innerHTML=`<div class="boostM3SafeIntro"><div class="boostM3Eyebrow">Start Here</div><h2>Your experience can travel.</h2><p>Jobs have different titles, but many use the same kinds of skills and experiences. We’ll look at what you already bring, careers you may be able to pursue now, and careers that may take a little more preparation. <b>You don’t need to understand job codes, career clusters, or workforce terminology.</b> BOOST will handle that part.</p><div class="boostM3Questions"><div class="boostM3Question"><b>What do I already bring?</b><span>Recognize experience and strengths you’ve already built.</span></div><div class="boostM3Question"><b>What could I do now?</b><span>See careers where your experience may already have value.</span></div><div class="boostM3Question"><b>Where could I move?</b><span>Explore careers where what you’ve learned may transfer.</span></div><div class="boostM3Question"><b>What might I need to build?</b><span>See which goals may take some additional preparation.</span></div></div><button class="btn" data-boost-safe-start type="button">SHOW ME WHAT I BRING →</button></div>`;q(panel,'[data-boost-safe-start]')?.addEventListener('click',()=>d.getElementById('setup')?.scrollIntoView({behavior:'smooth'}))}
function setup(d){const p=d.getElementById('setup');if(!p)return;set(q(p,'.step'),'Step 1 • Start With Where You Are');set(q(p,'h2'),'Start With Where You Are');set(byText(p,'label',/what do you do now|most recently/i),'What kind of work are you doing now, or what have you done most recently?');set(byText(p,'label',/optional note/i),'Anything about that work you want BOOST to know? (optional)');const wage=byText(p,'label',/hourly wage/i);if(wage&&!/helps compare opportunities/i.test(txt(wage.textContent)))wage.innerHTML='Current or last hourly wage <span class="muted">(optional — helps compare opportunities)</span>';set(d.getElementById('loadSkills'),'SHOW ME WHAT I BRING →')}
function strengthCount(d){const radios=qa(d,'#skillgrid input[type=radio][name^=sk]');if(!radios.length)return;const names=[...new Set(radios.map(x=>x.name))],checked=names.map(n=>q(d,`input[name="${n}"]:checked`)).filter(Boolean),strengths=checked.filter(x=>/Used Regularly|Used Sometimes/.test(x.value)).length,pct=Math.round(100*checked.length/names.length);set(q(d,'[data-strength-count]'),`${strengths} ${strengths===1?'strength':'strengths'} identified`);const fill=q(d,'[data-strength-fill]');if(fill)fill.style.width=pct+'%';set(q(d,'[data-strength-msg]'),checked.length===names.length?`You already bring ${strengths} transferable ${strengths===1?'strength':'strengths'}. Let’s see where ${strengths===1?'it can':'they can'} take you.`:`${checked.length} of ${names.length} experiences reviewed. Keep going — your toolkit is taking shape.`)}
function skills(d){const p=d.getElementById('skills');if(!p)return;set(q(p,'.step'),'Step 2 • What Do You Already Bring?');set(q(p,'h2'),'What Do You Already Bring?');const sub=q(p,'.sub');if(sub)set(sub,'Think about everything you have done — paid work, military service, volunteering, caregiving, school, side work, or other responsibilities. Tell BOOST how often you have actually used each experience.');const guide=q(p,'.capabilityGuide p');if(guide)set(guide,'There are no perfect answers here. We are simply identifying experience you can carry with you.');if(!d.getElementById('boostStrengths')&&d.getElementById('skillgrid')){const box=d.createElement('div');box.id='boostStrengths';box.innerHTML='<div class="boostStrengthHead"><span>My Experience Toolkit</span><span data-strength-count>0 strengths identified</span></div><div class="boostStrengthTrack"><div class="boostStrengthFill" data-strength-fill style="width:0%"></div></div><div class="boostStrengthMsg" data-strength-msg>Choose the answer that best reflects your real experience.</div>';d.getElementById('skillgrid').insertAdjacentElement('beforebegin',box)}qa(d,'#skillgrid input[type=radio][name^=sk]').forEach(input=>{const label=input.closest('label');if(!label||label.dataset.boostPlainLabel==='1')return;label.dataset.boostPlainLabel='1';const map={'Used Regularly':'Yes — I use this often','Used Sometimes':'Sometimes','Limited Experience':'Not much yet','Not Sure':'Not sure'};[...label.childNodes].filter(n=>n.nodeType===3).forEach(n=>n.remove());label.appendChild(d.createTextNode(' '+(map[input.value]||input.value)))});qa(d,'#skillgrid .skillcard').forEach(card=>{const desc=byText(card,'p',/what it means:/i);if(desc)desc.innerHTML=desc.innerHTML.replace(/What it means:/i,'In everyday terms:');const ex=q(card,'.example');if(ex)ex.innerHTML=ex.innerHTML.replace(/Think about your work:/i,"Think about where you've used this:")});set(d.getElementById('continueBtn'),'NEXT: THINK ABOUT WHICH STRENGTHS I WANT TO USE →');if(!d.body.dataset.boostStrengthListeners){d.body.dataset.boostStrengthListeners='1';qa(d,'#skillgrid input[type=radio][name^=sk]').forEach(input=>input.addEventListener('change',()=>strengthCount(d)))}strengthCount(d)}
function lab(d){const box=d.getElementById('boostM3Lab');if(!box)return;const step=q(box,'.step'),heading=q(box,'h2'),lead=q(box,'p');if(step)step.textContent='Step 3 • Optional Workplace Preference Check';if(heading)heading.textContent='Which of these strengths would you like to use more?';if(lead)lead.innerHTML='You’ve identified the strengths you already use. Now add one more layer: <b>which of those strengths would you like to keep using or use more in future work?</b> If you’re not sure, the Pizza Workplace Lab can help you explore that preference in realistic workplace situations.'}

function refreshDecisionButtons(card,decision){const keep=q(card,'[data-decision="keep"]'),pause=q(card,'[data-decision="pause"]');if(keep)keep.textContent=decision==='keep'?'✓ KEEP EXPLORING THIS CAREER':'KEEP EXPLORING THIS CAREER IN BOOST →';if(pause)pause.textContent=decision==='pause'?'✓ PAUSED FOR NOW':'PAUSE THIS CAREER FOR NOW'}
function nextUndecidedCard(d,s,currentSoc){const list=carriedCareers(s),dec=s?.module3?.careerDecisionsBySoc||{},idx=Math.max(0,list.findIndex(o=>String(o.soc)===String(currentSoc)));for(let i=idx+1;i<list.length;i++){if(!/^(keep|pause)$/.test(dec[list[i].soc]||'')){const c=q(d,`.boostM3CareerCompare[data-soc="${CSS.escape(String(list[i].soc))}"]`);if(c)return c}}for(let i=0;i<=idx;i++){if(!/^(keep|pause)$/.test(dec[list[i].soc]||'')){const c=q(d,`.boostM3CareerCompare[data-soc="${CSS.escape(String(list[i].soc))}"]`);if(c)return c}}return null}
function bindDecisionFlow(frame){
  const d=frame?.contentDocument;if(!d||d.__boostSafeDecisionBound)return;d.__boostSafeDecisionBound=true;
  d.addEventListener('click',e=>{
    const btn=e.target?.closest?.('#boostM3FinalCompare [data-decision]');if(!btn)return;
    e.preventDefault();e.stopImmediatePropagation();
    const soc=btn.dataset.soc,decision=btn.dataset.decision,s=readShared();s.module3=s.module3||{};s.module3.careerDecisionsBySoc=s.module3.careerDecisionsBySoc||{};s.module3.careerDecisionsBySoc[soc]=decision;s.module3.comparisonUpdatedAt=new Date().toISOString();s.module3.comparisonNeedsRefresh=false;
    const done=decisionComplete(s);s.module3.completionReady=done;if(done){s.module3.finalizedAt=s.module3.finalizedAt||new Date().toISOString();s.module3.careers=carriedCareers(s).filter(o=>s.module3.careerDecisionsBySoc[o.soc]==='keep').map(o=>({title:o.title,soc:o.soc,decision:'keep'}))}
    saveShared(s);
    const card=btn.closest('.boostM3CareerCompare');if(card)refreshDecisionButtons(card,decision);
    try{window.BOOSTModule3Final?.apply?.(frame)}catch(_){}
    setTimeout(()=>{
      const now=readShared(),next=nextUndecidedCard(d,now,soc);
      if(next)next.scrollIntoView({behavior:'smooth',block:'start'});else q(d,'#boostM3FinalStory')?.scrollIntoView({behavior:'smooth',block:'start'});
    },90);
  },true);
}
function showMissing(frame,kind,soc){
  const d=frame?.contentDocument;if(!d)return;
  let target=null,msg='';
  if(kind==='start'){target=q(d,'#setup');msg='Choose or confirm your current/recent occupation before saving Module 3.'}
  else if(kind==='skills'){target=q(d,'#skills');msg='Finish the transferable-skill self-assessment before saving Module 3.'}
  else if(kind==='career'){target=q(d,`.boostM3CareerCompare[data-soc="${CSS.escape(String(soc||''))}"]`);const s=readShared(),o=carriedCareers(s).find(x=>String(x.soc)===String(soc));msg=`Review ${o?.title||'the remaining career'} and choose Keep Exploring or Pause for Now.`}
  else{target=q(d,'#boostM3FinalChoice');msg='Choose how you want to apply your Module 3 evidence before saving.'}
  window.BOOSTPortal?.toast?.(msg);target?.scrollIntoView({behavior:'smooth',block:'start'});
}
function bindFinishGuard(frame){
  const finish=document.getElementById('finishBtn');if(!finish||finish.dataset.boostM3SafeGuard)return;finish.dataset.boostM3SafeGuard='1';
  finish.addEventListener('click',e=>{
    const s=readShared(),m=s?.module3||{},list=carriedCareers(s),dec=m.careerDecisionsBySoc||{},startedCompare=!!m.comparisonUpdatedAt||Object.keys(dec).length>0;
    if(!m.startingPoint?.soc&&!m.startingPoint?.title){e.preventDefault();e.stopImmediatePropagation();showMissing(frame,'start');return}
    if(!(m.selfAssessment||[]).length){e.preventDefault();e.stopImmediatePropagation();showMissing(frame,'skills');return}
    if(startedCompare){const missing=list.find(o=>!/^(keep|pause)$/.test(dec[o.soc]||''));if(missing){e.preventDefault();e.stopImmediatePropagation();showMissing(frame,'career',missing.soc);return}}
    else if(!m.workNowViewed){e.preventDefault();e.stopImmediatePropagation();showMissing(frame,'choice');return}
    m.completionReady=true;m.finalizedAt=m.finalizedAt||new Date().toISOString();m.careers=list.filter(o=>dec[o.soc]!=='pause').map(o=>({title:o.title,soc:o.soc,decision:dec[o.soc]||'work_now_lane'}));saveShared(s);
    try{window.BOOSTModule3Final?.apply?.(frame)}catch(_){}
    const report=frame.contentDocument?.getElementById('reportSection');report?.classList.remove('hidden');
  },true);
}
function polish(frame){try{const d=frame?.contentDocument;if(!d?.body)return;injectCSS(d);hero(d);intro(d);setup(d);skills(d);lab(d);plainLanguage(d);cleanRawH(d);bindDecisionFlow(frame);bindFinishGuard(frame)}catch(e){console.warn('BOOST Module 3 safe polish unavailable',e)}}
function init(){const p=new URLSearchParams(location.search);if(!/activity\.html$/i.test(location.pathname)||p.get('m')!=='module3')return;const frame=document.getElementById('activityFrame');if(!frame)return;const apply=()=>[120,350,800,1500].forEach(ms=>setTimeout(()=>polish(frame),ms));frame.addEventListener('load',apply);if(frame.contentDocument?.readyState==='complete')apply();window.addEventListener('message',()=>{setTimeout(()=>polish(frame),100);setTimeout(()=>polish(frame),350)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
