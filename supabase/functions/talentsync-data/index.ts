import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const url=Deno.env.get("SUPABASE_URL")!;
const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});

const cors={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"content-type, authorization, apikey, x-boost-staff-token",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
  "Content-Type":"application/json"
};
const respond=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
const email=v=>String(v??"").trim().toLowerCase();
const isUuid=v=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||""));
async function sha256(v:string){const h=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));return [...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,"0")).join("")}
async function requireStaff(req:Request){
  const token=String(req.headers.get("X-BOOST-Staff-Token")||"").trim();
  if(!token)return null;
  const now=new Date().toISOString(),hash=await sha256(token);
  const {data:s,error}=await db.from("boost_staff_sessions").select("id,email_normalized,expires_at,revoked_at").eq("token_hash",hash).maybeSingle();
  if(error||!s||s.revoked_at||!s.expires_at||s.expires_at<=now)return null;
  const {data:a,error:aErr}=await db.from("boost_staff_access").select("email,display_name,can_pinal,active").ilike("email",s.email_normalized).maybeSingle();
  if(aErr||!a||!a.active||!a.can_pinal)return null;
  await db.from("boost_staff_sessions").update({last_used_at:now}).eq("id",s.id);
  return {email:email(a.email),display_name:a.display_name||a.email};
}
function baseParticipant(r:any,s:any={}){
  return {
    id:r.id,sourceJourneyId:r.source_journey_id,name:r.participant_name||"Participant",
    coach:r.assigned_coach_email||"",program:s.program||"",entryWage:Number(s.entryWage||0)||0,
    iepComplete:s.iepComplete||"No",lastIepUpdate:s.lastIepUpdate||"",lastServiceDate:s.lastServiceDate||"",
    industry:s.industry||r.selected_industry||"",targetOccupation:s.targetOccupation||r.primary_career_title||"",
    pathway:s.pathway||"None",trainingComplete:s.trainingComplete||"",softSkills:s.softSkills||"",
    resumeUpdated:s.resumeUpdated||"",interviewPrep:s.interviewPrep||"",credentialEarned:s.credentialEarned||"",
    trainingStartDate:s.trainingStartDate||"",estimatedCompletionDate:s.estimatedCompletionDate||"",
    actualCompletionDate:s.actualCompletionDate||"",msgStatus:s.msgStatus||"",
    obligations:Array.isArray(s.obligations)?s.obligations:[],hired:s.hired||"",startDate:s.startDate||"",
    employerName:s.employerName||"",hourlyWage:s.hourlyWage??null,trainingRelated:s.trainingRelated||"",
    exitDate:s.exitDate||"",exitOutcome:s.exitOutcome||"",exitReason:s.exitReason||"",
    preferredContact:s.preferredContact||"",followUps:Array.isArray(s.followUps)?s.followUps:[],
    boostSource:true,boostOutputs:s.boostOutputs||r.boost_snapshot||null
  };
}
async function loadState(){
  const {data:parts,error}=await db.from("talentsync_participants").select("*").eq("source_area","pinal").order("created_at",{ascending:true});
  if(error)throw error;
  const ids=(parts||[]).map((x:any)=>x.id);
  let states:any[]=[];
  if(ids.length){const r=await db.from("talentsync_case_state").select("participant_id,case_state").in("participant_id",ids);if(r.error)throw r.error;states=r.data||[]}
  const map=new Map(states.map((x:any)=>[x.participant_id,x.case_state||{}]));
  const participants=(parts||[]).map((r:any)=>baseParticipant(r,map.get(r.id)||{}));
  const b=await db.from("talentsync_budget_lines").select("program_stream,line_type,budget_amount").eq("area","pinal");
  if(b.error)throw b.error;
  const budgets:any={};
  for(const row of b.data||[]){budgets[row.program_stream]=budgets[row.program_stream]||{};if(row.line_type==="Allocation")budgets[row.program_stream].allocation=Number(row.budget_amount||0);else budgets[row.program_stream][row.line_type]=Number(row.budget_amount||0)}
  return {participants,budgets};
}
async function saveParticipant(p:any,actor:string){
  if(!isUuid(p?.id))return;
  const now=new Date().toISOString(),pid=String(p.id);
  await db.from("talentsync_case_state").upsert({participant_id:pid,case_state:p,state_version:1,updated_by:actor,updated_at:now},{onConflict:"participant_id"});
  await db.from("talentsync_participants").update({assigned_coach_email:p.coach||null,operational_status:p.exitDate?"exited":p.hired==="Hired"?"employed":"active",updated_at:now}).eq("id",pid);
  await db.from("talentsync_service_plans").upsert({participant_id:pid,program_stream:p.program||null,iep_iss_status:p.iepComplete||null,target_occupation:p.targetOccupation||null,target_industry:p.industry||null,current_hourly_wage:Number(p.entryWage||0)||null,updated_by:actor,updated_at:now},{onConflict:"participant_id"});
  const ready=p.softSkills==="Yes"&&p.resumeUpdated==="Yes"&&p.interviewPrep==="Yes"&&["Yes","90%","NA"].includes(String(p.trainingComplete||""));
  await db.from("talentsync_readiness").upsert({participant_id:pid,employment_ready:ready,soft_skills_complete:p.softSkills==="Yes",resume_updated:p.resumeUpdated==="Yes",interview_prep_complete:p.interviewPrep==="Yes",training_status:p.trainingComplete||null,training_progress_pct:p.trainingComplete==="90%"?90:p.trainingComplete==="Yes"?100:null,updated_at:now},{onConflict:"participant_id"});
  if(p.hired==="Hired"&&p.startDate){
    const ex=await db.from("talentsync_employment").select("id").eq("participant_id",pid).eq("active",true).order("created_at",{ascending:true}).limit(1).maybeSingle();
    const row={participant_id:pid,employer_name:p.employerName||null,job_title:p.targetOccupation||null,industry:p.industry||null,start_date:p.startDate,hourly_wage:Number(p.hourlyWage||0)||null,training_related_employment:p.trainingRelated==="Yes"?true:p.trainingRelated==="No"?false:null,active:true,entered_by:actor,updated_at:now};
    if(ex.data?.id)await db.from("talentsync_employment").update(row).eq("id",ex.data.id);else await db.from("talentsync_employment").insert(row);
  }
  if(p.exitDate){
    const ex=await db.from("talentsync_employment").select("id").eq("participant_id",pid).eq("active",true).order("created_at",{ascending:false}).limit(1).maybeSingle();
    await db.from("talentsync_exits").upsert({participant_id:pid,exit_date:p.exitDate,exit_reason:p.exitReason||p.exitOutcome||null,placement_at_exit:p.hired==="Hired",employment_id:ex.data?.id||null,ready_to_exit:true,ready_to_exit_at:now,exited_by:actor,updated_at:now},{onConflict:"participant_id"});
  }
  for(const f of Array.isArray(p.followUps)?p.followUps:[]){
    const month=Number(f.month);if(!month||month<1||month>12)continue;
    await db.from("talentsync_followups").upsert({participant_id:pid,milestone_month:month,due_date:f.dueDate||null,status:f.status?"completed":"pending",contacted_at:f.contactDate?new Date(f.contactDate+"T12:00:00Z").toISOString():null,employment_status:f.status||null,contact_outcome:f.status||null,employer_name:f.employer||null,hourly_wage:Number(f.wage||0)||null,notes:f.notes||null,completed_by:f.contactDate?actor:null,completed_at:f.contactDate?new Date(f.contactDate+"T12:00:00Z").toISOString():null,updated_at:now},{onConflict:"participant_id,milestone_month"});
  }
  for(const o of Array.isArray(p.obligations)?p.obligations:[]){
    const ref=String(o.id||"").slice(0,200);if(!ref)continue;
    const orow={client_ref:ref,participant_id:pid,program_stream:p.program||"",service_type:o.type||"",support_type:o.supportType||null,vendor_name:o.vendor||null,original_amount:Number(o.amount||0),status:o.status||"requested",requested_on:o.requestedOn||new Date().toISOString().slice(0,10),approved_on:o.approvedOn||null,requested_by:actor,approved_by:o.status==="approved"?actor:null,updated_at:now};
    const saved=await db.from("talentsync_obligations").upsert(orow,{onConflict:"client_ref"}).select("id").single();if(saved.error)throw saved.error;
    for(const pay of o.payments||[]){const pr=String(pay.id||ref+"-"+pay.date+"-"+pay.amount).slice(0,200);await db.from("talentsync_payments").upsert({client_ref:pr,obligation_id:saved.data.id,amount:Number(pay.amount||0),payment_date:pay.date||new Date().toISOString().slice(0,10),hours:pay.hours==null?null:Number(pay.hours),wage:pay.wage==null?null:Number(pay.wage),reimbursement_pct:pay.reimbursementPct==null?null:Number(pay.reimbursementPct),payment_type:pay.paymentType||null,entered_by:actor},{onConflict:"client_ref"})}
    for(const d of o.deobligations||[]){const dr=String(d.id||ref+"-"+d.date+"-"+d.amount).slice(0,200);await db.from("talentsync_deobligation_requests").upsert({client_ref:dr,obligation_id:saved.data.id,amount:Number(d.amount||0),requested_on:d.requestedOn||d.date||new Date().toISOString().slice(0,10),reason:d.reason||null,status:d.status||"requested",approved_on:d.approvedOn||null,requested_by:actor,approved_by:d.status==="approved"?actor:null,updated_at:now},{onConflict:"client_ref"})}
  }
}
async function saveState(state:any,actor:string){
  for(const p of Array.isArray(state?.participants)?state.participants:[])await saveParticipant(p,actor);
  for(const [program,v] of Object.entries<any>(state?.budgets||{})){
    for(const [line,amount] of [["Allocation",v?.allocation],["ITA",v?.ITA],["OJT",v?.OJT],["WEX",v?.WEX],["Support Service",v?.["Support Service"]]]){if(amount==null)continue;await db.from("talentsync_budget_lines").upsert({area:"pinal",program_stream:program,line_type:line,budget_amount:Number(amount||0),updated_by:actor,updated_at:new Date().toISOString()},{onConflict:"area,program_stream,line_type"})}
  }
  await db.from("talentsync_audit_events").insert({area:"pinal",event_type:"state_saved",actor_email:actor,payload:{participant_count:Array.isArray(state?.participants)?state.participants.length:0}});
}
Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response(null,{headers:cors});
  if(req.method!=="POST")return respond({error:"Method not allowed"},405);
  try{
    const staff=await requireStaff(req);if(!staff)return respond({error:"TalentSync staff session expired. Open TalentSync from the BOOST Coach Dashboard."},401);
    const body=await req.json().catch(()=>({})),action=String(body.action||"");
    if(action==="load")return respond({state:await loadState(),staff});
    if(action==="save"){await saveState(body.state,staff.email);return respond({ok:true})}
    return respond({error:"Unknown action"},400);
  }catch(e){console.error(e);return respond({error:"TalentSync data service error."},500)}
});