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
    const script=document.createElement('script');
    script.src='assets/js/module3-customer.js?v=20260908b';
    script.onload=()=>{
      const frame=document.getElementById('activityFrame');
      if(!frame||!window.BOOSTModule3Customer)return;
      const apply=()=>setTimeout(()=>{
        try{window.BOOSTModule3Customer.inject(frame,()=>window.PinalBOOST?.get?.()||{})}
        catch(e){console.warn('BOOST Module 3 customer experience unavailable',e)}
      },350);
      frame.addEventListener('load',apply);
      if(frame.contentDocument?.readyState==='complete')apply();
    };
    script.onerror=()=>console.warn('BOOST Module 3 customer experience could not load.');
    document.head.appendChild(script);
  }catch(e){console.warn('BOOST Module 3 customer experience wiring unavailable',e)}
})();
