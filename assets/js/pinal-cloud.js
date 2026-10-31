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
      // A single revision-checked writer; old unconditional RPC must never run here.
      if(typeof window.PinalBOOSTCloud?.saveNow!=='function'){
        console.warn('Pinal BOOST verified cloud writer not ready. Retaining work on device.');
        return null;
      }
      const saved=await window.PinalBOOSTCloud.saveNow();
      if(!saved){window.dispatchEvent(new CustomEvent('boost-cloud-error',{detail:{kind:'save',message:'Your work is retained on this device. Cloud saving needs verification. Refresh BOOST and sign in again before continuing.'}}));}
      return saved||null;
    }
    // Device-only progress remains on this device until a verified user signs in.
    return null;
  }
  function schedule(j){clearTimeout(timer);timer=setTimeout(()=>save(j),650)}
  function isSafeStorageKey(k){return !!k && k!==J && k!==ID && k!==TOK && !k.startsWith('sb-') && !/access[_-]?token|refresh[_-]?token/i.test(k)}
  function snapshotStorage(){const out={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!isSafeStorageKey(k))continue;const v=localStorage.getItem(k);if(v!=null&&v.length<=250000)out[k]=v}return out}
  function storagePayloadTime(raw){
    try{const x=JSON.parse(raw||'{}')||{};const vals=[x.updatedAt,x.updated_at,x.completedAt,x.capturedAt,x.finalizedAt,x.evaluatedAt].map(v=>Date.parse(v||'')).filter(Number.isFinite);return vals.length?Math.max(...vals):0}catch(_){return 0}
  }
  function shouldRestoreKey(k,remoteValue){
    if(!isSafeStorageKey(k)||typeof remoteValue!=='string')return false;
    const localValue=localStorage.getItem(k);
    if(localValue==null)return true;
    if(k==='pinal_boost_career_exploration_v1'){
      const localTime=storagePayloadTime(localValue),remoteTime=storagePayloadTime(remoteValue);
      if(localTime&&remoteTime)return remoteTime>localTime;
      if(localTime&&!remoteTime)return false;
    }
    return false;
  }
  function restoreBrowserState(j){
    const modules=j?.modules||{},progress=j?.progress||{};
    const ordered=Object.entries(modules).filter(([id,x])=>x&&x.browserState&&progress[id]!=='stale').map(([,x])=>x).sort((a,b)=>String(a.completedAt||'').localeCompare(String(b.completedAt||'')));
    for(const mod of ordered){for(const [k,v] of Object.entries(mod.browserState||{})){if(shouldRestoreKey(k,v))localStorage.setItem(k,v)}}
    clearCompletionRefs(j,Object.entries(progress).filter(([,v])=>v==='stale').map(([id])=>id))
  }
  async function loadMine(){
    const cl=c();if(!cl)return null;
    const {data:{session}}=await cl.auth.getSession();if(!session?.user)return null;
    // Cloud progress is authoritative; never merge by browser-maintained timestamps.
    const {data,error}=await cl.rpc('boost_pinal_load_versioned');
    if(error){console.warn('Pinal BOOST revision load failed',error.message);return null}
    const remote=data?.journey||null;
    if(remote){
      if(typeof window.PinalBOOSTCloud?.restore==='function')window.PinalBOOSTCloud.restore(remote);
      else {
        // Do not overwrite an existing local journey without retaining its answers.
        const local=get();
        if(Object.keys(local.modules||{}).length){
          localStorage.setItem('boost_pinal_browser_recovery_'+Date.now(),JSON.stringify({journey:local,saved_at:new Date().toISOString(),reason:'pre-restore-pinal-cloud'}));
        }
        localStorage.setItem(J,JSON.stringify(remote));
      }
      restoreBrowserState(remote);
    }
    return remote;
  }
  async function signIn(email,name,redirectTo){const cl=c();if(!cl)throw new Error('Cloud unavailable');const parts=(name||'').trim().split(/\s+/);const first=parts.shift()||'',last=parts.join(' ');localStorage.setItem('pinal_boost_pending_name',name||'');localStorage.setItem('pinal_boost_pending_email',email||'');return cl.auth.signInWithOtp({email,options:{emailRedirectTo:redirectTo||cfg.authRedirect,data:{first_name:first,last_name:last,full_name:name,boost_region:REGION}}})}
  async function verify(email,code){return c().auth.verifyOtp({email,token:code,type:'email'})}
  async function finishAuth(){
    const cl=c();if(!cl)return null;
    const {data:{session}}=await cl.auth.getSession();if(!session?.user)return null;
    // Verification is a read, not permission to overwrite cloud answers.
    await loadMine();
    localStorage.removeItem('pinal_boost_pending_name');
    localStorage.removeItem('pinal_boost_pending_email');
    return session;
  }
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