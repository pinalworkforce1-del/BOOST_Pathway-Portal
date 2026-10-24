# BOOST independent Live Interview — integration boundary

**Status:** isolated visual baseline only. Do not attach to BOOST Interview Landing or enable interview sessions until the BOOST-owned backend is verified.

## Canonical experiences
- BOOST Soft Skills Base Camp: unchanged.
- BOOST Resume Retreat: native Rosie Resume Studio, unchanged.
- BOOST Interview Landing: original five scenarios, unchanged.
- Replace only `ready-2-work-qa/mock-interview.html` **after** end-to-end testing. Do not rewrite the scenario questions or stage completion logic.

## Required isolated BOOST stack
1. BOOST Supabase participant authentication (project `dxcajwarqojvmbteroco`). No Level Up sign-in/session/token.
2. BOOST-specific signed LiveKit room/token function, session allowance, identity, lifecycle, and state.
3. Adapt the proven Level Up Jacqueline LiveKit interface/agent patterns without calling Level Up's project.
4. Separate transcript storage and per-question evaluation using the BOOST participant ID; no transcript in localStorage.
5. Coach report: five scenario outcomes, three live interview questions/responses, strengths, development actions, 80/20 communication/listening assessment.
6. Update BOOST's `mockInterview.complete` only after backend-confirmed completed interview and evaluation (not on room open/close alone).
7. Publish completion and reports to TalentSync; preserve original certificate gate and existing scene progress.

## Release checks
- No Level Up URLs, Supabase credentials, endpoints, or database writes in participant-facing BOOST interview code.
- Interview launch requires BOOST auth and the existing Interview Landing scenario gate.
- End-to-end: reserve room → avatar audio → interview → transcript includes both speakers → evaluation → reload → results survive → TalentSync coach view → certificate.
- Rollback can restore original `mock-interview.html` link without altering stage progress.
