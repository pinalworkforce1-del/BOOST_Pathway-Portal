/* BOOST Ready 2 Work cloud sync — conservative merge, authenticated users only. */
(()=>{'use strict';
const KEY='boost-r2w-integrated-v1', cfg=window.PINAL_BOOST_CONFIG;
if(!window.supabase||!cfg)return;
const client=window.supabase.createClient(cfg.url,cfg.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
let userId=null,ready=false,busy=false,queued=false,timer=0,lastSynced='';
const status=document.createElement('span');
status.id='r2wSaveStatus';status.setAttribute('role','status');
status.style.cssText='font:12px system-ui;color:#d9e8f2;margin-left:8px';
document.querySelector('.top-actions')?.prepend(status);
const say=s=>{status.textContent=s;};
const read=()=>{for(const store of [localStorage,sessionStorage])try{const raw=store.getItem(KEY);if(raw)return JSON.parse(raw)}catch(e){}return null;};
const count=x=>Object.keys(x?.sceneSelections||{}).length;
function combine(remote,local){
 remote=remote&&typeof remote==='object'?remote:{};
 local=local&&typeof local==='object'?local:{};
 return {...remote,...local,
  sceneSelections:{...(remote.sceneSelections||{}),...(local.sceneSelections||{})},
  resumeBuilder:local.resumeBuilder?.complete?local.resumeBuilder:(remote.resumeBuilder?.complete?remote.resumeBuilder:(local.resumeBuilder||remote.resumeBuilder||{})),
  jacquelineInterview:remote.jacquelineInterview?.verifiedComplete?remote.jacquelineInterview:(local.jacquelineInterview||remote.jacquelineInterview||{})
 };
}
async function cloudRow(){
 const {data,error}=await client.from('boost_ready2work_progress').select('progress_json').eq('participant_id',userId).maybeSingle();
 if(error)throw error;return data?.progress_json||null;
}
function schedule(){queued=true;clearTimeout(timer);timer=setTimeout(flush,750)}
async function flush(){
 if(!ready||busy||!queued)return;
 busy=true;queued=false;
 try{
  const remote=await cloudRow(),local=read();if(!local){say('No local changes');return;}
  const merged=combine(remote,local);
  const serialized=JSON.stringify(merged);
  if(serialized===lastSynced){say('Saved');return}
  const {error}=await client.from('boost_ready2work_progress').upsert({participant_id:userId,progress_json:merged,updated_at:new Date().toISOString()},{onConflict:'participant_id'});
  if(error)throw error;
  lastSynced=serialized;say('Saved to BOOST cloud');
 }catch(e){queued=true;say('Cloud sync pending — saved on device');}
 finally{busy=false;if(queued)timer=setTimeout(flush,4500);}
}
window.addEventListener('boost-r2w-saved',()=>{if(ready)schedule()});
window.addEventListener('online',()=>{if(ready)schedule()});
(async()=>{
 try{
  const {data,error}=await client.auth.getSession();if(error)throw error;
  if(!data?.session){say('Saved on this device • sign in to BOOST for cloud sync');return}
  const {data:identity,error:ie}=await client.auth.getUser();if(ie||!identity?.user)throw ie||Error('Identity unavailable');
  userId=identity.user.id;
  const remote=await cloudRow(),local=read();
  if(remote&&typeof remote==='object'){
   const merged=combine(remote,local);
   const differs=JSON.stringify(merged)!==JSON.stringify(local);
   if(differs){
    try{localStorage.setItem(KEY,JSON.stringify(merged));}catch(e){sessionStorage.setItem(KEY,JSON.stringify(merged))}
    window.dispatchEvent(new CustomEvent('boost-r2w-cloud-restored',{detail:{progress:merged}}));
   }
  }
  ready=true; say('BOOST cloud connected');
  if(local||remote)schedule();
 }catch(e){say('Cloud unavailable — saved on this device');}
})();
})();