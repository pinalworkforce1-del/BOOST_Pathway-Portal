(()=>{'use strict';
const STORE_KEY='pinal_boost_comprehensive_skills_v1';
const $=s=>document.querySelector(s);
const read=()=>{try{return JSON.parse(localStorage.getItem(STORE_KEY)||'null')||{version:1,technical:{},credentials:{},marketNow:[]}}catch{return{version:1,technical:{},credentials:{},marketNow:[]}}};
const write=s=>localStorage.setItem(STORE_KEY,JSON.stringify(s));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9+#./ -]/g,' ').replace(/\s+/g,' ').trim();
const ROLE_SKILLS=[
 {re:/truck|tractor.?trailer|delivery driver|commercial driver|transport/i,skills:['eld','pretrip','loadsecure','routing']},
 {re:/warehouse|material mover|shipping|receiving|stock|inventory/i,skills:['forklift','palletjack','rfscanner','wms']},
 {re:/cashier|retail|customer service|sales associate/i,skills:['pos','m365']},
 {re:/administrative|office|coordinator|bookkeeper|accounting/i,skills:['excel','m365','outlook']},
 {re:/human resources|hr specialist|recruiter|talent acquisition|benefits|personnel/i,skills:['excel','m365','outlook','hris']},
 {re:/computer support|help desk|desktop support|it support/i,skills:['windows','m365','ticketing','remotesupport','hardware','activedirectory']},
 {re:/mechanic|automotive|auto technician/i,skills:['diagnosticscan','autobrakes','autoengine','autoelectric','powertools']},
 {re:/manufactur|production|machinist|cnc|quality/i,skills:['machineoperation','qualityinspection','calipers','blueprint']},
 {re:/nursing assistant|cna|patient care|medical assistant/i,skills:['patientcare','vitals','ehr','infection','transfers']},
 {re:/welder|welding/i,skills:['mig','tig','stickweld','blueprint','powertools']},
 {re:/construction|carpenter|maintenance technician/i,skills:['powertools','blueprint','preventive']},
 {re:/hvac|refrigeration/i,skills:['hvacdiag','refrigeration','electrical']},
 {re:/electrician|electrical technician/i,skills:['electrical','blueprint','powertools']},
 {re:/plumber|pipefitter/i,skills:['plumbing','blueprint','powertools']}
];
const EXTRA={
 hris:{id:'hris',label:'HRIS / applicant tracking systems',category:'Software / data',sources:['occupation suggestion'],evidence:[],confirmed:false},
 excel:{id:'excel',label:'Microsoft Excel',category:'Software / data',sources:['occupation suggestion'],evidence:[],confirmed:false},
 m365:{id:'m365',label:'Microsoft 365 / Office',category:'Software / data',sources:['occupation suggestion'],evidence:[],confirmed:false},
 outlook:{id:'outlook',label:'Microsoft Outlook',category:'Software / data',sources:['occupation suggestion'],evidence:[],confirmed:false}
};
function allowedFor(role){const out=new Set();for(const r of ROLE_SKILLS)if(r.re.test(role))for(const id of r.skills)out.add(id);return out}
function sourceText(x){const s=x.sources||[];if(s.includes('résumé'))return'Found directly in résumé';if(s.includes('participant'))return'Added or confirmed by you';if(s.includes('occupation suggestion'))return'Common in this kind of work — confirm only if you have used it';return'Skill evidence'}
function marketCandidates(state){const out=[...document.querySelectorAll('.skillCheck:checked')].map(el=>({key:'broad:'+el.dataset.skill,label:el.closest('.skill')?.querySelector('span')?.childNodes?.[0]?.textContent?.trim()||el.dataset.skill,type:'Transferable strength'}));for(const x of Object.values(state.technical||{}).filter(x=>x.confirmed))out.push({key:'tech:'+x.id,label:x.label,type:x.category||'Technical skill'});for(const x of Object.values(state.credentials||{}).filter(x=>x.status==='held'))out.push({key:'cred:'+x.id,label:x.label,type:'Credential / license'});const seen=new Set();return out.filter(x=>{const k=norm(x.label);if(!k||seen.has(k))return false;seen.add(k);return true})}
function renderMarket(state){const box=$('#compMarketList');if(!box)return;const cands=marketCandidates(state),valid=new Set(cands.map(x=>x.key));state.marketNow=(state.marketNow||[]).filter(k=>valid.has(k));box.innerHTML=cands.length?cands.map(x=>`<label class="compMarket ${state.marketNow.includes(x.key)?'selected':''}"><input type="checkbox" data-market="${esc(x.key)}" ${state.marketNow.includes(x.key)?'checked':''}><span><b>${esc(x.label)}</b><small>${esc(x.type)}</small></span></label>`).join(''):'<div class="empty">Confirm transferable or technical skills first. Held credentials can also be included.</div>';box.querySelectorAll('[data-market]').forEach(el=>el.onchange=()=>{const k=el.dataset.market;if(el.checked){if(state.marketNow.length>=7){el.checked=false;const st=$('#compMarketStatus');if(st)st.textContent='Choose up to 7 skills or credentials to market now.';return}if(!state.marketNow.includes(k))state.marketNow.push(k)}else state.marketNow=state.marketNow.filter(x=>x!==k);write(state);renderMarket(state)});const st=$('#compMarketStatus');if(st)st.textContent=`${state.marketNow.length} selected • aim for 5–7 when you have enough confirmed evidence.`}
function renderTechnical(state){const box=$('#compTechnicalList');if(!box)return;const items=Object.values(state.technical||{}).sort((a,b)=>String(a.category||'').localeCompare(String(b.category||''))||String(a.label||'').localeCompare(String(b.label||'')));box.innerHTML=items.length?items.map(x=>`<label class="compSkillCard ${x.confirmed?'confirmed':''}"><input type="checkbox" data-sync-tech="${esc(x.id)}" ${x.confirmed?'checked':''}><span><b>${esc(x.label)}</b><small>${esc(x.category||'Technical skill')} • ${esc(sourceText(x))}</small>${x.evidence?.[0]?`<em>${esc(x.evidence[0])}</em>`:''}</span></label>`).join(''):'<div class="empty">No technical or workplace skills surfaced yet. Add résumé evidence, confirm occupation suggestions, or add one manually.</div>';box.querySelectorAll('[data-sync-tech]').forEach(el=>el.onchange=()=>{const x=state.technical[el.dataset.syncTech];if(!x)return;x.confirmed=el.checked;if(el.checked&&!x.sources.includes('résumé')&&!x.sources.includes('participant'))x.sources.push('participant');if(!el.checked&&x.sources.includes('participant')&&x.sources.includes('occupation suggestion'))x.sources=x.sources.filter(s=>s!=='participant');write(state);renderTechnical(state);renderMarket(state)})}
function sync(){const role=$('#currentRole')?.value.trim()||'';const allowed=allowedFor(role);const state=read();state.technical=state.technical||{};state.marketNow=state.marketNow||[];
 for(const [id,x] of Object.entries(state.technical)){
   const sources=x.sources||[];
   if(!sources.includes('occupation suggestion'))continue;
   if(allowed.has(id))continue;
   x.sources=sources.filter(s=>s!=='occupation suggestion');
   const hasIndependent=x.sources.includes('résumé')||x.sources.includes('participant');
   if(!hasIndependent){delete state.technical[id];state.marketNow=state.marketNow.filter(k=>k!=='tech:'+id)}
 }
 for(const id of allowed){if(state.technical[id]){const x=state.technical[id];x.sources=x.sources||[];if(!x.sources.includes('occupation suggestion'))x.sources.push('occupation suggestion');continue}if(EXTRA[id])state.technical[id]=JSON.parse(JSON.stringify(EXTRA[id]))}
 state.updatedAt=new Date().toISOString();write(state);renderTechnical(state);renderMarket(state)}
function install(){const input=$('#currentRole');if(!input)return;let t;const queue=()=>{clearTimeout(t);t=setTimeout(sync,460)};input.addEventListener('input',queue);input.addEventListener('change',queue);setTimeout(sync,520)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();