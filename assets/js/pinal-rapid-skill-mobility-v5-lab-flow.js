(()=>{'use strict';
function install(){
 const researchContinue=document.getElementById('continueSnapshot');
 const labPanel=document.getElementById('labPanel');
 const planPanel=document.getElementById('planPanel');
 const labComplete=document.getElementById('labComplete');
 if(!researchContinue||!labPanel||!planPanel)return;
 researchContinue.textContent='Continue to Optional Skills Lab ↓';
 researchContinue.onclick=()=>labPanel.scrollIntoView({behavior:'smooth',block:'start'});
 let nav=document.getElementById('labFlowNav');
 if(!nav){
   nav=document.createElement('div');
   nav.id='labFlowNav';
   nav.className='labFlowNav';
   nav.innerHTML=`<div class="notice info"><b>Pizza Lab is optional.</b> Complete it if you want another applied-workplace reflection point, or continue to your Mobility Plan without it.</div><div class="buttons"><button class="btn green" id="labContinueBtn" type="button"></button></div>`;
   labPanel.appendChild(nav);
 }
 const btn=document.getElementById('labContinueBtn');
 const syncLabel=()=>{if(btn)btn.textContent=labComplete?.checked?'Continue to Mobility Plan ↓':'Skip Optional Lab → Mobility Plan'};
 syncLabel();
 labComplete?.addEventListener('change',syncLabel);
 if(btn)btn.onclick=()=>planPanel.scrollIntoView({behavior:'smooth',block:'start'});
 if(!document.getElementById('labFlowStyles')){
   const style=document.createElement('style');
   style.id='labFlowStyles';
   style.textContent='.labFlowNav{margin-top:18px;padding-top:16px;border-top:1px solid #dbe5ea}.labFlowNav .buttons{justify-content:flex-end}.labFlowNav .notice{max-width:none}@media(max-width:820px){.labFlowNav .buttons{justify-content:stretch}.labFlowNav .btn{width:100%}}';
   document.head.appendChild(style);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0),{once:true});else setTimeout(install,0)
})();