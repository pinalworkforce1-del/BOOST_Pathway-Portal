// BOOST-owned Resume Builder persistence adapter. Development branch only.
// Never use Level Up tokens or claim module completion from a browser draft.
export const BOOST_RESUME_MODULE='ready2work-resume-builder';
export function createBoostResumeStore({client,region='Pinal County',now=()=>new Date().toISOString()}) {
 if(!client?.auth?.getUser||!client?.from)throw Error('BOOST Supabase client required');
 async function identity(){
  const {data,error}=await client.auth.getUser();
  if(error||!data?.user?.id)throw Error('BOOST sign-in required');
  return data.user.id;
 }
 async function prerequisites(){
  const userId=await identity();
  const {data,error}=await client.from('boost_module_progress').select('module_id,status').eq('user_id',userId).eq('region',region).in('module_id',['module5','financial','ai']);
  if(error)throw Error('Cannot verify BOOST prerequisites');
  return ['module5','financial','ai'].every(id=>(data||[]).some(r=>r.module_id===id&&r.status==='completed'));
 }
 async function load(){
  const userId=await identity();
  const {data,error}=await client.from('boost_module_progress').select('status,evidence,updated_at').eq('user_id',userId).eq('region',region).eq('module_id',BOOST_RESUME_MODULE).maybeSingle();
  if(error)throw Error('Unable to load BOOST résumé');
  return {draft:data?.evidence?.draft||null,updated_at:data?.updated_at||null,status:data?.status||'not_started',cloud_saved:!!data};
 }
 async function saveDraft(draft){
  const userId=await identity();
  if(!await prerequisites())throw Error('Prerequisite modules are not verified');
  if(!draft||typeof draft!=='object'||Array.isArray(draft))throw Error('Résumé draft object required');
  const encoded=JSON.stringify(draft);
  if(encoded.length>125000)throw Error('Résumé draft exceeds size limit');
  const current=await load();
  // A browser save cannot overwrite verified completion.
  if(current.status==='completed')throw Error('Completed evidence cannot be replaced by draft save');
  const stamp=now();
  const row={user_id:userId,region,module_id:BOOST_RESUME_MODULE,pathway:'career',status:'in_progress',evidence:{source:'boost_shared_resume_builder',version:1,draft,cloud_saved_at:stamp,completion_verified:false},updated_at:stamp};
  const {error}=await client.from('boost_module_progress').upsert(row,{onConflict:'user_id,region,module_id'});
  if(error)throw Error('BOOST résumé cloud save failed: '+error.message);
  return {saved:true,updated_at:stamp,completed:false};
 }
 return Object.freeze({load,saveDraft,prerequisites});
}
