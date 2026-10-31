/* Pinal BOOST — read-only evidence view for cross-origin Modules 3 and 4.
 * Reads an authenticated, versioned journey. Never writes journey or module state. */
(()=>{
  'use strict';
  const requested=new URLSearchParams(location.search).get('m');
  const id=['module2','module3','module4'].includes(requested)?requested:null;
  if(!id||!/activity\.html$/i.test(location.pathname))return;

  const style=document.createElement('style');
  style.textContent=[
    '.pinalSavedEvidence{flex:0 0 auto;max-height:43vh;overflow:auto;background:#f3f8fb;color:#163047;border-bottom:2px solid #b9d5e7;font:14px/1.5 system-ui,sans-serif}',
    '.pinalSavedEvidence[hidden]{display:none!important}',
    '.pinalSavedEvidence details{padding:10px 20px}',
    '.pinalSavedEvidence summary{cursor:pointer;font-weight:850;font-size:15px;color:#123b62}',
    '.pinalSavedEvidence .pinalSub{margin:5px 0 8px;color:#3e5a6d}',
    '.pinalSavedEvidence .pinalGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px}',
    '.pinalSavedEvidence .pinalField{border:1px solid #cddfe9;background:white;border-radius:9px;padding:10px 12px;min-width:0}',
    '.pinalSavedEvidence .pinalField h4{margin:0 0 5px;font-size:12px;color:#315873;text-transform:uppercase;letter-spacing:.035em}',
    '.pinalSavedEvidence .pinalField p{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}',
    '.pinalSavedEvidence pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.4 ui-monospace,monospace;margin:0;max-height:150px;overflow:auto}',
    '.pinalSavedEvidence .pinalSmall{font-size:12px;color:#536879;margin:9px 0 0}',
    '@media(max-width:650px){.pinalSavedEvidence{max-height:40vh}.pinalSavedEvidence details{padding:8px 12px}}'
  ].join('');
  document.head.appendChild(style);
  const panel=document.createElement('section');
  panel.className='pinalSavedEvidence';
  panel.setAttribute('aria-label','Saved BOOST module evidence');
  panel.hidden=true;
  const frame=document.getElementById('activityFrame');
  if(!frame)return;
  frame.parentElement.insertBefore(panel,frame);

  const human=s=>String(s).replace(/([a-z])([A-Z])/g,'$1 $2').replace(/[_-]/g,' ').replace(/^./,x=>x.toUpperCase());
  const nice=(x)=>{
    if(x===null||x===undefined||x==='')return 'Not recorded';
    if(typeof x==='string'||typeof x==='number'||typeof x==='boolean')return String(x);
    if(Array.isArray(x)){
      if(!x.length)return 'None recorded';
      if(x.every(o=>typeof o==='string'||typeof o==='number'))return x.join(' • ');
      if(x.every(o=>o&&typeof o==='object'&&(o.title||o.careerTitle||o.occupation)))return x.map(o=>o.title||o.careerTitle||o.occupation).join(' • ');
    }
    return null;
  };
  const field=(label,value)=>{
    if(value===undefined||value===null||value==='')return null;
    const wrap=document.createElement('div');wrap.className='pinalField';
    const h=document.createElement('h4');h.textContent=human(label);
    const simple=nice(value);
    const v=document.createElement(simple===null?'pre':'p');
    v.textContent=simple===null?JSON.stringify(value,null,2):simple;
    wrap.append(h,v);
    return wrap;
  };
  async function draw(){
    try{
      const cloud=window.PinalBOOSTCloud;
      if(!cloud?.ready||!cloud?.getClient||!cloud?.loadMine)return;
      await cloud.ready();
      const c=cloud.getClient();if(!c)return;
      const session=(await c.auth.getSession()).data?.session;
      if(!session?.user?.id)return;
      const j=await cloud.loadMine();if(!j||typeof j!=='object')return;
      const email=String(j.participant?.email||j.participant_email||'').trim().toLowerCase();
      if(!email||email!==String(session.user.email||'').trim().toLowerCase())return;
      const saved=j.modules?.[id];
      if(!saved||typeof saved!=='object'||!Object.keys(saved).length)return;
      const reviewing=j.progress?.[id]==='stale'||!!j.staleModules?.[id];

      const details=document.createElement('details');
      details.open=true;
      const heading=document.createElement('summary');
      heading.textContent='Your saved '+({module2:'Career Validation',module3:'Career Mobility',module4:'Career Decision'}[id])+' evidence';
      const sub=document.createElement('p');sub.className='pinalSub';
      sub.textContent=reviewing
        ?'Saved answers were found. BOOST also records that this module needs review because earlier evidence changed.'
        :'These are your original saved answers from BOOST. They are shown here because the separate module page may not load the same saved browser state.';
      const grid=document.createElement('div');grid.className='pinalGrid';
      const keys=id==='module2'
        ?['currentHourlyWage','wageBaseline','careers','validationBySoc','fields','completedAt']
        :id==='module3'
        ?['startingPoint','currentWage','careers','careerDecisionsBySoc','selfAssessment','workPreferences','skillEvidence','skillLab','skillAlignmentBySoc','newExplorations','workNote','completedAt']
        :['careerTitle','selectedSoc','route','participantDirection','answers','decision','wageComparison','preparationIntel','resultSnapshot','completedAt'];
      for(const key of keys){const el=field(key,saved[key]);if(el)grid.appendChild(el)}
      const foot=document.createElement('p');foot.className='pinalSmall';
      foot.textContent='Read-only recovery view. Opening or closing this panel never changes your answers, review status, or completion history.';
      details.append(heading,sub,grid,foot);panel.replaceChildren(details);panel.hidden=false;
    }catch(err){console.warn('Pinal saved module evidence unavailable',err)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',draw,{once:true});else draw();
})();
