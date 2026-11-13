/* Northern-only Ready2Work guard. No app code loads until verified staff enrollment. */
(async()=>{
 'use strict';
 const text=document.getElementById('northernGateText');
 const gate=document.getElementById('northernGate');
 const say=msg=>{if(text)text.textContent=msg};
 const cfg=window.BOOST_CONFIG;
 const base='https://pinalworkforce1-del.github.io/BOOST_Pathway-Portal/ready-2-work-qa/';
 if(!cfg||cfg.region!=='Northern Arizona'||!window.supabase?.createClient){say('Northern sign-in is unavailable. Please return to BOOST.');return;}
 const client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
 try{
  const {data:sessionData,error:sessionError}=await client.auth.getSession();
  if(sessionError||!sessionData?.session){say('Please sign in to Northern BOOST first, then reopen Ready 2 Work.');return;}
  const {data:identity,error:identityError}=await client.auth.getUser();
  if(identityError||!identity?.user){say('Could not verify your Northern BOOST identity. Return to BOOST and sign in again.');return;}
  const {data:enrolled,error:enrollError}=await client.rpc('boost_northern_ready2work_enrolled');
  if(enrollError){say('Northern Ready 2 Work access verification is unavailable. Please contact your career coach.');return;}
  if(enrolled!==true){say('Ready 2 Work is not enabled for your account. Ask your Northern BOOST career coach to enable access in Coach View. Your existing BOOST progress is unchanged.');return;}
  // The shared app uses a fixed local key; swap its value to a per-user
  // Northern namespace before any application code can load.
  const localKey='boost-northern-r2w-v1',ownerKey='boost-northern-r2w-current-owner',scopedKey=localKey+':'+identity.user.id;
  try{
   const previousOwner=localStorage.getItem(ownerKey);
   if(previousOwner&&previousOwner!==identity.user.id){
    const previous=localStorage.getItem(localKey);
    if(previous)localStorage.setItem(localKey+':'+previousOwner,previous);
   }
   const scoped=localStorage.getItem(scopedKey);
   const existing=localStorage.getItem(localKey);
   if(scoped){
     // A prior save may have updated the main key before the per-user mirror.
     // Preserve whichever copy contains the most recent meaningful résumé.
     const parse=raw=>{try{return JSON.parse(raw||'null')}catch{return null}};
     const score=x=>{
       const rb=x?.resumeBuilder||{},exp=Array.isArray(rb.experiences)?rb.experiences:[],v=Array.isArray(rb.versions)?rb.versions:[];
       return exp.filter(e=>e&&(e.role||e.employer||e.evidence||(e.bullets||[]).length)).length*10+
         v.filter(z=>z&&(z.target||z.jobDescription||z.summary||z.alignment)).length*3+
         (rb.alignment?.explored?.length||0)*5+(rb.jobDescription?4:0)+(rb.summary?2:0);
     };
     const main=parse(existing),mirror=parse(scoped);
     const sameOwner=previousOwner===identity.user.id;
     const useMain=sameOwner&&main&&(score(main)>score(mirror)||
       (score(main)===score(mirror)&&Date.parse(main.savedAt||'')>Date.parse(mirror?.savedAt||'')));
     if(useMain)localStorage.setItem(scopedKey,existing);
     else localStorage.setItem(localKey,scoped);
   }else if(previousOwner===identity.user.id&&existing){
     // Do not erase a valid same-owner save merely because the mirror is missing.
     localStorage.setItem(scopedKey,existing);
   }else localStorage.removeItem(localKey);
   // Never fall back to a different participant's tab-only backup.
   if(previousOwner!==identity.user.id){sessionStorage.removeItem(localKey);sessionStorage.removeItem(localKey+'-backup');}
   localStorage.setItem(ownerKey,identity.user.id);
  }catch(e){say('Browser storage is unavailable. Open Ready 2 Work in a standard browser window.');return;}
  window.NORTHERN_R2W={client,userId:identity.user.id,verified:true,region:'Northern Arizona'};
  // Course data is hosted by Pinal, but its media references are relative.
  // Northern has no local /ready2work/assests/ directory, so resolve every
  // scenario image, prompt, impact audio and caption to the published source.
  // This changes only Northern's in-memory course data, never Pinal files.
  function resolveCourseMedia(){
   const course=window.R2W_COURSE;
   if(!course?.scenes?.length)throw new Error('Ready 2 Work course data unavailable');
   const visit=value=>{
    if(Array.isArray(value)){value.forEach(visit);return;}
    if(!value||typeof value!=='object')return;
    for(const [key,item] of Object.entries(value)){
     if(typeof item==='string'&&item.startsWith('assests/')){
      value[key]=new URL(item,base).href;
     }else if(item&&typeof item==='object')visit(item);
    }
   };
   visit(course);
  }
  const scripts=[
    base+'course-data.js',
    'resume-evidence-review-v1.js',
    'resume-occupation-titles-v1.js',
    'resume-occupation-search-v1.js',
    'resume-format-v1.js',
    'app.js',
    'resume-polish-v1.js',
    base+'resume-step-arrival-v1.js',
    'resume-strategy-v1.js',
    'interview-landing-v1.js',
    'northern-cloud-save.js'
  ];
  for(const src of scripts){
   await new Promise((resolve,reject)=>{
    const el=document.createElement('script');el.src=src;el.onload=resolve;el.onerror=()=>reject(new Error('Could not load '+src));
    document.body.append(el);
   });
   if(src===base+'course-data.js')resolveCourseMedia();
  }
  gate.hidden=true;
 }catch(err){say('Ready 2 Work could not be opened safely. Please return to Northern BOOST and try again.');}
})();