/* Ready 2 Work progress integration: non-destructive read-only probe. */
(()=>{'use strict';
const KEY='boost-r2w-integrated-v1';
const status=document.createElement('small');
status.id='ready2work-sync-status';
status.setAttribute('aria-live','polite');
status.style.cssText='display:block;text-align:center;font:12px system-ui;padding:5px;color:#547080';
status.textContent='Ready 2 Work progress remains saved on this device.';
document.body.appendChild(status);
const raw=localStorage.getItem(KEY);
if(raw){
 try{
  const data=JSON.parse(raw);
  const count=Object.keys(data.sceneSelections||{}).length;
  status.textContent='Ready 2 Work: '+count+' scenario decisions saved on this device.';
 }catch(_){status.textContent='Ready 2 Work: saved progress found on this device.'}
}
})();