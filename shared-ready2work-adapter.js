/* BOOST 2.0 shared-tools adapter — integration branch only.
 * UI code stays shared; each host owns identity and persistence.
 * No production API URL, token, or user ID is hard-coded here.
 */
export const SHARED_TOOLS = Object.freeze({
  resume: 'ready2work-resume-builder',
  interview: 'ready2work-live-interview'
});
export function createReady2WorkAdapter({program, getSession, endpoint, fetchImpl=fetch}) {
  if (!['boost','levelup'].includes(program)) throw Error('Unknown program');
  if (typeof getSession !== 'function') throw Error('Authenticated session provider required');
  if (!endpoint || !/^https:\/\//.test(endpoint)) throw Error('Verified HTTPS program-owned endpoint required');
  const origin = new URL(endpoint).origin;
  async function call(action, tool, payload={}) {
    if (!Object.values(SHARED_TOOLS).includes(tool)) throw Error('Unknown tool');
    const auth = await getSession();
    if (!auth?.access_token) throw Error('Sign-in required');
    const url = new URL(endpoint);
    if (url.origin !== origin) throw Error('Cross-origin endpoint blocked');
    const response = await fetchImpl(url.href, {
      method:'POST',
      headers:{'Content-Type':'application/json',Authorization:'Bearer '+auth.access_token},
      body:JSON.stringify({action,tool,payload}),
      redirect:'error',
      credentials:'omit',
      cache:'no-store'
    });
    if (!response.ok) throw Error('Tool service returned HTTP '+response.status);
    const data=await response.json();
    if (!data || data.ok !== true || data.program !== program || data.tool !== tool)
      throw Error('Tool service response invalid');
    return data;
  }
  return Object.freeze({
    load:(tool)=>call('load',tool),
    saveDraft:(tool,draft)=>call('save_draft',tool,{draft}),
    getCompletion:(tool)=>call('completion',tool),
    returnUrl:(base)=>{const u=new URL(base);if(u.origin!==location.origin)throw Error('Return URL must share host origin');return u.href}
  });
}
/*
 Backend requirements before enablement:
 - Validate bearer against OWN program's Supabase project.
 - Derive participant/journey identity SERVER-SIDE, not from request payload.
 - Verify enrollment and progression; check authorization and region/assignment.
 - Store résumé and interview evidence in OWN database; preserve existing rows.
 - Return {ok:true,program,tool,...}, with server-verified completion only.
 - Treat AI completions/transcripts as server-signed evidence, not browser flags.
 - Configure allowlisted HTTPS origins and enforce actual RLS per participant.
 - Jacqueline LiveKit token issuance must be program-scoped server-side.
 */
