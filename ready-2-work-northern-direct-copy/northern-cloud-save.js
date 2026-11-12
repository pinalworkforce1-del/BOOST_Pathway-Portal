/* Northern Ready2Work cloud adapter: never accesses Pinal Ready2Work table. */
(()=>{
 'use strict';
 const ctx=window.NORTHERN_R2W;
 if(!ctx?.verified||!ctx.client||!ctx.userId)return;
 const KEY='boost-northern-r2w-v1',TABLE='boost_northern_ready2work_progress';
 const status=document.createElement('span');status.id='r2wSaveStatus';status.setAttribute('role','status');status.style.cssText='font:12px system-ui;color:#d9e8f2;margin-left:8px';
 document.querySelector('.top-actions')?.prepend(status);
 const say=s=>{status.textContent=s};
 const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||sessionStorage.getItem(KEY)||'null')}catch{return null}};
 const time=x=>{const n=Date.parse(String(x||''));return Number.isFinite(n)?n:0};
 const scoreResume=rb=>{
  if(!rb||typeof rb!=='object')return 0;
  const versions=Array.isArray(rb.versions)?rb.versions:[];
  const experiences=Array.isArray(rb.experiences)?rb.experiences:[];
  const alignment=rb.alignment||versions[rb.activeVersion||0]?.alignment;
  return (experiences.filter(x=>x&&(x.role||x.employer||x.evidence||(x.bullets||[]).length)).length*12)+
    (versions.filter(v=>v&&(v.target||v.jobDescription||v.summary||v.alignment)).length*4)+
    (Array.isArray(alignment?.explored)?alignment.explored.length*6:0)+
    (rb.jobDescription?5:0)+(rb.summary?3:0)+(rb.skills?2:0)+(rb.contact?.name?1:0)+
    (rb.complete?5:0);
 };
 const combineResume=(remote,local)=>{
  if(!remote||typeof remote!=='object')return local||{};
  if(!local||typeof local!=='object')return remote;
  const rs=scoreResume(remote),ls=scoreResume(local);
  const rt=time(remote.lastEditedAt),lt=time(local.lastEditedAt);
  // A new empty or sparsely initialized résumé is never allowed to
  // overwrite an existing populated résumé. If both are populated,
  // the most recently edited résumé is authoritative.
  if(rs===0&&ls>0)return local;
  if(ls===0&&rs>0)return remote;
  // Reload-time migration or a stale browser mirror can acquire a fresh
  // timestamp without containing the participant's actual résumé work.
  // Preserve the significantly richer résumé even when its timestamp is older.
  if(rs>=ls+8)return remote;
  if(ls>=rs+8)return local;
  if(rt&&lt&&rt!==lt)return rt>lt?remote:local;
  if(rt&&!lt)return remote;
  if(lt&&!rt)return local;
  return rs>ls?remote:local;
 };
 const combine=(remote,local)=>{
  remote=remote&&typeof remote==='object'?remote:{};
  local=local&&typeof local==='object'?local:{};
  return {...remote,...local,
   sceneSelections:{...(remote.sceneSelections||{}),...(local.sceneSelections||{})},
   resumeBuilder:combineResume(remote.resumeBuilder,local.resumeBuilder),
   jacquelineInterview:remote.jacquelineInterview?.verifiedComplete?remote.jacquelineInterview:(local.jacquelineInterview||remote.jacquelineInterview||{})
  };
 };
 let ready=false,busy=false,queued=false,timer=0,last='';
 async function cloudRow(){
  const {data,error}=await ctx.client.from(TABLE).select('progress_json').eq('participant_id',ctx.userId).maybeSingle();
  if(error)throw error;return data?.progress_json||null;
 }
 function schedule(){queued=true;clearTimeout(timer);timer=setTimeout(flush,800)}
 async function flush(){
  if(!ready||busy||!queued)return;
  queued=false;busy=true;
  try{
   const remote=await cloudRow(),local=read();
   if(!local){say('No local changes');return}
   const merged=combine(remote,local),serialized=JSON.stringify(merged);
   if(JSON.stringify(merged.resumeBuilder||{})!==JSON.stringify(local.resumeBuilder||{})){
     // Preserve a richer cloud résumé locally and in the running app too.
     try{localStorage.setItem(KEY,serialized);localStorage.setItem(KEY+':'+ctx.userId,serialized)}catch(e){}
     window.dispatchEvent(new CustomEvent('boost-r2w-cloud-restored',{detail:{progress:merged}}));
   }
   if(serialized===last){say('Saved');return}
   const {error}=await ctx.client.from(TABLE).upsert({participant_id:ctx.userId,progress_json:merged,updated_at:new Date().toISOString()},{onConflict:'participant_id'});
   if(error)throw error;
   last=serialized;say('Saved to Northern BOOST cloud');
  }catch(e){queued=true;say('Northern cloud sync pending — saved on this device')}
  finally{busy=false;if(queued)timer=setTimeout(flush,4500)}
 }
 window.addEventListener('boost-r2w-saved',()=>{const current=read();if(current)try{localStorage.setItem(KEY+':'+ctx.userId,JSON.stringify(current))}catch(e){}if(ready)schedule()});
 window.addEventListener('online',()=>{if(ready)schedule()});
 (async()=>{
  try{
   const remote=await cloudRow(),local=read();
   if(remote){
    const merged=combine(remote,local);
    if(JSON.stringify(merged)!==JSON.stringify(local)){
     try{localStorage.setItem(KEY,JSON.stringify(merged))}catch{sessionStorage.setItem(KEY,JSON.stringify(merged))}
     window.dispatchEvent(new CustomEvent('boost-r2w-cloud-restored',{detail:{progress:merged}}));
    }
   }
   ready=true;say('Northern BOOST cloud connected');
   if(local||remote)schedule();
  }catch(e){say('Northern cloud unavailable — saved on this device')}
 })();
})();