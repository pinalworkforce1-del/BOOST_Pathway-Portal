import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const VERSION="boost-intake-rosie-pinal-v1";
const AREA="pinal";
const url=Deno.env.get("SUPABASE_URL")!;
const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});

const cors={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"content-type, authorization, apikey, x-boost-staff-token",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
  "Content-Type":"application/json"
};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
const clean=(v:unknown)=>String(v??"").trim();
const normEmail=(v:unknown)=>clean(v).toLowerCase();
async function sha256(v:string){const h=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));return [...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,"0")).join("")}

async function requirePinalStaff(req:Request){
  const token=clean(req.headers.get("X-BOOST-Staff-Token"));
  if(!token)return null;
  const now=new Date().toISOString(),hash=await sha256(token);
  const {data:s,error}=await db.from("boost_staff_sessions").select("id,email_normalized,expires_at,revoked_at").eq("token_hash",hash).maybeSingle();
  if(error||!s||s.revoked_at||!s.expires_at||s.expires_at<=now)return null;
  const {data:a,error:aErr}=await db.from("boost_staff_access").select("email,display_name,can_pinal,active").ilike("email",s.email_normalized).maybeSingle();
  if(aErr||!a||!a.active||!a.can_pinal)return null;
  await db.from("boost_staff_sessions").update({last_used_at:now}).eq("id",s.id);
  return {email:normEmail(a.email),display_name:a.display_name||a.email};
}

async function loadContext(journeyId:string){
  const journeyR=await db.from("pinal_boost_journeys").select("*").eq("id",journeyId).maybeSingle();
  if(journeyR.error)throw journeyR.error;
  if(!journeyR.data)return null;
  const j=journeyR.data;
  const progressPromise=j.user_id
    ? db.from("boost_module_progress").select("module_id,pathway,status,evidence,completed_at,updated_at").eq("region","pinal").eq("user_id",j.user_id).order("completed_at",{ascending:true})
    : Promise.resolve({data:[],error:null} as any);
  const [progressR,assignR,knowledgeR]=await Promise.all([
    progressPromise,
    db.from("boost_participant_assignments").select("primary_staff_email,secondary_staff_email,assigned_at,updated_at").eq("area","pinal").eq("journey_id",journeyId).maybeSingle(),
    db.from("boost_intake_rosie_knowledge").select("category,topic,content,source_type,source_ref").eq("area",AREA).eq("active",true).order("sort_order",{ascending:true})
  ]);
  if(progressR.error)throw progressR.error;
  if(assignR.error)throw assignR.error;
  if(knowledgeR.error)throw knowledgeR.error;
  return {
    participant:{
      journey_id:j.id,
      name:j.participant_name||"Participant",
      email:j.participant_email||null,
      participant_status:j.participant_status||null,
      selected_pathway:j.selected_pathway||null,
      selected_industry:j.selected_industry||null,
      primary_career_title:j.primary_career_title||null,
      h3_status:j.h3_status||null,
      current_step:j.current_step||null,
      boost_completed_at:j.boost_completed_at||null,
      created_at:j.created_at||null,
      updated_at:j.updated_at||null
    },
    assignment:assignR.data||null,
    boost_journey:j.journey_data||{},
    module_progress:progressR.data||[],
    eligibility_policy:knowledgeR.data||[]
  };
}

const SYSTEM=`You are Rosie, the Pinal County BOOST Coach View Intake & Eligibility Career Coach for authorized workforce staff.

ROLE
You support PRE-ENROLLMENT intake, Adult/Dislocated Worker eligibility analysis, Priority of Service review, documentation planning, and intake-note drafting. You are intentionally separate from TalentSync Rosie, which handles post-enrollment case management.

STRICT DECISION BOUNDARY
- You may analyze documented facts against controlled Pinal policy and identify a likely eligibility pathway or DW category.
- You may say "appears to meet," "facts currently support," or "pending verification."
- Never make the official eligibility determination, certify a document, approve enrollment, or represent that funding is approved.
- Never invent missing facts, barriers, wages, veteran status, UI status, layoff facts, household income, Selective Service status, or documentation.
- Authorized staff make and document the final eligibility determination.

SOURCE DISCIPLINE
- Use the controlled Pinal eligibility knowledge supplied in context.
- Cite controlling sources using source_ref in square brackets when they directly support the answer.
- Distinguish policy from workflow_config.
- If a required rule is not loaded, say what is missing rather than guessing.

ELIGIBILITY REASONING
For eligibility questions, organize reasoning as:
1. Likely pathway/category.
2. Facts that support it.
3. Missing facts or verification.
4. Policy basis.
Do not collapse Adult eligibility, Adult Priority of Service, and Dislocated Worker eligibility into one test.
For DW Category I, verify no-fault separation/notice, UI or workforce-attachment criterion, and unlikely-to-return support.
For complicated cases, compare multiple plausible categories and explain which facts distinguish them.

BOOST CONTEXT
Use BOOST outputs to support intake planning and the participant story: career targets, current/last wage if captured, researched careers, H3 status, interests, selected pathway, WORK NOW/BRIDGE/BUILD direction, training interest, financial considerations, skill mobility, and module evidence.
BOOST career direction is planning evidence, not eligibility evidence unless a policy rule specifically says otherwise.

INTAKE NOTES
When asked to draft an intake note, write a professional case note that:
- states presenting employment/intake situation using known facts;
- describes the apparent Adult/DW eligibility pathway and DW category when applicable, clearly noting pending verification;
- documents Priority of Service/veteran status only when known;
- identifies evidence reviewed and missing documents/facts;
- summarizes relevant BOOST findings and participant career direction;
- describes agreed next steps;
- never invents a fact or claims a final eligibility determination unless the coach explicitly states one has been made.
Keep the note concise enough for case management use but complete enough to show the reasoning.

STYLE
- Answer the actual question first.
- Practical, concise workforce-professional tone.
- Use bullets when they improve eligibility comparisons.
- For a draft intake note, provide the note first and a short "Still verify" section afterward if anything is missing.
`;

Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response(null,{headers:cors});
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  try{
    const staff=await requirePinalStaff(req);
    if(!staff)return json({error:"BOOST staff session expired. Sign in to the Coach View again."},401);
    const body=await req.json().catch(()=>({}));
    const journeyId=clean(body.journey_id);
    const question=clean(body.question).slice(0,12000);
    const history=Array.isArray(body.history)?body.history.slice(-8).map((x:any)=>({role:x?.role==="assistant"?"assistant":"user",text:clean(x?.text).slice(0,3000)})):[];
    if(!journeyId)return json({error:"Select a BOOST participant first."},400);
    if(!question)return json({error:"Ask Rosie an intake or eligibility question."},400);

    const context=await loadContext(journeyId);
    if(!context)return json({error:"Pinal BOOST participant not found."},404);

    const apiKey=Deno.env.get("OPENAI_API_KEY");
    if(!apiKey)return json({error:"Rosie's AI service is not configured.",model_status:"missing_secret"},503);

    const conversation=history.map((h:any)=>`${h.role.toUpperCase()}: ${h.text}`).join("\n");
    const payload={
      model:Deno.env.get("BOOST_ROSIE_MODEL")||Deno.env.get("TALENTSYNC_ROSIE_MODEL")||"gpt-5.6-luna",
      instructions:SYSTEM,
      input:[{role:"user",content:[{type:"input_text",text:`STAFF QUESTION:\n${question}\n\nRECENT CONVERSATION:\n${conversation||"(none)"}\n\nCONTROLLED PINAL BOOST INTAKE CONTEXT:\n${JSON.stringify(context)}`}]}],
      max_output_tokens:1400
    };
    const ai=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify(payload)});
    if(!ai.ok){const detail=(await ai.text()).slice(0,500);console.error("OpenAI error",ai.status,detail);return json({error:"Rosie could not complete that intake question.",model_status:`model_http_${ai.status}`},502)}
    const out=await ai.json();
    const answer=out.output_text||out.output?.flatMap((x:any)=>x.content||[]).find((x:any)=>x.type==="output_text")?.text;
    if(!answer)return json({error:"Rosie returned an empty response.",model_status:"empty_response"},502);
    return json({answer:String(answer).slice(0,16000),journey_id:journeyId,area:AREA,read_only:true,model_status:"ok",version:VERSION});
  }catch(e){console.error(e);return json({error:"BOOST Intake Rosie could not complete that question.",detail:String((e as any)?.message||e).slice(0,500),version:VERSION},500)}
});