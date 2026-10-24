# BOOST Interview Gateway Contract

Separate from Level Up. POST with an authenticated BOOST Supabase bearer token.
- readiness: validate BOOST participant, TalentSync transfer, independent LiveKit readiness.
- start: only after Interview Landing scenario gate; reserve isolated BOOST session, dispatch BOOST avatar agent.
- end: close owned session and await verified transcript and evaluation.
- latest_completed: return only BOOST-owned interview feedback.
Do not use Level Up token, participant ledger, or callback. Fail closed until BOOST keys, agent, callback, and tables are installed.
