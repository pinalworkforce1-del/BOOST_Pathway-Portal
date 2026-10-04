(() => {
  const course = window.R2W_COURSE;
  const scenes = course.scenes;
  const weights = course.weights;
  const skillNames = course.skills;
  const skillOrder = course.skillOrder;
  const STORAGE_KEY = 'boost-r2w-integrated-v1';
  const $ = id => document.getElementById(id);

  const stageDefs = {
    'Soft Skills Base Camp': {
      number: '1 • SOFT SKILLS BASE CAMP',
      tagline: 'Build the skills you’ll take to work.',
      home: 'assets/r2w-base-camp-home.webp',
      description: 'Practice the everyday decisions employers notice: communication, professionalism, problem solving, teamwork, planning, and quality.'
    },
    'Resume Retreat': {
      number: '2 • RESUME RETREAT',
      tagline: 'Show employers what you bring.',
      home: 'assets/r2w-resume-retreat-home.webp',
      description: 'Turn real experience into credible, employer-ready resume evidence.'
    },
    'Interview Landing': {
      number: '3 • INTERVIEW LANDING',
      tagline: 'Practice telling your story with confidence.',
      home: 'assets/r2w-interview-landing-home.webp',
      description: 'Prepare for interview moments that require judgment, confidence, and clear examples.'
    }
  };
  const stageOrder = Object.keys(stageDefs);

  let state = {
    currentScene: 0,
    ccOn: true,
    sceneSelections: {},
    skillScores: {COM:0,PRO:0,PSA:0,TEAM:0,TIME:0,QUAL:0},
    participantName: '',
    firstOpened: new Date().toISOString()
  };
  let activeStage = stageOrder[0];
  let lastImpact = null;
  const promptAudio = $('promptAudio');
  const impactAudio = $('impactAudio');

  function loadState(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw) state = {...state, ...JSON.parse(raw), skillScores:{...state.skillScores,...(JSON.parse(raw).skillScores||{})}};
    }catch(e){}
  }
  function saveState(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){} }

  function recalcScores(){
    const next={COM:0,PRO:0,PSA:0,TEAM:0,TIME:0,QUAL:0};
    for(const [sceneId, choice] of Object.entries(state.sceneSelections)){
      const delta = weights[sceneId]?.[choice] || {};
      for(const [k,v] of Object.entries(delta)) next[k] += Number(v||0);
    }
    state.skillScores=next;
  }

  const maxPositive = (()=>{
    const m={COM:0,PRO:0,PSA:0,TEAM:0,TIME:0,QUAL:0};
    for(const s of scenes){
      for(const k of skillOrder){
        let best=0;
        for(const c of ['A','B','C','D']) best=Math.max(best, Number(weights[s.id]?.[c]?.[k]||0));
        m[k]+=best;
      }
    }
    return m;
  })();

  function mastery(key){
    const raw = Number(state.skillScores[key]||0);
    const max = Math.max(1,maxPositive[key]||1);
    const ratio = Math.max(0, raw) / max;
    if(ratio >= .85) return {label:'Advanced',pct:100};
    if(ratio >= .68) return {label:'Strong',pct:82};
    if(ratio >= .48) return {label:'Demonstrated',pct:62};
    return {label:'Developing',pct:35};
  }

  function answeredCount(){ return Object.keys(state.sceneSelections).filter(id=>scenes.some(s=>String(s.id)===String(id))).length; }
  function stageScenes(stage){ return scenes.filter(s=>s.stage===stage); }
  function stageAnswered(stage){ return stageScenes(stage).filter(s=>state.sceneSelections[s.id]).length; }
  function stageComplete(stage){ const list=stageScenes(stage); return list.length>0 && stageAnswered(stage)===list.length; }
  function allComplete(){ return answeredCount()===scenes.length; }
  function firstIncompleteIndex(stage){
    const list=stageScenes(stage);
    const s=list.find(x=>!state.sceneSelections[x.id]) || list[0];
    return Math.max(0, scenes.findIndex(x=>x.id===s.id));
  }

  function updateOverall(){
    const n=answeredCount(), total=scenes.length;
    $('overallProgressText').textContent=`${n} of ${total} scenarios complete`;
    $('overallProgressBar').style.width=`${(n/total)*100}%`;
  }

  function hideViews(){ document.querySelectorAll('.view').forEach(v=>v.hidden=true); }
  function route(name, opts={}){
    stopAudio();
    hideViews();
    if(name==='map'){
      $('viewMap').hidden=false; renderMap(); history.replaceState(null,'','#map'); window.scrollTo(0,0); return;
    }
    if(name==='stage'){
      activeStage=opts.stage || activeStage; $('viewStage').hidden=false; renderStageHome(activeStage); history.replaceState(null,'',`#stage-${slug(activeStage)}`); window.scrollTo(0,0); return;
    }
    if(name==='scene'){
      if(Number.isInteger(opts.index)) state.currentScene=Math.max(0,Math.min(scenes.length-1,opts.index));
      $('viewScene').hidden=false; renderScene(); history.replaceState(null,'',`#scene-${scenes[state.currentScene].id}`); window.scrollTo(0,0); return;
    }
    if(name==='certificate'){
      $('viewCertificate').hidden=false; renderCertificate(); history.replaceState(null,'','#certificate'); window.scrollTo(0,0); return;
    }
  }
  function slug(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}

  function renderMap(){
    updateOverall();
    const cards=$('stageCards'); cards.innerHTML='';
    stageOrder.forEach((stage,i)=>{
      const def=stageDefs[stage], done=stageAnswered(stage), total=stageScenes(stage).length, complete=done===total;
      const b=document.createElement('button'); b.className='stage-card';
      b.innerHTML=`<img src="${def.home}" alt=""><div class="stage-card-copy"><span>STAGE ${i+1}</span><h2>${stage}</h2><p>${def.description}</p><div class="stage-card-foot"><span class="status-pill ${complete?'complete':''}">${complete?'Complete':`${done} of ${total} complete`}</span><strong>${complete?'Review →':'Continue →'}</strong></div></div>`;
      b.onclick=()=>route('stage',{stage}); cards.appendChild(b);
    });
  }

  function renderStageHome(stage){
    updateOverall(); const def=stageDefs[stage], done=stageAnswered(stage), total=stageScenes(stage).length, complete=done===total;
    $('stageHomeImg').src=def.home; $('stageHomeImg').alt=`${stage} home environment`;
    $('stageNumber').textContent=def.number; $('stageHomeTitle').textContent=stage; $('stageHomeTagline').textContent=def.tagline;
    $('stageHomeProgress').textContent=complete?'Complete':`${done} of ${total} complete`;
    $('stageHomeProgress').className=`status-pill ${complete?'complete':''}`;
    $('requiredPathTitle').textContent=complete?'Review required scenarios':'Continue required scenarios';
    $('requiredPathMeta').textContent=complete?`${total} of ${total} complete • revisit any decision`:`${done} of ${total} complete • skill impact updates after every decision`;
    $('requiredPathBtn').onclick=()=>route('scene',{index:firstIncompleteIndex(stage)});
  }

  function renderSkillHud(changed={}){
    const grid=$('skillGrid'); const compact=$('compactSkillStrip'); grid.innerHTML=''; compact.innerHTML='';
    skillOrder.forEach(k=>{
      const m=mastery(k); const delta=Number(changed[k]||0);
      const item=document.createElement('div'); item.className='skill-item';
      item.innerHTML=`<div class="skill-row"><span>${skillNames[k]}</span><span>${m.label}</span></div><div class="meter"><i style="width:${m.pct}%"></i></div>`; grid.appendChild(item);
      const bar=document.createElement('i'); bar.style.setProperty('--w',`${m.pct}%`); bar.title=`${skillNames[k]}: ${m.label}`; if(delta<0) bar.style.filter='saturate(.5)'; compact.appendChild(bar);
    });
  }

  function promptText(s){ return `${s.title}. ${s.setup} What do you do? A. ${s.choices.A} B. ${s.choices.B} C. ${s.choices.C} D. ${s.choices.D}`; }
  function stopAudio(){
    if('speechSynthesis' in window) speechSynthesis.cancel();
    [promptAudio,impactAudio].forEach(a=>{ if(a){a.pause(); try{a.currentTime=0}catch(e){}} });
  }
  function speak(text,onend){ if(!('speechSynthesis' in window)) return; speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.rate=.95; if(onend)u.onend=onend; speechSynthesis.speak(u); }
  function attachTrack(audio,src){ audio.querySelectorAll('track').forEach(t=>t.remove()); if(!src)return; const t=document.createElement('track'); t.kind='captions';t.srclang='en';t.label='English';t.src=src;t.default=state.ccOn; audio.appendChild(t); }

  function renderScene(){
    updateOverall(); recalcScores(); saveState(); lastImpact=null;
    const s=scenes[state.currentScene]; activeStage=s.stage;
    $('sceneImg').src=s.img; $('sceneImg').alt=`${s.title} scenario`;
    $('sceneBadge').textContent=`R2W-S${String(s.id).padStart(2,'0')} • ${s.stage}`;
    $('sceneStageChip').textContent=s.stage; $('sceneTitle').textContent=s.title; $('sceneSetup').textContent=s.setup;
    $('sceneProgressBar').style.width=`${((state.currentScene+1)/scenes.length)*100}%`;
    $('sceneProgressText').textContent=`${state.currentScene+1} of ${scenes.length} published scenarios`;
    const inStage=stageScenes(s.stage), pos=inStage.findIndex(x=>x.id===s.id)+1; $('stageProgressText').textContent=`${pos} of ${inStage.length} in ${s.stage}`;
    $('promptCaption').textContent=promptText(s); $('promptCaption').classList.toggle('show',state.ccOn);
    $('inlineFeedback').hidden=true; $('impactCaption').classList.remove('show');
    renderSkillHud();
    const box=$('choices'); box.innerHTML='';
    const previous=state.sceneSelections[s.id];
    for(const k of ['A','B','C','D']){
      const b=document.createElement('button'); b.className=`choice ${previous===k?'selected':''}`;
      b.innerHTML=`<strong>${k}</strong>${s.choices[k]}`; b.onclick=()=>choose(s,k,b); box.appendChild(b);
    }
    if(previous){ showInline(s,previous); }
    $('prevSceneBtn').disabled=state.currentScene===0;
    $('nextSceneBtn').textContent=state.currentScene===scenes.length-1?'Return to Ready 2 Work map →':(scenes[state.currentScene+1].stage!==s.stage?`Continue to ${scenes[state.currentScene+1].stage} →`:'Next scenario →');
    $('ccBtn').textContent=state.ccOn?'CC':'CC Off';
  }

  function showInline(s,k){ const im=s.impact[k]; lastImpact={s,k,im}; $('inlineFeedback').hidden=false; $('inlineFeedbackTitle').textContent=`You chose ${k}`; $('inlineFeedbackText').textContent=im.feedback||im.narration||''; $('impactCaption').textContent=im.narration||''; $('impactCaption').classList.toggle('show',state.ccOn); }

  function choose(s,k,b){
    document.querySelectorAll('.choice').forEach(x=>x.classList.remove('selected')); b.classList.add('selected');
    state.sceneSelections[s.id]=k; recalcScores(); saveState(); updateOverall(); showInline(s,k); renderSkillHud(weights[s.id]?.[k]||{}); showImpactDialog(s,k); playImpact(s,k);
  }

  function showImpactDialog(s,k){
    const im=s.impact[k]; $('impactDialogTitle').textContent=`You chose ${k}`; $('impactDialogText').textContent=im.feedback||im.narration||'';
    const grid=$('impactSkillGrid'); grid.innerHTML=''; const delta=weights[s.id]?.[k]||{};
    skillOrder.forEach(skill=>{
      const m=mastery(skill); const d=Number(delta[skill]||0); const el=document.createElement('div'); el.className=`impact-skill ${d!==0?'changed':''} ${d<0?'risk':''}`;
      const note=d>0?'Evidence strengthened':d<0?'Development opportunity':'No new evidence this decision';
      el.innerHTML=`<div class="skill-row"><strong>${skillNames[skill]}</strong><strong>${m.label}</strong></div><div class="meter"><i style="width:${m.pct}%"></i></div><div class="delta">${note}</div>`; grid.appendChild(el);
    });
    if(typeof $('impactDialog').showModal==='function') $('impactDialog').showModal(); else $('impactDialog').setAttribute('open','');
  }
  function closeImpact(){ try{$('impactDialog').close()}catch(e){$('impactDialog').removeAttribute('open')} }

  function playImpact(s,k){
    const im=s.impact[k]; stopAudio(); attachTrack(impactAudio,im.vtt);
    if(im.file){ impactAudio.src=im.file; impactAudio.play().catch(()=>speak(im.narration||im.feedback||'')); } else speak(im.narration||im.feedback||'');
  }

  function certificateId(){
    const key=`${state.participantName||'participant'}|${state.firstOpened||''}|BOOST-R2W`;
    let h=2166136261; for(let i=0;i<key.length;i++){h^=key.charCodeAt(i);h=Math.imul(h,16777619)}
    return `PINAL-R2W-${(h>>>0).toString(36).toUpperCase().padStart(7,'0')}`;
  }
  function renderCertificate(){
    updateOverall(); recalcScores();
    $('participantName').value=state.participantName||'';
    const grid=$('certificateSkills'); grid.innerHTML='';
    skillOrder.forEach(k=>{ const m=mastery(k); const r=document.createElement('div'); r.className='cert-skill'; r.innerHTML=`<strong>${skillNames[k]}</strong><strong>${m.label}</strong>`; grid.appendChild(r); });
    const resumeDone=stageComplete('Resume Retreat'), interviewDone=stageComplete('Interview Landing');
    $('resumeReadiness').textContent=resumeDone?'Complete':'In Progress'; $('interviewReadiness').textContent=interviewDone?'Complete':'In Progress';
    $('certificateDate').textContent=allComplete()?new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric'}).format(new Date()):'Pending completion';
    $('certificateId').textContent=certificateId();
    $('certificateStatus').textContent=allComplete()?'Certificate earned':'Certificate progress';
    $('certificateLock').classList.toggle('show',!allComplete());
    $('certificateLockText').textContent=`Complete all ${scenes.length} currently published Ready 2 Work scenarios to unlock this first-run certificate. ${answeredCount()} of ${scenes.length} are complete.`;
    $('printCertificateBtn').disabled=!allComplete();
  }

  document.addEventListener('click',e=>{
    const r=e.target.closest('[data-route]'); if(r){ e.preventDefault(); route(r.dataset.route); }
    const s=e.target.closest('[data-stage]'); if(s){ e.preventDefault(); route('stage',{stage:s.dataset.stage}); }
  });
  $('backToStage').onclick=()=>route('stage',{stage:scenes[state.currentScene].stage});
  $('prevSceneBtn').onclick=()=>{ if(state.currentScene>0) route('scene',{index:state.currentScene-1}); };
  $('nextSceneBtn').onclick=()=>{ if(state.currentScene>=scenes.length-1) route('map'); else route('scene',{index:state.currentScene+1}); };
  $('listenBtn').onclick=()=>{ const s=scenes[state.currentScene]; stopAudio(); attachTrack(promptAudio,s.promptVtt); if(s.promptFile){promptAudio.src=s.promptFile;promptAudio.play().catch(()=>speak(promptText(s)))}else speak(promptText(s)); };
  $('replayBtn').onclick=()=>{ if(lastImpact) playImpact(lastImpact.s,lastImpact.k); };
  $('ccBtn').onclick=()=>{ state.ccOn=!state.ccOn; saveState(); $('ccBtn').textContent=state.ccOn?'CC':'CC Off'; $('promptCaption').classList.toggle('show',state.ccOn); $('impactCaption').classList.toggle('show',state.ccOn&&!$('inlineFeedback').hidden); };
  $('skillToggle').onclick=()=>{ const h=$('skillHud'); h.classList.toggle('expanded'); $('skillToggle').textContent=h.classList.contains('expanded')?'Hide skills':'View skills'; };
  $('impactClose').onclick=closeImpact; $('impactContinue').onclick=closeImpact;
  $('impactDialog').addEventListener('click',e=>{ if(e.target===$('impactDialog')) closeImpact(); });
  $('participantName').addEventListener('input',e=>{ state.participantName=e.target.value; saveState(); $('certificateId').textContent=certificateId(); });
  $('printCertificateBtn').onclick=()=>window.print();
  $('resetBtn').onclick=()=>{ if(confirm('Start Ready 2 Work over on this device? This clears decisions, skill evidence, and certificate progress.')){ localStorage.removeItem(STORAGE_KEY); location.hash='#map'; location.reload(); } };

  loadState(); recalcScores(); updateOverall();
  const hash=location.hash||'#map';
  if(hash.startsWith('#scene-')){ const id=Number(hash.split('-')[1]); const idx=scenes.findIndex(s=>s.id===id); route('scene',{index:idx>=0?idx:0}); }
  else if(hash==='#certificate') route('certificate');
  else if(hash.startsWith('#stage-')){ const wanted=hash.slice(7); const stage=stageOrder.find(s=>slug(s)===wanted)||stageOrder[0]; route('stage',{stage}); }
  else route('map');
})();
