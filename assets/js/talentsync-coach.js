(()=>{'use strict';
function bootTalentSync(){
  if(!/staff-dashboard\.html$/i.test(location.pathname)) return;
  const $=id=>document.getElementById(id);
  const grid=$('grid'),toolbar=document.querySelector('.toolbar'),stats=document.querySelector('.stats');
  if(!grid||!toolbar||!stats||document.getElementById('talentSyncToggle')) return;

  let active=false;
  const original={
    title:document.title,
    brand:document.querySelector('.brand b')?.textContent||'PINAL BOOST • COACH VIEW',
    sub:document.querySelector('.brand span')?.textContent||'',
    statLabels:[...stats.querySelectorAll('.stat small')].map(x=>x.textContent),
    searchPlaceholder:$('search')?.placeholder||''
  };

  const btn=document.createElement('button');
  btn.type='button'; btn.className='btn alt'; btn.id='talentSyncToggle'; btn.textContent='Open TalentSync';
  const refresh=$('refresh'); refresh?.parentNode?.insertBefore(btn,refresh);

  const style=document.createElement('style');
  style.textContent=`
    body.talentsync-mode{--ts:#2f7d4c}
    body.talentsync-mode .person:not(.ts-approved){display:none!important}
    body.talentsync-mode .person.ts-approved{border-left:5px solid var(--ts)}
    .ts-strip{margin-top:10px;padding:9px 10px;border:1px solid #d7e5dc;background:#f3faf6;border-radius:10px;font-size:11px;line-height:1.4;color:#365c46}
    .ts-strip b{display:block;color:#24513d;margin-bottom:2px}
    .ts-mode-note{grid-column:1/-1;padding:9px 11px;border:1px solid #cfe2d7;background:#f2f8f5;border-radius:11px;color:#365c46;font-size:11px;font-weight:800}
  `;
  document.head.appendChild(style);

  function cards(){return [...grid.querySelectorAll('.person')]}
  function markApproved(){
    cards().forEach(card=>{
      const sent=[...card.querySelectorAll('button')].some(b=>/Sent to TalentSync/i.test(b.textContent||''));
      card.classList.toggle('ts-approved',sent);
      const old=card.querySelector('.ts-strip');
      if(sent&&!old){
        const strip=document.createElement('div');
        strip.className='ts-strip';
        strip.innerHTML='<b>TalentSync • Enrollment Setup</b>Next action: Complete intake / enrollment setup.';
        card.appendChild(strip);
      } else if(!sent&&old){old.remove()}
    });
  }
  function updateStats(){
    if(!active)return;
    const approved=cards().filter(c=>c.classList.contains('ts-approved'));
    const visible=approved.filter(c=>getComputedStyle(c).display!=='none');
    const vals=[visible.length,visible.length,0,0];
    ['sPeople','sActive','sFollow','sDone'].forEach((id,i)=>{const el=$(id);if(el)el.textContent=String(vals[i])});
  }
  function enter(){
    active=true; document.body.classList.add('talentsync-mode'); document.title='TalentSync • Coach View';
    const b=document.querySelector('.brand b'),s=document.querySelector('.brand span');
    if(b)b.textContent='TALENTSYNC • COACH VIEW';
    if(s)s.textContent='MY PARTICIPANTS • ENROLLMENT SETUP • EMPLOYMENT FLOW';
    btn.textContent='Back to BOOST';
    const labels=['My Participants','Enrollment Setup','Employment Ready','Employed'];
    [...stats.querySelectorAll('.stat small')].forEach((el,i)=>{if(labels[i])el.textContent=labels[i]});
    if($('search'))$('search').placeholder='Search my TalentSync participants';
    ['pathFilter','daysFilter','h3Filter'].forEach(id=>{if($(id))$(id).style.display='none'});
    if($('statusFilter'))$('statusFilter').style.display='none';
    const af=$('assignmentFilter'); if(af){af.value='mine';af.dispatchEvent(new Event('change',{bubbles:true}))}
    markApproved(); updateStats();
  }
  function leave(){
    active=false; document.body.classList.remove('talentsync-mode'); document.title=original.title;
    const b=document.querySelector('.brand b'),s=document.querySelector('.brand span');
    if(b)b.textContent=original.brand;if(s)s.textContent=original.sub;
    btn.textContent='Open TalentSync';
    [...stats.querySelectorAll('.stat small')].forEach((el,i)=>{if(original.statLabels[i])el.textContent=original.statLabels[i]});
    if($('search'))$('search').placeholder=original.searchPlaceholder;
    ['pathFilter','daysFilter','h3Filter','statusFilter'].forEach(id=>{if($(id))$(id).style.display=''});
    cards().forEach(c=>c.classList.remove('ts-approved'));
    document.querySelectorAll('.ts-strip').forEach(x=>x.remove());
    const af=$('assignmentFilter');if(af){af.value='';af.dispatchEvent(new Event('change',{bubbles:true}))}
  }
  btn.addEventListener('click',()=>active?leave():enter());

  const observer=new MutationObserver(()=>{if(active){markApproved();updateStats()}});
  observer.observe(grid,{childList:true,subtree:true});
  markApproved();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(bootTalentSync,0));
else setTimeout(bootTalentSync,0);
})();