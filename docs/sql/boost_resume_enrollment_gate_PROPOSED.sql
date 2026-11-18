-- Proposed, NOT APPLIED: staff-reviewed enrollment gate for BOOST résumé integration.
-- Review TalentSync source_user_id mapping and approval ownership before deploying.
-- Server-side authorization must also be enforced on every résumé save, not just the UI.
create or replace function public.boost_resume_enrollment_approved()
returns boolean language sql stable security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from public.talentsync_participants p
    where p.source_user_id = auth.uid()
      and p.enrollment_approved_at is not null
      and p.source_area ilike '%pinal%'
  );
$$;
revoke all on function public.boost_resume_enrollment_approved() from public, anon;
grant execute on function public.boost_resume_enrollment_approved() to authenticated;
-- Pending: add an RLS-safe server-side persistence policy/endpoint for résumé saves.
