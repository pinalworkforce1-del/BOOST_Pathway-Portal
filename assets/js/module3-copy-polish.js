(function(){
'use strict';
function polish(frame){
  try{
    const d=frame?.contentDocument;if(!d?.body)return;
    const skillBtn=d.getElementById('continueBtn');
    if(skillBtn)skillBtn.textContent='NEXT: THINK ABOUT WHICH STRENGTHS I WANT TO USE →';

    const lab=d.getElementById('boostM3Lab');
    if(lab){
      const step=lab.querySelector('.step');
      const heading=lab.querySelector('h2');
      const lead=lab.querySelector('p');
      if(step)step.textContent='Step 3 • Optional Workplace Preference Check';
      if(heading)heading.textContent='Which of these strengths would you like to use more?';
      if(lead)lead.innerHTML='You’ve identified the strengths you already use. Now add one more layer: <b>which of those strengths would you like to keep using or use more in future work?</b> If you’re not sure, the Pizza Workplace Lab can help you explore that preference in realistic workplace situations.';
    }
  }catch(e){console.warn('BOOST Module 3 copy polish unavailable',e)}
}
function init(){
  const p=new URLSearchParams(location.search);
  if(!/activity\.html$/i.test(location.pathname)||p.get('m')!=='module3')return;
  const frame=document.getElementById('activityFrame');if(!frame)return;
  let observer=null;
  const apply=()=>setTimeout(()=>{
    polish(frame);
    try{
      observer?.disconnect();
      observer=new frame.contentWindow.MutationObserver(()=>polish(frame));
      observer.observe(frame.contentDocument.body,{childList:true,subtree:true});
    }catch(_){}
  },500);
  frame.addEventListener('load',apply);
  if(frame.contentDocument?.readyState==='complete')apply();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();