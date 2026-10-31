# Northern AZ regression validation — October 31, 2026

Draft PR #9; no permanent database changes.

Executed the exact draft SQL from `docs/sql/pinal-legacy-writer-guard-DRAFT.sql` inside one transaction, then used a newly generated synthetic authenticated user to exercise:

1. `boost_save_my_journey_for_region('Northern Arizona', synthetic_journey)` successfully returned a saved journey ID.
2. The saved `boost_journeys.journey_data` matched the supplied Northern test evidence.
3. `boost_save_my_journey_for_region('Pinal County', synthetic_journey)` was rejected with SQLSTATE `PT409` by the proposed Pinal-only guard.
4. Transaction was rolled back. A subsequent query verified zero synthetic auth accounts, zero synthetic Northern journeys, and 57 Pinal recovery-snapshot journeys.

**Result:** PASS for this database-level Northern regression test. This does *not* validate Northern browser modules, deployed services, role migrations or two real authenticated browser sessions.

Full Pinal hosted browser test remains blocked until the draft has a safe isolated auth/database service; neither production DB nor Supabase Free project limit should be bypassed for test hosting.
