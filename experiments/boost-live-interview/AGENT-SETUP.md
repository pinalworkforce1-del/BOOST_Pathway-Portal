# Independent BOOST Jacqueline agent

**Status: scaffold only, not deployed.** This package is intentionally separate from Level Up's working agent and accounts.

Agent registration name: `boost-jacqueline-interview`. Room prefix: `boost-interview-`.

## Required before enabling
- Deploy this worker to a LiveKit project configured with BOOST credentials. LiveKit API key, secret, URL and the OpenAI voice-provider key must be injected as runtime secrets, never committed.
- Confirm the worker starts with the installed LiveKit Agents SDK version, then validate two-way audio. The scaffold has not been executed or validated.
- Implement a signed, idempotent end-of-session callback to BOOST Supabase, with participant speech + interviewer speech, per-question evidence and transcript integrity checks.
- Wire the BOOST token endpoint to issue only participant-owned, time-limited tokens for BOOST rooms and dispatch `boost-jacqueline-interview`.
- Connect BOOST transcript and evaluation processing. Keep stage completion false until verified transcript, all required questions, and evaluation are available.
- Link the isolated frontend only after end-to-end testing.

No Level Up token endpoint, session table, or callback may be used.
