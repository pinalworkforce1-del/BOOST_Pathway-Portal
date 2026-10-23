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
  const old=document.querySelector('#levelupEvidencePanel');if(old){old.remove();return;}
  const evidence=p.levelupEvidence,holder=document.createElement('section');holder.id='levelupEvidencePanel';
  holder.style.cssText='margin:8px 0 14px;padding:14px;border:1px solid #b7cbd8;background:#f6fafc;border-radius:12px;font-size:12px;line-height:1.5';
  const h=document.createElement('h3');h.textContent='Level Up Participant Results';h.style.margin='0 0 6px';holder.append(h);
  const intro=document.createElement('p');intro.style.margin='0 0 12px';intro.textContent='Coach evidence · Career Tree · Ready 2 Work · Résumé · Live Interview';holder.append(intro);
  const escapeValue=v=>String(v??'—');
  function card(title,data,summary){
    const d=document.createElement('details');d.style.cssText='background:white;border:1px solid #dce5e8;border-radius:10px;padding:11px;margin:8px 0';
    const head=document.createElement('summary');head.style.cssText='font-weight:800;cursor:pointer;color:#174d62';head.textContent=title+' — '+summary;d.append(head);
    const body=document.createElement('div');body.style.cssText='padding-top:8px;color:#294552';
    const line=(label,value)=>{const row=document.createElement('p');row.style.margin='5px 0';const strong=document.createElement('strong');strong.textContent=label+': ';row.append(strong,document.createTextNode(escapeValue(value)));body.append(row)};
    if(data&&typeof data==='object'){
      line('Completion',data.completion_verified===true||data.is_complete===true?'Verified complete':data.status||'Not verified');
      if(data.updated_at||data.completed_at)line('Last evidence',data.completed_at||data.updated_at);
      if(Array.isArray(data.top_3)&&data.top_3.length)line('Interest profile',data.top_3.map(x=>typeof x==='string'?x:x.label||x.code||'').join(', '));
      if(data.completed_scenes!==undefined)line('Scenarios',String(data.completed_scenes)+' / '+String(data.total_scenes||'—'));
      if(data.occupation_reflections)line('Career reflections',data.occupation_reflections.length);
      if(data.saved_careers)line('Saved careers',data.saved_careers.map(x=>x.title||x.name||'Career').join(', '));
      if(data.selected_occupation)line('Selected occupation',data.selected_occupation.title||'Recorded');
      if(data.conversation_balance)line('Interview speaking balance',String(data.conversation_balance.participant_percent||0)+'% participant / '+String(data.conversation_balance.interviewer_percent||0)+'% interviewer');
      const pre=document.createElement('details');pre.style.marginTop='9px';const ps=document.createElement('summary');ps.textContent='Full saved evidence';pre.append(ps);const code=document.createElement('pre');code.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;max-height:320px;overflow:auto;background:#f1f5f9;padding:8px;border-radius:6px';code.textContent=JSON.stringify(data,null,2);pre.append(code);body.append(pre);
    }else line('Status','No cloud evidence supplied');
    d.append(body);holder.append(d);
  }
  if(!evidence){
    const msg=document.createElement('p');msg.textContent='No verified Level Up evidence is linked to this TalentSync case. Existing Level Up records are not accessed through email matching; a secure participant identity link is required.';holder.append(msg);
  }else{
    const ct=evidence.career_tree||{},rw=evidence.ready_2_work||{};
    card('Discover Me',ct.discover_me,ct.discover_me?.status||'Not available');
    card('Explore Careers',ct.explore_careers,ct.explore_careers?.status||'Not available');
    card('Work + Life Plan',ct.work_life_plan,ct.work_life_plan?.status||'Not available');
    card('Soft Skills Synergy',rw.soft_skills,rw.soft_skills?.status||'Not available');
    card('Resume Rise',rw.resume,rw.resume?.status||'Not available');
    card('Interview Intelligence & Nova',rw.interview,rw.interview?.status||'Not available');
    if(evidence.other_modules)card('Additional Level Up modules',evidence.other_modules,'Saved evidence');
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