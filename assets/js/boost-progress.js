(function(){
  "use strict";

  const cfg=window.BOOST_CONFIG||{};
  const REGION=cfg.region||"Pinal County";
  const MAP_KEY="boostPathwaysV29";
  const OLD_MAP_KEY="boostPathwaysV28";
  const NONCE_PREFIX="boost_completion_nonce:";
  const RETURN_FLAG="boost_complete";
  const SYNC_FLAG="boost_progress_synced";
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

  function launchModule(el,event){
    const href=el.getAttribute("href");
    if(!href||href==="#"||el.dataset.coming)return;
    const moduleId=el.dataset.moduleId
      ||(el.dataset.industryId?"industry-"+el.dataset.industryId:null)
      ||(el.hasAttribute("data-career-skillmobility")?"industry-skillmobility":null);
    if(!moduleId)return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const nonce=randomNonce();
    sessionStorage.setItem(NONCE_PREFIX+moduleId,nonce);
    if(el.dataset.setPathway){
      localStorage.setItem("boostPortalPathway_v2",el.dataset.setPathway);
      const map=parseMap();
      map.pathway=el.dataset.setPathway;
      localStorage.setItem(MAP_KEY,JSON.stringify(map));
    }

    const destination=new URL(href,location.href);
    destination.searchParams.set("boost_return",location.origin+location.pathname);
    destination.searchParams.set("boost_module",moduleId);
    destination.searchParams.set("boost_nonce",nonce);
    location.assign(destination.toString());
  }

  function parseMap(){
    try{return JSON.parse(localStorage.getItem(MAP_KEY)||localStorage.getItem(OLD_MAP_KEY)||'{"pathway":null,"complete":{}}')}
    catch(_){return {pathway:null,complete:{}}}
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

    const {error}=await c.from("boost_module_progress").upsert({
      user_id:session.user.id,
      region:REGION,
      module_id:moduleId,
      pathway:moduleId==="module1"?"shared":(localStorage.getItem("boostPortalPathway_v2")||null),
      status:"completed",
      evidence:{source:"module_completion_return",version:1},
      completed_at:new Date().toISOString(),
      updated_at:new Date().toISOString()
    },{onConflict:"user_id,region,module_id"});

    if(error){
      console.error("BOOST completion could not be saved:",error.message);
      return false;
    }

    sessionStorage.removeItem(NONCE_PREFIX+moduleId);
    history.replaceState({},"",clean.toString());
    return true;
  }

  async function syncValidatedProgress(c,session,forceReload){
    const {data,error}=await c.from("boost_module_progress")
      .select("module_id")
      .eq("user_id",session.user.id)
      .eq("region",REGION)
      .eq("status","completed");

    if(error){
      console.error("BOOST validated progress could not be loaded:",error.message);
      return;
    }

    const map=parseMap();
    const next={};
    (data||[]).forEach(row=>{next[keyForModule(row.module_id)]=true});
    const changed=JSON.stringify(map.complete||{})!==JSON.stringify(next);
    map.complete=next;
    localStorage.setItem(MAP_KEY,JSON.stringify(map));

    if((changed||forceReload)&&sessionStorage.getItem(SYNC_FLAG)!=="1"){
      sessionStorage.setItem(SYNC_FLAG,"1");
      location.reload();
      return;
    }
    sessionStorage.removeItem(SYNC_FLAG);
  }

  async function boot(){
    const c=getClient();
    if(!c)return;
    const {data}=await c.auth.getSession();
    const session=data.session;
    if(!session?.user)return;

    const recorded=await recordReturn(c,session);
    await syncValidatedProgress(c,session,recorded);
  }

  document.addEventListener("click",event=>{
    const el=event.target.closest("[data-module-id], [data-industry-id], [data-career-skillmobility]");
    if(el)launchModule(el,event);
  },true);

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);
  else boot();

  window.BOOSTValidatedProgress={refresh:boot};
})();