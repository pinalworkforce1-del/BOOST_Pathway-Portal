/* BOOST Ready 2 Work: opt-in-by-existing-auth, non-destructive authenticated sync. */
(()=>{'use strict';
const KEY='boost-r2w-integrated-v1';
const area=document.createElement('small');area.id='r2wCloudStatus';area.style.cssText='display:block;text-align:center;font:12px system-ui;padding:5px;color:#547080';area.textContent='Progress is saved on this device. Checking cloud sign-in…';document.body.append(area);
if(!window.supabase||!window.PINAL_BOOST_CONFIG){area.textContent='Device save active. Cloud sync unavailable.';return}
const cfg=window.PINAL_BOOST_CONFIG;
const client=window.supabase.createClient(cfg.url,cfg.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
let userId=null, timer=null, busy=false, pending=false;
const snapshot=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}};
const count=p=>Object.keys(p?.sceneSelections||{}).length;
async function flush(){
 if(!userId||busy)return;
 const local=snapshot();if(!local)return;
 busy=true;
 try{
   const {error}=await client.from('boost_ready2work_progress').upsert({participant_id:userId,progress_json:local,updated_at:new Date().toISOString()},{onConflict:'participant_id'});
   if(error)throw error;
   area.textContent='Cloud backup saved • '+count(local)+' scenario decisions.';
 }catch(e){area.textContent='Device progress retained • cloud sync pending ('+String(e.message||'unavailable')+').';}
 finally{busy=false;if(pending){pending=false;queue();}}
}
function queue(){if(!userId)return;if(busy){pending=true;return}clearTimeout(timer);timer=setTimeout(flush,600);}
(async()=>{
 try{
   const {data,error}=await client.auth.getSession();if(error)throw error;
   const session=data?.session;
   if(!session){area.textContent='Device progress only • sign in to BOOST for cloud backup.';return}
   const {data:auth,error:identityError}=await client.auth.getUser();if(identityError||!auth?.user)throw identityError||Error('No verified user');
   userId=auth.user.id;
   const {data:row,error:readError}=await client.from('boost_ready2work_progress').select('progress_json').eq('participant_id',userId).maybeSingle();
   if(readError)throw readError;
   const local=snapshot(), remote=row?.progress_json;
   if(!local&&remote&&typeof remote==='object'){
     try{localStorage.setItem(KEY,JSON.stringify(remote));area.textContent='Cloud progress recovered • '+count(remote)+' decisions. Reload to display it.';}
     catch(e){area.textContent='Cloud progress found, but device storage is unavailable: '+e.message}
   }else if(local&&remote&&count(remote)>count(local)){
     area.textContent='Cloud has '+count(remote)+' decisions vs device '+count(local)+'. No automatic overwrite performed.';
   }else if(local){queue();}
   else area.textContent='Cloud backup connected. Your first answer will be saved.';
 }catch(e){area.textContent='Device progress retained • cloud connection unavailable ('+String(e.message||'unknown')+').';}
})();
window.addEventListener('boost-r2w-saved',e=>{if(e.detail?.verified)queue();});
})();