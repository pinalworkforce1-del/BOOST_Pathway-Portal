(()=>{
'use strict';
const params=new URLSearchParams(location.search);
if(!/activity\.html$/i.test(location.pathname))return;
const moduleId=params.get('m')||'';
if(!['module1','module2','module3','module4'].includes(moduleId))return;
const frame=document.getElementById('activityFrame');
if(!frame)return;

const ROSIE='https://pinalworkforce1-del.github.io/BOOST_Pathway-Portal/assets/images/rosie-master.webp';
const CFG={
  module1:{audio:'#introAudio',title:'Discover Career Possibilities'},
  module2:{audio:'#introAudio',title:'Career Reality Check'},
  module3:{audio:'#module3IntroAudio',title:'See Where Your Skills Can Take You'},
  module4:{audio:'.introAudio audio',title:'Turn Your Evidence Into a Direction'}
};
const cfg=CFG[moduleId];

function css(d){
 if(d.getElementById('boostStandardAudioStyle'))return;
 const s=d.createElement('style');s.id='boostStandardAudioStyle';s.textContent=`
 .boostStandardAudio{max-width:1120px;margin:18px auto;padding:0 16px;font-family:Arial,sans-serif}
 #boostM1OpeningExperience>.boostStandardAudio{max-width:none;margin:0;padding:14px 18px 16px;background:#fff}
 .boostStandardAudioCard{display:grid;grid-template-columns:104px minmax(0,1fr);gap:16px;align-items:center;padding:14px 16px;border:1px solid #cbd8e6;border-radius:16px;background:#f7fbff;box-shadow:0 7px 22px rgba(7,31,56,.08);color:#17324d}
 .boostStandardAudioRosie{width:104px;height:112px;border-radius:13px;overflow:hidden;background:#eaf3f7;border:1px solid #c8d9e3;display:flex;align-items:flex-end;justify-content:center}
 .boostStandardAudioRosie img{width:100%;height:100%;object-fit:cover;object-position:50% 17%;display:block}
 .boostStandardAudioLabel{font-size:.76rem;font-weight:900;letter-spacing:.09em;text-transform:uppercase;color:#486581;margin-bottom:5px}
 .boostStandardAudioTitle{font-size:1rem;font-weight:900;color:#102f4d;margin:0 0 10px}
 .boostStandardAudioControls{display:flex;gap:8px;flex-wrap:wrap}
 .boostStandardAudioBtn{border:1px solid #8eabc4;background:#fff;color:#0b3d68;border-radius:999px;padding:9px 13px;font:800 .82rem/1.2 Arial,sans-serif;cursor:pointer}
 .boostStandardAudioBtn.primary{background:#0b3d68;color:#fff;border-color:#0b3d68}
 .boostStandardAudioBtn:hover,.boostStandardAudioBtn:focus-visible{transform:translateY(-1px);outline:3px solid rgba(42,157,143,.16)}
 .boostStandardAudioStatus{min-height:17px;margin-top:7px;font-size:.75rem;color:#60717d}
 .boostStandardAudioSource{display:none!important}
 .boostLegacyNarrationHidden{display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important}
 .boostAudioCompact{margin-top:9px;padding:10px 11px;border-radius:11px;background:#f7fbff;border:1px solid #cbd8e6}
 .boostAudioCompact .boostStandardAudioControls{gap:6px}
 .boostAudioCompact .boostStandardAudioBtn{padding:7px 10px;font-size:.76rem}
 @media(max-width:620px){.boostStandardAudio{padding:0 10px}#boostM1OpeningExperience>.boostStandardAudio{padding:11px}.boostStandardAudioCard{grid-template-columns:74px minmax(0,1fr);gap:11px;padding:12px}.boostStandardAudioRosie{width:74px;height:82px}.boostStandardAudioBtn{width:100%;text-align:center}}
 `;d.head.appendChild(s);
}
function button(d,text,primary=false){const b=d.createElement('button');b.type='button';b.className='boostStandardAudioBtn'+(primary?' primary':'');b.textContent=text;return b}
function wireControls(d,audio,mount,title,compact=false){
 const controls=d.createElement('div');controls.className=compact?'boostAudioCompact':'boostStandardAudioBody';
 if(!compact){const label=d.createElement('div');label.className='boostStandardAudioLabel';label.textContent='Prefer to listen?';controls.appendChild(label);const t=d.createElement('div');t.className='boostStandardAudioTitle';t.textContent='Rosie can narrate this introduction.';controls.appendChild(t)}
 const row=d.createElement('div');row.className='boostStandardAudioControls';
 const play=button(d,'▶ Listen: '+title,true),pause=button(d,'❚❚ Pause Narration'),replay=button(d,'↻ Replay');row.append(play,pause,replay);controls.appendChild(row);
 const status=d.createElement('div');status.className='boostStandardAudioStatus';controls.appendChild(status);
 const defaultText='▶ Listen: '+title;
 const safePlay=()=>audio.play().catch(()=>{status.textContent='Narration is temporarily unavailable.'});
 play.addEventListener('click',safePlay);pause.addEventListener('click',()=>audio.pause());replay.addEventListener('click',()=>{try{audio.currentTime=0}catch(_){}safePlay()});
 audio.addEventListener('play',()=>{play.textContent='▶ Narration Playing';status.textContent='Rosie is narrating.'});
 audio.addEventListener('pause',()=>{if(!audio.ended){play.textContent=audio.currentTime>0?'▶ Resume: '+title:defaultText;status.textContent=audio.currentTime>0?'Paused.':''}});
 audio.addEventListener('ended',()=>{play.textContent='▶ Listen Again: '+title;status.textContent='Narration complete.'});
 mount.appendChild(controls);return controls;
}
function hideLegacy(d,audio){
 audio.classList.add('boostStandardAudioSource');audio.removeAttribute('controls');
 if(moduleId==='module1'){
   const old=d.getElementById('audioBtn');if(old){old.classList.add('boostLegacyNarrationHidden');old.style.setProperty('display','none','important')}
   const oldWrap=d.querySelector('#boostM1OpeningExperience .boostM1Audio');if(oldWrap){oldWrap.classList.add('boostLegacyNarrationHidden');oldWrap.style.setProperty('display','none','important')}
 }
 if(moduleId==='module2'){
   d.querySelectorAll('.opening .audioRow,.audioRow').forEach(row=>{row.classList.add('boostLegacyNarrationHidden');row.style.setProperty('display','none','important');row.setAttribute('aria-hidden','true')});
   const old=d.getElementById('audioBtn');if(old){old.style.setProperty('display','none','important');old.setAttribute('aria-hidden','true')}
 }
 if(moduleId==='module3'){const box=d.querySelector('.audioBox');if(box)box.style.setProperty('display','none','important')}
 if(moduleId==='module4'){const old=d.querySelector('.introAudio');if(old)old.style.setProperty('display','none','important')}
}
function placement(d,audio){
 if(moduleId==='module1')return d.querySelector('#boostM1OpeningExperience .boostM1Media');
 if(moduleId==='module2')return d.querySelector('.opening')||audio.parentElement;
 if(moduleId==='module3')return d.querySelector('.openingExperience')||audio.parentElement;
 if(moduleId==='module4')return d.querySelector('.hero')||audio.parentElement;
 return audio.parentElement;
}
function installPrimary(){
 let d;try{d=frame.contentDocument}catch(_){return false}if(!d?.body||!d.head)return false;
 const audio=d.querySelector(cfg.audio);if(!audio)return false;
 css(d);hideLegacy(d,audio);
 const host=placement(d,audio);if(!host)return false;
 let shell=d.getElementById('boostStandardAudio');
 if(shell){
   if(host.nextElementSibling!==shell)host.insertAdjacentElement('afterend',shell);
   return true;
 }
 shell=d.createElement('div');shell.id='boostStandardAudio';shell.className='boostStandardAudio';
 const card=d.createElement('div');card.className='boostStandardAudioCard';
 const portrait=d.createElement('div');portrait.className='boostStandardAudioRosie';portrait.innerHTML=`<img src="${ROSIE}" alt="Rosie, your BOOST guide">`;
 card.appendChild(portrait);wireControls(d,audio,card,cfg.title,false);shell.appendChild(card);
 host.insertAdjacentElement('afterend',shell);
 return true;
}
function compactModule4Audio(){
 if(moduleId!=='module4')return;
 let d;try{d=frame.contentDocument}catch(_){return}if(!d?.body)return;
 d.querySelectorAll('.rosieAudio audio').forEach((audio,i)=>{
   if(audio.dataset.boostStandardized)return;audio.dataset.boostStandardized='1';audio.classList.add('boostStandardAudioSource');audio.removeAttribute('controls');
   const box=audio.closest('.rosieAudio');if(!box)return;
   wireControls(d,audio,box,i===0?'Rosie Tip':'Rosie Reminder',true);
 });
}
function run(){let n=0;const t=setInterval(()=>{const ok=installPrimary();compactModule4Audio();if(ok&&++n>=12)clearInterval(t);else if(++n>=80)clearInterval(t)},250)}
frame.addEventListener('load',run);run();
if(moduleId==='module4'){const mo=new MutationObserver(()=>compactModule4Audio());setTimeout(()=>{try{mo.observe(frame.contentDocument.body,{childList:true,subtree:true})}catch(_){ }},800)}
})();
