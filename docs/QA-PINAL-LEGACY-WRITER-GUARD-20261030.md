# Legacy Pinal writer compatibility guard — rollback test

October 30, 2026 (Arizona). Draft PR #9.

Discovered two remaining bypasses: `boost_save_my_journey_for_region(text,jsonb)` and `pinal_boost_save_journey(uuid,text,jsonb)`. Both can write `public.pinal_boost_journeys` without atomic revision checking. The latter is scoped exclusively to Pinal; the former also serves Northern Arizona, so the draft guard explicitly leaves the non-Pinal branch unchanged.

Added `docs/sql/pinal-legacy-writer-guard-DRAFT.sql` containing the actual current function definitions with a Pinal-only rejection before the old write path. Test transaction installed draft replacements, supplied synthetic JWT claims (not a real login session), called both legacy Pinal RPCs, asserted SQLSTATE PT409, and rolled back. **Passed.**

The initial test without JWT failed authentication *before* the guard as expected. Repeated with synthetic authenticated claims; both old Pinal methods rejected as expected.

The file is **not deployed**. The existing production RPCs remain unchanged, and legacy bookmarked sessions can continue using them until controlled deployment. Frontend draft now surfaces save failures and retains a local copy.

**Do not merge yet:** Need browser-based two-origin tests; cached-client refresh experience; atomic writer deployment coupled with client release; potential other writer paths and exact Northern AZ regression; revision guard first-time sign-in; login bootstrap races; compatibility with service role and staff workflows; rigorous rollback plan.
