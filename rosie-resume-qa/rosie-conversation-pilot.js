/* Rosie conversational pilot: opt-in, human-approved additions to existing resume state. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const bridge=()=>window.RosieConversationBridge;
let busy=false, sessionKey='', draftTexts=[], draftKey='', visible=false;
const messages=()=> $('rosiePilotMessages');
const when=()=>new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
function status(text){$('rosiePilotStatus').textContent=text||''}
function addMessage(role,text,persist=true){
  if(!text)return;
  const el=document.createElement('div');el.className='rosie-pilot-line '+(role==='assistant'?'coach':'participant');
  const header=document.createElement('strong');header.textContent=(role==='assistant'?'Rosie':'You')+' · '+when();
  const body=document.createElement('p');body.textContent=text;
  el.append(header,body);messages().appendChild(el);messages().scrollTop=messages().scrollHeight;
  if(persist)bridge()?.append(role,text);
}
const cleanBullet=text=>String(text||'').trim().replace(/^(?:[•●▪◦*]|[-–—]|\d+[.)])\s*/,'').trim();
let activeModal=null;
function ensureModal(){
  if(activeModal)return activeModal;
  const dlg=document.createElement('dialog');dlg.id='rosieDraftReviewModal';dlg.className='rosie-draft-modal';dlg.setAttribute('aria-labelledby','rosieDraftModalTitle');
  const shell=document.createElement('div');shell.className='rosie-draft-modal-shell';
  const top=document.createElement('div');top.className='rosie-draft-modal-top';
  const heading=document.createElement('div');const kicker=document.createElement('small');kicker.textContent='ROSIE · RÉSUMÉ EVIDENCE REVIEW';
  const title=document.createElement('h2');title.id='rosieDraftModalTitle';title.textContent='Choose your strongest bullet';
  heading.append(kicker,title);
  const close=document.createElement('button');close.type='button';close.className='rosie-draft-close';close.textContent='✕';close.setAttribute('aria-label','Close bullet review');close.onclick=()=>dlg.close();
  top.append(heading,close);shell.appendChild(top);
  const description=document.createElement('p');description.textContent='These are suggestions based on what you shared. Review or edit one, confirm the facts, then add it to your résumé.';shell.appendChild(description);
  const host=document.createElement('div');host.id='rosieDraftModalOptions';host.className='rosie-pilot-drafts';shell.appendChild(host);
  const foot=document.createElement('div');foot.className='rosie-draft-modal-footer';
  const continueBtn=document.createElement('button');continueBtn.type='button';continueBtn.className='rosie-draft-close-later';continueBtn.textContent='Return to conversation';continueBtn.onclick=()=>dlg.close();
  foot.appendChild(continueBtn);shell.appendChild(foot);
  dlg.appendChild(shell);
  dlg.addEventListener('click',event=>{if(event.target===dlg)dlg.close()});
  document.body.appendChild(dlg);
  activeModal=dlg;return dlg;
}
function clearDrafts(){draftTexts=[];draftKey='';$('rosiePilotDrafts').replaceChildren();const d=$('rosieDraftReviewModal');if(d?.open)d.close();const b=$('rosieReviewDrafts');if(b)b.hidden=true}
function showDraftModal(){const d=ensureModal();if(draftTexts.length&&!d.open)d.showModal()}
function loadChat(){
  const snapshot=bridge()?.snapshot(),state=bridge()?.getSessionData();
  if(!snapshot||!state){status('Résumé data unavailable');return}
  sessionKey=state.key;
  $('rosiePilotTarget').value=snapshot.target||'';
  $('rosiePilotRole').value=snapshot.role||'';
  $('rosiePilotEmployer').value=snapshot.employer||'';
  messages().replaceChildren();clearDrafts();
  for(const m of state.messages||[])addMessage(m.role,m.text,false);
  if(!state.messages?.length){
    addMessage('assistant','Hi! I’m Rosie. You can tell me what you did at a previous job, ask for help explaining your experience, or work on one résumé bullet together.'+
      (snapshot.target?' Your current résumé target is '+snapshot.target+'. We can use that for relevance without pretending you have experience you haven’t gained.':''));
  }
  status('Preview conversation saved on this browser. You approve every change.');
}
function showMode(mode,record=true){
  if(activeModal?.open)activeModal.close();
  const guided=mode!=='chat';
  $('rosiePilotChoice').hidden=true;
  $('resumeBuilderForm').hidden=!guided;
  $('rosiePilotPanel').hidden=guided;
  $('rosiePilotSwitchChat').hidden=!guided;
  $('rosiePilotMode').textContent=guided?'Guided':'Conversational';
  visible=true;
  if(record)bridge()?.metric('choice_or_switch',mode);
  if(guided)bridge()?.refreshGuided();
  else loadChat();
}
function chooseMode(mode){
  bridge()?.metric('choice',mode);
  showMode(mode,false);
}
function offerChoice(){
  const state=bridge()?.getSessionData();
  if(!state)return;
  const form=$('resumeBuilderForm');
  if(!state.initialChoice){
    $('rosiePilotChoice').hidden=false;form.hidden=true;
    $('rosiePilotPanel').hidden=true;$('rosiePilotSwitchChat').hidden=true;
  }else showMode(state.lastMode||state.initialChoice,false);
}
function draftsUI(proposals){
  const host=ensureModal().querySelector('#rosieDraftModalOptions');host.replaceChildren();
  $('rosieDraftModalTitle').textContent='Choose your strongest bullet';
  draftKey=bridge()?.getSessionData()?.key||'';
  draftTexts=proposals.filter(x=>x.text).map(x=>({...x,text:cleanBullet(x.text)})).filter(x=>x.text);
  const btn=$('rosieReviewDrafts');if(btn)btn.hidden=false;
  for(const proposal of draftTexts){
    const wrap=document.createElement('div');wrap.className='rosie-pilot-proposal';
    const heading=document.createElement('strong');heading.textContent=proposal.name;
    const editor=document.createElement('textarea');editor.value=proposal.text;editor.rows=3;editor.setAttribute('aria-label','Review and edit '+proposal.name);
    const approval=document.createElement('label');approval.className='rosie-pilot-approval';
    const check=document.createElement('input');check.type='checkbox';
    approval.append(check,document.createTextNode(' I confirm that this describes work I actually did.'));
    const button=document.createElement('button');button.type='button';button.textContent='Add this bullet to my résumé';button.className='rosie-pilot-accept';
    button.onclick=()=>{
      if(!check.checked){status('Please verify the facts before adding the bullet.');check.focus();return}
      const text=cleanBullet(editor.value);
      if(text.length<10){status('Please enter a complete bullet.');editor.focus();return}
      if(bridge()?.getSessionData()?.key!==draftKey){status('You changed résumé or role. Start a new draft for this experience.');clearDrafts();return}
      const other=bridge()?.snapshot()?.approvedBullets||[];
      if(other.map(cleanBullet).includes(text)){status('This bullet is already on your résumé.');return}
      bridge().accept(text);
      bridge().metric('bullet_approved','chat');
      clearDrafts();
      addMessage('assistant','Added to your résumé preview. Would you like to build another bullet, revise your résumé, or discuss a different responsibility?');
      status('Approved bullet saved to the résumé on the right.');
      $('rosiePilotInput')?.focus();
    };
    wrap.append(heading,editor,approval,button);host.appendChild(wrap);
  }
  showDraftModal();
}

function editReview(operation,indexes,replacement){
  const snapshot=bridge()?.snapshot(),original=snapshot?.approvedBullets||[];
  const affected=[...new Set(indexes||[])].filter(i=>Number.isInteger(i)&&i>=0&&i<original.length).sort((a,b)=>a-b);
  if(!affected.length){status('I could not identify which approved bullet to change. Use Manage résumé bullets to choose it.');return}
  if(operation==='consolidate'&&affected.length<2){status('Choose at least two bullets to consolidate.');return}
  const host=ensureModal().querySelector('#rosieDraftModalOptions');host.replaceChildren();
  const title=$('rosieDraftModalTitle');title.textContent='Review a résumé change';
  const note=document.createElement('p');note.className='rosie-edit-note';note.textContent='This will '+(operation==='remove'?'remove':operation==='replace'?'replace':'consolidate')+' existing approved bullet(s), NOT add a new bullet. Nothing changes until you confirm.';
  host.append(note);
  const old=document.createElement('div');old.className='rosie-edit-before';
  const label=document.createElement('strong');label.textContent='Existing bullets affected';old.append(label);
  const ul=document.createElement('ul');for(const i of affected){const li=document.createElement('li');li.textContent=original[i];ul.append(li)}old.append(ul);host.append(old);
  const editor=document.createElement('textarea');editor.rows=3;
  if(operation!=='remove'){const heading=document.createElement('strong');heading.textContent='Replacement bullet — editable';host.append(heading);editor.value=cleanBullet(replacement||original[affected[0]]);editor.setAttribute('aria-label','Replacement bullet');host.append(editor)}
  const confirm=document.createElement('label');confirm.className='rosie-pilot-approval';
  const check=document.createElement('input');check.type='checkbox';confirm.append(check,document.createTextNode(' I reviewed which bullet(s) will change.'));host.append(confirm);
  const message=document.createElement('p');message.setAttribute('role','status');message.className='rosie-edit-error';host.append(message);
  const action=document.createElement('button');action.type='button';action.className='rosie-pilot-accept';action.textContent=operation==='remove'?'Remove selected bullet(s)':'Replace selected bullet(s)';
  action.onclick=()=>{
    if(!check.checked){message.textContent='Confirm the proposed change first.';return}
    const result=bridge().applyEdit(operation,affected,editor.value,original);
    if(!result.ok){message.textContent=result.error;return}
    clearDrafts();bridge().metric('bullet_'+operation,'chat');
    addMessage('assistant','Résumé updated: '+(result.beforeCount-result.afterCount>0?'redundant bullets removed. ':'approved wording replaced. ')+'Use Undo last edit if you want to reverse this change.');
    status('Résumé updated — '+result.afterCount+' approved bullet(s) remain.');
    const undo=$('rosieUndoBulletEdit');if(undo)undo.hidden=false;
  };
  host.append(action);draftKey=bridge().getSessionData().key;draftTexts=[];ensureModal().showModal();
}
function manageBullets(){
  const snapshot=bridge()?.snapshot(),bullets=snapshot?.approvedBullets||[];
  if(!bullets.length){status('There are no approved bullets in this role yet.');return}
  const dlg=ensureModal(),host=dlg.querySelector('#rosieDraftModalOptions');host.replaceChildren();
  $('rosieDraftModalTitle').textContent='Manage approved résumé bullets';
  const intro=document.createElement('p');intro.textContent='Choose the duplicates you want to consolidate. You will review the exact replacement before anything changes.';host.append(intro);
  const choices=[];bullets.forEach((b,i)=>{const label=document.createElement('label');label.className='rosie-manage-choice';const check=document.createElement('input');check.type='checkbox';const txt=document.createElement('span');txt.textContent=b;label.append(check,txt);host.append(label);choices.push({check,i})});
  const note=document.createElement('p');note.setAttribute('role','status');host.append(note);
  const consolidate=document.createElement('button');consolidate.type='button';consolidate.className='rosie-pilot-accept';consolidate.textContent='Review consolidation';
  consolidate.onclick=()=>{
    const ix=choices.filter(x=>x.check.checked).map(x=>x.i);
    if(ix.length<2){note.textContent='Select at least two duplicate bullets to consolidate.';return}
    dlg.close();editReview('consolidate',ix,bullets[ix[ix.length-1]]);
  };
  const remove=document.createElement('button');remove.type='button';remove.className='rosie-draft-close-later';remove.textContent='Review removal';
  remove.onclick=()=>{const ix=choices.filter(x=>x.check.checked).map(x=>x.i);if(!ix.length){note.textContent='Select one or more bullets to remove.';return}dlg.close();editReview('remove',ix,'')};
  host.append(consolidate,remove);
  if(!dlg.open)dlg.showModal();
}

async function sendMessage(value){
  if(busy||!value.trim())return;
  if(!bridge()){status('Rosie résumé connection unavailable');return}
  const current=bridge().getSessionData();
  if(current.key!==sessionKey)loadChat();
  clearDrafts();
  addMessage('user',value.trim());
  busy=true;$('rosiePilotSend').disabled=true;$('rosiePilotDraftNow').disabled=true;
  status('Rosie is reviewing your message…');
  try{
    const state=bridge().getSessionData();
    const result=await bridge().converse(state.messages);
    if(bridge().getSessionData().key!==sessionKey){status('Résumé changed during coaching. Open that role to continue.');return}
    const reply=String(result.reply||'').trim()||'Can you tell me a little more about that responsibility?';
    addMessage('assistant',reply);
    const proposals=[{name:'Clear & Direct',text:result.clearDirect},{name:'Skills Forward',text:result.skillsForward}];
    if(result.editOperation&&result.editOperation!=='none'){
      editReview(result.editOperation,result.editIndexes||[],result.editText||'');
      status('Review a proposed edit to existing bullets. No new bullet will be added.');
    }else if(proposals.some(x=>x.text)){
      draftsUI(proposals);status('Review and approve a draft before adding it.');
    }else status('Your conversation is saved. Continue whenever you’re ready.');
  }catch(e){
    const msg=String(e?.message||'Rosie is currently unavailable.');
    status(msg);
    addMessage('assistant','I cannot complete that request right now. Your existing résumé and our conversation are saved; you can continue in Guided Builder.');
  }finally{busy=false;$('rosiePilotSend').disabled=false;$('rosiePilotDraftNow').disabled=false}
}
function bind(){
  if(!$('rosiePilotPanel')||!bridge())return;
  const metaFields={rosiePilotTarget:'target',rosiePilotRole:'role',rosiePilotEmployer:'employer'};
  for(const [id,key] of Object.entries(metaFields)){
    $(id).addEventListener('change',()=>{
      bridge()?.updateMeta({[key]:$(id).value});
      status('Job information saved to your résumé.');
    });
  }
  const reviewButton=document.createElement('button');reviewButton.type='button';reviewButton.id='rosieReviewDrafts';reviewButton.textContent='Review drafted bullets';reviewButton.hidden=true;
  reviewButton.onclick=showDraftModal;$('rosiePilotDraftNow').after(reviewButton);
  const manage=document.createElement('button');manage.type='button';manage.id='rosieManageBullets';manage.textContent='Manage résumé bullets';manage.onclick=manageBullets;
  const undo=document.createElement('button');undo.type='button';undo.id='rosieUndoBulletEdit';undo.textContent='Undo last edit';undo.hidden=true;
  undo.onclick=()=>{const r=bridge()?.undoEdit();if(r?.ok){undo.hidden=true;status('Previous bullets restored.');addMessage('assistant','Your last bullet edit has been undone.')}else status(r?.error||'Unable to undo this edit.')};
  $('rosiePilotSwitchGuided').after(manage,undo);
  $('rosiePilotGuided').onclick=()=>chooseMode('guided');
  $('rosiePilotChat').onclick=()=>chooseMode('chat');
  $('rosiePilotSwitchGuided').onclick=()=>showMode('guided');
  $('rosiePilotSwitchChat').onclick=()=>showMode('chat');
  $('rosiePilotSend').onclick=()=>{const input=$('rosiePilotInput'),value=input.value;input.value='';sendMessage(value)};
  $('rosiePilotDraftNow').onclick=()=>sendMessage('Please create two concise, evidence-based résumé bullet drafts from the confirmed details I have shared. Ask one specific question instead if more evidence is necessary.');
  $('rosiePilotInput').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('rosiePilotSend').click()}};
  const view=$('viewResumeBuilder');
  const refresh=()=>{
    if(!view.hidden){
      const next=bridge().getSessionData().key;
      if(!visible){offerChoice()}
      else if(!$('rosiePilotPanel').hidden&&next!==sessionKey)loadChat();
    }else visible=false;
  };
  new MutationObserver(refresh).observe(view,{attributes:true,attributeFilter:['hidden']});
  window.addEventListener('boost-r2w-cloud-restored',()=>{if(!view.hidden&&!$('rosiePilotPanel').hidden)loadChat()});
  refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);
else bind();
})();
