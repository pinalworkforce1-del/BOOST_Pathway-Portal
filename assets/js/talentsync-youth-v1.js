/* TalentSync Youth Workspace v1: program-aware caseload and case review.
   Uses existing case-state persistence; does not change enrollment or approvals. */
(()=>{
const elements=[
'Tutoring, study skills and dropout prevention','Alternative secondary school and dropout recovery',
'Paid and unpaid work experiences','Occupational skills training','Education concurrent with workforce preparation',
'Leadership development opportunities','Supportive services','Adult mentoring','Follow-up services',
'Comprehensive guidance and counseling','Financial literacy education',
'Entrepreneurial skills training','Labor market and employment information',
'Postsecondary preparation and transition'];
const originalTable=renderTable,originalDrawer=renderDrawer;
const table=document.querySelector('#caseloadBody')?.closest('table'),head=table?.querySelector('thead tr');
const adultHeaders=head?.innerHTML||'';
const youthHeaders=['Participant','Health','Program / Stage','ISS','Elements','WEX','Support Services','Barriers','Education','Leadership / Mentoring','MSG','Employment','Actions'];
const esc=typeof escapeHtml==='function'?escapeHtml:(v)=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function ensure(p){return p.youthCase&&typeof p.youthCase==='object'?p.youthCase:{}}
function summary(y){return Object.values(y.elements||{}).filter(x=>x&&x!=='not_assessed').length}
function youthTable(rows){
 head.innerHTML=youthHeaders.map(x=>'<th>'+esc(x)+'</th>').join('');
 const body=document.querySelector('#caseloadBody');
 if(!rows.length){body.innerHTML='<tr><td colspan="13" class="empty">No Youth participants match.</td></tr>';return}
 body.innerHTML=rows.map(({p,d})=>{const y=ensure(p);return '<tr><td><button class="participant-link" data-open="'+esc(p.id)+'">'+esc(displayParticipantName(p.name))+'</button></td>'+
 '<td>'+esc(d.highestSeverity)+'</td><td>Youth · '+esc(d.stage)+'</td><td>'+esc(y.iss||'Not reviewed')+'</td>'+
 '<td>'+summary(y)+' / 14 reviewed</td><td>'+esc(y.wex||'Not reviewed')+'</td>'+
 '<td>'+esc(y.support||'Not reviewed')+'</td><td>'+esc(y.barriers||'Not assessed')+'</td>'+
 '<td>'+esc(y.education||'Not reviewed')+'</td><td>'+esc(y.leadership||'Not reviewed')+' / '+esc(y.mentoring||'Not reviewed')+'</td>'+
 '<td>'+esc(p.msgStatus||'Not recorded')+'</td><td>'+esc(d.employment?.status||'Not recorded')+'</td>'+
 '<td><button class="participant-link" data-open="'+esc(p.id)+'">Open case</button></td></tr>'}).join('');
}
renderTable=function(rows){if(document.querySelector('#programFilter')?.value==='Youth')youthTable(rows);
 else{if(head)head.innerHTML=adultHeaders;originalTable(rows);if(head&&head.children[5])head.children[5].textContent='IEP / ISS';document.querySelectorAll('#caseloadBody tr').forEach((tr,i)=>{const p=rows[i]?.p;if(p?.program!=='Youth')return;const cell=tr.children[5];if(cell){const status=ensure(p).iss||'Not reviewed';cell.innerHTML='<span class="badge '+(status==='Completed'?'healthy':'due')+'">ISS: '+esc(status)+'</span>'}})}};
function field(label,key,y,choices){return '<label style="display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:600">'+esc(label)+'<select data-youth-field="'+key+'" style="padding:8px;width:100%;border:1px solid #cbd5e1;border-radius:7px">'+choices.map(x=>'<option value="'+esc(x)+'"'+((y[key]||'Not reviewed')===x?' selected':'')+'>'+esc(x)+'</option>').join('')+'</select></label>'}
renderDrawer=function(id){
 originalDrawer(id);
 const p=state.participants.find(x=>String(x.id)===String(id));
 const target=document.querySelector('#drawerSignals');
 const old=document.querySelector('#youthWorkspace');
 if(old)old.remove();
 document.querySelectorAll('#drawer .levelup-results-control').forEach(x=>x.remove());
 if(!p||p.program!=='Youth'||!target)return;
 const firstSignal=target.querySelector('.signal-card');if(firstSignal){const iss=ensure(p).iss||'Not reviewed';firstSignal.innerHTML='<label>ISS</label><span class="badge '+(iss==='Completed'?'healthy':'due')+'">'+esc(iss)+'</span>';}
 const y=ensure(p),panel=document.createElement('section');panel.id='youthWorkspace';
 panel.style.cssText='margin:12px 0;padding:14px;border:1px solid #93c5bd;border-radius:12px;background:#f4faf8';
 const statuses=['Not reviewed','Needed','Offered','Referred','In progress','Provided','Completed','Declined','Not needed'];
 const choices=['Not reviewed','Planned','In progress','Completed','Needs attention','Not applicable'];
 panel.innerHTML='<h3 style="margin:0 0 5px;color:#155e63">Youth Case Management</h3>'+
 '<p style="font-size:12px;margin:0 0 10px">ISY / OSY classification and services must be verified against the AJC record. These are planning notes, not automatic WIOA service reporting.</p>'+
 '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">'+
 field('Comprehensive Assessment','assessment',y,choices)+field('Individual Service Strategy','iss',y,choices)+field('Work Experience','wex',y,choices)+
 field('Support Services','support',y,choices)+field('Barriers','barriers',y,choices)+
 field('Education','education',y,choices)+field('Leadership','leadership',y,choices)+field('Mentoring','mentoring',y,choices)+
 '</div><h4>14 Youth Program Elements</h4><div style="display:grid;gap:7px">'+elements.map((label,i)=>{
 const value=y.elements?.[String(i+1)]||'Not reviewed';
 return '<label style="font-size:12px;display:flex;gap:10px;justify-content:space-between;align-items:center"><span>'+(i+1)+'. '+esc(label)+'</span><select data-youth-element="'+(i+1)+'" style="max-width:135px;padding:6px;border:1px solid #cbd5e1">'+statuses.map(s=>'<option'+(value===s?' selected':'')+'>'+esc(s)+'</option>').join('')+'</select></label>'}).join('')+
 '</div><button id="youthSave" type="button" style="margin-top:12px;padding:9px 14px;background:#155e63;color:white;border:0;border-radius:9px;font-weight:700">Save Youth Review</button>'+
 '<p id="youthSaveStatus" style="font-size:11px" role="status"></p>';
 target.insertAdjacentElement('afterend',panel);
 const evidenceBtn=document.createElement('button');
 evidenceBtn.className='levelup-results-control';evidenceBtn.type='button';evidenceBtn.textContent='View Level Up Results';evidenceBtn.style.cssText='margin:9px 0;padding:9px 13px;border:1px solid #155e63;border-radius:9px;color:#155e63;background:white;font-weight:700;cursor:pointer';
 evidenceBtn.onclick=()=>{
  const evidence=p.levelupEvidence;
  const old=document.querySelector('#levelupEvidencePanel');if(old){old.remove();return;}
  const holder=document.createElement('div');holder.id='levelupEvidencePanel';
  holder.style.cssText='margin:8px 0 14px;padding:12px;border:1px solid #b7cbd8;background:#f6fafc;border-radius:10px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px';
  if(!evidence){holder.textContent='No verified Level Up evidence is linked to this TalentSync case yet. A participant must be securely linked and transferred before reports appear here.';}
  else {
   const heading=document.createElement('strong');heading.textContent='Linked Level Up evidence';holder.append(heading);
   const groups=[['Career Tree',evidence.career_tree],['Ready 2 Work and interview',evidence.ready_2_work]];
   for(const [name,data] of groups){const details=document.createElement('details');details.style.marginTop='9px';
    const summary=document.createElement('summary');summary.textContent=name;details.append(summary);
    const pre=document.createElement('pre');pre.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font-size:11px';pre.textContent=data?JSON.stringify(data,null,2):'No transferred evidence';details.append(pre);holder.append(details);}
  }
  evidenceBtn.insertAdjacentElement('afterend',holder);
 };
 panel.insertAdjacentElement('beforebegin',evidenceBtn);
 
 const reviewBody=panel.innerHTML;
 const collapseReview=()=>{
  panel.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><div><strong>Youth Review</strong><div style="font-size:12px;color:#466">Changes queued for cloud sync; reopen to review.</div></div><button type="button" id="youthExpand" style="padding:8px;border-radius:8px">Edit Youth Review</button></div>';
  panel.querySelector('#youthExpand').onclick=()=>renderDrawer(p.id);
 };
 panel.querySelector('#youthSave').addEventListener('click',async()=>{
  const saved={...ensure(p),elements:{...(ensure(p).elements||{})}};
  panel.querySelectorAll('[data-youth-field]').forEach(el=>saved[el.dataset.youthField]=el.value);
  panel.querySelectorAll('[data-youth-element]').forEach(el=>saved.elements[el.dataset.youthElement]=el.value);
  const prior=p.youthCase;p.youthCase=saved;
  const msg=panel.querySelector('#youthSaveStatus'),btn=panel.querySelector('#youthSave');btn.disabled=true;
  try{await saveState();msg.textContent='Youth review queued for cloud sync.';msg.style.color='#166534';const firstSignal=target.querySelector('.signal-card');if(firstSignal){firstSignal.innerHTML='<label>ISS</label><span class="badge '+(saved.iss==='Completed'?'healthy':'due')+'">'+esc(saved.iss||'Not reviewed')+'</span>';}collapseReview();renderTable(visibleRows())}
  catch(err){p.youthCase=prior;msg.textContent='Save failed. Changes were not confirmed: '+(err?.message||err);msg.style.color='#b91c1c'}
  finally{btn.disabled=false}
 });
};
})();