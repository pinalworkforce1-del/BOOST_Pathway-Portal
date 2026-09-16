(()=>{'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
let occupations=[];
const ALIASES={
 'hr':['human resources'],'human resource':['human resources'],'human resources':['human resources'],
 'cna':['nursing assistant'],'nursing assistant':['nursing assistant'],
 'cdl':['truck driver','tractor trailer'],'truck driver':['truck driver','tractor trailer'],
 'help desk':['computer user support','computer support'],'it support':['computer user support','computer support'],
 'forklift':['material mover'],'warehouse':['material mover','stockers','order fillers'],
 'retail manager':['first line supervisors of retail sales workers'],
 'store manager':['first line supervisors of retail sales workers'],
 'welder':['welders cutters solderers and brazers'],
 'hvac':['heating air conditioning refrigeration mechanics installers']
};
async function loadOccupations(){
 try{
  const b64=window.BOOST_DATA_B64||'';
  if(!b64||!('DecompressionStream'in window))return false;
  const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
  const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  const rows=JSON.parse(await new Response(stream).text());
  occupations=rows.map(r=>({soc:String(r[0]||''),title:String(r[1]||''),sector:String(r[2]||''),openings:Number(r[4])||0})).filter(x=>x.title);
  return true;
 }catch(e){console.warn('Rapid Employment occupation picker could not load occupation data',e);return false}
}
function scoreOccupation(o,q){
 const title=norm(o.title),query=norm(q);if(!query)return 0;
 let score=0;
 if(title===query)score=120;
 else if(title.startsWith(query))score=100;
 else if(title.includes(query))score=82;
 const words=query.split(' ').filter(Boolean);
 if(words.length&&words.every(w=>title.includes(w)))score=Math.max(score,74+Math.min(12,words.length*2));
 for(const [alias,targets] of Object.entries(ALIASES)){
  if(norm(alias)===query||norm(alias).startsWith(query)||query.startsWith(norm(alias))){
   if(targets.some(t=>title.includes(norm(t))))score=Math.max(score,112);
  }
 }
 if(score)score+=Math.min(12,Math.log10(Math.max(1,o.openings))*3);
 return score;
}
function matches(q){
 const query=norm(q);if(query.length<2)return[];
 return occupations.map(o=>({o,score:scoreOccupation(o,query)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||b.o.openings-a.o.openings||a.o.title.localeCompare(b.o.title)).slice(0,7).map(x=>x.o);
}
function installPicker(){
 const input=$('#currentRole');if(!input||$('#occupationPickerResults'))return;
 input.setAttribute('autocomplete','off');
 const results=document.createElement('div');
 results.id='occupationPickerResults';results.className='occupationPickerResults';results.hidden=true;
 input.insertAdjacentElement('afterend',results);
 function hide(){results.hidden=true;results.innerHTML=''}
 function select(o){
  input.value=o.title;
  hide();
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.dispatchEvent(new Event('change',{bubbles:true}));
  input.focus();
 }
 function render(){
  const list=matches(input.value);
  if(!list.length){hide();return}
  results.innerHTML=list.map(o=>`<button type="button" class="occupationPickerOption" data-soc="${esc(o.soc)}"><span><b>${esc(o.title)}</b><small>${o.sector?esc(o.sector)+' • ':''}SOC ${esc(o.soc)}</small></span><span class="occupationPickerChoose">Choose</span></button>`).join('');
  results.hidden=false;
  results.querySelectorAll('.occupationPickerOption').forEach((btn,i)=>{
   btn.addEventListener('pointerdown',e=>e.preventDefault());
   btn.addEventListener('mousedown',e=>e.preventDefault());
   btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();select(list[i])});
  });
 }
 input.addEventListener('input',render);
 input.addEventListener('focus',()=>{if(input.value.trim().length>=2)render()});
 input.addEventListener('keydown',e=>{
  if(results.hidden)return;
  const opts=[...results.querySelectorAll('.occupationPickerOption')];
  if(e.key==='Escape'){hide();return}
  if(e.key==='ArrowDown'){e.preventDefault();(opts[0])?.focus()}
  if(e.key==='Enter'&&opts.length===1){e.preventDefault();opts[0].click()}
 });
 results.addEventListener('keydown',e=>{
  const opts=[...results.querySelectorAll('.occupationPickerOption')],i=opts.indexOf(document.activeElement);
  if(e.key==='ArrowDown'){e.preventDefault();opts[Math.min(opts.length-1,i+1)]?.focus()}
  if(e.key==='ArrowUp'){e.preventDefault();if(i<=0)input.focus();else opts[i-1]?.focus()}
  if(e.key==='Escape'){hide();input.focus()}
 });
 document.addEventListener('pointerdown',e=>{if(e.target!==input&&!results.contains(e.target))hide()});
}
function styles(){if($('#occupationPickerStyles'))return;const s=document.createElement('style');s.id='occupationPickerStyles';s.textContent=`#startPanel .grid3>label:first-child{position:relative}.occupationPickerResults{position:absolute;left:0;right:0;top:74px;z-index:60;max-height:310px;overflow:auto;padding:5px;border:1px solid #b9cbd7;border-radius:12px;background:#fff;box-shadow:0 14px 34px rgba(20,48,68,.22)}.occupationPickerResults[hidden]{display:none}.occupationPickerOption{width:100%;display:flex;justify-content:space-between;gap:12px;align-items:center;padding:10px 11px;border:0;border-radius:9px;background:#fff;text-align:left;color:#173042;cursor:pointer}.occupationPickerOption:hover,.occupationPickerOption:focus{background:#edf5f8;outline:2px solid #7ca7bf;outline-offset:-2px}.occupationPickerOption b{display:block;font-size:.87rem}.occupationPickerOption small{display:block;margin-top:2px;color:#687c89;font-size:.72rem}.occupationPickerChoose{font-size:.7rem;font-weight:900;color:#2f7d4c;white-space:nowrap}@media(max-width:820px){.occupationPickerResults{top:74px}}`;document.head.appendChild(s)}
async function install(){styles();await loadOccupations();installPicker()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();