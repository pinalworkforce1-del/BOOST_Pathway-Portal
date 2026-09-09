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

    const output=document.createElement('script');
    output.src='assets/js/module3-output.js?v=20260909a';
    output.onload=()=>{
      const frame=document.getElementById('activityFrame');
      if(!frame||!window.BOOSTModule3Output)return;
      window.BOOSTModule3Output.init(frame);
    };
    output.onerror=()=>console.warn('BOOST Module 3 evidence summary could not load.');
    document.head.appendChild(output);
  }catch(e){console.warn('BOOST Module 3 customer experience wiring unavailable',e)}
})();