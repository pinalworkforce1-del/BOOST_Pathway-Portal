/* Isolated BOOST Interview Landing scenario sync. Does not change local progression. */
(()=>{'use strict';
const KEY='boost-r2w-integrated-v1';
const IDS=['31','32','33','34','35'];
let last='',timer;
async function sync(){
  const state=JSON.parse(localStorage.getItem(KEY)||'{}');
  const selections=state.sceneSelections||{};
  const answers=Object.fromEntries(IDS.filter(k=>['A','B','C','D'].includes(selections[k])).map(k=>[k,selections[k]]));
  const serialized=JSON.stringify(answers);
  if(!Object.keys(answers).length||serialized===last)return;
  const cfg=window.BOOST_CONFIG;
  if(!cfg?.supabaseUrl||!window.supabase)return;
  const client=window.__boostInterviewSyncClient||(window.__boostInterviewSyncClient=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,detectSessionInUrl:false}}));
  const {data:{user}}=await client.auth.getUser();
  if(!user)return;
  const {error}=await client.rpc('boost_save_interview_scenarios',{answers});
  if(!error)last=serialized;
  else console.warn('BOOST scenario cloud sync pending:',error.message);
}
function queue(){clearTimeout(timer);timer=setTimeout(()=>sync().catch(console.warn),700);}
const original=Storage.prototype.setItem;
Storage.prototype.setItem=function(k,v){const r=original.call(this,k,v);if(this===localStorage&&k===KEY)queue();return r;};
window.addEventListener('pageshow',queue);document.addEventListener('visibilitychange',()=>{if(!document.hidden)queue()});
queue();
})();