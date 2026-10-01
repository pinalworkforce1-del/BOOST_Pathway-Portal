(()=>{'use strict';
const cfg=window.PINAL_BOOST_CONFIG||{},TOKEN_KEY='boost-coach-staff-token-v1';
const endpoint=()=>cfg.url+'/functions/v1/talentsync-ask-rosie-pinal';
const token=()=>localStorage.getItem(TOKEN_KEY)||'';
let history=[];
function participant(){try{return state?.participants?.find(p=>String(p.id)===String(selectedId))||null}catch(_){return null}}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function md(s){return esc(s).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>')}
function add(text,who='bot'){const c=document.querySelector('#tsRosieChat');if(!c)return;const d=document.createElement('div');d.className='tsr-msg '+who;d.innerHTML=md(text);c.appendChild(d);c.scrollTop=c.scrollHeight}
function syncContext(){const p=participant(),el=document.querySelector('#tsRosieContext');if(el)el.textContent=p?(p.name+' · '+(p.program||'Program not set')+' · '+(p.pathway||'No pathway')):'Select a participant in TalentSync first.'}
async function ask(q){
 q=String(q||'').trim();if(!q)return;
 const p=participant();if(!p){add('Select a participant first so I can use the correct Pinal TalentSync case.');return}
 add(q,'user');const prior=history.slice(-8);history.push({role:'user',text:q});add('Thinking through the case…','thinking');
 try{
  const r=await fetch(endpoint(),{method:'POST',headers:{'Content-Type':'application/json','apikey':cfg.key,'Authorization':'Bearer '+cfg.key,'X-BOOST-Staff-Token':token()},body:JSON.stringify({participant_id:p.id,question:q,history:prior})});
  const d=await r.json().catch(()=>({}));document.querySelectorAll('.tsr-msg.thinking').forEach(x=>x.remove());
  if(!r.ok)throw new Error(d.error||'Rosie is unavailable');
  const a=String(d.answer||'I could not produce an answer.');history.push({role:'assistant',text:a});add(a,'bot');
 }catch(e){document.querySelectorAll('.tsr-msg.thinking').forEach(x=>x.remove());add('I could not reach the Pinal Rosie service. '+String(e?.message||e),'bot')}
}
function open(){document.querySelector('#tsRosiePanel')?.classList.add('open');syncContext()}
function close(){document.querySelector('#tsRosiePanel')?.classList.remove('open')}
function build(){
 const fab=document.createElement('button');fab.className='tsr-fab';fab.innerHTML='<span class="tsr-avatar">R</span><span>Ask Rosie</span>';fab.onclick=open;document.body.appendChild(fab);
 const p=document.createElement('aside');p.id='tsRosiePanel';p.className='tsr-panel';p.innerHTML='<div class="tsr-head"><div class="tsr-avatar big">R</div><div><strong>Rosie · Pinal Career Coach</strong><small id="tsRosieContext">Select a participant first.</small></div><button id="tsRosieClose">×</button></div><div id="tsRosieChat" class="tsr-chat"><div class="tsr-msg bot"><strong>Hi, I\\'m Rosie.</strong><br>I can reason across this participant\\'s TalentSync record, BOOST outputs, obligations/payments, employment information, and the controlled Pinal knowledge loaded for me. I am read-only and advisory.</div><div class="tsr-quick"><button>What is next for this participant?</button><button>What needs attention?</button><button>Are any obligations pending approval?</button><button>Prep me for my appointment.</button></div></div><div class="tsr-input"><textarea id="tsRosieInput" rows="2" placeholder="Ask about this participant…"></textarea><button id="tsRosieSend">Send</button></div>';
 document.body.appendChild(p);p.querySelector('#tsRosieClose').onclick=close;p.querySelector('#tsRosieSend').onclick=()=>{const i=p.querySelector('#tsRosieInput');const q=i.value;i.value='';ask(q)};
 p.querySelector('#tsRosieInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();p.querySelector('#tsRosieSend').click()}});
 p.querySelectorAll('.tsr-quick button').forEach(b=>b.onclick=()=>ask(b.textContent));document.addEventListener('click',e=>{if(e.target.closest('[data-open]'))setTimeout(syncContext,50)});window.addEventListener('talentsync:cloud-ready',syncContext)
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();