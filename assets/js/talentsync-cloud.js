(()=>{'use strict';
const cfg=window.PINAL_BOOST_CONFIG||{},TOKEN_KEY='boost-coach-staff-token-v1';
const token=()=>localStorage.getItem(TOKEN_KEY)||'';
const endpoint=()=>cfg.url+'/functions/v1/talentsync-data';
const headers=()=>({'Content-Type':'application/json','apikey':cfg.key,'Authorization':'Bearer '+cfg.key,'X-BOOST-Staff-Token':token()});
let cloudReady=false,saveTimer=null,saving=false,pending=false;
async function call(action,body={}){const r=await fetch(endpoint(),{method:'POST',headers:headers(),body:JSON.stringify({action,...body})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'TalentSync cloud service unavailable');return d}
function mergeDefaults(remote){return{participants:Array.isArray(remote?.participants)?remote.participants:[],budgets:{...clone(DEFAULT_BUDGETS),...(remote?.budgets||{})},vendors:Array.isArray(remote?.vendors)?remote.vendors:[]}}
async function cloudLoad(){
  if(!token()||!cfg.url||!cfg.key)return;
  try{
    const d=await call('load');
    state=mergeDefaults(d.state||{});
    if(d.staff?.role){role=d.staff.role;const rs=document.querySelector('#roleSelect');if(rs)rs.value=role}
    localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
    cloudReady=true;
    render();
    window.dispatchEvent(new CustomEvent('talentsync:cloud-ready',{detail:{participants:state.participants.length,role:d.staff?.role||role}}));
  }catch(e){console.error('TalentSync cloud load failed',e);cloudReady=false}
}
async function flush(){
  if(!cloudReady||saving||!token())return;
  saving=true;
  try{await call('save',{state});pending=false}
  catch(e){console.error('TalentSync cloud save failed',e);pending=true}
  finally{saving=false;if(pending){clearTimeout(saveTimer);saveTimer=setTimeout(flush,1200)}}
}
const localSave=window.saveState;
window.saveState=function(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  if(typeof localSave==='function'&&localSave!==window.saveState){try{localSave()}catch(_){}}
  if(!cloudReady)return;
  pending=true;clearTimeout(saveTimer);saveTimer=setTimeout(flush,450);
};
window.addEventListener('beforeunload',()=>{if(pending&&cloudReady){try{navigator.sendBeacon&&navigator.sendBeacon(endpoint(),new Blob([JSON.stringify({action:'save',state})],{type:'application/json'}))}catch(_){}}});
window.addEventListener('load',()=>setTimeout(cloudLoad,80));
})();