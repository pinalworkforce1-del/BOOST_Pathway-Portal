/* BOOST Ready 2 Work: read-only legacy progress diagnostic. */
(()=>{'use strict';
const modern='boost-r2w-integrated-v1',legacy='boost_r2w_v1';
const indicator=document.createElement('small');
indicator.id='ready2work-sync-status';
indicator.setAttribute('role','status');
indicator.style.cssText='display:block;text-align:center;font:12px system-ui;padding:7px;color:#547080';
document.body.append(indicator);
const read=key=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
const current=read(modern),old=read(legacy);
const currentCount=Object.keys(current?.sceneSelections||{}).length;
const oldCount=Object.keys(old?.answers||{}).length;
indicator.textContent='Ready 2 Work progress check: current '+currentCount+' decisions; earlier version '+oldCount+' decisions'+(oldCount?' (recovery may be possible)':'')+'. No progress has been changed.';
})();