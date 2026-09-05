(() => {
  const STORAGE_KEY='boostPortalCompleted_v2';
  const PATHWAY_KEY='boostPortalPathway_v2';
  const INDUSTRY_KEY='boostPortalIndustry_v2';
  const MAP_STATE_KEY='boostPathwaysV29';
  const MAP_LEGACY_KEY='boostPathwaysV28';
  const routes={shared:['module1'],career:['module1','module2','module3','module4','ai','industry','investment'],rapid:['module1','financial','skillmobility','ai','jobsearch']};
  const labels={shared:'Shared BOOST Start',career:'Career Exploration & Development',rapid:'Rapid Employment'};
  const industryLabels={healthcare:'Healthcare Pathways',trades:'Skilled Trades Pathways',manufacturing:'Advanced Manufacturing Pathways',it:'Information Technology',cdl:'Transportation & Logistics'};

  function mapState(){try{return JSON.parse(localStorage.getItem(MAP_STATE_KEY)||localStorage.getItem(MAP_LEGACY_KEY)||'{}')}catch{return{}}}
  function saveMapState(s){s=s||{};s.complete=s.complete||{};localStorage.setItem(MAP_STATE_KEY,JSON.stringify(s))}
  function mapId(id){return industryLabels[id]?`i:${id}`:`m:${id}`}
  function mirrorToMap(completedId){const ms=mapState();ms.complete=ms.complete||{};if(completedId)ms.complete[mapId(completedId)]=true;ms.pathway=getPathway()==='shared'?null:getPathway();const ind=getIndustry();if(ind)ms.selectedIndustry=ind;saveMapState(ms)}
  function importFromMap(){const ms=mapState(),done=getCompleted();Object.entries(ms.complete||{}).forEach(([k,v])=>{if(!v)return;if(k.startsWith('m:'))done.add(k.slice(2));if(k.startsWith('i:')){const id=k.slice(2);done.add(id);done.add('industry');if(industryLabels[id])localStorage.setItem(INDUSTRY_KEY,id)}});saveCompleted(done);if(ms.pathway&&routes[ms.pathway])localStorage.setItem(PATHWAY_KEY,ms.pathway)}

  function getPathway(){return localStorage.getItem(PATHWAY_KEY)||'shared'}
  function setPathway(id){if(!routes[id])return;localStorage.setItem(PATHWAY_KEY,id);mirrorToMap();syncCloudState();updateProgress();document.dispatchEvent(new CustomEvent('boostpathway',{detail:{pathway:id}}))}
  function getIndustry(){return localStorage.getItem(INDUSTRY_KEY)||''}
  function setIndustry(id){if(!industryLabels[id])return;localStorage.setItem(INDUSTRY_KEY,id);setPathway('career');mirrorToMap(id);syncCloudState();updateProgress()}
  function getCompleted(){try{return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'))}catch{return new Set()}}
  function saveCompleted(set){localStorage.setItem(STORAGE_KEY,JSON.stringify([...set]))}
  function markComplete(id){const s=getCompleted();s.add(id);if(industryLabels[id]){localStorage.setItem(INDUSTRY_KEY,id);s.add('industry');localStorage.setItem(PATHWAY_KEY,'career')}saveCompleted(s);mirrorToMap(id);syncCloudState(id);updateProgress();document.dispatchEvent(new CustomEvent('boostprogress',{detail:{id}}))}
  function reset(){localStorage.removeItem(STORAGE_KEY);localStorage.removeItem(PATHWAY_KEY);localStorage.removeItem(INDUSTRY_KEY);localStorage.removeItem(MAP_STATE_KEY);updateProgress();document.dispatchEvent(new CustomEvent('boostprogress'))}
  function routeIsComplete(done,id){return id==='industry'?done.has('industry'):done.has(id)}
  function updateProgress(){
    const pathway=getPathway(),route=routes[pathway]||routes.career,done=getCompleted();
    const n=route.filter(id=>routeIsComplete(done,id)).length,pct=route.length?Math.round((n/route.length)*100):0;
    document.querySelectorAll('[data-progress-fill]').forEach(el=>el.style.width=pct+'%');
    document.querySelectorAll('[data-progress-count]').forEach(el=>el.textContent=`${n} of ${route.length} complete`);
    document.querySelectorAll('[data-pathway-label]').forEach(el=>el.textContent=labels[pathway]||'BOOST Pathway');
    document.querySelectorAll('[data-module-id]').forEach(el=>{const id=el.dataset.moduleId;el.classList.toggle('is-complete',done.has(id));el.classList.remove('is-next')});
    const selectedIndustry=getIndustry();
    document.querySelectorAll('[data-industry-id]').forEach(el=>{const id=el.dataset.industryId;el.classList.toggle('is-complete',done.has('industry')&&selectedIndustry===id);el.classList.remove('is-next')});
    const next=route.find(id=>!routeIsComplete(done,id));
    if(next==='industry'){document.querySelectorAll('[data-industry-id],[data-industry-choice]').forEach(el=>el.classList.add('is-next'))}else if(next){document.querySelectorAll(`[data-module-id="${next}"]`).forEach(el=>el.classList.add('is-next'))}
    document.querySelectorAll('[data-investment-card]').forEach(el=>{const ready=done.has('industry');el.classList.toggle('is-ready',ready);el.classList.toggle('is-complete',done.has('investment'));const status=el.querySelector('[data-investment-status]');if(status)status.textContent=done.has('investment')?'Completed':ready?'Ready after your industry experience':'Complete an industry experience first'});
  }
  function toast(msg){let t=document.querySelector('.toast');if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t)}t.textContent=msg;t.classList.add('show');clearTimeout(window.__boostToast);window.__boostToast=setTimeout(()=>t.classList.remove('show'),3400)}
  function openPathwayDialog(){const d=document.getElementById('pathwayDialog');if(d&&typeof d.showModal==='function')d.showModal()}

  function loadScript(src){return new Promise((resolve,reject)=>{if(document.querySelector(`script[src="${src}"]`))return resolve();const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}
  async function ensureCloud(){try{await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');await loadScript(new URL('assets/js/pinal-cloud-config.js',location.href.includes('/topic/')?new URL('../',location.href):location.href).toString());await loadScript(new URL('assets/js/pinal-cloud.js',location.href.includes('/topic/')?new URL('../',location.href):location.href).toString());return window.PinalBOOST||null}catch(e){console.warn('Pinal BOOST cloud unavailable',e);return null}}
  function syncCloudState(completedId){if(!window.PinalBOOST)return;const j=window.PinalBOOST.get();j.selectedPathway=getPathway();j.selectedIndustry=getIndustry();j.portal=j.portal||{};j.portal.completed=[...getCompleted()];j.portal.mapState=mapState();j.progress=j.progress||{};if(completedId)j.progress[completedId]='complete';window.PinalBOOST.put(j)}
  async function restoreCloudState(){const cloud=await ensureCloud();if(!cloud)return;await cloud.finishAuth();const j=cloud.get();if(j.selectedPathway&&routes[j.selectedPathway])localStorage.setItem(PATHWAY_KEY,j.selectedPathway);if(j.selectedIndustry&&industryLabels[j.selectedIndustry])localStorage.setItem(INDUSTRY_KEY,j.selectedIndustry);if(j.portal?.mapState)saveMapState(j.portal.mapState);const fromCloud=new Set(j.portal?.completed||Object.entries(j.progress||{}).filter(([,v])=>v==='complete').map(([k])=>k));if(fromCloud.size){const merged=getCompleted();fromCloud.forEach(x=>merged.add(x));saveCompleted(merged)}importFromMap();mirrorToMap();updateProgress()}

  function isModule1Activity(){return /activity\.html$/i.test(location.pathname)&&new URLSearchParams(location.search).get('m')==='module1'}
  async function requireModule1SignIn(){if(!isModule1Activity())return;const cloud=await ensureCloud();if(!cloud)return;const cl=cloud.client();const {data:{session}}=await cl.auth.getSession();if(session?.user)return;
    const st=document.createElement('style');st.textContent='.pinalAuthGate{position:fixed;inset:0;z-index:99999;background:#071a2bd9;backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:18px}.pinalAuthCard{width:min(530px,96vw);background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 28px 80px #0008;font-family:Inter,Arial,sans-serif}.pinalAuthHead{background:linear-gradient(90deg,#102d49,#1f587f);color:#fff;padding:20px 22px;border-bottom:3px solid #e4a72b}.pinalAuthHead h2{margin:0}.pinalAuthBody{padding:20px 22px}.pinalAuthRow{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pinalAuthBody label{display:block;font-weight:850;margin:10px 0 5px;color:#17324d}.pinalAuthBody input{width:100%;padding:12px;border:1px solid #bdccd5;border-radius:10px;font:inherit}.pinalAuthBtn{width:100%;margin-top:13px;padding:12px;border:0;border-radius:11px;background:#0d2741;color:#fff;font-weight:900;cursor:pointer}.pinalAuthCode{display:none}.pinalAuthCode.show{display:block}.pinalAuthStatus{margin-top:10px;color:#2f6b50;font-size:13px;font-weight:800}.pinalAuthNote{margin-top:11px;padding:10px;border-radius:10px;background:#f1f6f8;color:#566b78;font-size:12px;line-height:1.4}@media(max-width:600px){.pinalAuthRow{grid-template-columns:1fr}}';document.head.appendChild(st);
    const gate=document.createElement('div');gate.className='pinalAuthGate';gate.innerHTML='<div class="pinalAuthCard"><div class="pinalAuthHead"><h2>Welcome to Pinal BOOST</h2><p>Sign in so your BOOST progress and career evidence can follow you.</p></div><div class="pinalAuthBody"><div class="pinalAuthRow"><div><label>First name</label><input id="paFirst" autocomplete="given-name"></div><div><label>Last name</label><input id="paLast" autocomplete="family-name"></div></div><label>Email</label><input id="paEmail" type="email" autocomplete="email"><button class="pinalAuthBtn" id="paSend">Send My Sign-In Email</button><div class="pinalAuthCode" id="paCodeWrap"><label>6-digit code</label><input id="paCode" maxlength="6" inputmode="numeric" autocomplete="one-time-code"><button class="pinalAuthBtn" id="paVerify">Verify Code & Start Module 1</button></div><div class="pinalAuthStatus" id="paStatus"></div><div class="pinalAuthNote">Your confirmation returns to the Pinal BOOST portal. Keep this browser tab open while checking your email.</div></div></div>';document.body.appendChild(gate);
    const $=s=>gate.querySelector(s),status=$('#paStatus');
    $('#paSend').onclick=async()=>{const fn=$('#paFirst').value.trim(),ln=$('#paLast').value.trim(),em=$('#paEmail').value.trim();if(!fn||!ln||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){status.textContent='Enter your name and a valid email.';return}status.textContent='Sending secure sign-in email…';const {error}=await cloud.signIn(em,(fn+' '+ln).trim(),window.PINAL_BOOST_CONFIG.authRedirect+'activity.html?m=module1');if(error){status.textContent=error.message;return}$('#paCodeWrap').classList.add('show');status.textContent='Email sent. Use the link or enter the six-digit code if one is provided.'};
    $('#paVerify').onclick=async()=>{const em=$('#paEmail').value.trim(),code=$('#paCode').value.trim();if(!/^\d{6}$/.test(code)){status.textContent='Enter the six-digit code.';return}const {error}=await cloud.verify(em,code);if(error){status.textContent=error.message;return}await cloud.finishAuth();gate.remove();location.reload()};
  }

  document.addEventListener('click',e=>{
    const pathLink=e.target.closest('[data-set-pathway]');if(pathLink?.dataset.setPathway)setPathway(pathLink.dataset.setPathway);
    const coming=e.target.closest('[data-coming]');if(coming){e.preventDefault();toast(`${coming.dataset.coming} is reserved in the portal and ready to wire when its live resource is available.`)}
    const resetBtn=e.target.closest('[data-reset-progress]');if(resetBtn){e.preventDefault();if(confirm('Reset BOOST prototype progress and pathway selection on this device?'))reset()}
    const choose=e.target.closest('[data-choose-pathway]');if(choose){e.preventDefault();openPathwayDialog()}
    const setBtn=e.target.closest('[data-pathway-choice]');if(setBtn){e.preventDefault();setPathway(setBtn.dataset.pathwayChoice);const d=document.getElementById('pathwayDialog');if(d?.open)d.close();toast(`${labels[setBtn.dataset.pathwayChoice]} pathway selected.`)}
    const industryChoice=e.target.closest('[data-industry-choice]');if(industryChoice){e.preventDefault();setPathway('career');toast('Choose the industry experience that best matches the occupation you are exploring. If none fits, Skill Mobility will serve as the fallback.')}
    const industry=e.target.closest('[data-industry-id]');if(industry)setIndustry(industry.dataset.industryId);
    const investment=e.target.closest('[data-investment-card]');if(investment&&!getCompleted().has('industry')){e.preventDefault();toast('Complete your selected industry workplace skills experience first. Career Investment Explorer follows that step.')}
    const pageComplete=e.target.closest('[data-page-complete]');if(pageComplete){e.preventDefault();const id=pageComplete.dataset.pageComplete;if(id){markComplete(id);toast('Marked complete. Your BOOST map has been updated.')}}
  });

  window.BOOSTPortal={getCompleted,markComplete,reset,getPathway,setPathway,getIndustry,setIndustry,routes,labels,industryLabels,toast,updateProgress,syncCloudState};
  document.addEventListener('DOMContentLoaded',async()=>{importFromMap();updateProgress();await restoreCloudState();await requireModule1SignIn()});
})();
