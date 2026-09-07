(function(){
  "use strict";
  const cfg=window.BOOST_CONFIG||{};
  const REGION=cfg.region||"Pinal County";
  const MAP_KEY="boostPathwaysV29";
  const MAP_OLD_KEY="boostPathwaysV28";
  const COMPLETED_KEY="boostPortalCompleted_v2";
  const PATH_KEY="boostPortalPathway_v2";
  const JOURNEY_ID_KEY="boost_pinal_cloud_journey_id";
  const TOKEN_KEY="boost_pinal_cloud_access_token";
  const DEVICE_KEY="boost_pinal_device_only_mode";
  const WATCHED=new Set([MAP_KEY,MAP_OLD_KEY,COMPLETED_KEY,PATH_KEY]);
  const originalSetItem=Storage.prototype.setItem;
  let client=null,saveTimer=null,saving=false,pending=false;

  function configured(){
    return !!(cfg.cloudEnabled&&cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase&&window.supabase.createClient);
  }
  function getClient(){
    if(!configured())return null;
    if(!client)client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    return client;
  }
  function parse(key,fallback){
    try{return JSON.parse(localStorage.getItem(key)||fallback)}catch(e){return JSON.parse(fallback)}
  }
  function randomToken(){
    const b=new Uint8Array(32);crypto.getRandomValues(b);
    return Array.from(b,x=>x.toString(16).padStart(2,"0")).join("");
  }
  function credentials(){
    let id=localStorage.getItem(JOURNEY_ID_KEY),token=localStorage.getItem(TOKEN_KEY);
    if(!id){id=crypto.randomUUID();originalSetItem.call(localStorage,JOURNEY_ID_KEY,id)}
    if(!token){token=randomToken();originalSetItem.call(localStorage,TOKEN_KEY,token)}
    return {id,token};
  }
  function hasLocalProgress(){
    const map=parse(MAP_KEY,localStorage.getItem(MAP_OLD_KEY)||"{}");
    const completed=parse(COMPLETED_KEY,"[]");
    return !!(map.pathway||Object.keys(map.complete||{}).length||completed.length||localStorage.getItem(PATH_KEY));
  }
  function snapshot(name,email){
    return {
      schema_version:1,
      region:REGION,
      participant:{name:name||"",email:(email||"").toLowerCase()},
      portal:{
        map:parse(MAP_KEY,localStorage.getItem(MAP_OLD_KEY)||"{}"),
        completed:parse(COMPLETED_KEY,"[]"),
        pathway:localStorage.getItem(PATH_KEY)||""
      },
      updated_at:new Date().toISOString()
    };
  }
  function restore(journey){
    const p=journey&&journey.portal;if(!p)return false;
    if(p.map)originalSetItem.call(localStorage,MAP_KEY,JSON.stringify(p.map));
    if(Array.isArray(p.completed))originalSetItem.call(localStorage,COMPLETED_KEY,JSON.stringify(p.completed));
    if(p.pathway)originalSetItem.call(localStorage,PATH_KEY,p.pathway);
    return true;
  }
  async function saveNow(){
    const c=getClient();if(!c)return false;
    const session=(await c.auth.getSession()).data.session;
    if(!session||!session.user)return false;
    const meta=session.user.user_metadata||{};
    const name=[meta.first_name,meta.last_name].filter(Boolean).join(" ")||meta.full_name||"";
    const cred=credentials();
    const payload=snapshot(name,session.user.email||"");
    const result=await c.rpc("boost_save_journey",{p_journey_id:cred.id,p_access_token:cred.token,p_journey:payload});
    if(result.error){console.warn("Pinal BOOST cloud save failed",result.error.message);return false}
    window.dispatchEvent(new CustomEvent("boost-cloud-status",{detail:{state:"saved",region:REGION}}));
    return true;
  }
  function queueSave(){
    if(!configured())return;
    pending=true;clearTimeout(saveTimer);
    saveTimer=setTimeout(async function(){
      if(saving)return;saving=true;
      try{while(pending){pending=false;await saveNow()}}finally{saving=false}
    },450);
  }
  async function loadMine(){
    const c=getClient();if(!c)return null;
    const result=await c.rpc("boost_load_my_journey_for_region",{p_region:REGION});
    if(result.error){console.warn("Pinal BOOST cloud load failed",result.error.message);return null}
    return result.data||null;
  }
  Storage.prototype.setItem=function(key,value){
    originalSetItem.call(this,key,value);
    if(this===localStorage&&WATCHED.has(key))queueSave();
  };

  function addStyles(){
    if(document.getElementById("boost-pinal-auth-style"))return;
    const s=document.createElement("style");s.id="boost-pinal-auth-style";
    s.textContent=".boostAuthGate{position:fixed;inset:0;z-index:2147483640;background:rgba(4,17,28,.88);backdrop-filter:blur(7px);display:flex;align-items:center;justify-content:center;padding:18px}.boostAuthCard{width:min(540px,96vw);background:#fff;border-radius:22px;box-shadow:0 30px 90px rgba(0,0,0,.45);overflow:hidden}.boostAuthHead{padding:20px 22px;background:linear-gradient(90deg,#102d49,#1f587f);color:#fff;border-bottom:3px solid #e4a72b}.boostAuthHead h2{margin:0;font-size:25px}.boostAuthHead p{margin:7px 0 0;color:#d9e8f2;line-height:1.4}.boostAuthBody{padding:20px 22px}.boostAuthBody label{display:block;font-weight:800;color:#17324d;margin:11px 0 5px}.boostAuthBody input{width:100%;padding:12px 13px;border:1px solid #bdccd5;border-radius:11px;font:inherit}.boostAuthRow{display:grid;grid-template-columns:1fr 1fr;gap:10px}.boostAuthBtn{width:100%;border:0;border-radius:12px;padding:12px 14px;margin-top:14px;background:#0d2741;color:#fff;font-weight:900;font-size:15px;cursor:pointer}.boostAuthBtn.secondary{background:#eef4f7;color:#17324d;border:1px solid #c4d3db}.boostAuthBtn:disabled{opacity:.55;cursor:wait}.boostAuthNote{margin-top:12px;padding:10px 12px;border-radius:10px;background:#f2f7fa;color:#526975;font-size:13px;line-height:1.45}.boostAuthStatus{margin-top:10px;font-size:13px;font-weight:800;color:#2f6b50}.boostAuthCode{display:none}.boostAuthCode.show{display:block}@media(max-width:600px){.boostAuthRow{grid-template-columns:1fr}}";
    document.head.appendChild(s);
  }
  async function showGate(){
    if(!configured()||sessionStorage.getItem(DEVICE_KEY)==="1")return;
    const c=getClient();
    const session=(await c.auth.getSession()).data.session;
    if(session&&session.user)return;
    addStyles();
    const gate=document.createElement("div");gate.className="boostAuthGate";
    gate.innerHTML='<div class="boostAuthCard"><div class="boostAuthHead"><h2>Welcome to Pinal BOOST</h2><p>Sign in once so your BOOST journey and pathway progress can follow you across devices.</p></div><div class="boostAuthBody"><div class="boostAuthRow"><div><label for="boostFirst">First name</label><input id="boostFirst" autocomplete="given-name"></div><div><label for="boostLast">Last name</label><input id="boostLast" autocomplete="family-name"></div></div><label for="boostEmail">Email</label><input id="boostEmail" type="email" autocomplete="email" placeholder="you@example.com"><button class="boostAuthBtn" id="boostSend">Send My Sign-In Email</button><div class="boostAuthCode" id="boostCodeWrap"><label for="boostCode">6-digit code</label><input id="boostCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456"><button class="boostAuthBtn" id="boostVerify">Verify Code & Start</button></div><div class="boostAuthStatus" id="boostAuthStatus"></div><div class="boostAuthNote">Use the secure link in the email to return here, or enter its six-digit code above.</div><button class="boostAuthBtn secondary" id="boostDevice">Continue on this device for now</button></div></div>';
    document.body.appendChild(gate);
    const first=gate.querySelector("#boostFirst"),last=gate.querySelector("#boostLast"),email=gate.querySelector("#boostEmail"),send=gate.querySelector("#boostSend"),wrap=gate.querySelector("#boostCodeWrap"),code=gate.querySelector("#boostCode"),verify=gate.querySelector("#boostVerify"),status=gate.querySelector("#boostAuthStatus");
    send.onclick=async function(){
      const fn=first.value.trim(),ln=last.value.trim(),em=email.value.trim();
      if(!fn||!ln||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){status.textContent="Enter your first name, last name, and a valid email address.";return}
      send.disabled=true;status.textContent="Sending your secure BOOST sign-in email…";
      const redirect=new URL(location.href);redirect.hash="";
      const result=await c.auth.signInWithOtp({email:em,options:{emailRedirectTo:redirect.toString(),data:{first_name:fn,last_name:ln,full_name:(fn+" "+ln).trim(),boost_region:REGION}}});
      send.disabled=false;
      if(result.error){status.textContent="We could not send the sign-in email. "+result.error.message;return}
      originalSetItem.call(localStorage,"boost_pinal_pending_name",(fn+" "+ln).trim());
      wrap.classList.add("show");status.textContent="Email sent. Check your inbox to continue.";
    };
    verify.onclick=async function(){
      const em=email.value.trim(),token=code.value.trim();
      if(!/^\d{6}$/.test(token)){status.textContent="Enter the six-digit code from your email.";return}
      verify.disabled=true;status.textContent="Verifying…";
      const result=await c.auth.verifyOtp({email:em,token:token,type:"email"});verify.disabled=false;
      if(result.error){status.textContent="That code could not be verified. "+result.error.message;return}
      await saveNow();gate.remove();location.reload();
    };
    gate.querySelector("#boostDevice").onclick=function(){sessionStorage.setItem(DEVICE_KEY,"1");gate.remove()};
  }
  async function bootstrap(){
    if(!configured())return;
    const c=getClient();
    const session=(await c.auth.getSession()).data.session;
    if(session&&session.user){
      if(hasLocalProgress())await saveNow();
      else{const remote=await loadMine();if(remote&&restore(remote)){location.reload();return}}
    }
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",showGate);else showGate();
  }
  window.PinalBOOSTCloud={configured:configured,saveNow:saveNow,loadMine:loadMine};
  bootstrap();
})();