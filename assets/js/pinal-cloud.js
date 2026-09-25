(function(){
  'use strict';
  const J='pinal_boost_journey_v1',ID='pinal_boost_cloud_journey_id',TOK='pinal_boost_cloud_access_token',REGION='Pinal County';
  const cfg=window.PINAL_BOOST_CONFIG||{}; let client=null,timer=null;
  function c(){if(!client&&window.supabase&&cfg.url&&cfg.key)client=window.supabase.createClient(cfg.url,cfg.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});return client}
  function randomToken(){const b=new Uint8Array(32);crypto.getRandomValues(b);return Array.from(b,x=>x.toString(16).padStart(2,'0')).join('')}
  function creds(){let id=localStorage.getItem(ID),t=localStorage.getItem(TOK);if(!id){id=crypto.randomUUID();localStorage.setItem(ID,id)}if(!t){t=randomToken();localStorage.setItem(TOK,t)}return{id,token:t}}
  function get(){try{return JSON.parse(localStorage.getItem(J)||'{}')}catch(e){return{}}}
  const downstream={module1:['module2','module3','module4','module5'],module2:['module3','module4','module5'],module3:['module4','module5'],module4:['module5']};
  function moduleTime(mod){const v=mod?.completedAt||mod?.finalizedAt||mod?.evaluatedAt||'';const t=Date.parse(v);return Number.isFinite(t)?t:0}
  function clearCompletionRefs(j,ids){
    const stale=new Set(ids||[]);
    if(Array.isArray(j?.portal?.completed))j.portal.completed=j.portal.completed.filter(id=>!stale.has(id));
    const mc=j?.portal?.mapState?.complete;if(mc)stale.forEach(id=>{delete mc['m:'+id]});
    try{
      const done=new Set(JSON.parse(localStorage.getItem('boostPortalCompleted_v2')||'[]'));stale.forEach(id=>done.delete(id));localStorage.setItem('boostPortalCompleted_v2',JSON.stringify([...done]));
      const ms=JSON.parse(localStorage.getItem('boostPathwaysV29')||'{}');ms.complete=ms.complete||{};stale.forEach(id=>delete ms.complete['m:'+id]);localStorage.setItem('boostPathwaysV29',JSON.stringify(ms));
    }catch(_){}
  }
  function markStale(j,ids,reason){
    j.progress=j.progress||{};j.staleModules=j.staleModules||{};
    (ids||[]).forEach(id=>{if(j.progress[id]==='complete')j.progress[id]='stale';j.staleModules[id]={reason,markedAt:new Date().toISOString()}});
    clearCompletionRefs(j,ids);return j
  }
  function invalidateDownstream(j,moduleId){
    const ids=downstream[moduleId]||[];if(!ids.length)return j;
    return markStale(j,ids,moduleId+' was updated after downstream work')
  }
  function reconcileFreshness(j){
    j=j||{};const m=j.modules||{};
    const checks=[['module1','module2'],['module2','module3'],['module3','module4'],['module4','module5']];
    for(const [up,down] of checks){
      const ut=moduleTime(m[up]),dt=moduleTime(m[down]);
      if(ut&&dt&&ut>dt)markStale(j,[down,...(downstream[down]||[])],up+' is newer than '+down);
    }
    return j
  }
  function put(j){j=reconcileFreshness(j||{});j.region=REGION;j.updated_at=new Date().toISOString();localStorage.setItem(J,JSON.stringify(j));schedule(j);return j}
  function patch(obj){const j=get();Object.assign(j,obj||{});return put(j)}
  async function save(j=get()){
    const cl=c();if(!cl)return null;
    const {data:{session}}=await cl.auth.getSession();
    if(session?.user){
      const {data,error}=await cl.rpc('boost_save_my_journey_for_region',{p_region:REGION,p_journey:j});
      if(error){console.warn('Pinal BOOST authenticated save failed',error.message);return null}
      if(data)localStorage.setItem(ID,String(data));
      return data;
    }
    const cr=creds();
    const {data,error}=await cl.rpc('pinal_boost_save_journey',{p_journey_id:cr.id,p_access_token:cr.token,p_journey:j});
    if(error){console.warn('Pinal BOOST device-only save failed',error.message);return null}
    if(data&&String(data)!==cr.id)localStorage.setItem(ID,String(data));
    return data;
  }
  function schedule(j){clearTimeout(timer);timer=setTimeout(()=>save(j),350)}
  function isSafeStorageKey(k){return !!k && k!==J && k!==ID && k!==TOK && !k.startsWith('sb-') && !/access[_-]?token|refresh[_-]?token/i.test(k)}
  function snapshotStorage(){const out={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!isSafeStorageKey(k))continue;const v=localStorage.getItem(k);if(v!=null&&v.length<=250000)out[k]=v}return out}
  function restoreBrowserState(j){const modules=j?.modules||{},progress=j?.progress||{};const ordered=Object.entries(modules).filter(([id,x])=>x&&x.browserState&&progress[id]!=='stale').map(([,x])=>x).sort((a,b)=>String(a.completedAt||'').localeCompare(String(b.completedAt||'')));for(const mod of ordered){for(const [k,v] of Object.entries(mod.browserState||{})){if(isSafeStorageKey(k)&&typeof v==='string')localStorage.setItem(k,v)}}clearCompletionRefs(j,Object.entries(progress).filter(([,v])=>v==='stale').map(([id])=>id))}
  async function loadMine(){
    const cl=c();if(!cl)return null;
    const {data:{session}}=await cl.auth.getSession();if(!session?.user)return null;
    const {data,error}=await cl.rpc('boost_load_my_journey_for_region',{p_region:REGION});
    if(error){console.warn('Pinal BOOST load failed',error.message);return null}
    if(data){const clean=reconcileFreshness(data);localStorage.setItem(J,JSON.stringify(clean));restoreBrowserState(clean);return clean}
    return null;
  }
  async function signIn(email,name,redirectTo){const cl=c();if(!cl)throw new Error('Cloud unavailable');const parts=(name||'').trim().split(/\s+/);const first=parts.shift()||'',last=parts.join(' ');localStorage.setItem('pinal_boost_pending_name',name||'');localStorage.setItem('pinal_boost_pending_email',email||'');return cl.auth.signInWithOtp({email,options:{emailRedirectTo:redirectTo||cfg.authRedirect,data:{first_name:first,last_name:last,full_name:name,boost_region:REGION}}})}
  async function verify(email,code){return c().auth.verifyOtp({email,token:code,type:'email'})}
  async function finishAuth(){const cl=c();if(!cl)return null;const {data:{session}}=await cl.auth.getSession();if(!session?.user)return null;let j=await loadMine()||get();j.participant=j.participant||{};j.participant.name=localStorage.getItem('pinal_boost_pending_name')||session.user.user_metadata?.full_name||j.participant.name||'';j.participant.email=session.user.email||localStorage.getItem('pinal_boost_pending_email')||j.participant.email||'';put(j);localStorage.removeItem('pinal_boost_pending_name');localStorage.removeItem('pinal_boost_pending_email');await save(j);return session}
  function captureModule(moduleId,extra){const j=get();j.progress=j.progress||{};j.modules=j.modules||{};invalidateDownstream(j,moduleId);j.progress[moduleId]='complete';if(j.staleModules)delete j.staleModules[moduleId];j.modules[moduleId]=Object.assign({},j.modules[moduleId]||{},extra||{},{completedAt:new Date().toISOString(),browserState:snapshotStorage()});if(extra?.primaryCareer)j.primaryCareerTitle=extra.primaryCareer;if(extra?.h3Status)j.h3Status=extra.h3Status;return put(j)}
  window.PinalBOOST={get,put,patch,save,loadMine,signIn,verify,finishAuth,client:c,journeyKey:J,captureModule,snapshotStorage,restoreBrowserState};
})();