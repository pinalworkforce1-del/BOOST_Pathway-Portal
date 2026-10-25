/* BOOST Ready 2 Work: non-mutating local progress diagnostic. */
(()=>{'use strict';
const indicator=document.createElement('small');
indicator.id='ready2work-sync-status';
indicator.setAttribute('role','status');
indicator.style.cssText='display:block;text-align:center;font:12px system-ui;padding:7px;color:#547080';
document.body.append(indicator);
const read=key=>{
  try{const raw=localStorage.getItem(key);return {found:raw!==null,data:raw?JSON.parse(raw):null,error:null};}
  catch(e){return {found:false,data:null,error:e?.name||'Read error'};}
};
const count=o=>o&&typeof o==='object'?Object.keys(o).length:0;
function update(){
  const current=read('boost-r2w-integrated-v1'),old=read('boost_r2w_v1');
  const saved=count(current.data?.sceneSelections),prior=count(old.data?.answers);
  const label=document.getElementById('overallProgressText')?.textContent||'';
  const mapCount=Number((label.match(/^(\\d+) of \\d+/)||[])[1]);
  const visible=Number.isFinite(mapCount)?mapCount:null;
  const parts=['Progress check: map '+(visible===null?'unavailable':visible)+'/22',
    'saved on this device '+saved,'older format '+prior];
  if(current.error)parts.push('storage read error: '+current.error);
  else if(!current.found)parts.push('current storage key not found');
  if(visible!==null&&visible!==saved)parts.push('DISPLAY/STORAGE MISMATCH — do not reset');
  indicator.textContent=parts.join(' • ')+'. Read-only; no progress changed.';
}
update();
window.addEventListener('storage',update);
setInterval(update,1500);
})();