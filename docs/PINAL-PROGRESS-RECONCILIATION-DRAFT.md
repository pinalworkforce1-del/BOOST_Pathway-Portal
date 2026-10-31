# Pinal BOOST cross-session dependency review contract (draft — not deployed)

## Why
A completed module and a **current** module are different facts. The browser-local `pinal_boost_dependency_freshness_v1` flags may disagree between two browsers even though `boost_module_progress` and `pinal_boost_journeys` are the same.

## Authoritative model
- A review record is scoped by `auth.uid()`, `Pinal County`, downstream `module_id`, and a stable *upstream evidence version or signature*.
- A review event records `triggered_at`, `source_module`, `reason_code`, `evidence_version`, `resolved_at`, and `resolved_by_module_completion_id` or equivalent verification.
- A newer upstream change creates/reopens a pending review even when the downstream module remains *completed*.
- Completing downstream work can clear only the matching pending review when that completion was recorded after the trigger and earlier prerequisites are current.
- Never infer a cleared review simply from a previously stored `completed` label. Never import anonymous or locally mismatched browser flags as trusted events.
- Legacy `journey_data.staleModules` entries must remain visible as requiring review or verification until validated. Their absence **is not evidence** that browser-only review changes were resolved.
- Browser `localStorage['pinal_boost_dependency_freshness_v1']` can remain an informational cache for module UI, but it must not independently determine homepage `Completed` vs `Review Needed`.
- All participant-specific SELECT / mutation paths must be authenticated and owner-scoped, with no unauthenticated `SECURITY DEFINER` entry points.

## Required before deployment
1. Implement authenticated, server-validated revision events (or equivalent atomic trigger) for actual upstream module changes; `boost_save_my_journey_for_region` currently performs unconditional whole-document replacement and must be migrated or guarded, including `boostCollectName` and selected-path saves in `index.html`.
2. Update **both** the homepage and embedded module-review banner to read the same server-derived review status; local writes may only queue a verified upstream change.
3. Coordinate the `boost_pinal_load_versioned` and `boost_pinal_save_if_revision` API with `boost-cloud.js`; the draft JS deliberately fails closed if the backend functions are not yet installed.
4. Add an explicit reconciliation state when historical local-only flags cannot be verified; don't silently clear or automatically force a user to redo all content.
5. Test same authenticated account in fresh incognito, second device, old bookmark redirect, module save/return, and multiple simultaneous tabs; verify no responses or completions disappear.
6. Confirm the protected recovery schema `boost_recovery_pinal_20261031_0330z` remains intact. Keep this pull request unmerged until tests and review are complete.

## Current implementation status
- Pinal recovery snapshot exists and its row counts were verified.
- Draft branch contains cloud-first restore guard, draft atomic SQL, and revision-gated save wiring.
- Review-event backend, UI integration, authenticated end-to-end tests and full migration of all journey writers **remain outstanding**. Production is unchanged.
