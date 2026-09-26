(function(){
  'use strict';
  const J='pinal_boost_journey_v1',ID='pinal_boost_cloud_journey_id',TOK='pinal_boost_cloud_access_token',REGION='Pinal County';
  const cfg=window.PINAL_BOOST_CONFIG||{}; let client=null,timer=null;
  function installMapReviewStyle(){
    if(document.getElementById('pinalReviewMapPolish'))return;
    const s=document.createElement('style');s.id='pinalReviewMapPolish';
    s.textContent='.hotspot.is-review-needed,.hotspot.is-waiting-review{outline:none!important;box-shadow:none!important;filter:none!important;opacity:1!important}.hotspot.is-review-needed .complete-badge,.hotspot.is-waiting-review .complete-badge{box-shadow:0 2px 8px rgba(0,0,0,.32)!important}.hotspot.is-review-needed .complete-badge{background:#d99a16!important;color:#fff!important}.hotspot.is-waiting-review .complete-badge{background:#68757f!important;color:#fff!important}';
    document.head.appendChild(s)
  }
  installMapReviewStyle();
  function c(){if(!client&&window.supabase&&cfg.url&&cfg.key)client=window.supabase.createClient(cfg.url,cfg.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});return client}
  function randomToken(){const b=new Uint8Array(32);crypto.getRandomValues(b);return Array.from(b,x=>x.toString(16).padStart(2,'0')).join('')}
  function creds(){let id=localStorage.getItem(ID),t=localStorage.getItem(TOK);if(!id){id=crypto.randomUUID();localStorage.setItem(ID,id)}if(!t){t=randomToken();localStorage.setItem(TOK,t)}return{id,token:t}}
  function get(){try{return JSON.parse(localStorage.getItem(J)||'{}')}catch(e){return{}}}
  const downstream={module1:['module2','module3','module4','module5'],module2:['module3','module4','module5'],module3:['module4','module5'],module4:['module5']};
  function stable(v){if(Array.isArray(v))return v.map(stable);if(v&&typeof v==='object'){const o={};Object.keys(v).sort().forEach(k=>{if(!['completedAt','capturedAt','updatedAt','finalizedAt','evaluatedAt','resultGeneratedAt','browserState','source'].includes(k))o[k]=stable(v[k])});return o}return v}
  function careers(mod){const list=Array.isArray(mod?.selected)&&mod.selected.length?mod.selected:(Array.isArray(mod?.careers)?mod.careers:[]);return list.map(x=>typeof x==='string'?{title:x,soc:''}:{title:x?.title||x?.careerTitle||x?.occupation||'',soc:String(x?.soc||x?.socCode||'')}).filter(x=>x.title||x.soc).sort((a,b)=>(a.soc+'|'+a.title).localeCompare(b.soc+'|'+b.title))}
  function dependencySignature(moduleId,mod){
    if(!mod||typeof mod!=='object'||!Object.keys(mod).length)return'';
    let payload;
    if(moduleId==='module1')payload={interestScores:mod.interestScores||mod.scores||{},careers:careers(mod),validatedWorkDrivers:mod?.alignmentProfile?.validatedWorkDrivers||[]};
    else if(moduleId==='module2')payload={careers:careers(mod),fields:mod.fields||{},validationBySoc:mod.validationBySoc||{}};
    else if(moduleId==='module3')payload={careers:careers(mod),fields:mod.fields||{},startingPoint:mod.startingPoint||{},mobilityPath:mod.mobilityPath||'',reportCreated:!!mod.reportCreated};
    else if(moduleId==='module4')payload={career:mod.career||mod.selectedCareer||null,careerTitle:mod.careerTitle||'',selectedSoc:mod.selectedSoc||'',route:mod.route||mod.participantDirection||mod?.decision?.code||'',answers:mod.answers||{},decision:mod.decision||{}};
    else payload=stable(mod);
    try{return JSON.stringify(stable(payload))}catch(_){return''}
  }
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
    return markStale(j,ids,moduleId+' changed after downstream work')
  }
  function reconcileFreshness(j){
    /* Freshness is now created only by a meaningful saved evidence change. Timestamp order alone is not proof that participant evidence changed. */
    return j||{}
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
  function captureModule(moduleId,extra){
    const j=get();j.progress=j.progress||{};j.modules=j.modules||{};
    const previous=j.modules[moduleId]||{},oldSig=dependencySignature(moduleId,previous);
    const next=Object.assign({},previous,extra||{},{completedAt:new Date().toISOString(),browserState:snapshotStorage()});
    const newSig=dependencySignature(moduleId,next),meaningfullyChanged=!!oldSig&&!!newSig&&oldSig!==newSig;
    if(meaningfullyChanged)invalidateDownstream(j,moduleId);
    j.progress[moduleId]='complete';if(j.staleModules)delete j.staleModules[moduleId];j.modules[moduleId]=next;
    if(extra?.primaryCareer)j.primaryCareerTitle=extra.primaryCareer;if(extra?.h3Status)j.h3Status=extra.h3Status;return put(j)
  }
  window.PinalBOOST={get,put,patch,save,loadMine,signIn,verify,finishAuth,client:c,journeyKey:J,captureModule,snapshotStorage,restoreBrowserState,dependencySignature};
})();