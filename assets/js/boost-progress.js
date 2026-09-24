(function(){
  "use strict";

  const cfg=window.BOOST_CONFIG||{};
  const REGION=cfg.region||"Pinal County";
  const MAP_KEY="boostPathwaysV29";
  const OLD_MAP_KEY="boostPathwaysV28";
  const JOURNEY_KEY="pinal_boost_journey_v1";
  const SHARED_CAREER_KEY="pinal_boost_career_exploration_v1";
  const NONCE_PREFIX="boost_completion_nonce:";
  const RETURN_FLAG="boost_complete";
  const SYNC_FLAG="boost_progress_synced";
  const RAPID_SKILL_MOBILITY_URL="rapid-employment.html";
  const RAPID_JOB_SEARCH_URL="https://pinalworkforce1-del.github.io/48_hour_job_search/boost.html";
  const PORTAL_PATH_KEY="boostPortalPathway_v2";
  const JOB_SEARCH_KEY="boost48JobSearchV11";
  const FINANCIAL_KEY="pinal_boost_financial_v1";
  const CORE_WRAPPED=new Set(["module1","module2","module3","module4","module5"]);
  const CORE_PREVIOUS={module2:"module1",module3:"module2",module4:"module3"};
  let client=null;

  const keyForModule=id=>id.startsWith("industry-")?"i:"+id.slice(9):"m:"+id;

  function getClient(){
    if(client)return client;
    if(window.PinalBOOSTCloud?.getClient){client=window.PinalBOOSTCloud.getClient();return client}
    if(!cfg.supabaseUrl||!cfg.supabaseAnonKey||!window.supabase?.createClient)return null;
    client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    return client;
  }

  function randomNonce(){const bytes=new Uint8Array(24);crypto.getRandomValues(bytes);return Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("")}
  function parseMap(){try{return JSON.parse(localStorage.getItem(MAP_KEY)||localStorage.getItem(OLD_MAP_KEY)||'{"pathway":null,"complete":{}}')}catch(_){return {pathway:null,complete:{}}}}
  function journey(){try{return JSON.parse(localStorage.getItem(JOURNEY_KEY)||'{}')||{}}catch(_){return{}}}
  function sharedCareerState(){try{return JSON.parse(localStorage.getItem(SHARED_CAREER_KEY)||'{}')||{}}catch(_){return{}}}
  function hasPayload(moduleId){const m=journey().modules?.[moduleId];return !!(m&&typeof m==="object"&&Object.keys(m).length)}
  function selectedPath(map=parseMap()){return localStorage.getItem(PORTAL_PATH_KEY)||map.pathway||null}
  function writeJourney(j){j.updated_at=new Date().toISOString();localStorage.setItem(JOURNEY_KEY,JSON.stringify(j));return j}
  function repairStandaloneEvidence(moduleId){
    if(hasPayload(moduleId))return true;
    const j=journey();j.modules=j.modules||{};j.progress=j.progress||{};
    if(moduleId==="jobsearch"){
      let s=null;try{s=JSON.parse(localStorage.getItem(JOB_SEARCH_KEY)||"null")}catch(_){}
      if(!s?.completed)return false;
      const completedAt=s.completedAt||new Date().toISOString();
      j.modules.jobsearch={module:"jobsearch",source:"recovered_48_hour_job_search_local_state",version:2,completedAt,values:s.values||{},lists:s.lists||{},checks:s.checks||{},phases:s.phases||{},activities:s.activities||{},mistakeDone:s.mistakeDone||[]};
      j.progress.jobsearch="complete";writeJourney(j);return true;
    }
    if(moduleId==="financial"){
      let s=null;try{s=JSON.parse(localStorage.getItem(FINANCIAL_KEY)||"null")}catch(_){}
      if(!s?.completedAt||!s?.evidence)return false;
      j.modules.financial=Object.assign({module:"financial",source:"recovered_financial_local_state",version:2,completedAt:s.completedAt},s.evidence);
      j.progress.financial="complete";writeJourney(j);return true;
    }
    if(moduleId==="ai"){
      const legacy=j.modules.module5;
      if(!legacy||typeof legacy!=="object"||(!String(legacy.version||"").startsWith("ai-you-")&&!legacy.scenario))return false;
      j.modules.ai=Object.assign({module:"ai",source:"recovered_ai_you_legacy_module5"},legacy);
      if(String(legacy.version||"").startsWith("ai-you-"))delete j.modules.module5;
      if(j.modules.module5_checkpoint&&!j.modules.ai_checkpoint)j.modules.ai_checkpoint=j.modules.module5_checkpoint;
      if(j.modules.module5_checkpoint)delete j.modules.module5_checkpoint;
      j.progress.ai="complete";writeJourney(j);return true;
    }
    return false;
  }
  function notify(message){if(window.BOOSTPortal?.toast)window.BOOSTPortal.toast(message);else alert(message)}

  function moduleIdFor(el){
    if(el.hasAttribute("data-investment-card"))return "module5";
    return el.dataset.moduleId||(el.dataset.industryId?"industry-"+el.dataset.industryId:null)||(el.hasAttribute("data-career-skillmobility")?"industry-skillmobility":null);
  }

  function prerequisitesMet(moduleId){
    const map=parseMap(),complete=map.complete||{},path=selectedPath(map),previous=CORE_PREVIOUS[moduleId];
    const requireStep=(id,missingMessage,evidenceMessage)=>{
      if(!complete[keyForModule(id)]){notify(missingMessage);return false}
      if(!hasPayload(id)&&!repairStandaloneEvidence(id)){notify(evidenceMessage);return false}
      return true;
    };
    if(previous&&!requireStep(previous,"Complete the previous BOOST module before continuing.","Your previous completion predates BOOST data sharing. Reopen and save the previous module once so its results can carry forward."))return false;
    if(moduleId==="skillmobility"&&!requireStep("module1","Complete Module 1 — Discover before starting Finding Yourself in Work.","Reopen and save Module 1 once so its results can carry into Finding Yourself in Work."))return false;
    if(moduleId==="jobsearch"&&!requireStep("skillmobility","Complete Finding Yourself in Work before starting the 48-Hour Job Search.","Reopen and save Finding Yourself in Work once so its results can carry into the 48-Hour Job Search."))return false;
    if(moduleId==="financial"){
      if(path!=="rapid"&&path!=="career"){notify("Choose your BOOST pathway before starting Build Strong Financial Habits.");return false}
      const prior=path==="career"?"module5":"jobsearch";
      const label=path==="career"?"Career Investment Explorer":"the 48-Hour Job Search";
      if(!requireStep(prior,"Complete "+label+" before starting Build Strong Financial Habits.","Reopen and save "+label+" once so its results can carry into Build Strong Financial Habits."))return false;
    }
    if(moduleId==="ai"){
      if(path==="career"&&!requireStep("module5","Complete Career Investment Explorer before starting AI & You.","Reopen and save Career Investment Explorer once so its results can carry into AI & You."))return false;
      if(!requireStep("financial","Complete Build Strong Financial Habits before starting AI & You.","Reopen and save Build Strong Financial Habits once so its results can carry into AI & You."))return false;
    }
    if(moduleId.startsWith("industry-")){
      if(path!=="career"){notify("Choose the Career Exploration & Development pathway before starting an Industry Experience.");return false}
      if(!requireStep("module4","Complete Module 4 — Decide before starting your Industry Experience.","Reopen and save Module 4 once so its decision evidence can carry into your Industry Experience."))return false;
    }
    if(moduleId==="module5"){
      if(path!=="career"){notify("Career Investment Explorer is part of the Career Exploration & Development pathway.");return false}
      if(!requireStep("module4","Complete Module 4 — Decide before opening Career Investment Explorer.","Reopen and save Module 4 once so its decision evidence can carry into Career Investment Explorer."))return false;
      const industryEntry=Object.entries(complete).find(([k,v])=>k.startsWith("i:")&&v===true);
      if(!industryEntry){notify("Complete your selected Industry Experience before opening Career Investment Explorer.");return false}
      const industryId="industry-"+industryEntry[0].slice(2);
      if(!hasPayload(industryId)){notify("Your Industry Experience completion predates data sharing. Reopen and save that experience once so its evidence can carry into Career Investment Explorer.");return false}
    }
    return true;
  }

  function wrappedActivity(moduleId){if(CORE_WRAPPED.has(moduleId))return moduleId;if(moduleId.startsWith("industry-")&&moduleId!=="industry-skillmobility")return moduleId.slice(9);return null}

  function wireRapidSkillMobility(){
    const el=document.querySelector('[data-module-id="skillmobility"]');if(!el)return;
    el.setAttribute("href",RAPID_SKILL_MOBILITY_URL);el.removeAttribute("target");el.removeAttribute("rel");el.setAttribute("aria-label","Open Rapid Employment Skill Mobility");
    const label=el.querySelector('.hotspot-label');if(label)label.textContent="Open Rapid Employment Skill Mobility";
  }
  function wireRapidJobSearch(){
    const el=document.querySelector('[data-module-id="jobsearch"]');if(!el)return;
    el.setAttribute("href",RAPID_JOB_SEARCH_URL);el.removeAttribute("target");el.removeAttribute("rel");
  }

  function launchModule(el,event){
    const moduleId=moduleIdFor(el);if(!moduleId)return;
    const href=moduleId==="skillmobility"?RAPID_SKILL_MOBILITY_URL:moduleId==="jobsearch"?RAPID_JOB_SEARCH_URL:el.getAttribute("href");
    if(!href||href==="#"||el.dataset.coming)return;
    event.preventDefault();event.stopImmediatePropagation();if(!prerequisitesMet(moduleId))return;

    const nonce=randomNonce();sessionStorage.setItem(NONCE_PREFIX+moduleId,nonce);
    if(el.dataset.setPathway){localStorage.setItem("boostPortalPathway_v2",el.dataset.setPathway);const map=parseMap();map.pathway=el.dataset.setPathway;localStorage.setItem(MAP_KEY,JSON.stringify(map))}
    if(moduleId==="module5")localStorage.setItem("boostPortalPathway_v2","career");

    const returnUrl=location.origin+location.pathname,activity=wrappedActivity(moduleId);let destination;
    if(activity){destination=new URL("activity.html",location.href);destination.searchParams.set("m",activity);destination.searchParams.set("boost_source",new URL(href,location.href).toString())}
    else destination=new URL(href,location.href);
    destination.searchParams.set("boost_return",returnUrl);destination.searchParams.set("boost_module",moduleId);destination.searchParams.set("boost_nonce",nonce);location.assign(destination.toString());
  }

  async function recordReturn(c,session){
    const params=new URLSearchParams(location.search),moduleId=params.get(RETURN_FLAG),nonce=params.get("boost_nonce");if(!moduleId)return false;
    const expected=sessionStorage.getItem(NONCE_PREFIX+moduleId),clean=new URL(location.href);clean.searchParams.delete(RETURN_FLAG);clean.searchParams.delete("boost_nonce");
    if(!expected||!nonce||expected!==nonce){history.replaceState({},"",clean.toString());console.warn("BOOST completion return was not accepted because its session receipt did not match.");return false}
    if(!hasPayload(moduleId))repairStandaloneEvidence(moduleId);
    if(!hasPayload(moduleId)){history.replaceState({},"",clean.toString());console.warn("BOOST completion return was not accepted because its journey evidence was not saved.");notify("Your module results were not saved, so BOOST did not mark this step complete. Please reopen the module and save again.");return false}

    const now=new Date().toISOString();
    const {error}=await c.from("boost_module_progress").upsert({user_id:session.user.id,region:REGION,module_id:moduleId,pathway:moduleId==="module1"?"shared":(moduleId.startsWith("industry-")||moduleId==="module5"?"career":(localStorage.getItem("boostPortalPathway_v2")||null)),status:"completed",evidence:{source:"module_completion_return",version:2,journey_payload_saved:true},completed_at:now,updated_at:now},{onConflict:"user_id,region,module_id"});
    if(error){console.error("BOOST completion could not be saved:",error.message);return false}
    try{await window.PinalBOOSTCloud?.saveNow?.()}catch(e){console.warn("BOOST journey save after completion failed",e)}
    sessionStorage.removeItem(NONCE_PREFIX+moduleId);history.replaceState({},"",clean.toString());return true;
  }

  function completeValidationRows(rows){const required=["jobs","wages","prep","employerSupport","life","future"],list=Object.values(rows||{}).filter(v=>v&&typeof v==="object");return !!(list.length&&list.every(v=>required.every(k=>String(v[k]??"").trim())))}
  function recoverableModule2Evidence(){
    const j=journey(),jm=j.modules?.module2||{};
    if(completeValidationRows(jm.validationBySoc))return {source:"journey",module2:jm,validationBySoc:jm.validationBySoc};
    const careers=(jm.careers||[]).filter(v=>v&&typeof v==="object");
    if(careers.length&&careers.every(v=>[v.jobsInterpretation,v.wagesInterpretation,v.preparationReadiness,v.employerSupport,v.lifeInterpretation,v.future].every(x=>String(x??"").trim())))return {source:"journey-careers",module2:jm,validationBySoc:jm.validationBySoc||{}};
    const shared=sharedCareerState(),sm=shared.module2||{};if(completeValidationRows(sm.validationBySoc))return {source:"shared-career-record",module2:sm,validationBySoc:sm.validationBySoc};return null;
  }
  function ensureJourneyModule2(recovery){
    const j=journey(),shared=sharedCareerState(),existing=j.modules?.module2||{};j.modules=j.modules||{};j.progress=j.progress||{};
    if(!Object.keys(existing).length||!completeValidationRows(existing.validationBySoc)){
      const selected=shared.module1?.selected||[],rows=recovery.validationBySoc||{},careers=selected.map(o=>{const v=rows[o.soc]||{};return {title:o.title||"",soc:o.soc||"",origin:o.origin||"Saved in Module 1",pathway:o.pathway||null,regional:o.regional||null,jobsInterpretation:v.jobs||"",wagesInterpretation:v.wages||"",preparationReadiness:v.prep||"",employerSupport:v.employerSupport||"",lifeInterpretation:v.life||"",future:v.future||"",entryWage:v.entryWage||null,preparationIntel:v.preparationIntel||null,validation:v}});
      j.modules.module2=Object.assign({},existing,recovery.module2||{},{module:"module2",source:"recovered_from_saved_reality_check",validationBySoc:rows,careers,completedAt:existing.completedAt||recovery.module2?.completedAt||new Date().toISOString()});
    }
    j.progress.module2="complete";localStorage.setItem(JOURNEY_KEY,JSON.stringify(j));return j.modules.module2;
  }
  async function repairValidatedModule2(c,session){
    const recovery=recoverableModule2Evidence();if(!recovery)return false;const module2=ensureJourneyModule2(recovery);
    const {data,error}=await c.from("boost_module_progress").select("module_id").eq("user_id",session.user.id).eq("region",REGION).eq("module_id","module2").eq("status","completed").maybeSingle();
    if(error){console.warn("BOOST Module 2 progress repair check failed:",error.message);return false}if(data?.module_id)return false;
    const now=new Date().toISOString(),completedAt=module2.completedAt||module2.originalModule2CompletedAt||module2.capturedAt||now;
    const {error:upsertError}=await c.from("boost_module_progress").upsert({user_id:session.user.id,region:REGION,module_id:"module2",pathway:"career",status:"completed",evidence:{source:"saved_module2_evidence_repair",version:2,journey_payload_saved:true,recovered_from:recovery.source},completed_at:completedAt,updated_at:now},{onConflict:"user_id,region,module_id"});
    if(upsertError){console.warn("BOOST Module 2 validated progress repair failed:",upsertError.message);return false}try{await window.PinalBOOSTCloud?.saveNow?.()}catch(e){console.warn("BOOST journey save after Module 2 repair did not finish",e)}console.info("BOOST restored Module 2 validated completion from saved Reality Check evidence.");return true;
  }
  async function repairStandaloneValidatedProgress(c,session){
    const repairs=[
      {id:"jobsearch",pathway:"rapid"},
      {id:"financial",pathway:selectedPath(parseMap())||null}
    ];
    let changed=false;
    for(const item of repairs){
      if(!repairStandaloneEvidence(item.id))continue;
      const {data,error}=await c.from("boost_module_progress").select("module_id").eq("user_id",session.user.id).eq("region",REGION).eq("module_id",item.id).eq("status","completed").maybeSingle();
      if(error){console.warn("BOOST "+item.id+" recovery check failed:",error.message);continue}
      if(data?.module_id)continue;
      const payload=journey().modules?.[item.id]||{},now=new Date().toISOString(),completedAt=payload.completedAt||payload.completed_at||now;
      const pathway=item.id==="jobsearch"?"rapid":(item.pathway==="career"?"career":"rapid");
      const {error:upsertError}=await c.from("boost_module_progress").upsert({user_id:session.user.id,region:REGION,module_id:item.id,pathway,status:"completed",evidence:{source:"saved_local_evidence_repair",version:2,journey_payload_saved:true,recovered_from:payload.source||"local_state"},completed_at:completedAt,updated_at:now},{onConflict:"user_id,region,module_id"});
      if(upsertError){console.warn("BOOST "+item.id+" validated progress recovery failed:",upsertError.message);continue}
      changed=true;
    }
    if(changed){try{await window.PinalBOOSTCloud?.saveNow?.()}catch(e){console.warn("BOOST journey save after standalone recovery did not finish",e)}}
    return changed;
  }

  async function syncValidatedProgress(c,session,forceReload){
    const {data,error}=await c.from("boost_module_progress").select("module_id").eq("user_id",session.user.id).eq("region",REGION).eq("status","completed");if(error){console.error("BOOST validated progress could not be loaded:",error.message);return}
    const map=parseMap(),next={};(data||[]).forEach(row=>{next[keyForModule(row.module_id)]=true});const changed=JSON.stringify(map.complete||{})!==JSON.stringify(next);map.complete=next;localStorage.setItem(MAP_KEY,JSON.stringify(map));
    if((changed||forceReload)&&sessionStorage.getItem(SYNC_FLAG)!=="1"){sessionStorage.setItem(SYNC_FLAG,"1");location.reload();return}sessionStorage.removeItem(SYNC_FLAG);
  }

  function retireStandaloneCareerSkillMobility(){document.querySelectorAll('[data-career-skillmobility]').forEach(el=>{el.style.display='none';el.setAttribute('aria-hidden','true');el.setAttribute('tabindex','-1')})}

  async function boot(){
    retireStandaloneCareerSkillMobility();wireRapidSkillMobility();wireRapidJobSearch();
    const c=getClient();if(!c)return;const {data}=await c.auth.getSession();const session=data.session;if(!session?.user)return;
    const recorded=await recordReturn(c,session),repaired=await repairValidatedModule2(c,session),standaloneRepaired=await repairStandaloneValidatedProgress(c,session);await syncValidatedProgress(c,session,recorded||repaired||standaloneRepaired);
  }

  document.addEventListener("click",event=>{const el=event.target.closest("[data-module-id], [data-industry-id], [data-career-skillmobility], [data-investment-card]");if(el)launchModule(el,event)},true);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
  window.BOOSTValidatedProgress={refresh:boot};
})();