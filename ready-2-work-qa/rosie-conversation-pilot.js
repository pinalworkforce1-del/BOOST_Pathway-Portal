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
function clearDrafts(){draftTexts=[];draftKey='';$('rosiePilotDrafts').replaceChildren()}
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
  status('Conversation saved with your BOOST résumé. You approve every change.');
}
function showMode(mode,record=true){
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
  const host=$('rosiePilotDrafts');host.replaceChildren();
  draftKey=bridge()?.getSessionData()?.key||'';
  draftTexts=proposals.filter(x=>x.text);
  for(const proposal of draftTexts){
    const wrap=document.createElement('div');wrap.className='rosie-pilot-proposal';
    const heading=document.createElement('strong');heading.textContent=proposal.name;
    const editor=document.createElement('textarea');editor.value=proposal.text;editor.rows=3;editor.setAttribute('aria-label','Review and edit '+proposal.name);
    const approval=document.createElement('label');approval.className='rosie-pilot-approval';
    const check=document.createElement('input');check.type='checkbox';approval.append(check,document.createTextNode(' I confirm that this describes work I actually did.'));
    const button=document.createElement('button');button.type='button';button.textContent='Add reviewed bullet to my résumé';button.className='rosie-pilot-accept';
    button.onclick=()=>{
      if(!check.checked){status('Please verify the facts before adding the bullet.');return}
      const text=editor.value.trim();if(text.length<10){status('Please enter a complete bullet.');return}
      if(bridge()?.getSessionData()?.key!==draftKey){status('You changed résumé or role. Start a new draft for this experience.');clearDrafts();return}
      const other=bridge()?.snapshot()?.approvedBullets||[];
      if(other.includes(text)){status('This bullet is already on your résumé.');return}
      bridge().accept(text);
      bridge().metric('bullet_approved','chat');
      clearDrafts();
      addMessage('assistant','Added to your résumé preview. Would you like to build another bullet, revise your résumé, or discuss a different responsibility?');
      status('Approved bullet saved to the same résumé as Guided Builder.');
    };
    wrap.append(heading,editor,approval,button);host.appendChild(wrap);
  }
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
    if(proposals.some(x=>x.text))draftsUI(proposals);
    status(proposals.some(x=>x.text)?'Review and approve a draft before adding it.':'Your conversation is saved. Continue whenever you’re ready.');
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
