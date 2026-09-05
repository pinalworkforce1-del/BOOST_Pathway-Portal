(function(){
  'use strict';
  const J='pinal_boost_journey_v1',ID='pinal_boost_cloud_journey_id',TOK='pinal_boost_cloud_access_token';
  const cfg=window.PINAL_BOOST_CONFIG||{}; let client=null,timer=null;
  function c(){if(!client&&window.supabase&&cfg.url&&cfg.key)client=window.supabase.createClient(cfg.url,cfg.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});return client}
  function randomToken(){const b=new Uint8Array(32);crypto.getRandomValues(b);return Array.from(b,x=>x.toString(16).padStart(2,'0')).join('')}
  function creds(){let id=localStorage.getItem(ID),t=localStorage.getItem(TOK);if(!id){id=crypto.randomUUID();localStorage.setItem(ID,id)}if(!t){t=randomToken();localStorage.setItem(TOK,t)}return{id,token:t}}
  function get(){try{return JSON.parse(localStorage.getItem(J)||'{}')}catch(e){return{}}}
  function put(j){j=j||{};j.region='Pinal County';localStorage.setItem(J,JSON.stringify(j));schedule(j);return j}
  function patch(obj){const j=get();Object.assign(j,obj||{});return put(j)}
  async function save(j=get()){const cl=c();if(!cl)return null;const cr=creds();const {data,error}=await cl.rpc('pinal_boost_save_journey',{p_journey_id:cr.id,p_access_token:cr.token,p_journey:j});if(error){console.warn('Pinal BOOST save failed',error.message);return null}if(data&&String(data)!==cr.id)localStorage.setItem(ID,String(data));return data}
  function schedule(j){clearTimeout(timer);timer=setTimeout(()=>save(j),350)}
  async function loadMine(){const cl=c();if(!cl)return null;const {data:{session}}=await cl.auth.getSession();if(!session?.user)return null;const {data,error}=await cl.rpc('pinal_boost_load_my_journey');if(error){console.warn('Pinal BOOST load failed',error.message);return null}if(data){localStorage.setItem(J,JSON.stringify(data));return data}return null}
  async function signIn(email,name,redirectTo){const cl=c();if(!cl)throw new Error('Cloud unavailable');const parts=(name||'').trim().split(/\s+/);const first=parts.shift()||'',last=parts.join(' ');localStorage.setItem('pinal_boost_pending_name',name||'');localStorage.setItem('pinal_boost_pending_email',email||'');return cl.auth.signInWithOtp({email,options:{emailRedirectTo:redirectTo||cfg.authRedirect,data:{first_name:first,last_name:last,full_name:name}}})}
  async function verify(email,code){return c().auth.verifyOtp({email,token:code,type:'email'})}
  async function finishAuth(){const cl=c();if(!cl)return null;const {data:{session}}=await cl.auth.getSession();if(!session?.user)return null;let j=await loadMine()||get();j.participant=j.participant||{};j.participant.name=localStorage.getItem('pinal_boost_pending_name')||session.user.user_metadata?.full_name||j.participant.name||'';j.participant.email=session.user.email||localStorage.getItem('pinal_boost_pending_email')||j.participant.email||'';put(j);localStorage.removeItem('pinal_boost_pending_name');localStorage.removeItem('pinal_boost_pending_email');await save(j);return session}
  function captureModule(moduleId,extra){const j=get();j.progress=j.progress||{};j.modules=j.modules||{};j.progress[moduleId]='complete';j.modules[moduleId]=Object.assign({},j.modules[moduleId]||{},extra||{},{completedAt:new Date().toISOString()});if(extra?.primaryCareer)j.primaryCareerTitle=extra.primaryCareer;if(extra?.h3Status)j.h3Status=extra.h3Status;return put(j)}
  window.PinalBOOST={get,put,patch,save,loadMine,signIn,verify,finishAuth,client:c,journeyKey:J,captureModule};
})();
