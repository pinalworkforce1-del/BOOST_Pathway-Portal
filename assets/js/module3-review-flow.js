(function(){
'use strict';
const KEY='pinal_boost_career_exploration_v1';
const JOURNEY_KEY='pinal_boost_journey_v1';
const params=new URLSearchParams(location.search);
if(!/activity\.html$/i.test(location.pathname)||params.get('m')!=='module3')return;
const frame=document.getElementById('activityFrame');
const finish=document.getElementById('finishBtn');
if(!frame||!finish)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
function shared(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(_){return{}}}
function putShared(s){s.updatedAt=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(s));mirrorJourney(s)}
function getJourney(){try{return window.PinalBOOST?.get?.()||JSON.parse(localStorage.getItem(JOURNEY_KEY)||'{}')||{}}catch(_){return{}}}
function mirrorJourney(s){
 try{
  const j=getJourney();j.modules=j.modules||{};j.modules.module3=Object.assign({},j.modules.module3||{},s.module3||{});j.updated_at=new Date().toISOString();
  if(window.PinalBOOST?.put)window.PinalBOOST.put(j);else localStorage.setItem(JOURNEY_KEY,JSON.stringify(j));
 }catch(e){console.warn('BOOST Module 3 review-flow journey mirror unavailable',e)}
}
function carried(s){return s?.module1?.selected||[]}
function decisions(s){return s?.module3?.careerDecisionsBySoc||{}}
function explicitDecision(v){return v==='keep'||v==='pause'}
function currentCards(d){try{return [...d.querySelectorAll('#boostM3FinalCompare .boostM3CareerCompare[data-soc]')]}catch(_){return[]}}
function smooth(el,block='center'){try{el?.scrollIntoView({behavior:'smooth',block})}catch(_){}}
function toast(msg){if(window.BOOSTPortal?.toast)window.BOOSTPortal.toast(msg);else alert(msg)}
function css(d){
 if(d.getElementById('boostM3ReviewFlowCSS'))return;
 const s=d.createElement('style');s.id='boostM3ReviewFlowCSS';s.textContent=`
 .boostM3CareerCompare.boostM3Reviewed{border-color:#79bba7;box-shadow:0 0 0 2px rgba(42,157,143,.08)}
 .boostM3ReviewReceipt{margin-top:9px;padding:9px 11px;border-radius:9px;background:#eef8f6;border-left:4px solid #2a9d8f;color:#315b5a;font-size:.78rem;font-weight:800;line-height:1.4}
 .boostM3ReviewReceipt.pause{background:#f7f1f1;border-left-color:#9a6262;color:#704747}
 .boostM3ProgressCue{margin:11px 0 3px;padding:9px 11px;border-radius:9px;background:#f4f8fb;color:#536b7d;font-size:.76rem;font-weight:800}
 `;d.head.appendChild(s)
}
function markCard(card,decision){
 if(!card)return;card.classList.add('boostM3Reviewed');
 const keep=card.querySelector('[data-decision="keep"]'),pause=card.querySelector('[data-decision="pause"]');
 if(keep)keep.textContent=decision==='keep'?'✓ KEEP EXPLORING — SAVED':'KEEP EXPLORING THIS CAREER IN BOOST →';
 if(pause)pause.textContent=decision==='pause'?'✓ PAUSED FOR NOW — SAVED':'PAUSE THIS CAREER FOR NOW';
 let receipt=card.querySelector('.boostM3ReviewReceipt');if(!receipt){receipt=card.ownerDocument.createElement('div');receipt.className='boostM3ReviewReceipt';card.appendChild(receipt)}
 receipt.classList.toggle('pause',decision==='pause');receipt.innerHTML=decision==='keep'?'<b>Saved:</b> This career stays active and will carry into Decide.':'<b>Saved:</b> This career is set aside for now. It remains in your journey history and can be revisited later.';
}
function updateReviewCue(d,s){
 const panel=d.getElementById('boostM3FinalCompare');if(!panel)return;
 const list=carried(s),dec=decisions(s),done=list.filter(o=>explicitDecision(dec[o.soc])).length;
 let cue=panel.querySelector('.boostM3ProgressCue');if(!cue){cue=d.createElement('div');cue.className='boostM3ProgressCue';const lead=panel.querySelector('.boostM3Lead');lead?.insertAdjacentElement('afterend',cue)}
 cue.textContent=`Career review progress: ${done} of ${list.length} reviewed. Each choice is saved as you go.`;
}
function renderFromState(d){
 const s=shared(),dec=decisions(s);currentCards(d).forEach(card=>{const v=dec[card.dataset.soc];if(explicitDecision(v))markCard(card,v)});updateReviewCue(d,s);
 try{window.BOOSTModule3Final?.apply?.(frame)}catch(_){}
}
function nextUndecidedCard(d,s,afterSoc){
 const dec=decisions(s),cards=currentCards(d),start=Math.max(0,cards.findIndex(c=>c.dataset.soc===String(afterSoc)));
 for(let i=start+1;i<cards.length;i++)if(!explicitDecision(dec[cards[i].dataset.soc]))return cards[i];
 for(let i=0;i<=start;i++)if(!explicitDecision(dec[cards[i].dataset.soc]))return cards[i];
 return null;
}
function saveDecision(d,button){
 const soc=String(button.dataset.soc||''),decision=button.dataset.decision;if(!soc||!explicitDecision(decision))return;
 const s=shared();s.module3=s.module3||{};s.module3.careerDecisionsBySoc=s.module3.careerDecisionsBySoc||{};s.module3.careerDecisionsBySoc[soc]=decision;s.module3.comparisonStartedAt=s.module3.comparisonStartedAt||new Date().toISOString();s.module3.comparisonUpdatedAt=new Date().toISOString();s.module3.comparisonNeedsRefresh=false;
 const list=carried(s),dec=s.module3.careerDecisionsBySoc,allReviewed=list.length>0&&list.every(o=>explicitDecision(dec[o.soc]));s.module3.comparisonComplete=allReviewed;s.module3.completionReady=allReviewed||!!s.module3.workNowViewed;if(allReviewed)s.module3.finalizedAt=new Date().toISOString();
 putShared(s);markCard(button.closest('.boostM3CareerCompare'),decision);updateReviewCue(d,s);
 try{window.BOOSTModule3Final?.apply?.(frame)}catch(_){}
 const next=nextUndecidedCard(d,s,soc);
 setTimeout(()=>{
  if(next){toast('Saved. Moving to the next career in your comparison.');smooth(next,'start')}
  else{const story=d.getElementById('boostM3FinalStory');toast('Career review complete. Your Module 3 story has been updated.');smooth(story,'start')}
 },120);
}
function startCompare(){const s=shared();s.module3=s.module3||{};s.module3.comparisonStartedAt=s.module3.comparisonStartedAt||new Date().toISOString();putShared(s)}
function startWorkNow(){const s=shared();s.module3=s.module3||{};s.module3.workNowStartedAt=s.module3.workNowStartedAt||new Date().toISOString();putShared(s)}
function completionStatus(d){
 const s=shared(),m=s?.module3||{},list=carried(s),dec=decisions(s),api=d?.defaultView?.__BOOST_M3_FINAL_API;
 const current=api?.getCurrent?.()||null;
 if(!m.startingPoint?.soc&&!current)return{ok:false,section:'#setup',message:'Choose your current or most recent occupation first.'};
 const skillCards=[...d.querySelectorAll('#skillgrid .skillcard')];const checked=skillCards.filter(c=>c.querySelector('input[type="radio"]:checked')).length;
 if(!skillCards.length)return{ok:false,section:'#setup',message:'Open your occupation-based transferable skills before finishing Module 3.'};
 if(checked<skillCards.length)return{ok:false,section:'#skills',message:`Complete your transferable-skill self-assessment (${checked} of ${skillCards.length} answered).`};
 const compareStarted=!!m.comparisonStartedAt||Object.keys(dec).some(k=>explicitDecision(dec[k]));
 if(compareStarted){const missing=list.find(o=>!explicitDecision(dec[o.soc]));if(missing)return{ok:false,soc:String(missing.soc),message:`Review ${missing.title} and choose Keep Exploring or Pause for Now.`};return{ok:true,mode:'compare'}}
 if(m.workNowViewed)return{ok:true,mode:'work_now'};
 return{ok:false,section:'#boostM3FinalChoice',message:'Choose how you want to apply your Module 3 evidence before returning to the BOOST map.'};
}
function showMissing(d,status){
 toast(status.message);
 if(status.soc){const card=d.querySelector(`#boostM3FinalCompare .boostM3CareerCompare[data-soc="${CSS.escape(status.soc)}"]`);if(card){smooth(card,'start');return}}
 smooth(d.querySelector(status.section||'#boostM3FinalChoice'),'start');
}
function finalizeShared(d,status){
 const s=shared(),m=s.module3=s.module3||{},list=carried(s),dec=decisions(s);
 m.completionReady=true;m.finalizedAt=new Date().toISOString();m.comparisonComplete=status.mode==='compare';
 m.careers=list.filter(o=>dec[o.soc]!=='pause').map(o=>({title:o.title,soc:o.soc,decision:dec[o.soc]||'not_explicit',pathway:o.pathway||null,regional:o.regional||null}));
 m.pausedCareers=list.filter(o=>dec[o.soc]==='pause').map(o=>({title:o.title,soc:o.soc,decision:'pause'}));
 putShared(s);return s;
}
async function finishModule3(e){
 e.preventDefault();e.stopImmediatePropagation();
 const d=frame.contentDocument;if(!d){toast('Module 3 is still loading. Try again in a moment.');return}
 const status=completionStatus(d);if(!status.ok){showMissing(d,status);return}
 const s=finalizeShared(d,status),m=s.module3||{};
 finish.disabled=true;finish.textContent='Saving your Module 3 story…';
 const evidence={module:'module3',source:'pinal_module3_finalized_funnel',capturedAt:new Date().toISOString(),completedAt:new Date().toISOString(),startingPoint:m.startingPoint||null,selfAssessment:m.selfAssessment||[],skillLab:m.skillLab||null,careerDecisionsBySoc:m.careerDecisionsBySoc||{},careers:m.careers||[],pausedCareers:m.pausedCareers||[],newExplorations:m.newExplorations||[],skillAlignmentBySoc:m.skillAlignmentBySoc||{},completionMode:status.mode,finalizedAt:m.finalizedAt};
 try{
  if(window.PinalBOOST?.captureModule)window.PinalBOOST.captureModule('module3',evidence);else{const j=getJourney();j.modules=j.modules||{};j.progress=j.progress||{};j.modules.module3=Object.assign({},j.modules.module3||{},evidence);j.progress.module3='complete';localStorage.setItem(JOURNEY_KEY,JSON.stringify(j))}
  try{await window.PinalBOOST?.save?.();await window.PinalBOOSTCloud?.saveNow?.()}catch(err){console.warn('BOOST Module 3 cloud save did not finish before return',err)}
  const ret=params.get('boost_return')||'index.html',nonce=params.get('boost_nonce')||'',target=new URL(ret,location.href);if(target.origin!==location.origin)throw new Error('Unsafe BOOST return URL');target.searchParams.set('boost_complete','module3');if(nonce)target.searchParams.set('boost_nonce',nonce);location.assign(target.toString());
 }catch(err){console.error('BOOST Module 3 guided completion failed',err);finish.disabled=false;finish.textContent='✓ Save Results & Return to BOOST';toast('Your Module 3 evidence is still saved here, but BOOST could not return to the map yet. Please try again.')}
}
function bind(){
 const d=frame.contentDocument;if(!d?.body)return;css(d);if(d.body.dataset.boostM3ReviewFlowBound!=='1'){
  d.body.dataset.boostM3ReviewFlowBound='1';
  d.addEventListener('click',e=>{
   const decision=e.target.closest?.('#boostM3FinalCompare [data-decision][data-soc]');if(decision){e.preventDefault();e.stopImmediatePropagation();saveDecision(d,decision);return}
   if(e.target.closest?.('#boostM3CompareLane'))startCompare();
   if(e.target.closest?.('#boostM3WorkLane'))startWorkNow();
  },true);
 }
 renderFromState(d);
}
frame.addEventListener('load',()=>setTimeout(bind,950));
setTimeout(bind,1100);
finish.addEventListener('click',finishModule3,true);
})();