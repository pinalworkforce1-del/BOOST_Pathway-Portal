(()=>{'use strict';
const cfg=window.PINAL_BOOST_CONFIG||{},TOKEN_KEY='boost-coach-staff-token-v1';
const endpoint=()=>cfg.url+'/functions/v1/talentsync-ask-rosie-pinal';
const trainingEndpoint=()=>cfg.url+'/functions/v1/talentsync-training-effectiveness';
const token=()=>localStorage.getItem(TOKEN_KEY)||'';
let history=[];
function participant(){try{return state?.participants?.find(p=>String(p.id)===String(selectedId))||null}catch(_){return null}}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function md(s){return esc(s).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>')}
function add(text,who='bot'){const c=document.querySelector('#tsRosieChat');if(!c)return;const d=document.createElement('div');d.className='tsr-msg '+who;d.innerHTML=md(text);c.appendChild(d);c.scrollTop=c.scrollHeight}
function syncContext(){const p=participant(),el=document.querySelector('#tsRosieContext');if(el)el.textContent=p?('Participant · '+(p.program||'Program not set')+' · '+(p.pathway||'No pathway')):'Select a participant in TalentSync first.'}
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
function metricKey(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ')}
function pickMetric(data,patterns){for(const [k,v] of Object.entries(data||{})){const x=metricKey(k);if(patterns.some(r=>r.test(x))&&String(v??'').trim())return String(v).trim()}return''}
async function prefillTrainingEffectiveness(p){
 const bo=p?.boostOutputs||{},provider=String(bo.trainingProvider||bo.module5?.provider||'').trim(),program=String(bo.trainingProgram||bo.module5?.programName||'').trim();
 if(!provider&&!program)return;
 try{
  const r=await fetch(trainingEndpoint(),{method:'POST',headers:{'Content-Type':'application/json','apikey':cfg.key,'Authorization':'Bearer '+cfg.key,'X-BOOST-Staff-Token':token()},body:JSON.stringify({provider,program})});
  const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok||!d.match)return;
  const raw=d.match.data||{},tj=p.trainingJustification&&typeof p.trainingJustification==='object'?p.trainingJustification:{};
  const completion=pickMetric(raw,[/completion rate/,/^completion$/, /completed/]);
  const placement=pickMetric(raw,[/job placement/,/placement rate/,/employment.*(2nd|q2|second)/]);
  const earnings=pickMetric(raw,[/average earnings/,/avg.*earnings/,/average wage/,/avg.*wage/,/wage.*(2nd|q2|second)/]);
  const cost=pickMetric(raw,[/total cost/,/^cost$/, /tuition/]);
  if(completion&&!tj.completionRate)tj.completionRate=completion;
  if(placement&&!tj.jobPlacementRate)tj.jobPlacementRate=placement;
  if(earnings&&!tj.avgEarningsPost)tj.avgEarningsPost=earnings;
  if(cost&&!tj.comparisonTotalCost){const n=Number(cost.replace(/[$,]/g,''));tj.comparisonTotalCost=Number.isFinite(n)?n:cost}
  tj.trainingEffectivenessSource='ARIZONA@WORK Pinal County Program Performance Report';
  tj.trainingEffectivenessRefreshedAt=d.refreshed_at||new Date().toISOString();
  tj.trainingEffectivenessMatch=d.match;
  p.trainingJustification=tj;
  if(typeof saveState==='function')saveState();
 }catch(_){ }
}
function patchTrainingPdfFooter(){
 const C=window.jspdf?.jsPDF;if(!C||C.prototype.__pinalEOFooter)return;
 const addFooter=doc=>{if(!doc||doc.__pinalEOApplied)return;doc.__pinalEOApplied=true;const pages=doc.getNumberOfPages?.()||1;for(let i=1;i<=pages;i++){doc.setPage(i);doc.setFillColor(255,255,255);doc.rect(40,735,532,52,'F');doc.setTextColor(70);doc.setFont('helvetica','normal');doc.setFontSize(6.4);const t="Equal Opportunity Employer / Program • Auxiliary aids and services are available upon request to individuals with disabilities. Certain accommodations require 48 hours' notice. For alternative formats or information about the ARIZONA@WORK Pinal County Equal Opportunity and Affirmative Action policy, call 520-866-6227. TTY/TDD Services 7-1-1. Steven's Amendment information: pinal.gov/StevensAmendment.";doc.text(doc.splitTextToSize(t,520),46,746);doc.setTextColor(0)}};
 const save=C.prototype.save,output=C.prototype.output;C.prototype.save=function(...a){addFooter(this);return save.apply(this,a)};C.prototype.output=function(...a){addFooter(this);return output.apply(this,a)};C.prototype.__pinalEOFooter=true;
}
function loadTrainingTools(){
 if(!document.querySelector('script[data-jspdf]')){const j=document.createElement('script');j.src='https://cdn.jsdelivr.net/npm/jspdf@4.2.1/dist/jspdf.umd.min.js';j.dataset.jspdf='1';j.onload=patchTrainingPdfFooter;document.head.appendChild(j)}else patchTrainingPdfFooter();
 if(!document.querySelector('script[data-training-justification]')){const s=document.createElement('script');s.src='assets/js/talentsync-training-justification.js?v=20261002-2';s.defer=true;s.dataset.trainingJustification='1';document.head.appendChild(s)}
}
async function openTrainingJustification(){const p=participant();if(!p)return;await prefillTrainingEffectiveness(p);const api=window.TALENTSYNC_TRAINING_JUSTIFICATION;if(api?.open)api.open();else{loadTrainingTools();setTimeout(()=>window.TALENTSYNC_TRAINING_JUSTIFICATION?.open(),500)}}
function addTrainingDrawerAction(){const grid=document.querySelector('#drawerActions');if(!grid||grid.querySelector('[data-training-justification]'))return;const b=document.createElement('button');b.className='action-card';b.type='button';b.dataset.trainingJustification='1';b.innerHTML='<strong>Training Justification</strong><span>Rosie-guided PY26 checklist · Arizona performance auto-pull · PDF / print</span>';b.onclick=openTrainingJustification;grid.appendChild(b)}
function build(){
 loadTrainingTools();
 const fab=document.createElement('button');fab.className='tsr-fab';fab.innerHTML='<span class="tsr-avatar">R</span><span>Ask Rosie</span>';fab.onclick=open;document.body.appendChild(fab);
 const p=document.createElement('aside');p.id='tsRosiePanel';p.className='tsr-panel';p.innerHTML='<div class="tsr-head"><div class="tsr-avatar big">R</div><div><strong>Rosie · Pinal Career Coach</strong><small id="tsRosieContext">Select a participant first.</small></div><button id="tsRosieClose">×</button></div><div id="tsRosieChat" class="tsr-chat"><div class="tsr-msg bot"><strong>Hi, I’m Rosie.</strong><br>I can reason across this participant’s TalentSync record, BOOST outputs, obligations/payments, employment information, and the controlled Pinal knowledge loaded for me. I can also guide you through the PY26 Training Justification Checklist and produce the completed PDF.</div><div class="tsr-quick"><button>What is next for this participant?</button><button>What needs attention?</button><button>Are any obligations pending approval?</button><button>Prep me for my appointment.</button><button data-training-quick>Complete Training Justification</button></div></div><div class="tsr-input"><textarea id="tsRosieInput" rows="2" placeholder="Ask about this participant…"></textarea><button id="tsRosieSend">Send</button></div>';
 document.body.appendChild(p);p.querySelector('#tsRosieClose').onclick=close;p.querySelector('#tsRosieSend').onclick=()=>{const i=p.querySelector('#tsRosieInput');const q=i.value;i.value='';ask(q)};
 p.querySelector('#tsRosieInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();p.querySelector('#tsRosieSend').click()}});
 p.querySelectorAll('.tsr-quick button').forEach(b=>b.onclick=()=>b.hasAttribute('data-training-quick')?openTrainingJustification():ask(b.textContent));document.addEventListener('click',e=>{if(e.target.closest('[data-open]'))setTimeout(()=>{syncContext();addTrainingDrawerAction()},60)});window.addEventListener('talentsync:cloud-ready',()=>{syncContext();addTrainingDrawerAction()});new MutationObserver(addTrainingDrawerAction).observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();