window.BOOST_LINKS = Object.freeze({
  module1: 'https://pinalworkforce1-del.github.io/BOOST/',
  module2: 'https://pinalworkforce1-del.github.io/BOOST-Career-Validation/',
  module3: 'https://pinalworkforce1-del.github.io/BOOST-Career-Mobility/',
  module4: 'https://pinalworkforce1-del.github.io/BOOST-Decide/',
  ai: 'https://pinalworkforce1-del.github.io/AI_Literacy/',
  investment: 'https://pinalworkforce1-del.github.io/BOOST_Skill_Gap_Closure/',
  healthcare: 'https://pinalworkforce1-del.github.io/MedicalSkills/',
  trades: 'https://pinalworkforce1-del.github.io/Skilled-Trades/',
  manufacturing: 'https://pinalworkforce1-del.github.io/BOOST-Advanced-Manufacturing/',
  it: 'https://pinalworkforce1-del.github.io/BOOST_Information_Tech/',
  cdl: 'https://pinalworkforce1-del.github.io/BOOSTCDL/',
  interestForm: 'https://forms.cloud.microsoft/r/ZTsLaQY4qC',
  ajc: 'https://www.azjobconnection.gov/',
  onet: 'https://www.mynextmove.org/explore/ip'
});

(function wirePinalModule2CompletionRepair(){
  try{
    const params=new URLSearchParams(location.search);
    if(!/activity\.html$/i.test(location.pathname)||params.get('m')!=='module2')return;
    const frame=document.getElementById('activityFrame');
    const finish=document.getElementById('finishBtn');
    if(!frame||!finish)return;

    function sharedState(){
      try{return JSON.parse(localStorage.getItem('pinal_boost_career_exploration_v1')||'{}')||{}}
      catch(_){return{}}
    }
    function value(el){return String(el?.value||'').trim()}
    function liveRealityCheck(){
      try{
        const d=frame.contentDocument;if(!d)return null;
        const cards=[...d.querySelectorAll('.career[data-soc]')];
        if(!cards.length)return null;
        const required=['jobs','wages','prep','employerSupport','life','future'];
        const validationBySoc={};
        let complete=true;
        cards.forEach(card=>{
          const soc=card.dataset.soc||'';
          const row={};
          card.querySelectorAll('[data-field]').forEach(el=>row[el.dataset.field]=value(el));
          validationBySoc[soc]=row;
          if(!required.every(k=>value(card.querySelector(`[data-field="${k}"]`))))complete=false;
        });
        return{complete,validationBySoc,cards};
      }catch(e){console.warn('BOOST Module 2 live completion check unavailable',e);return null}
    }
    function recoveredEvidence(live){
      const s=sharedState(),selected=s?.module1?.selected||[];
      const saved=s?.module2?.validationBySoc||{};
      const merged={...saved,...live.validationBySoc};
      const careers=selected.map(o=>{
        const v=merged[o.soc]||{};
        return{
          title:o.title||'',soc:o.soc||'',origin:o.origin||'Saved in Module 1',pathway:o.pathway||null,regional:o.regional||null,
          jobsInterpretation:v.jobs||'',wagesInterpretation:v.wages||'',preparationReadiness:v.prep||'',employerSupport:v.employerSupport||'',lifeInterpretation:v.life||'',future:v.future||'',
          entryWage:v.entryWage||null,preparationIntel:v.preparationIntel||null,validation:v
        };
      });
      return{
        module:'module2',source:'pinal_module2_saved_reality_check',capturedAt:new Date().toISOString(),
        careers,validationBySoc:merged,intelligenceVersion:s?.module2?.intelligenceVersion||'QI-v1/BLS-baseline-v1',
        originalModule2CompletedAt:s?.module2?.completedAt||null,recoveredSavedEvidence:true
      };
    }

    finish.addEventListener('click',async event=>{
      const live=liveRealityCheck();
      if(!live?.complete)return;
      event.preventDefault();event.stopImmediatePropagation();
      finish.disabled=true;finish.textContent='Restoring Module 2 completion…';
      try{
        const evidence=recoveredEvidence(live);
        if(window.PinalBOOST?.captureModule)window.PinalBOOST.captureModule('module2',evidence);
        else{
          const j=window.PinalBOOST?.get?.()||JSON.parse(localStorage.getItem('pinal_boost_journey_v1')||'{}')||{};
          j.modules=j.modules||{};j.progress=j.progress||{};j.modules.module2=Object.assign({},j.modules.module2||{},evidence,{completedAt:new Date().toISOString()});j.progress.module2='complete';
          localStorage.setItem('pinal_boost_journey_v1',JSON.stringify(j));
        }
        try{await window.PinalBOOST?.save?.();await window.PinalBOOSTCloud?.saveNow?.()}catch(e){console.warn('BOOST Module 2 recovery cloud save did not finish before return',e)}
        const ret=params.get('boost_return')||'index.html',nonce=params.get('boost_nonce')||'';
        const target=new URL(ret,location.href);
        if(target.origin!==location.origin)throw new Error('Unsafe BOOST return URL');
        target.searchParams.set('boost_complete','module2');if(nonce)target.searchParams.set('boost_nonce',nonce);
        location.assign(target.toString());
      }catch(e){
        console.error('BOOST Module 2 completion recovery failed',e);
        finish.disabled=false;finish.textContent='✓ Save Results & Return to BOOST';
        window.BOOSTPortal?.toast?.('Your Module 2 answers are still saved, but BOOST could not restore the map completion yet. Please try the green button again.');
      }
    },true);
  }catch(e){console.warn('BOOST Module 2 completion repair unavailable',e)}
})();

(function wirePinalModule3CustomerExperience(){
  try{
    const params=new URLSearchParams(location.search);
    if(!/activity\.html$/i.test(location.pathname)||params.get('m')!=='module3')return;

    function getJourney(){
      try{
        if(window.PinalBOOST?.get)return window.PinalBOOST.get()||{};
        return JSON.parse(localStorage.getItem('pinal_boost_journey_v1')||'{}');
      }catch(_){return{}}
    }

    function carryOnetScores(frame){
      try{
        const d=frame.contentDocument;
        if(!d)return 0;
        const scores=getJourney()?.modules?.module1?.interestScores||{};
        let loaded=0;
        ['R','I','A','S','E','C'].forEach(k=>{
          const el=d.getElementById(k),value=scores[k];
          if(!el||value==null||value==='')return;
          el.value=String(value);
          el.dispatchEvent(new Event('input',{bubbles:true}));
          el.dispatchEvent(new Event('change',{bubbles:true}));
          loaded++;
        });
        return loaded;
      }catch(e){console.warn('BOOST Module 3 O*NET carry-forward unavailable',e);return 0}
    }

    const script=document.createElement('script');
    script.src='assets/js/module3-customer.js?v=20260909a';
    script.onload=()=>{
      const frame=document.getElementById('activityFrame');
      if(!frame||!window.BOOSTModule3Customer)return;
      const apply=()=>setTimeout(()=>{
        try{
          const title=document.getElementById('activityTitle');
          const note=document.getElementById('moduleNote');
          if(title)title.textContent='Module 3 — Where Can My Experience Take Me?';
          if(note)note.textContent='See what you already bring, compare it with the careers you validated, and explore what you may want to build next.';
          document.title='Module 3 — Where Can My Experience Take Me? | BOOST';
          carryOnetScores(frame);
          window.BOOSTModule3Customer.inject(frame,getJourney);
        }catch(e){console.warn('BOOST Module 3 customer experience unavailable',e)}
      },350);
      frame.addEventListener('load',apply);
      if(frame.contentDocument?.readyState==='complete')apply();
    };
    script.onerror=()=>console.warn('BOOST Module 3 customer experience could not load.');
    document.head.appendChild(script);

    const funnel=document.createElement('script');
    funnel.src='assets/js/module3-funnel.js?v=20260909b';
    funnel.onload=()=>{
      const frame=document.getElementById('activityFrame');
      if(!frame||!window.BOOSTModule3Funnel)return;
      window.BOOSTModule3Funnel.init(frame);
    };
    funnel.onerror=()=>console.warn('BOOST Module 3 funnel experience could not load.');
    document.head.appendChild(funnel);

    const scores=document.createElement('script');
    scores.src='assets/js/module3-lab-scores.js?v=20260909a';
    scores.onerror=()=>console.warn('BOOST Module 3 O*NET lab score bridge could not load.');
    document.head.appendChild(scores);

    const skillmatch=document.createElement('script');
    skillmatch.src='assets/js/module3-skill-match.js?v=20260909a';
    skillmatch.onload=()=>{
      const frame=document.getElementById('activityFrame');
      if(!frame||!window.BOOSTModule3SkillMatch)return;
      window.BOOSTModule3SkillMatch.init(frame);
    };
    skillmatch.onerror=()=>console.warn('BOOST Module 3 career skill alignment could not load.');
    document.head.appendChild(skillmatch);

    const output=document.createElement('script');
    output.src='assets/js/module3-output.js?v=20260909a';
    output.onload=()=>{
      const frame=document.getElementById('activityFrame');
      if(!frame||!window.BOOSTModule3Output)return;
      window.BOOSTModule3Output.init(frame);
    };
    output.onerror=()=>console.warn('BOOST Module 3 evidence summary could not load.');
    document.head.appendChild(output);

    const final=document.createElement('script');
    final.src='assets/js/module3-final-v2.js?v=20260909d';
    final.onload=()=>{
      const frame=document.getElementById('activityFrame');
      if(!frame||!window.BOOSTModule3Final)return;
      window.BOOSTModule3Final.init(frame);
    };
    final.onerror=()=>console.warn('BOOST Module 3 finalized two-lane experience could not load.');
    document.head.appendChild(final);
  }catch(e){console.warn('BOOST Module 3 customer experience wiring unavailable',e)}
})();