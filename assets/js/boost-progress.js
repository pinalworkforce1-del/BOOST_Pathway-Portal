(function(){
  "use strict";

  const cfg=window.BOOST_CONFIG||{};
  const REGION=cfg.region||"Pinal County";
  const MAP_KEY="boostPathwaysV29";
  const OLD_MAP_KEY="boostPathwaysV28";
  const JOURNEY_KEY="pinal_boost_journey_v1";
  const NONCE_PREFIX="boost_completion_nonce:";
  const RETURN_FLAG="boost_complete";
  const SYNC_FLAG="boost_progress_synced";
  const CORE_WRAPPED=new Set(["module1","module2","module3","module4","module5"]);
  const CORE_PREVIOUS={module2:"module1",module3:"module2",module4:"module3"};
  let client=null;

  const keyForModule=id=>id.startsWith("industry-")?"i:"+id.slice(9):"m:"+id;

  function getClient(){
    if(client)return client;
    if(window.PinalBOOSTCloud?.getClient){client=window.PinalBOOSTCloud.getClient();return client}
    if(!cfg.supabaseUrl||!cfg.supabaseAnonKey||!window.supabase?.createClient)return null;
    client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
    });
    return client;
  }

  function randomNonce(){
    const bytes=new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
  }

  function parseMap(){
    try{return JSON.parse(localStorage.getItem(MAP_KEY)||localStorage.getItem(OLD_MAP_KEY)||'{"pathway":null,"complete":{}}')}
    catch(_){return {pathway:null,complete:{}}}
  }
  function journey(){
    try{return JSON.parse(localStorage.getItem(JOURNEY_KEY)||'{}')||{}}
    catch(_){return{}}
  }
  function hasPayload(moduleId){
    const m=journey().modules?.[moduleId];
    return !!(m&&typeof m==="object"&&Object.keys(m).length);
  }

  function notify(message){
    if(window.BOOSTPortal?.toast)window.BOOSTPortal.toast(message);
    else alert(message);
  }

  function moduleIdFor(el){
    if(el.hasAttribute("data-investment-card"))return "module5";
    return el.dataset.moduleId
      ||(el.dataset.industryId?"industry-"+el.dataset.industryId:null)
      ||(el.hasAttribute("data-career-skillmobility")?"industry-skillmobility":null);
  }

  function prerequisitesMet(moduleId){
    const map=parseMap(),complete=map.complete||{};
    const previous=CORE_PREVIOUS[moduleId];
    if(previous&&!complete[keyForModule(previous)]){
      notify("Complete the previous BOOST module before continuing.");
      return false;
    }
    if(previous&&!hasPayload(previous)){
      notify("Your previous completion predates BOOST data sharing. Reopen and save the previous module once so its results can carry forward.");
      return false;
    }
    if(moduleId.startsWith("industry-")){
      if(!complete["m:module4"]){notify("Complete Module 4 — Decide before starting your Industry Experience.");return false;}
      if(!hasPayload("module4")){notify("Reopen and save Module 4 once so its decision evidence can carry into your Industry Experience.");return false;}
    }
    if(moduleId==="module5"){
      if(!complete["m:module4"]){notify("Complete Module 4 — Decide before opening Skill Investment.");return false;}
      if(!hasPayload("module4")){notify("Reopen and save Module 4 once so its decision evidence can carry into Skill Investment.");return false;}
      const industryEntry=Object.entries(complete).find(([k,v])=>k.startsWith("i:")&&v===true);
      if(!industryEntry){notify("Complete your selected Industry Experience before opening Skill Investment.");return false;}
      const industryId="industry-"+industryEntry[0].slice(2);
      if(!hasPayload(industryId)){notify("Your Industry Experience completion predates data sharing. Reopen and save that experience once so its evidence can carry into Skill Investment.");return false;}
    }
    return true;
  }

  function wrappedActivity(moduleId){
    if(CORE_WRAPPED.has(moduleId))return moduleId;
    if(moduleId.startsWith("industry-")&&moduleId!=="industry-skillmobility")return moduleId.slice(9);
    return null;
  }

  function launchModule(el,event){
    const href=el.getAttribute("href");
    if(!href||href==="#"||el.dataset.coming)return;
    const moduleId=moduleIdFor(el);
    if(!moduleId)return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if(!prerequisitesMet(moduleId))return;

    const nonce=randomNonce();
    sessionStorage.setItem(NONCE_PREFIX+moduleId,nonce);
    if(el.dataset.setPathway){
      localStorage.setItem("boostPortalPathway_v2",el.dataset.setPathway);
      const map=parseMap();
      map.pathway=el.dataset.setPathway;
      localStorage.setItem(MAP_KEY,JSON.stringify(map));
    }
    if(moduleId==="module5")localStorage.setItem("boostPortalPathway_v2","career");

    const returnUrl=location.origin+location.pathname;
    const activity=wrappedActivity(moduleId);
    let destination;
    if(activity){
      destination=new URL("activity.html",location.href);
      destination.searchParams.set("m",activity);
      destination.searchParams.set("boost_source",new URL(href,location.href).toString());
    }else destination=new URL(href,location.href);
    destination.searchParams.set("boost_return",returnUrl);
    destination.searchParams.set("boost_module",moduleId);
    destination.searchParams.set("boost_nonce",nonce);
    location.assign(destination.toString());
  }

  async function recordReturn(c,session){
    const params=new URLSearchParams(location.search);
    const moduleId=params.get(RETURN_FLAG);
    const nonce=params.get("boost_nonce");
    if(!moduleId)return false;

    const expected=sessionStorage.getItem(NONCE_PREFIX+moduleId);
    const clean=new URL(location.href);
    clean.searchParams.delete(RETURN_FLAG);
    clean.searchParams.delete("boost_nonce");

    if(!expected||!nonce||expected!==nonce){
      history.replaceState({},"",clean.toString());
      console.warn("BOOST completion return was not accepted because its session receipt did not match.");
      return false;
    }
    if(!hasPayload(moduleId)){
      history.replaceState({},"",clean.toString());
      console.warn("BOOST completion return was not accepted because its journey evidence was not saved.");
      notify("Your module results were not saved, so BOOST did not mark this step complete. Please reopen the module and save again.");
      return false;
    }

    const now=new Date().toISOString();
    const {error}=await c.from("boost_module_progress").upsert({
      user_id:session.user.id,
      region:REGION,
      module_id:moduleId,
      pathway:moduleId==="module1"?"shared":(moduleId.startsWith("industry-")||moduleId==="module5"?"career":(localStorage.getItem("boostPortalPathway_v2")||null)),
      status:"completed",
      evidence:{source:"module_completion_return",version:2,journey_payload_saved:true},
      completed_at:now,
      updated_at:now
    },{onConflict:"user_id,region,module_id"});

    if(error){console.error("BOOST completion could not be saved:",error.message);return false;}

    try{await window.PinalBOOSTCloud?.saveNow?.()}catch(e){console.warn("BOOST journey save after completion failed",e)}
    sessionStorage.removeItem(NONCE_PREFIX+moduleId);
    history.replaceState({},"",clean.toString());
    return true;
  }

  async function syncValidatedProgress(c,session,forceReload){
    const {data,error}=await c.from("boost_module_progress").select("module_id").eq("user_id",session.user.id).eq("region",REGION).eq("status","completed");
    if(error){console.error("BOOST validated progress could not be loaded:",error.message);return;}
    const map=parseMap(),next={};
    (data||[]).forEach(row=>{next[keyForModule(row.module_id)]=true});
    const changed=JSON.stringify(map.complete||{})!==JSON.stringify(next);map.complete=next;localStorage.setItem(MAP_KEY,JSON.stringify(map));
    if((changed||forceReload)&&sessionStorage.getItem(SYNC_FLAG)!=="1"){
      sessionStorage.setItem(SYNC_FLAG,"1");location.reload();return;
    }
    sessionStorage.removeItem(SYNC_FLAG);
  }

  async function boot(){
    const c=getClient();if(!c)return;
    const {data}=await c.auth.getSession();const session=data.session;if(!session?.user)return;
    const recorded=await recordReturn(c,session);await syncValidatedProgress(c,session,recorded);
  }

  document.addEventListener("click",event=>{
    const el=event.target.closest("[data-module-id], [data-industry-id], [data-career-skillmobility], [data-investment-card]");
    if(el)launchModule(el,event);
  },true);

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
  window.BOOSTValidatedProgress={refresh:boot};
})();