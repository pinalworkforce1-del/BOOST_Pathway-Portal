(()=>{'use strict';
function boot(){
 if(!/staff-dashboard\.html$/i.test(location.pathname))return;
 const refresh=document.getElementById('refresh');
 if(!document.getElementById('talentSyncToggle')){
  const btn=document.createElement('button');btn.type='button';btn.className='btn alt';btn.id='talentSyncToggle';btn.textContent='Open TalentSync';btn.title='Open the TalentSync operational workspace';refresh?.parentNode?.insertBefore(btn,refresh);btn.addEventListener('click',()=>{location.href='talentsync.html'});
 }
 const app=document.getElementById('app'),grid=document.getElementById('grid');if(!app||!grid)return;
 if(!document.getElementById('boostFunnel')){
  const style=document.createElement('style');style.textContent=`.boostFunnel{margin:14px 0 16px}.boostFunnelHead{display:flex;justify-content:space-between;gap:12px;align-items:end;margin-bottom:8px}.boostFunnelHead h2{margin:0;color:var(--navy);font-size:17px}.boostFunnelHead span{font-size:10px;color:var(--muted)}.funnelGrid{display:grid;grid-template-columns:repeat(5,1fr);gap:9px}.funnelCard{border:1px solid var(--line);border-radius:14px;background:#fff;padding:12px;text-align:left}.funnelCard small{display:block;font-size:9px;text-transform:uppercase;letter-spacing:.06em;font-weight:900;color:var(--muted)}.funnelCard strong{display:block;font-size:24px;color:var(--navy);margin:3px 0}.funnelCard span{font-size:10px;color:var(--muted);line-height:1.3}.funnelCard.alert{border-color:#e6c66d;background:#fff9e9}.funnelCard.good{border-color:#a9d5bd;background:#f3faf6}.movedWrap{margin-top:16px;border-top:2px solid #cfe2d7;padding-top:14px}.movedHead{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px}.movedHead h2{margin:0;color:#24513d;font-size:16px}.movedHead span{font-size:10px;color:var(--muted)}.movedGrid{display:grid;gap:10px}.movedGrid .person{background:#f7faf8;border-color:#cfe2d7}.movedGrid .person:before{content:'✓ MOVED TO ENROLLMENT';display:inline-block;font-size:9px;font-weight:950;letter-spacing:.05em;color:#276a46;background:#e8f5ee;border-radius:999px;padding:5px 8px;margin-bottom:8px}@media(max-width:900px){.funnelGrid{grid-template-columns:1fr 1fr}}@media(max-width:520px){.funnelGrid{grid-template-columns:1fr}}`;
  document.head.appendChild(style);
  const funnel=document.createElement('section');funnel.id='boostFunnel';funnel.className='boostFunnel';funnel.innerHTML=`<div class="boostFunnelHead"><div><h2>BOOST → Enrollment Funnel</h2><span>See progression, stalled participants, and successful handoffs at a glance.</span></div></div><div class="funnelGrid"><div class="funnelCard"><small>BOOST Started</small><strong id="fStarted">0</strong><span>Participants who entered BOOST</span></div><div class="funnelCard"><small>BOOST Finished</small><strong id="fFinished">0</strong><span>Completed current BOOST pathway</span></div><div class="funnelCard alert"><small>Stalled 30+ Days</small><strong id="fStalled">0</strong><span id="fDropoff">No current dropoff</span></div><div class="funnelCard"><small>Enrollment Approved</small><strong id="fApproved">0</strong><span>Coach advanced participant to enrollment</span></div><div class="funnelCard good"><small>Moved to TalentSync</small><strong id="fMoved">0</strong><span>Successful operational handoff</span></div></div>`;
  const stats=app.querySelector('.stats');app.insertBefore(funnel,stats||grid);
  const moved=document.createElement('section');moved.id='movedEnrollment';moved.className='movedWrap';moved.innerHTML='<div class="movedHead"><h2>Moved to Enrollment</h2><span>BOOST record retained • operational case continues in TalentSync</span></div><div id="movedGrid" class="movedGrid"></div>';grid.insertAdjacentElement('afterend',moved);
 }
 let busy=false;
 function classify(){if(busy)return;busy=true;requestAnimationFrame(()=>{try{
   const movedGrid=document.getElementById('movedGrid');if(!movedGrid)return;
   [...movedGrid.querySelectorAll('.person')].forEach(card=>grid.appendChild(card));
   const cards=[...grid.querySelectorAll(':scope > .person')];let finished=0,stalled=0,approved=0,moved=0;const drop=new Map();
   cards.forEach(card=>{
    const text=(card.innerText||'').toLowerCase();const modules=[...card.querySelectorAll('.module')];const done=modules.filter(x=>x.classList.contains('done')).length;
    const isFinished=(modules.length>0&&done===modules.length)||/\bcompleted\b/.test(text)&&!/not completed/.test(text);
    const isMoved=/moved to talentsync|sent to talentsync|in talentsync|handoff complete|moved to enrollment/.test(text);
    const isApproved=isMoved||/enrollment approved|approved for enrollment|handoff pending/.test(text);
    const dayMatches=[...text.matchAll(/(\d+)\+?\s*days?/g)].map(m=>Number(m[1]));const isStalled=!isMoved&&(dayMatches.some(n=>n>=30)||/30\+|needs follow-up/.test(text));
    if(isFinished)finished++;if(isApproved)approved++;if(isMoved){moved++;movedGrid.appendChild(card)}
    if(isStalled){stalled++;const next=modules.find(x=>!x.classList.contains('done'));if(next){const n=(next.querySelector('b')?.textContent||'Next module').trim();drop.set(n,(drop.get(n)||0)+1)}}
   });
   const all=cards.length;document.getElementById('fStarted').textContent=all;document.getElementById('fFinished').textContent=finished;document.getElementById('fStalled').textContent=stalled;document.getElementById('fApproved').textContent=approved;document.getElementById('fMoved').textContent=moved;
   const top=[...drop.entries()].sort((a,b)=>b[1]-a[1])[0];document.getElementById('fDropoff').textContent=top?`Biggest dropoff: ${top[0]} · ${top[1]} participant${top[1]===1?'':'s'}`:'No current 30+ day dropoff';
   document.getElementById('movedEnrollment').classList.toggle('hidden',moved===0);
  }finally{busy=false}},0)}
 const obs=new MutationObserver(classify);obs.observe(grid,{childList:true,subtree:true,characterData:true});classify();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();