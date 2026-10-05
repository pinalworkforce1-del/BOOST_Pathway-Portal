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
      home: 'assests/r2w-base-camp-home.webp',
      description: 'Practice the everyday decisions employers notice: communication, professionalism, problem solving, teamwork, planning, and quality.'
    },
    'Resume Retreat': {
      number: '2 • RESUME RETREAT',
      tagline: 'Show employers what you bring.',
      home: 'assests/r2w-resume-retreat-home.webp',
      description: 'Turn real experience into credible, employer-ready resume evidence.'
    },
    'Interview Landing': {
      number: '3 • INTERVIEW LANDING',
      tagline: 'Practice telling your story with confidence.',
      home: 'assests/r2w-interview-landing-home.webp',
      description: 'Prepare for interview moments that require judgment, confidence, and clear examples.'
    }
  };
  const stageOrder = Object.keys(stageDefs);

  let state = {
    currentScene: 0,
    ccOn: true,
    audioOn: false,
    sceneSelections: {},
    skillScores: {COM:0,PRO:0,PSA:0,TEAM:0,TIME:0,QUAL:0},
    participantName: '',
    firstOpened: new Date().toISOString(),
    resumeBuilder: {step:0,target:'',summary:'',experience:'',evidence:'',skills:'',education:'',integrity:false,ready:false,complete:false}
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

  function masteryFromRatio(raw,max){
    const ratio = Math.max(0, Number(raw||0)) / Math.max(1,Number(max||1));
    if(ratio >= .85) return {label:'Advanced',pct:100,ratio};
    if(ratio >= .68) return {label:'Strong',pct:82,ratio};
    if(ratio >= .48) return {label:'Demonstrated',pct:62,ratio};
    return {label:'Developing',pct:Math.max(8,Math.round(ratio*100)),ratio};
  }
  function liveMaxPositive(){
    const m={COM:0,PRO:0,PSA:0,TEAM:0,TIME:0,QUAL:0};
    for(const s of scenes){
      if(!Object.prototype.hasOwnProperty.call(state.sceneSelections,String(s.id)) && !Object.prototype.hasOwnProperty.call(state.sceneSelections,s.id)) continue;
      for(const k of skillOrder){
        let best=0;
        for(const choice of ['A','B','C','D']) best=Math.max(best,Number(weights[s.id]?.[choice]?.[k]||0));
        m[k]+=best;
      }
    }
    return m;
  }
  function mastery(key,mode='live'){
    const max = mode==='final' ? maxPositive[key] : liveMaxPositive()[key];
    return masteryFromRatio(state.skillScores[key],max);
  }

  function answeredCount(){ return Object.keys(state.sceneSelections).filter(id=>scenes.some(s=>String(s.id)===String(id))).length; }
  function stageScenes(stage){ return scenes.filter(s=>s.stage===stage); }
  function stageAnswered(stage){ return stageScenes(stage).filter(s=>state.sceneSelections[s.id]).length; }
  function stageComplete(stage){ const list=stageScenes(stage); const scenariosDone=list.length>0 && stageAnswered(stage)===list.length; if(stage==='Resume Retreat') return scenariosDone && !!state.resumeBuilder?.complete; return scenariosDone; }
  function allComplete(){ return answeredCount()===scenes.length; }
  function stageUnlocked(stage){
    const i=stageOrder.indexOf(stage);
    return i<=0 || stageComplete(stageOrder[i-1]);
  }
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
    if(name==='resume-builder'){
      $('viewResumeBuilder').hidden=false; renderResumeBuilder(); history.replaceState(null,'','#resume-builder'); window.scrollTo(0,0); return;
    }
    if(name==='certificate'){
      $('viewCertificate').hidden=false; renderCertificate(); history.replaceState(null,'','#certificate'); window.scrollTo(0,0); return;
    }
  }
  function slug(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}

  function renderMap(){
    updateOverall();
    document.querySelectorAll('.map-hotspot').forEach(h=>{
      h.classList.remove('map-complete','map-locked','map-current');
      h.querySelector('.map-state-indicator')?.remove();
      let complete=false, unlocked=true;
      if(h.dataset.stage){ complete=stageComplete(h.dataset.stage); unlocked=stageUnlocked(h.dataset.stage); }
      else if(h.dataset.route==='certificate'){ complete=allComplete(); unlocked=true; }
      const indicator=document.createElement('span'); indicator.className='map-state-indicator';
      if(complete){ h.classList.add('map-complete'); indicator.textContent='✓'; indicator.setAttribute('aria-label','Complete'); }
      else if(!unlocked){ h.classList.add('map-locked'); indicator.textContent='🔒'; indicator.setAttribute('aria-label','Locked'); }
      else { h.classList.add('map-current'); indicator.textContent='→'; indicator.setAttribute('aria-label','Available now'); }
      h.appendChild(indicator);
    });
    const cards=$('stageCards'); cards.innerHTML='';
    stageOrder.forEach((stage,i)=>{
      const def=stageDefs[stage], done=stageAnswered(stage), total=stageScenes(stage).length, complete=done===total, unlocked=stageUnlocked(stage);
      const b=document.createElement('button'); b.className=`stage-card ${unlocked?'':'locked'}`; b.disabled=!unlocked;
      const status=complete?'Complete':unlocked?`${done} of ${total} complete`:'Locked';
      const action=complete?'Review →':unlocked?'Continue →':'Complete prior stage';
      b.innerHTML=`<img src="${def.home}" alt=""><div class="stage-card-copy"><span>STAGE ${i+1}</span><h2>${stage}</h2><p>${def.description}</p><div class="stage-card-foot"><span class="status-pill ${complete?'complete':''}">${status}</span><strong>${action}</strong></div></div>`;
      if(unlocked) b.onclick=()=>route('stage',{stage}); cards.appendChild(b);
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
    const grid=$('stageExperienceGrid'); grid.querySelectorAll('.resume-builder-card').forEach(x=>x.remove());
    if(stage==='Resume Retreat'){
      const scenariosDone=done===total, rb=state.resumeBuilder||{};
      const b=document.createElement('button'); b.type='button'; b.className='board-card resume-builder-card'+(scenariosDone?'':' locked'); b.disabled=!scenariosDone;
      b.innerHTML=`<span class="card-kicker">REQUIRED • STEP 2</span><strong>Résumé Builder</strong><small>${!scenariosDone?'Complete the 5 Resume Retreat decisions to unlock.':rb.complete?'Employer-ready résumé complete ✓':'Build, review, and approve your employer-ready résumé.'}</small><span class="card-arrow">${rb.complete?'✓':'→'}</span>`;
      if(scenariosDone) b.onclick=()=>route('resume-builder'); grid.prepend(b);
      $('requiredPathTitle').textContent=scenariosDone?'Review Resume Decision Trail':'Continue Resume Decision Trail';
      $('requiredPathMeta').textContent=`${done} of ${total} decisions complete • Résumé Builder ${rb.complete?'complete':scenariosDone?'unlocked':'locked'}`;
      $('stageHomeProgress').textContent=stageComplete(stage)?'Complete':scenariosDone?'Builder required':`${done} of ${total} decisions`;
    }
  }


  let resumeStep=0;
  function resumeData(){ state.resumeBuilder=state.resumeBuilder||{step:0,target:'',summary:'',experience:'',evidence:'',skills:'',education:'',integrity:false,ready:false,complete:false}; return state.resumeBuilder; }
  const occupationAliases=[
    {match:/^(cdl|truck|truck driver|tractor trailer|tractor-trailer)$/i,title:'Heavy and Tractor-Trailer Truck Drivers'},
    {match:/^(cnc|cnc operator|cnc machinist)$/i,title:'Computer Numerically Controlled Tool Operators'},
    {match:/^(it|it support|help desk|tech support)$/i,title:'Computer User Support Specialists'},
    {match:/^(network|network support|network technician)$/i,title:'Computer Network Support Specialists'},
    {match:/^(weld|welder|welding)$/i,title:'Welders, Cutters, Solderers, and Brazers'},
    {match:/^(electrician|electrical)$/i,title:'Electricians'},
    {match:/^(hvac|heating and cooling|air conditioning)$/i,title:'Heating, Air Conditioning, and Refrigeration Mechanics and Installers'},
    {match:/^(customer service|csr)$/i,title:'Customer Service Representatives'},
    {match:/^(medical assistant|ma)$/i,title:'Medical Assistants'},
    {match:/^(cna|nursing assistant)$/i,title:'Nursing Assistants'}
  ];
  function normalizeOccupationEntry(value){const v=String(value||'').trim();const hit=occupationAliases.find(x=>x.match.test(v));return hit?hit.title:v;}
  function renderResumeBuilder(){
    const d=resumeData(); resumeStep=Math.max(0,Math.min(3,d.step||0));
    const fields={rbTarget:'target',rbSummary:'summary',rbExperience:'experience',rbEvidence:'evidence',rbSkills:'skills',rbEducation:'education'};
    Object.entries(fields).forEach(([id,key])=>{ $(id).value=d[key]||''; $(id).oninput=e=>{d[key]=e.target.value; saveState(); renderResumePreview();}; }); $('rbTarget').onchange=e=>{const formal=normalizeOccupationEntry(e.target.value);d.target=formal;e.target.value=formal;saveState();renderResumePreview();};
    $('rbIntegrity').checked=!!d.integrity; $('rbReady').checked=!!d.ready;
    $('rbIntegrity').onchange=e=>{d.integrity=e.target.checked; saveState();}; $('rbReady').onchange=e=>{d.ready=e.target.checked; saveState();};
    document.querySelectorAll('.resume-step').forEach((el,i)=>el.hidden=i!==resumeStep);
    const stepper=$('resumeStepper'); stepper.innerHTML=''; ['Direction','Experience','Skills & education','Review'].forEach((x,i)=>{const b=document.createElement('span');b.className='resume-step-dot '+(i<resumeStep?'done':i===resumeStep?'current':'');b.textContent=(i<resumeStep?'✓ ':i===resumeStep?'→ ':'')+x;stepper.appendChild(b);});
    $('rbPrev').disabled=resumeStep===0; $('rbNext').textContent=resumeStep===3?(d.complete?'Résumé complete ✓':'Complete Résumé ✓'):'Continue →';
    $('resumeBuilderStatus').textContent=d.complete?'Complete':'Step '+(resumeStep+1)+' of 4';
    renderResumePreview();
  }
  function renderResumePreview(){ const d=resumeData(); $('rpName').textContent=state.participantName||'Your Name'; $('rpTarget').textContent=d.target||'Target occupation'; $('rpSummary').textContent=d.summary||'Your professional summary will appear here.'; $('rpExperience').textContent=d.experience||'Experience'; $('rpEvidence').textContent=d.evidence||'Evidence and accomplishments'; $('rpSkills').textContent=d.skills||'Skills'; $('rpEducation').textContent=d.education||'Education, training, and credentials'; }
  const R2W_AI_URL='https://dxcajwarqojvmbteroco.supabase.co/functions/v1/ready2work-resume-ai';
  const R2W_AI_KEY='sb_publishable_ehUKOOksq5SlkTNb-wQ8ZA_Zh8XlWDF';
  async function callR2WResumeAI(body){const res=await fetch(R2W_AI_URL,{method:'POST',headers:{'Content-Type':'application/json','apikey':R2W_AI_KEY},body:JSON.stringify(body)});let data={};try{data=await res.json()}catch(_){}if(!res.ok)throw new Error(data?.message||data?.error||'Rosie AI is unavailable right now.');return data}
  function showResumeCoach(id,html){const el=$(id);if(!el)return;el.hidden=false;el.innerHTML=html}
  async function rosieBuildBullet(){
    const d=resumeData(),btn=$('rbBuildBullet'),choices=$('rbBulletChoices');if(!String(d.experience||'').trim()){showResumeCoach('rbBulletCoach','<b>Tell me about the experience first.</b><br>Use normal words. I’ll help shape it for the résumé.');$('rbExperience').focus();return}
    btn.disabled=true;btn.textContent='Rosie is working…';choices.innerHTML='';showResumeCoach('rbBulletCoach','<b>Working from your real experience…</b><br>I won’t add facts you didn’t give me.');
    try{const data=await callR2WResumeAI({mode:'bullet',evidence:{targetOccupation:d.target,experience:d.experience,context:d.evidence}});
      if(data.needsClarification){showResumeCoach('rbBulletCoach','<b>I need one detail before I write it.</b><br>'+escapeHtml(data.question||'Tell me one more detail about what you did.')+'<br><small>Add the answer in Evidence or accomplishments, then try again.</small>');$('rbEvidence').focus();return}
      if(data.integrityFailed)throw new Error('Rosie caught an unsupported detail and stopped the draft. Add more factual detail and try again.');
      const drafts=[{label:'Clear & Direct',text:data.clearDirect},{label:'Skills Forward',text:data.skillsForward}].filter(x=>x.text);
      showResumeCoach('rbBulletCoach','<b>Rosie drafted these only from what you entered.</b><br>Choose one, then edit it if you want.');
      choices.innerHTML=drafts.map((x,i)=>'<button type="button" class="rosie-draft" data-rb-draft="'+i+'"><b>'+escapeHtml(x.label)+'</b><span>'+escapeHtml(x.text)+'</span></button>').join('');
      choices.querySelectorAll('[data-rb-draft]').forEach(b=>b.onclick=()=>{d.evidence=drafts[Number(b.dataset.rbDraft)].text;$('rbEvidence').value=d.evidence;saveState();renderResumePreview();choices.querySelectorAll('.rosie-draft').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')});
    }catch(e){showResumeCoach('rbBulletCoach','<b>Rosie AI is temporarily unavailable.</b><br>'+escapeHtml(e.message||'Your own words are still saved.'))}finally{btn.disabled=false;btn.textContent='✦ Rosie: Turn This Into Résumé Evidence'}
  }
  async function rosieBuildSummary(){
    const d=resumeData(),btn=$('rbDraftSummary');btn.disabled=true;btn.textContent='Rosie is drafting…';showResumeCoach('rbSummaryCoach','<b>Building from your résumé evidence…</b>');
    try{const data=await callR2WResumeAI({mode:'summary',evidence:{targetOccupation:d.target,experience:d.experience,evidence:d.evidence,skills:d.skills,education:d.education}});
      if(data.needsClarification){showResumeCoach('rbSummaryCoach','<b>I need a little more evidence first.</b><br>'+escapeHtml(data.question||'Add more experience or skills, then try again.'));return}
      if(!data.summary)throw new Error('No summary was returned.');d.summary=data.summary;$('rbSummary').value=d.summary;saveState();renderResumePreview();showResumeCoach('rbSummaryCoach','<b>Draft ready.</b><br>Read it and change anything that doesn’t sound like you.');
    }catch(e){showResumeCoach('rbSummaryCoach','<b>Rosie AI is temporarily unavailable.</b><br>'+escapeHtml(e.message||'Your current résumé is still saved.'))}finally{btn.disabled=false;btn.textContent='✦ Rosie: Help Build My Summary'}
  }
  function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

  function validateResumeStep(){ const d=resumeData(); if(resumeStep===0)return d.target.trim()&&d.summary.trim(); if(resumeStep===1)return d.experience.trim()&&d.evidence.trim(); if(resumeStep===2)return d.skills.trim()&&d.education.trim(); return d.integrity&&d.ready; }

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
  function speak(text,onend){ if(onend) onend(); }
  function attachTrack(audio,src){ audio.querySelectorAll('track').forEach(t=>t.remove()); if(!src)return; const t=document.createElement('track'); t.kind='captions';t.srclang='en';t.label='English';t.src=src;t.default=state.ccOn; audio.appendChild(t); }
  function updateAudioControl(){ $('listenBtn').textContent=state.audioOn?'🔊 Audio On':'🔇 Audio Off'; $('listenBtn').setAttribute('aria-pressed',state.audioOn?'true':'false'); }
  function playPrompt(s){ if(!state.audioOn||!s?.promptFile)return; stopAudio(); attachTrack(promptAudio,s.promptVtt); promptAudio.src=s.promptFile; promptAudio.play().catch(()=>{}); }

  function renderScene(){
    updateOverall(); recalcScores(); saveState(); lastImpact=null;
    const s=scenes[state.currentScene]; activeStage=s.stage;
    const sceneImg=$('sceneImg');
    const mediaUrl=new URL(s.img,document.baseURI).href;
    const sceneVisual=sceneImg.closest('.scene-visual');
    sceneImg.classList.remove('media-failed');
    sceneVisual?.classList.remove('media-loaded');
    sceneVisual?.classList.remove('media-failed');
    sceneImg.alt=`${s.title} scenario`;
    sceneImg.onerror=null;
    sceneImg.onload=()=>{ sceneImg.classList.remove('media-failed'); sceneVisual?.classList.add('media-loaded'); };
    sceneImg.onerror=()=>{
      sceneImg.classList.add('media-failed');
      sceneImg.alt='';
      sceneImg.removeAttribute('src');
      sceneVisual?.classList.remove('media-loaded'); sceneVisual?.classList.add('media-failed');
    };
    sceneImg.src=mediaUrl;
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
    const stageList=stageScenes(s.stage), isStageEnd=s.id===stageList[stageList.length-1].id;
    if(!isStageEnd) $('nextSceneBtn').textContent='Next scenario →';
    else if(s.stage==='Soft Skills Base Camp') $('nextSceneBtn').textContent='Continue to Resume Retreat →';
    else if(s.stage==='Resume Retreat') $('nextSceneBtn').textContent='Continue to Résumé Builder →';
    else $('nextSceneBtn').textContent='View Work Readiness Progress →';
    $('ccBtn').textContent=state.ccOn?'CC':'CC Off'; updateAudioControl();
    if(state.audioOn) setTimeout(()=>playPrompt(s),120);
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
    if(state.audioOn && im.file){ impactAudio.src=im.file; impactAudio.play().catch(()=>{}); }
  }

  function certificateId(){
    const key=`${state.participantName||'participant'}|${state.firstOpened||''}|BOOST-R2W`;
    let h=2166136261; for(let i=0;i<key.length;i++){h^=key.charCodeAt(i);h=Math.imul(h,16777619)}
    return `PINAL-R2W-${(h>>>0).toString(36).toUpperCase().padStart(7,'0')}`;
  }
  function renderCertificate(){
    updateOverall(); recalcScores();
    $('participantName').value=state.participantName||'';
    const earned=allComplete(), n=answeredCount(), total=scenes.length;
    $('readinessProgressTitle').textContent=earned?'Work Ready Certificate earned':'Your progress so far';
    $('readinessProgressMeta').textContent=earned?`${total} of ${total} scenarios complete • all Ready 2 Work areas complete`:`${n} of ${total} scenarios complete • your skill profile updates with every decision`;
    $('readinessProgressBar').style.width=`${(n/total)*100}%`;
    const stageStatus=$('readinessStageStatus'); stageStatus.innerHTML='';
    stageOrder.forEach(stage=>{ const done=stageComplete(stage), unlocked=stageUnlocked(stage), el=document.createElement('div'); el.className=`readiness-stage-chip ${done?'complete':unlocked?'current':'locked'}`; el.innerHTML=`<strong>${done?'✓':unlocked?'→':'🔒'} ${stage}</strong><span>${done?'Complete':unlocked?(stageAnswered(stage)?`${stageAnswered(stage)} of ${stageScenes(stage).length} complete`:'Available'):'Locked'}</span>`; stageStatus.appendChild(el); });
    $('masteryProfileTitle').textContent=earned?'Final Soft Skill Mastery Profile':'Current Soft Skill Progress';
    const grid=$('certificateSkills'); grid.innerHTML='';
    skillOrder.forEach(k=>{ const m=mastery(k,earned?'final':'live'); const r=document.createElement('div'); r.className='cert-skill'; r.innerHTML=`<strong>${skillNames[k]}</strong><strong>${m.label}</strong>`; grid.appendChild(r); });
    const resumeDone=stageComplete('Resume Retreat'), interviewDone=stageComplete('Interview Landing');
    $('resumeReadiness').textContent=resumeDone?'Complete':'In Progress'; $('interviewReadiness').textContent=interviewDone?'Complete':'In Progress';
    $('certificateDate').textContent=allComplete()?new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric'}).format(new Date()):'Pending completion';
    $('certificateId').textContent=certificateId();
    $('certificateStatus').textContent=earned?'Certificate earned':'Work Readiness Progress';
    $('certificateLock').classList.toggle('show',!earned);
    $('certificateLock').querySelector('strong').textContent='Certificate in Progress';
    $('certificateLockText').textContent=`Keep building your work-readiness evidence. ${n} of ${total} scenarios are complete. Your current skill profile is shown above; the final credential unlocks when all Ready 2 Work requirements are complete.`;
    $('printCertificateBtn').disabled=!earned;
  }

  document.addEventListener('click',e=>{
    const r=e.target.closest('[data-route]'); if(r){ e.preventDefault(); route(r.dataset.route); }
    const s=e.target.closest('[data-stage]'); if(s){ e.preventDefault(); const stage=s.dataset.stage; if(stageUnlocked(stage)) route('stage',{stage}); }
  });
  $('backToStage').onclick=()=>route('stage',{stage:scenes[state.currentScene].stage});
  $('prevSceneBtn').onclick=()=>{ if(state.currentScene>0) route('scene',{index:state.currentScene-1}); };
  $('nextSceneBtn').onclick=()=>{
    const current=scenes[state.currentScene], list=stageScenes(current.stage), isStageEnd=current.id===list[list.length-1].id;
    if(isStageEnd){
      if(current.stage==='Soft Skills Base Camp'){ route('stage',{stage:'Resume Retreat'}); return; }
      if(current.stage==='Resume Retreat'){ route('resume-builder'); return; }
      if(current.stage==='Interview Landing'){ route('certificate'); return; }
    }
    if(state.currentScene<scenes.length-1) route('scene',{index:state.currentScene+1});
  };
  $('resumeBackBtn').onclick=()=>route('stage',{stage:'Resume Retreat'});
  $('rbBuildBullet').onclick=rosieBuildBullet;
  $('rbDraftSummary').onclick=rosieBuildSummary;
  $('rbPrev').onclick=()=>{ if(resumeStep>0){resumeStep--; resumeData().step=resumeStep; saveState(); renderResumeBuilder();} };
  $('rbNext').onclick=()=>{ if(!validateResumeStep()){ alert('Complete the required fields on this step before continuing.'); return; } const d=resumeData(); if(resumeStep<3){resumeStep++;d.step=resumeStep;saveState();renderResumeBuilder();}else{d.complete=true;d.completedAt=new Date().toISOString();saveState();renderResumeBuilder();updateOverall();setTimeout(()=>route('stage',{stage:'Resume Retreat'}),350);} };
  $('listenBtn').onclick=()=>{ state.audioOn=!state.audioOn; saveState(); updateAudioControl(); if(state.audioOn) playPrompt(scenes[state.currentScene]); else stopAudio(); };
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
  else if(hash==='#resume-builder'){ route('resume-builder'); }
  else if(hash.startsWith('#stage-')){ const wanted=hash.slice(7); const stage=stageOrder.find(s=>slug(s)===wanted)||stageOrder[0]; route('stage',{stage}); }
  else route('map');
})();
