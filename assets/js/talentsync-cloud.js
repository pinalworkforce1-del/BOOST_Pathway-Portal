(()=>{'use strict';
const cfg=window.PINAL_BOOST_CONFIG||{},TOKEN_KEY='boost-coach-staff-token-v1';
const token=()=>localStorage.getItem(TOKEN_KEY)||'';
const endpoint=()=>cfg.url+'/functions/v1/talentsync-data';
const headers=()=>({'Content-Type':'application/json','apikey':cfg.key,'Authorization':'Bearer '+cfg.key,'X-BOOST-Staff-Token':token()});
let cloudReady=false,saveTimer=null,saving=false,pending=false;
async function call(action,body={}){const r=await fetch(endpoint(),{method:'POST',headers:headers(),body:JSON.stringify({action,...body})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'TalentSync cloud service unavailable');return d}
function mergeDefaults(remote){return{participants:Array.isArray(remote?.participants)?remote.participants:[],budgets:{...clone(DEFAULT_BUDGETS),...(remote?.budgets||{})},vendors:Array.isArray(remote?.vendors)?remote.vendors:[]}}
async function cloudLoad(){
  window.TALENTSYNC_CLOUD_AUTH_REQUIRED=false;
  if(!token()||!cfg.url||!cfg.key){window.TALENTSYNC_CLOUD_AUTH_REQUIRED=true;const vb=document.querySelector('#vendorBody');if(vb)vb.innerHTML='<tr><td colspan="4" class="pipeline-empty"><strong>Secure TalentSync data is not loaded.</strong><br>Open TalentSync from the BOOST Coach Dashboard and sign in again.</td></tr>';return}
  try{
    const d=await call('load');
    state=mergeDefaults(d.state||{});
    if(d.staff?.role){
      role=d.staff.role;
      const permissions=d.staff.permissions||{
        canDirectorView:role==='Director',
        canManageVendors:role==='Director',
        canManageBudget:role==='Director'||role==='Regional Admin',
        canApproveFinance:role==='Director'||role==='Regional Admin'
      };
      window.TALENTSYNC_PERMISSIONS=permissions;
      const rs=document.querySelector('#roleSelect');
      if(rs){rs.value=role;rs.disabled=true;rs.title='Access is assigned by TalentSync administration';}
      const budgetTab=document.querySelector('[data-view="budget"]');
      const vendorTab=document.querySelector('[data-view="vendors"]');
      if(budgetTab)budgetTab.classList.toggle('hidden',!(permissions.canManageBudget||permissions.canApproveFinance));
      if(vendorTab)vendorTab.classList.toggle('hidden',!permissions.canManageVendors);
      const reset=document.querySelector('#resetBtn');
      if(reset)reset.classList.toggle('hidden',!permissions.canDirectorView);
      if((activeView==='budget'&&!(permissions.canManageBudget||permissions.canApproveFinance))||(activeView==='vendors'&&!permissions.canManageVendors))switchView('operations');
    }
    localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
    cloudReady=true;window.TALENTSYNC_CLOUD_AUTH_REQUIRED=false;
    render();if(activeView==='vendors'&&typeof renderVendors==='function')renderVendors();
    window.dispatchEvent(new CustomEvent('talentsync:cloud-ready',{detail:{participants:state.participants.length,role:d.staff?.role||role}}));
  }catch(e){console.error('TalentSync cloud load failed',e);cloudReady=false;window.TALENTSYNC_CLOUD_AUTH_REQUIRED=/session expired|401/i.test(String(e?.message||e));const vb=document.querySelector('#vendorBody');if(vb&&window.TALENTSYNC_CLOUD_AUTH_REQUIRED)vb.innerHTML='<tr><td colspan="4" class="pipeline-empty"><strong>Secure TalentSync session expired.</strong><br>Return to the BOOST Coach Dashboard, sign in again, then reopen TalentSync.</td></tr>'}
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