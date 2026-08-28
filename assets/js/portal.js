(() => {
  const STORAGE_KEY='boostPortalCompleted_v2';
  const PATHWAY_KEY='boostPortalPathway_v2';
  const INDUSTRY_KEY='boostPortalIndustry_v2';

  const routes={
    shared:['module1'],
    career:['module1','module2','module3','module4','ai','industry','investment'],
    rapid:['module1','financial','skillmobility','ai','jobsearch']
  };
  const labels={shared:'Shared BOOST Start',career:'Career Exploration & Development',rapid:'Rapid Employment'};
  const industryLabels={
    healthcare:'Healthcare Pathways',
    trades:'Skilled Trades Pathways',
    manufacturing:'Advanced Manufacturing Pathways',
    it:'Information Technology',
    cdl:'Transportation & Logistics'
  };

  function getPathway(){return localStorage.getItem(PATHWAY_KEY)||'shared'}
  function setPathway(id){
    if(!routes[id]) return;
    localStorage.setItem(PATHWAY_KEY,id);
    updateProgress();
    document.dispatchEvent(new CustomEvent('boostpathway',{detail:{pathway:id}}));
  }
  function getIndustry(){return localStorage.getItem(INDUSTRY_KEY)||''}
  function setIndustry(id){
    if(!industryLabels[id]) return;
    localStorage.setItem(INDUSTRY_KEY,id);
    setPathway('career');
    updateProgress();
  }
  function getCompleted(){try{return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'))}catch{return new Set()}}
  function saveCompleted(set){localStorage.setItem(STORAGE_KEY,JSON.stringify([...set]))}
  function markComplete(id){
    const s=getCompleted();
    s.add(id);
    if(industryLabels[id]){
      localStorage.setItem(INDUSTRY_KEY,id);
      s.add('industry');
      localStorage.setItem(PATHWAY_KEY,'career');
    }
    saveCompleted(s);
    updateProgress();
    document.dispatchEvent(new CustomEvent('boostprogress',{detail:{id}}));
  }
  function reset(){
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PATHWAY_KEY);
    localStorage.removeItem(INDUSTRY_KEY);
    updateProgress();
    document.dispatchEvent(new CustomEvent('boostprogress'));
  }
  function routeIsComplete(done,id){
    if(id==='industry') return done.has('industry');
    return done.has(id);
  }
  function updateProgress(){
    const pathway=getPathway();
    const route=routes[pathway]||routes.career;
    const done=getCompleted();
    const n=route.filter(id=>routeIsComplete(done,id)).length;
    const pct=route.length?Math.round((n/route.length)*100):0;
    document.querySelectorAll('[data-progress-fill]').forEach(el=>el.style.width=pct+'%');
    document.querySelectorAll('[data-progress-count]').forEach(el=>el.textContent=`${n} of ${route.length} complete`);
    document.querySelectorAll('[data-pathway-label]').forEach(el=>el.textContent=labels[pathway]||'BOOST Pathway');

    document.querySelectorAll('[data-module-id]').forEach(el=>{
      const id=el.dataset.moduleId;
      el.classList.toggle('is-complete',done.has(id));
      el.classList.remove('is-next');
    });

    const selectedIndustry=getIndustry();
    document.querySelectorAll('[data-industry-id]').forEach(el=>{
      const id=el.dataset.industryId;
      el.classList.toggle('is-complete',done.has('industry') && selectedIndustry===id);
      el.classList.remove('is-next');
    });

    const next=route.find(id=>!routeIsComplete(done,id));
    if(next==='industry'){
      document.querySelectorAll('[data-industry-id]').forEach(el=>el.classList.add('is-next'));
      document.querySelectorAll('[data-industry-choice]').forEach(el=>el.classList.add('is-next'));
    }else if(next){
      document.querySelectorAll(`[data-module-id="${next}"]`).forEach(el=>el.classList.add('is-next'));
    }

    document.querySelectorAll('[data-investment-card]').forEach(el=>{
      const ready=done.has('industry');
      el.classList.toggle('is-ready',ready);
      el.classList.toggle('is-complete',done.has('investment'));
      const status=el.querySelector('[data-investment-status]');
      if(status) status.textContent=done.has('investment')?'Completed':ready?'Ready after your industry experience':'Complete an industry experience first';
    });
  }

  function toast(msg){
    let t=document.querySelector('.toast');
    if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t)}
    t.textContent=msg;t.classList.add('show');
    clearTimeout(window.__boostToast);
    window.__boostToast=setTimeout(()=>t.classList.remove('show'),3400);
  }
  function openPathwayDialog(){
    const d=document.getElementById('pathwayDialog');
    if(d && typeof d.showModal==='function') d.showModal();
  }

  document.addEventListener('click',e=>{
    const pathLink=e.target.closest('[data-set-pathway]');
    if(pathLink?.dataset.setPathway) setPathway(pathLink.dataset.setPathway);
    const coming=e.target.closest('[data-coming]');
    if(coming){
      e.preventDefault();
      const label=coming.dataset.coming;
      toast(`${label} is reserved in the portal and ready to wire when its live resource is available.`);
    }
    const resetBtn=e.target.closest('[data-reset-progress]');
    if(resetBtn){e.preventDefault();if(confirm('Reset BOOST prototype progress and pathway selection on this device?')) reset()}
    const choose=e.target.closest('[data-choose-pathway]');
    if(choose){e.preventDefault();openPathwayDialog()}
    const setBtn=e.target.closest('[data-pathway-choice]');
    if(setBtn){
      e.preventDefault();
      setPathway(setBtn.dataset.pathwayChoice);
      const d=document.getElementById('pathwayDialog');
      if(d?.open) d.close();
      toast(`${labels[setBtn.dataset.pathwayChoice]} pathway selected for this prototype.`);
    }
    const industryChoice=e.target.closest('[data-industry-choice]');
    if(industryChoice){
      e.preventDefault();
      setPathway('career');
      toast('Choose the industry experience that best matches the occupation you are exploring. If none fits, Skill Mobility will serve as the fallback.');
    }
    const industry=e.target.closest('[data-industry-id]');
    if(industry){setIndustry(industry.dataset.industryId)}
    const investment=e.target.closest('[data-investment-card]');
    if(investment && !getCompleted().has('industry')){
      e.preventDefault();
      toast('Complete your selected industry workplace skills experience first. Career Investment Explorer follows that step.');
    }
    const pageComplete=e.target.closest('[data-page-complete]');
    if(pageComplete){
      e.preventDefault();
      const id=pageComplete.dataset.pageComplete;
      if(id){markComplete(id);toast('Marked complete. Your BOOST map has been updated.')}
    }
  });

  window.BOOSTPortal={getCompleted,markComplete,reset,getPathway,setPathway,getIndustry,setIndustry,routes,labels,industryLabels,toast,updateProgress};
  document.addEventListener('DOMContentLoaded',updateProgress);
})();
