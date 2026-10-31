# Pinal BOOST — atomic journey conflict test evidence

**Date:** 2026-10-30, America/Phoenix
**Status:** Passed SQL-level transaction test; browser acceptance testing NOT COMPLETE. Do not deploy draft PR #9.

The draft SQL in `docs/sql/pinal-journey-atomic-revision-DRAFT.sql` was executed inside a transaction with a temporary synthetic `auth.users` identity and corresponding request-scoped claims. Test did not generate a real signed login session or browser OTP.

Checked: first save succeeds; subsequent save with matching revision succeeds; upstream career selection change creates `stale` status on downstream completed module; replaying old revision yields `conflict=true`; versioned load returns the latest review status. Full transaction rolled back.

**Post-rollback verification:** zero synthetic `pinal_boost_journeys` records, zero synthetic `auth.users` identities. Recovery snapshot still contains 57 primary Pinal journeys.

**NOT YET VERIFIED:**
- Actual Supabase Auth sessions and two browser origins on separate devices.
- True concurrent transactions (single-transaction stale revision replay is not a parallel race).
- Integration of all preexisting saved browser-only flags and unsynced work.
- First-time user name save, multiple module completion handoffs, legacy redirect, selected pathway persistence.
- Legacy unconditional RPC callers elsewhere and stale local evidence restoration.
- Actual review-state end-to-end test, no participant response loss, release rollback/feature flag.

**Release gate:** Existing database function `boost_save_my_journey_for_region` remains an unguarded writer and can bypass the new draft CAS function. Before any deployment, inspect all caller paths and either eliminate/restrict old write paths or make that RPC CAS-compatible. Confirm full workflows with two real authenticated sessions and participant-safe synthetic test records.
