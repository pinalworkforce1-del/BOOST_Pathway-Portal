(()=>{
'use strict';
const params=new URLSearchParams(location.search);
if(!/activity\.html$/i.test(location.pathname))return;
const raw=params.get('m')||'';
const moduleId=raw==='investment'?'module5':raw;
const frame=document.getElementById('activityFrame');
if(!frame)return;
const stageIndex={module1:0,module2:1,module3:2,module4:3,healthcare:4,trades:4,manufacturing:4,it:4,cdl:4,module5:5}[moduleId];
if(stageIndex==null)return;
const labels=['Discover','Validate','Explore Skills','Decide','Experience','Close the Gap','Launch'];
const descriptions={
 module1:'Discover career possibilities that connect your interests with regional opportunity.',
 module2:'Validate your career options against jobs, wages, preparation, and life fit.',
 module3:'Discover what your existing experience can already do for you.',
 module4:'Turn the evidence you have gathered into a direction.',
 healthcare:'Build applied workplace evidence through an industry experience.',
 trades:'Build applied workplace evidence through an industry experience.',
 manufacturing:'Build applied workplace evidence through an industry experience.',
 it:'Build applied workplace evidence through an industry experience.',
 cdl:'Build applied workplace evidence through an industry experience.',
 module5:'Decide whether a targeted skill investment is needed to close the gap.'
};
function findLegacyProgress(d){
 const journey=d.querySelector('.journeyWrap');
 if(journey)return journey;
 for(const sec of d.querySelectorAll('section')){
  const p=sec.querySelector(':scope > .progress');
  if(p&&/BOOST progression/i.test(sec.textContent||''))return sec;
 }
 return null;
}
function buildBar(d){
 const bar=d.createElement('div');bar.id='pinalStandardJourney';
 const stages=labels.map((label,i)=>`<div class="psjStage ${i<stageIndex?'done':i===stageIndex?'active':''}"><span>${label}</span></div>`).join('');
 bar.innerHTML=`<div class="psjInner"><div class="psjLabel">Your BOOST Journey</div><div class="psjTrack" aria-label="BOOST journey progress">${stages}</div><div class="psjHere">You are here: ${descriptions[moduleId]||'Continue building your BOOST journey.'}</div></div>`;
 return bar;
}
function inject(){
 let d;try{d=frame.contentDocument}catch(_){return false}if(!d?.body||!d.head)return false;
 if(d.getElementById('pinalStandardJourney'))return true;

 // Module 3 is the visual gold master. Leave its native journey bar exactly where it is: directly below the hero/header.
 if(moduleId==='module3'&&d.querySelector('.journeyWrap'))return true;

 if(!d.getElementById('pinalStandardJourneyStyle')){
  const style=d.createElement('style');style.id='pinalStandardJourneyStyle';style.textContent=`
  #pinalStandardJourney{background:#fff;border-bottom:1px solid #d9e2ec;padding:14px 16px 15px;font-family:Arial,sans-serif;color:#17324d}
  #pinalStandardJourney .psjInner{max-width:1120px;margin:auto}
  #pinalStandardJourney .psjLabel{font-size:.7rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#2a9d8f;margin-bottom:8px}
  #pinalStandardJourney .psjTrack{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;align-items:start}
  #pinalStandardJourney .psjStage{position:relative;text-align:center;color:#7a8b99;font-size:.72rem;font-weight:800;padding-top:20px}
  #pinalStandardJourney .psjStage:before{content:"";position:absolute;top:5px;left:50%;transform:translateX(-50%);width:11px;height:11px;border-radius:50%;background:#cdd9e0;z-index:2}
  #pinalStandardJourney .psjStage:after{content:"";position:absolute;height:3px;background:#dfe7ec;top:9px;left:-50%;width:100%;z-index:1}
  #pinalStandardJourney .psjStage:first-child:after{display:none}
  #pinalStandardJourney .psjStage.done:before{background:#2a9d8f}
  #pinalStandardJourney .psjStage.done:after{background:#2a9d8f}
  #pinalStandardJourney .psjStage.active{color:#0b3158}
  #pinalStandardJourney .psjStage.active:before{background:#f4b942;box-shadow:0 0 0 5px rgba(244,185,66,.22)}
  #pinalStandardJourney .psjStage.active:after{background:#2a9d8f}
  #pinalStandardJourney .psjHere{margin-top:9px;font-size:.78rem;color:#64748b}
  @media(max-width:700px){#pinalStandardJourney{padding:12px 10px 13px}#pinalStandardJourney .psjStage{font-size:.64rem}#pinalStandardJourney .psjHere{font-size:.72rem}}
  `;d.head.appendChild(style);
 }

 const bar=buildBar(d);
 const legacy=findLegacyProgress(d);
 if(legacy){
  legacy.replaceWith(bar);
  return true;
 }

 // If a module did not already have a progress treatment, place the standard bar in the same structural location as Module 3: immediately below the hero/header area.
 const hero=d.querySelector('.hero, header.hero, body > header');
 if(hero){hero.insertAdjacentElement('afterend',bar);return true}

 // Conservative fallback only when no recognizable header exists.
 const main=d.querySelector('main');
 if(main){main.insertAdjacentElement('beforebegin',bar);return true}
 d.body.insertBefore(bar,d.body.firstChild);
 return true;
}
function run(){let n=0;const t=setInterval(()=>{if(inject()||++n>=60)clearInterval(t)},200)}
frame.addEventListener('load',run);run();
})();
