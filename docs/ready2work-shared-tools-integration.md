# BOOST 2.0: Ready 2 Work shared tools — verified inspection (2026-10-24)

## Updated scope
The user's original BOOST Ready 2 Work experience already contains 22 scenarios (12 Soft Skills Synergy, 5 résumé scenarios originally; user requests six in current Level Up Resume Rise, and 5 interview scenarios). **Verify exact scenario count in BOOST before changing anything.** Do not duplicate or migrate these scenario experiences by default.

Instead, add two shared capabilities:
1. Résumé Builder, from `pinalworkforce1-del/LU_Discovery/public/resume-builder-prototype.html`
2. Jacqueline live mock interview (source and LiveKit endpoint still to be located and traced)

BOOST owns its own identity, progression, scenario history, coach visibility, and Ready 2 Work Certificate. Level Up owns its own records. A single shared UI build should send authenticated results to the appropriate program-specific backend.

## Source evidence
- `pinalworkforce1-del/Resume_District/src/ResumeDistrict.tsx` links to `https://pinalworkforce1-del.github.io/LU_Discovery/resume-builder-prototype.html`.
- The builder uses a **hardcoded Level Up Supabase** URL, `/functions/v1/resume-ai`, and `/rest/v1/resume_profiles` plus `resume_versions`, and calls `getValidLevelUpAccessToken()` before cloud saves. Its return button is Level Up-specific (`source=ready2work`).
- Directly opening that builder from BOOST would NOT provide safe BOOST identity, save, resume results, or coach reporting. Do not link it as a completed integration.
- `BOOST_Pathway-Portal/boost-2-certificates-rosie-staging.html` has intentionally unset launch routes for Ready 2 Work and a read-only progression preview.
- Level Up Career Tree coach file `LU_Discovery/public/coach-career-tree.html` shows separate keys `ready2work-soft-skills`, `ready2work-resume-scenarios`, and `ready_2_work.interview_live`, not a confirmed BOOST schema.

## Design for one shared update
- Preserve the builder's user experience and source in its canonical repository.
- Refactor a shared adapter interface, with `levelup` and `boost` adapters that independently load/save participants and report completion. Never accept participant ID as proof of authorization; use server-validated user context.
- Deployment may reuse a single hosted front end only after authenticated program context, safe return URL allowlist, storage origin issues, and per-program RLS are tested.
- Claude/Jacqueline LiveKit session creation, transcript evaluation, and final completion events likewise must use server-side program selection and isolated program-owned records; no shared service key in browser code.
- Both apps must receive updates to common UI/experience without coupling the underlying databases.

## Next implementation gates
1. Locate canonical BOOST 22-scenario code and validate existing progress keys before wiring shared pages.
2. Locate canonical Jacqueline launch page, LiveKit token issuer, callback, transcript and evaluation endpoints.
3. Inspect BOOST-specific auth and persistence mechanisms; define adapter endpoints using existing conventions.
4. Add staging-only launch, save, return, and coach-detail integration; test with distinct BOOST and Level Up accounts.
5. Promote only after end-to-end cloud verification and production regression checks.

## Safety
No modifications to production BOOST, production Level Up, Rosie AI, scenario files or Supabase schema in this phase.
