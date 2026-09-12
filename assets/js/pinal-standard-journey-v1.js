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
 if(moduleId==='module1'){
  const rail=d.querySelector('nav.rail');
  if(rail)return rail;
 }
 if(moduleId==='module2'){
  const journey=d.querySelector('body > .journey, .journey');
  if(journey)return journey;
 }
 const journeyWrap=d.querySelector('.journeyWrap');
 if(journeyWrap)return journeyWrap;
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
function normalizeModule1Opening(d){
 if(moduleId!=='module1'||d.getElementById('boostM1OpeningExperience'))return;
 const hero=d.querySelector('header.hero'),grid=hero?.querySelector('.heroGrid'),img=grid?.querySelector(':scope > img'),button=d.getElementById('audioBtn'),audio=d.getElementById('introAudio'),bar=d.getElementById('pinalStandardJourney');
 if(!hero||!grid||!img||!bar)return;
 if(!d.getElementById('boostM1OpeningStyle')){
  const style=d.createElement('style');style.id='boostM1OpeningStyle';style.textContent=`
   header.hero .heroGrid{display:block!important;max-width:1120px!important}
   #boostM1OpeningExperience{max-width:1160px;margin:22px auto 26px;background:#fff;border:1px solid #d9e3ec;border-radius:22px;overflow:hidden;box-shadow:0 12px 34px rgba(7,31,56,.09)}
   #boostM1OpeningExperience .boostM1Media{background:#0e3049}
   #boostM1OpeningExperience .boostM1Media img{width:100%;display:block;aspect-ratio:16/7;object-fit:cover}
   #boostM1OpeningExperience .boostM1Audio{padding:14px 18px 16px;background:#fff;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
   #boostM1OpeningExperience .boostM1Audio .audioBtn{margin:0;background:#0b3158!important;color:#fff!important;border:1px solid #0b3158!important;border-radius:999px;padding:10px 15px;font-weight:900;cursor:pointer}
   #boostM1OpeningExperience .boostM1Audio audio{display:none}
   #boostM1OpeningExperience .boostM1AudioNote{font-size:.78rem;color:#64748b;font-weight:700}
   @media(max-width:700px){#boostM1OpeningExperience{margin:14px 12px 20px}#boostM1OpeningExperience .boostM1Media img{aspect-ratio:16/8}}
  `;d.head.appendChild(style);
 }
 const opening=d.createElement('section');opening.id='boostM1OpeningExperience';
 const media=d.createElement('div');media.className='boostM1Media';media.appendChild(img);
 const controls=d.createElement('div');controls.className='boostM1Audio';
 if(button)controls.appendChild(button);
 if(audio)controls.appendChild(audio);
 const note=d.createElement('span');note.className='boostM1AudioNote';note.textContent='Optional narration';controls.appendChild(note);
 opening.appendChild(media);opening.appendChild(controls);
 bar.insertAdjacentElement('afterend',opening);
}
function normalizeModule4Opening(d){
 if(moduleId!=='module4'||d.getElementById('boostM4OpeningExperience'))return;
 const hero=d.querySelector('header.hero'),visual=hero?.querySelector('.heroVisual'),audio=hero?.querySelector('.introAudio'),bar=d.getElementById('pinalStandardJourney');
 if(!hero||!visual||!bar)return;
 if(!d.getElementById('boostM4OpeningStyle')){
  const style=d.createElement('style');style.id='boostM4OpeningStyle';style.textContent=`
   header.hero .wrap{max-width:1120px}
   #boostM4OpeningExperience{margin:18px 0 24px;background:#fff;border:1px solid #d9e3ec;border-radius:22px;overflow:hidden;box-shadow:0 12px 34px rgba(7,31,56,.09)}
   #boostM4OpeningExperience .heroVisual{margin:0;border-radius:0;max-height:none;background:#0e3049}
   #boostM4OpeningExperience .heroVisual img{width:100%;display:block;aspect-ratio:16/7;object-fit:cover;max-height:none}
   #boostM4OpeningExperience .introAudio{margin:0;padding:14px 18px 16px;background:#fff}
   #boostM4OpeningExperience .introAudio audio{width:100%;max-width:520px}
   @media(max-width:700px){#boostM4OpeningExperience{margin:14px 0 20px}#boostM4OpeningExperience .heroVisual img{aspect-ratio:16/8}}
  `;d.head.appendChild(style);
 }
 const opening=d.createElement('section');opening.id='boostM4OpeningExperience';opening.className='noPrint';
 opening.appendChild(visual);
 if(audio)opening.appendChild(audio);
 bar.insertAdjacentElement('afterend',opening);
}
function normalizeOpenings(d){normalizeModule1Opening(d);normalizeModule4Opening(d)}
function inject(){
 let d;try{d=frame.contentDocument}catch(_){return false}if(!d?.body||!d.head)return false;
 if(d.getElementById('pinalStandardJourney')){normalizeOpenings(d);return true}

 // Module 3 is the visual gold master. Keep its native journey bar exactly where it is.
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
 if(legacy){legacy.replaceWith(bar);normalizeOpenings(d);return true}

 const hero=d.querySelector('.hero, header.hero, body > header');
 if(hero){hero.insertAdjacentElement('afterend',bar);normalizeOpenings(d);return true}
 const main=d.querySelector('main');
 if(main){main.insertAdjacentElement('beforebegin',bar);normalizeOpenings(d);return true}
 d.body.insertBefore(bar,d.body.firstChild);normalizeOpenings(d);
 return true;
}
function run(){let n=0;const t=setInterval(()=>{if(inject()||++n>=60)clearInterval(t)},200)}
frame.addEventListener('load',run);run();
})();

(()=>{
'use strict';
try{
 const params=new URLSearchParams(location.search),m=params.get('m')||'';
 if(!/activity\.html$/i.test(location.pathname)||!['module1','module2','module3','module4'].includes(m))return;
 if(document.querySelector('script[data-pinal-audio-standard]'))return;
 const s=document.createElement('script');s.src='assets/js/pinal-audio-standard-v1.js?v=20260911audio1';s.dataset.pinalAudioStandard='1';
 s.onerror=()=>console.warn('Pinal BOOST standardized Rosie audio could not load.');document.head.appendChild(s);
}catch(e){console.warn('Pinal BOOST standardized Rosie audio loader unavailable',e)}
})();
