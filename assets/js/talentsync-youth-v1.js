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
 else{if(head)head.innerHTML=adultHeaders;originalTable(rows)}};
function field(label,key,y,choices){return '<label style="display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:600">'+esc(label)+'<select data-youth-field="'+key+'" style="padding:8px;width:100%;border:1px solid #cbd5e1;border-radius:7px">'+choices.map(x=>'<option value="'+esc(x)+'"'+((y[key]||'Not reviewed')===x?' selected':'')+'>'+esc(x)+'</option>').join('')+'</select></label>'}
renderDrawer=function(id){
 originalDrawer(id);
 const p=state.participants.find(x=>String(x.id)===String(id));
 const target=document.querySelector('#drawerSignals');
 const old=document.querySelector('#youthWorkspace');
 if(old)old.remove();
 if(!p||p.program!=='Youth'||!target)return;
 const y=ensure(p),panel=document.createElement('section');panel.id='youthWorkspace';
 panel.style.cssText='margin:12px 0;padding:14px;border:1px solid #93c5bd;border-radius:12px;background:#f4faf8';
 const statuses=['Not reviewed','Needed','Offered','Referred','In progress','Provided','Completed','Declined','Not needed'];
 const choices=['Not reviewed','Planned','In progress','Completed','Needs attention','Not applicable'];
 panel.innerHTML='<h3 style="margin:0 0 5px;color:#155e63">Youth Case Management</h3>'+
 '<p style="font-size:12px;margin:0 0 10px">ISY / OSY classification and services must be verified against the AJC record. These are planning notes, not automatic WIOA service reporting.</p>'+
 '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">'+
 field('Individual Service Strategy','iss',y,choices)+field('Work Experience','wex',y,choices)+
 field('Support Services','support',y,choices)+field('Barriers','barriers',y,choices)+
 field('Education','education',y,choices)+field('Leadership','leadership',y,choices)+field('Mentoring','mentoring',y,choices)+
 '</div><h4>14 Youth Program Elements</h4><div style="display:grid;gap:7px">'+elements.map((label,i)=>{
 const value=y.elements?.[String(i+1)]||'Not reviewed';
 return '<label style="font-size:12px;display:flex;gap:10px;justify-content:space-between;align-items:center"><span>'+(i+1)+'. '+esc(label)+'</span><select data-youth-element="'+(i+1)+'" style="max-width:135px;padding:6px;border:1px solid #cbd5e1">'+statuses.map(s=>'<option'+(value===s?' selected':'')+'>'+esc(s)+'</option>').join('')+'</select></label>'}).join('')+
 '</div><button id="youthSave" type="button" style="margin-top:12px;padding:9px 14px;background:#155e63;color:white;border:0;border-radius:9px;font-weight:700">Save Youth Review</button>'+
 '<p id="youthSaveStatus" style="font-size:11px" role="status"></p>';
 target.insertAdjacentElement('afterend',panel);
 panel.querySelector('#youthSave').addEventListener('click',async()=>{
  const saved={...ensure(p),elements:{...(ensure(p).elements||{})}};
  panel.querySelectorAll('[data-youth-field]').forEach(el=>saved[el.dataset.youthField]=el.value);
  panel.querySelectorAll('[data-youth-element]').forEach(el=>saved.elements[el.dataset.youthElement]=el.value);
  const prior=p.youthCase;p.youthCase=saved;
  const msg=panel.querySelector('#youthSaveStatus'),btn=panel.querySelector('#youthSave');btn.disabled=true;
  try{await saveState();msg.textContent='Saved Youth review to the existing case record.';msg.style.color='#166534'}
  catch(err){p.youthCase=prior;msg.textContent='Save failed. Changes were not confirmed: '+(err?.message||err);msg.style.color='#b91c1c'}
  finally{btn.disabled=false}
 });
};
})();